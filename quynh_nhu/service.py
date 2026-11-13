"""Business rules ported from the working TypeScript release; SQL schema is unchanged."""

import math
import builtins
import re
import unicodedata
from contextlib import contextmanager
from datetime import datetime
from .db import (
    all,
    one,
    run,
    code,
    now,
    day,
    date_plus,
    transaction,
    lock_products,
    lock_request,
    session_token,
)
from .errors import BusinessError, fail, present, positive, integer, required, number


def ident(v):
    return int(number(v)) if integer(v) else 0


def scoped_key(key):
    return session_token.get() + ":" + key


def take_failure(key):
    return bool(
        one(
            "DELETE FROM setting WHERE key=? AND value='1' RETURNING key",
            scoped_key(key),
        )
    )


@contextmanager
def atomic(message):
    force = take_failure("fail_save")
    try:
        with transaction():
            yield
            if force:
                raise RuntimeError("DEMO_ROLLBACK")
    except BusinessError:
        raise
    except Exception as exc:
        raise BusinessError(message, status=500) from exc


def settings():
    return {
        r["key"].split(":", 1)[1]: r["value"] == "1"
        for r in all("SELECT * FROM setting WHERE key LIKE ?", scoped_key("%"))
    }


def set_settings(d):
    with transaction():
        for k in [
            "printer_error",
            "fail_save",
            "fail_load",
            "fail_export_read",
            "fail_export_file",
        ]:
            if k in d:
                run(
                    "INSERT INTO setting VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                    scoped_key(k),
                    "1" if d[k] else "0",
                )
    return settings()


def products():
    ps = all(
        "SELECT p.*,c.name category,COALESCE((SELECT SUM(remaining) FROM receipt_line l WHERE l.product_id=p.id),0) stock,COALESCE((SELECT SUM(remaining) FROM receipt_line l WHERE l.product_id=p.id AND (l.expiry IS NULL OR l.expiry>=?)),0) sellable FROM product p JOIN category c ON c.id=p.category_id ORDER BY p.id",
        day(),
    )
    units = all("SELECT * FROM unit ORDER BY factor,id")
    histories = all(
        "SELECT h.*,u.name unit_name,u.product_id FROM price_history h JOIN unit u ON u.id=h.unit_id ORDER BY h.id DESC"
    )
    return [
        dict(
            p,
            units=[u for u in units if u["product_id"] == p["id"]],
            price_history=[h for h in histories if h["product_id"] == p["id"]],
        )
        for p in ps
    ]


def suppliers():
    ss = all("SELECT * FROM supplier ORDER BY id")
    cs = all(
        "SELECT sc.*,c.name FROM supplier_category sc JOIN category c ON c.id=sc.category_id"
    )
    return [
        dict(
            s,
            category_ids=[c["category_id"] for c in cs if c["supplier_id"] == s["id"]],
            categories=[c["name"] for c in cs if c["supplier_id"] == s["id"]],
        )
        for s in ss
    ]


def lots():
    return all(
        "SELECT l.*,p.name product_name,p.barcode,p.base_unit,p.min_stock,r.created_at,s.name supplier_name FROM receipt_line l JOIN product p ON p.id=l.product_id JOIN receipt r ON r.id=l.receipt_id JOIN supplier s ON s.id=r.supplier_id ORDER BY r.created_at,l.id"
    )


def bootstrap():
    return dict(
        today=day(),
        categories=all("SELECT * FROM category ORDER BY id"),
        products=products(),
        suppliers=suppliers(),
        customers=all("SELECT * FROM customer ORDER BY id"),
        settings=settings(),
    )


def save_product(d):
    edit = bool(d.get("id"))
    required(
        d,
        ["name", "category_id", "base_unit", "reference_cost"]
        + ([] if edit else ["price"]),
    )
    fields = {
        k: "Dữ liệu không hợp lệ!"
        for k in ["reference_cost"] + ([] if edit else ["price"])
        if not positive(d.get(k))
    }
    if not one("SELECT id FROM category WHERE id=?", ident(d.get("category_id"))):
        fields["category_id"] = "Dữ liệu không hợp lệ!"
    if not integer(d.get("min_stock", 0)) or number(d.get("min_stock", 0)) < 0:
        fields["min_stock"] = "Dữ liệu không hợp lệ!"
    extras = d.get("units") or []
    if not edit:
        names = {str(d["base_unit"]).strip().lower()}
        for u in extras:
            if (
                not present(u.get("name"))
                or not integer(u.get("factor"))
                or number(u.get("factor")) <= 0
                or not positive(u.get("price"))
                or str(u.get("name", "")).strip().lower() in names
            ):
                fields["units"] = "Dữ liệu không hợp lệ!"
            names.add(str(u.get("name", "")).strip().lower())
    if fields:
        fail("Dữ liệu không hợp lệ!", fields)
    with transaction():
        if edit and not one("SELECT id FROM product WHERE id=?", d["id"]):
            fail("Sản phẩm không tồn tại!")
        pid = d.get("id") or code("SP")
        args = (
            str(d["name"]).strip(),
            ident(d["category_id"]),
            str(d.get("barcode") or "").strip(),
            str(d["base_unit"]).strip(),
            number(d["reference_cost"]),
        )
        if edit:
            run(
                "UPDATE product SET name=?,category_id=?,barcode=?,base_unit=?,reference_cost=?,average_cost=CASE WHEN EXISTS(SELECT 1 FROM receipt_line WHERE product_id=?) THEN average_cost ELSE ? END,min_stock=?,expiry_managed=?,description=? WHERE id=?",
                *args,
                pid,
                number(d["reference_cost"]),
                ident(d.get("min_stock", 0)),
                int(bool(d.get("expiry_managed"))),
                str(d.get("description") or "").strip(),
                pid,
            )
            base = one(
                "SELECT * FROM unit WHERE product_id=? AND factor=1 ORDER BY id LIMIT 1",
                pid,
            )
            if base and base["name"] != str(d["base_unit"]).strip():
                if one(
                    "SELECT id FROM unit WHERE product_id=? AND name=? AND id<>?",
                    pid,
                    str(d["base_unit"]).strip(),
                    base["id"],
                ):
                    fail(
                        "Dữ liệu không hợp lệ!", {"base_unit": "Dữ liệu không hợp lệ!"}
                    )
                run(
                    "UPDATE unit SET name=? WHERE id=?",
                    str(d["base_unit"]).strip(),
                    base["id"],
                )
        else:
            run(
                "INSERT INTO product(id,name,category_id,barcode,base_unit,reference_cost,average_cost,min_stock,expiry_managed,description) VALUES (?,?,?,?,?,?,?,?,?,?)",
                pid,
                *args,
                number(d["reference_cost"]),
                ident(d.get("min_stock", 0)),
                int(bool(d.get("expiry_managed"))),
                str(d.get("description") or "").strip(),
            )
            for u in [dict(name=d["base_unit"], factor=1, price=d["price"])] + extras:
                run(
                    "INSERT INTO unit(product_id,name,factor,price) VALUES (?,?,?,?)",
                    pid,
                    str(u["name"]).strip(),
                    ident(u["factor"]),
                    number(u["price"]),
                )
        return dict(
            id=pid,
            message=(
                "Cập nhật sản phẩm thành công!" if edit else "Thêm sản phẩm thành công!"
            ),
        )


def delete_product(pid):
    with transaction():
        if not one("SELECT id FROM product WHERE id=?", pid):
            fail("Sản phẩm không tồn tại!")
        if any(
            one(f"SELECT id FROM {t} WHERE product_id=?", pid)
            for t in ["receipt_line", "invoice_line", "return_line"]
        ):
            fail("Không thể xóa sản phẩm đã có tồn kho hoặc giao dịch!")
        run(
            "DELETE FROM price_history WHERE unit_id IN (SELECT id FROM unit WHERE product_id=?)",
            pid,
        )
        run("DELETE FROM unit WHERE product_id=?", pid)
        run("DELETE FROM product WHERE id=?", pid)
        return dict(message="Xóa sản phẩm thành công!")


def update_price(d):
    required(d, ["price"])
    if not positive(d["price"]):
        fail("Giá bán không hợp lệ!", {"price": "Giá bán không hợp lệ!"})
    u = one(
        "SELECT u.*,p.average_cost FROM unit u JOIN product p ON p.id=u.product_id WHERE u.id=?",
        ident(d.get("unit_id")),
    )
    if not u:
        fail("Sản phẩm không tồn tại!")
    if number(d["price"]) < u["average_cost"] * u["factor"] and not d.get("confirmed"):
        return dict(warning="Giá bán thấp hơn giá nhập. Bạn có muốn tiếp tục?")
    with transaction():
        run(
            "INSERT INTO price_history(unit_id,old_price,new_price,created_at) VALUES (?,?,?,?)",
            u["id"],
            u["price"],
            number(d["price"]),
            now(),
        )
        run("UPDATE unit SET price=? WHERE id=?", number(d["price"]), u["id"])
    return dict(message="Cập nhật giá bán thành công!")


def save_supplier(d):
    required(d, ["name", "phone"])
    fields = {}
    if not re.fullmatch(r"\d{10}", str(d.get("phone") or "")):
        fields["phone"] = "Dữ liệu không hợp lệ!"
    if d.get("email") and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", d["email"]):
        fields["email"] = "Dữ liệu không hợp lệ!"
    if d.get("id") and d.get("status") not in ["Đang hợp tác", "Ngừng hợp tác"]:
        fields["status"] = "Dữ liệu không hợp lệ!"
    if fields:
        fail("Dữ liệu không hợp lệ!", fields)
    categories = all("SELECT * FROM category")
    if d.get("other"):
        if not present(d.get("new_category")):
            fail(
                "Vui lòng nhập tên danh mục mới!",
                {"new_category": "Vui lòng nhập tên danh mục mới!"},
            )
        if any(
            c["name"].lower() == d["new_category"].strip().lower() for c in categories
        ):
            fail(
                "Danh mục đã tồn tại, vui lòng chọn danh mục có sẵn!",
                {"new_category": "Danh mục đã tồn tại, vui lòng chọn danh mục có sẵn!"},
            )
    with transaction():
        sid = d.get("id") or code("NCC")
        args = (
            d["name"].strip(),
            d["phone"],
            str(d.get("email") or "").strip(),
            str(d.get("address") or "").strip(),
            str(d.get("description") or "").strip(),
        )
        if d.get("id"):
            if not one("SELECT id FROM supplier WHERE id=?", sid):
                fail("Dữ liệu không hợp lệ!")
            run(
                "UPDATE supplier SET name=?,phone=?,email=?,address=?,description=?,status=? WHERE id=?",
                *args,
                d["status"],
                sid,
            )
            run("DELETE FROM supplier_category WHERE supplier_id=?", sid)
        else:
            run(
                "INSERT INTO supplier(id,name,phone,email,address,description) VALUES (?,?,?,?,?,?)",
                sid,
                *args,
            )
        ids = set(ident(v) for v in (d.get("category_ids") or []))
        if d.get("other"):
            ids.add(
                run("INSERT INTO category(name) VALUES (?)", d["new_category"].strip())[
                    "lastInsertRowid"
                ]
            )
        for cid in ids:
            if not any(c["id"] == cid for c in categories) and not d.get("other"):
                fail("Dữ liệu không hợp lệ!")
            run("INSERT INTO supplier_category VALUES (?,?)", sid, cid)
        return dict(
            id=sid,
            message=(
                "Cập nhật thông tin nhà cung cấp thành công!"
                if d.get("id")
                else "Thêm nhà cung cấp thành công!"
            ),
        )


def delete_supplier(sid):
    with transaction():
        if one("SELECT id FROM receipt WHERE supplier_id=?", sid):
            fail("Không thể xóa nhà cung cấp đã phát sinh giao dịch nhập hàng!")
        run("DELETE FROM supplier_category WHERE supplier_id=?", sid)
        run("DELETE FROM supplier WHERE id=?", sid)
    return dict(message="Xóa nhà cung cấp thành công!")


def valid_date(v):
    if not isinstance(v, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
        return False
    try:
        return datetime.fromisoformat(v).date().isoformat() == v
    except ValueError:
        return False


def validate_receipt_line(d, index=None):
    prefix = "" if index is None else f"lines.{index}."
    p = one("SELECT * FROM product WHERE id=?", d.get("product_id") or "")
    u = one(
        "SELECT * FROM unit WHERE id=? AND product_id=?",
        ident(d.get("unit_id")),
        d.get("product_id") or "",
    )
    keys = ["product_id", "unit_id", "quantity", "price"] + (
        ["expiry"] if p and p["expiry_managed"] else []
    )
    fields = {prefix + k: "Không được để trống" for k in keys if not present(d.get(k))}
    if fields:
        fail("Không được để trống", fields)
    if (
        not p
        or not u
        or not integer(d.get("quantity"))
        or not positive(d.get("quantity"))
        or not positive(d.get("price"))
    ):
        fail(
            "Số lượng nhập và giá nhập phải lớn hơn 0",
            {
                prefix + "quantity": "Số lượng nhập và giá nhập phải lớn hơn 0",
                prefix + "price": "Số lượng nhập và giá nhập phải lớn hơn 0",
            },
        )
    if p["expiry_managed"] and (
        not valid_date(d.get("expiry")) or d["expiry"] <= day()
    ):
        fail(
            "Hạn sử dụng phải sau ngày nhập hàng",
            {prefix + "expiry": "Hạn sử dụng phải sau ngày nhập hàng"},
        )
    return dict(p=p, unit=u)


def movement(product, lot, kind, quantity, time, reference):
    run(
        "INSERT INTO movement(product_id,lot_id,kind,quantity,created_at,reference) VALUES (?,?,?,?,?,?)",
        product,
        lot,
        kind,
        quantity,
        time,
        reference,
    )


def save_receipt(d):
    existing = one(
        "SELECT id FROM receipt WHERE request_key=?", d.get("request_key") or ""
    )
    if existing:
        return dict(id=existing["id"], message="Nhập hàng thành công")
    required(d, ["supplier_id"], "Không được để trống")
    if not one("SELECT id FROM supplier WHERE id=?", d["supplier_id"]):
        fail("Không được để trống", {"supplier_id": "Không được để trống"})
    if not d.get("lines"):
        fail("Không được để trống", {"lines": "Không được để trống"})
    for i, l in enumerate(d["lines"]):
        validate_receipt_line(l, i)
    with atomic("Không thể lưu phiếu nhập"):
        lock_request("receipt", d.get("request_key"))
        duplicate = one(
            "SELECT id FROM receipt WHERE request_key=?", d.get("request_key")
        )
        if duplicate:
            return dict(id=duplicate["id"], message="Nhập hàng thành công", warnings=[])
        lock_products([l["product_id"] for l in d["lines"]])
        rid, time = code("PN"), now()
        run(
            "INSERT INTO receipt VALUES (?,?,?,?,?)",
            rid,
            d["supplier_id"],
            time,
            sum(number(l["quantity"]) * number(l["price"]) for l in d["lines"]),
            d.get("request_key"),
        )
        for l in d["lines"]:
            validated = validate_receipt_line(l)
            p, u = validated["p"], validated["unit"]
            base = ident(l["quantity"]) * u["factor"]
            stock = one(
                "SELECT COALESCE(SUM(remaining),0) n FROM receipt_line WHERE product_id=?",
                p["id"],
            )["n"]
            average = (
                stock * p["average_cost"] + number(l["quantity"]) * number(l["price"])
            ) / (stock + base)
            lot = run(
                "INSERT INTO receipt_line(receipt_id,product_id,unit_id,unit_name,factor,quantity,price,total,expiry,original_quantity,remaining) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                rid,
                p["id"],
                u["id"],
                u["name"],
                u["factor"],
                ident(l["quantity"]),
                number(l["price"]),
                number(l["quantity"]) * number(l["price"]),
                l.get("expiry") if p["expiry_managed"] else None,
                base,
                base,
            )["lastInsertRowid"]
            run("UPDATE product SET average_cost=? WHERE id=?", average, p["id"])
            movement(p["id"], lot, "receipt", base, time, rid)
        return dict(id=rid, message="Nhập hàng thành công")


def receipt_detail(rid):
    r = one(
        "SELECT r.*,s.name supplier_name FROM receipt r JOIN supplier s ON s.id=r.supplier_id WHERE r.id=?",
        rid,
    )
    if not r:
        fail("Không tìm thấy phiếu nhập")
    return dict(
        r,
        lines=all(
            "SELECT l.*,p.name product_name,p.base_unit FROM receipt_line l JOIN product p ON p.id=l.product_id WHERE receipt_id=? ORDER BY l.id",
            rid,
        ),
    )


def query(d):
    errors = {
        "inventory": "Không thể tải dữ liệu tồn kho",
        "receipt-history": "Không thể tải lịch sử nhập hàng",
        "sales-history": "Không thể tải lịch sử bán hàng",
        "reports": "Không thể tải báo cáo. Vui lòng thử lại",
    }
    q = str(d.get("q") or "").strip().lower()

    def matches(*values):
        return any(q in str(v or "").lower() for v in values)

    if d.get("from") and d.get("to") and d["from"] > d["to"]:
        fail("Khoảng thời gian không hợp lệ")
    if (d.get("from") and not valid_date(d["from"])) or (
        d.get("to") and not valid_date(d["to"])
    ):
        fail("Khoảng thời gian không hợp lệ")
    if take_failure("fail_load"):
        fail(errors.get(d.get("scope"), "Không thể tải dữ liệu"))
    scope = d.get("scope")

    def in_range(r):
        return (not d.get("from") or day(r["created_at"]) >= d["from"]) and (
            not d.get("to") or day(r["created_at"]) <= d["to"]
        )

    if scope == "receipt-history":
        return [
            r
            for r in all(
                "SELECT r.*,s.name supplier_name FROM receipt r JOIN supplier s ON s.id=r.supplier_id ORDER BY r.created_at DESC,r.id DESC"
            )
            if matches(r["id"], r["supplier_name"]) and in_range(r)
        ]
    if scope == "inventory":
        ps = [p for p in products() if matches(p["id"], p["name"], p["barcode"])]
        if d.get("filter") in ["Sắp hết hạn", "Đã hết hạn"]:
            ids = {p["id"] for p in ps}
            return [
                l
                for l in lots()
                if l["product_id"] in ids
                and l["remaining"] > 0
                and l["expiry"]
                and (
                    l["expiry"] < day()
                    if d["filter"] == "Đã hết hạn"
                    else day() <= l["expiry"] <= date_plus(30)
                )
            ]
        return [
            p
            for p in ps
            if d.get("filter") != "Dưới mức cảnh báo tồn kho"
            or p["stock"] <= p["min_stock"]
        ]
    if scope == "products":
        return [
            p
            for p in products()
            if matches(p["id"], p["name"])
            and (not d.get("category") or p["category_id"] == ident(d["category"]))
        ]
    if scope == "suppliers":
        return [
            s
            for s in suppliers()
            if matches(s["id"], s["name"])
            and (not d.get("category") or ident(d["category"]) in s["category_ids"])
            and (not d.get("status") or s["status"] == d["status"])
        ]
    if scope == "customers":
        return [
            c
            for c in all("SELECT * FROM customer ORDER BY id")
            if matches(c["id"], c["name"], c["phone"])
        ]
    if scope == "adjustments":
        return [
            l
            for l in lots()
            if matches(l["product_id"], l["product_name"], l["barcode"])
        ]
    if scope == "sales-history":
        return [
            i
            for i in all(
                "SELECT i.*,c.name customer_name,c.phone FROM invoice i LEFT JOIN customer c ON c.id=i.customer_id ORDER BY i.created_at DESC,i.id DESC"
            )
            if matches(i["id"], i.get("phone"))
            and (
                not d.get("invoice_id")
                or str(d["invoice_id"]).strip().lower() in i["id"].lower()
            )
            and (
                not d.get("phone")
                or str(d["phone"]).strip() in str(i.get("phone") or "")
            )
            and in_range(i)
        ]
    return []


def save_customer(d):
    if not present(d.get("name")) or not present(d.get("phone")):
        fail("Vui lòng nhập đầy đủ Tên khách hàng và Số điện thoại")
    name = str(d["name"]).strip()
    if (
        not name
        or not builtins.all(
            unicodedata.category(c)[0] in "LM" or c in " .'-" for c in name
        )
        or not any(unicodedata.category(c).startswith("L") for c in name)
        or not re.fullmatch(r"0\d{9}", str(d["phone"]))
    ):
        fail("Tên khách hàng hoặc Số điện thoại không đúng định dạng")
    if one(
        "SELECT id FROM customer WHERE phone=? AND id<>?", d["phone"], d.get("id") or ""
    ):
        fail("Số điện thoại đã tồn tại trong hệ thống")
    with transaction():
        cid = d.get("id") or code("KH")
        args = (name, d["phone"], str(d.get("address") or "").strip())
        if d.get("id"):
            run("UPDATE customer SET name=?,phone=?,address=? WHERE id=?", *args, cid)
        else:
            run("INSERT INTO customer VALUES (?,?,?,?)", cid, *args)
        return dict(
            id=cid,
            message=(
                "Cập nhật thông tin khách hàng thành công"
                if d.get("id")
                else "Thêm khách hàng thành công"
            ),
        )


def delete_customer(cid):
    with transaction():
        if one("SELECT id FROM invoice WHERE customer_id=?", cid):
            fail("Không thể xóa khách hàng đã có lịch sử mua hàng")
        run("DELETE FROM customer WHERE id=?", cid)
    return dict(message="Xóa khách hàng thành công")


def customer_detail(cid):
    c = one("SELECT * FROM customer WHERE id=?", cid)
    if not c:
        fail("Không tìm thấy khách hàng phù hợp")
    return dict(
        c,
        invoices=all(
            "SELECT * FROM invoice WHERE customer_id=? ORDER BY created_at DESC,id DESC",
            cid,
        ),
    )


def find_customer(phone):
    c = one("SELECT * FROM customer WHERE phone=?", phone)
    if not c:
        fail("Không tìm thấy khách hàng")
    return c


def sale_line(l):
    p = one("SELECT * FROM product WHERE id=?", l.get("product_id") or "")
    u = one(
        "SELECT * FROM unit WHERE id=? AND product_id=?",
        ident(l.get("unit_id")),
        l.get("product_id") or "",
    )
    if not p or not u:
        fail("Không tìm thấy sản phẩm")
    if not integer(l.get("quantity")) or not positive(l.get("quantity")):
        fail("Số lượng bán không hợp lệ", {"quantity": "Số lượng bán không hợp lệ"})
    return dict(
        product_id=p["id"],
        product_name=p["name"],
        unit_id=u["id"],
        unit_name=u["name"],
        factor=u["factor"],
        quantity=ident(l["quantity"]),
        price=u["price"],
        cost=p["average_cost"],
        total=ident(l["quantity"]) * u["price"],
    )


def quote_cart(d):
    if not d.get("lines"):
        fail("Số lượng bán không hợp lệ")
    lines = [sale_line(l) for l in d["lines"]]
    wanted = {}
    for l in lines:
        wanted[l["product_id"]] = (
            wanted.get(l["product_id"], 0) + l["quantity"] * l["factor"]
        )
    for pid, qty in wanted.items():
        available = one(
            "SELECT COALESCE(SUM(remaining),0) n FROM receipt_line WHERE product_id=? AND (expiry IS NULL OR expiry>=?)",
            pid,
            day(),
        )["n"]
        if qty > available:
            fail("Số lượng bán không hợp lệ", {"quantity": "Số lượng bán không hợp lệ"})
    return dict(lines=lines, total=sum(l["total"] for l in lines))


def allocate(l, invoice_line, exchange_line, kind, time, reference):
    sources = all(
        "SELECT l.* FROM receipt_line l JOIN receipt r ON r.id=l.receipt_id WHERE l.product_id=? AND l.remaining>0 AND (l.expiry IS NULL OR l.expiry>=?) ORDER BY CASE WHEN l.expiry IS NULL THEN 1 ELSE 0 END,l.expiry,r.created_at,l.id",
        l["product_id"],
        day(),
    )
    left = l["quantity"] * l["factor"]
    for source in sources:
        if not left:
            break
        qty = min(source["remaining"], left)
        run(
            "UPDATE receipt_line SET remaining=remaining-? WHERE id=? AND remaining>=?",
            qty,
            source["id"],
            qty,
        )
        run(
            "INSERT INTO allocation(lot_id,invoice_line_id,exchange_line_id,quantity) VALUES (?,?,?,?)",
            source["id"],
            invoice_line,
            exchange_line,
            qty,
        )
        movement(l["product_id"], source["id"], kind, -qty, time, reference)
        left -= qty
    if left > 0:
        fail("Không đủ số lượng hàng có thể bán")


def checkout(d):
    existing = one(
        "SELECT id FROM invoice WHERE request_key=?", d.get("request_key") or ""
    )
    if existing:
        return dict(id=existing["id"], message="Bán hàng thành công", warnings=[])
    if not d.get("lines"):
        fail("Số lượng bán không hợp lệ")
    with atomic("Không thể lưu giao dịch. Hãy thử lại"):
        lock_request("invoice", d.get("request_key"))
        duplicate = one(
            "SELECT id FROM invoice WHERE request_key=?", d.get("request_key")
        )
        if duplicate:
            return dict(id=duplicate["id"], message="Bán hàng thành công", warnings=[])
        lock_products([l["product_id"] for l in d["lines"]])
        lines = [sale_line(l) for l in d["lines"]]
        total = sum(l["total"] for l in lines)
        if d.get("method") not in ["Tiền mặt", "Chuyển khoản"]:
            fail("Dữ liệu không hợp lệ!")
        if d["method"] == "Tiền mặt" and (
            not math.isfinite(number(d.get("cash"))) or number(d.get("cash")) < total
        ):
            fail(
                "Tiền khách đưa chưa đủ để thanh toán",
                {"cash": "Tiền khách đưa chưa đủ để thanh toán"},
            )
        if d["method"] == "Chuyển khoản" and not d.get("confirmed"):
            fail("Vui lòng xác nhận đã nhận đủ tiền")
        if d.get("customer_id") and not one(
            "SELECT id FROM customer WHERE id=?", d["customer_id"]
        ):
            fail("Không tìm thấy khách hàng")
        iid, time = code("HD"), now()
        cash = number(d.get("cash")) if d["method"] == "Tiền mặt" else total
        run(
            "INSERT INTO invoice(id,customer_id,created_at,total,method,cash,change,request_key) VALUES (?,?,?,?,?,?,?,?)",
            iid,
            d.get("customer_id") or None,
            time,
            total,
            d["method"],
            cash,
            cash - total,
            d.get("request_key"),
        )
        for l in lines:
            line = run(
                "INSERT INTO invoice_line(invoice_id,product_id,product_name,unit_id,unit_name,factor,quantity,price,cost,total) VALUES (?,?,?,?,?,?,?,?,?,?)",
                iid,
                l["product_id"],
                l["product_name"],
                l["unit_id"],
                l["unit_name"],
                l["factor"],
                l["quantity"],
                l["price"],
                l["cost"],
                l["total"],
            )["lastInsertRowid"]
            allocate(l, line, None, "sale", time, iid)
        ids = {l["product_id"] for l in lines}
        warnings = [
            {k: p[k] for k in ["id", "name", "stock", "base_unit", "min_stock"]}
            for p in products()
            if p["id"] in ids and p["stock"] <= p["min_stock"]
        ]
        return dict(id=iid, message="Bán hàng thành công", warnings=warnings)


def invoice_detail(iid):
    i = one(
        "SELECT i.*,c.name customer_name,c.phone customer_phone,c.address customer_address FROM invoice i LEFT JOIN customer c ON c.id=i.customer_id WHERE i.id=?",
        iid,
    )
    if not i:
        fail("Không tìm thấy hóa đơn phù hợp")
    lines = all(
        "SELECT l.*,l.quantity-COALESCE((SELECT SUM(r.quantity) FROM return_line r WHERE r.original_line_id=l.id AND r.kind='return'),0) returnable FROM invoice_line l WHERE invoice_id=? ORDER BY l.id",
        iid,
    )
    for l in lines:
        l["allocations"] = all(
            "SELECT a.*,s.receipt_id,s.expiry,COALESCE((SELECT SUM(quantity) FROM return_allocation WHERE allocation_id=a.id),0) returned,COALESCE((SELECT SUM(quantity) FROM return_allocation WHERE allocation_id=a.id AND restock=1),0) restocked FROM allocation a JOIN receipt_line s ON s.id=a.lot_id WHERE invoice_line_id=? ORDER BY a.id",
            l["id"],
        )
    tickets = all(
        "SELECT * FROM return_ticket WHERE invoice_id=? ORDER BY created_at,id", iid
    )
    for t in tickets:
        t["lines"] = all(
            "SELECT * FROM return_line WHERE ticket_id=? ORDER BY id", t["id"]
        )
    return dict(i, lines=lines, tickets=tickets)


def check_cancel(iid):
    i = one("SELECT * FROM invoice WHERE id=?", iid)
    if not i:
        fail("Không tìm thấy hóa đơn phù hợp")
    if i["status"] == "Đã hủy":
        fail("Hóa đơn này đã được hủy trước đó")
    if one("SELECT id FROM return_ticket WHERE invoice_id=?", iid):
        fail("Hóa đơn có giao dịch đổi/trả hàng, không thể hủy trực tiếp")
    return i


def cancel_invoice(d):
    if d.get("request_key") and one(
        "SELECT id FROM invoice WHERE cancel_request_key=?", d["request_key"]
    ):
        return dict(id=d["id"], message="Hủy hóa đơn thành công")
    check_cancel(d.get("id"))
    if not present(d.get("reason")):
        fail(
            "Vui lòng nhập lý do hủy hóa đơn",
            {"reason": "Vui lòng nhập lý do hủy hóa đơn"},
        )
    with atomic("Không thể hủy hóa đơn"):
        one("SELECT id FROM invoice WHERE id=? FOR UPDATE", d["id"])
        if d.get("request_key") and one(
            "SELECT id FROM invoice WHERE cancel_request_key=?", d["request_key"]
        ):
            return dict(id=d["id"], message="Hủy hóa đơn thành công")
        check_cancel(d["id"])
        lock_products(
            [
                x["product_id"]
                for x in all(
                    "SELECT product_id FROM invoice_line WHERE invoice_id=?", d["id"]
                )
            ]
        )
        time = now()
        allocations = all(
            "SELECT a.*,l.product_id FROM allocation a JOIN invoice_line l ON l.id=a.invoice_line_id WHERE l.invoice_id=? ORDER BY a.id",
            d["id"],
        )
        for a in allocations:
            run(
                "UPDATE receipt_line SET remaining=remaining+? WHERE id=?",
                a["quantity"],
                a["lot_id"],
            )
            movement(
                a["product_id"], a["lot_id"], "cancel", a["quantity"], time, d["id"]
            )
        run(
            "UPDATE invoice SET status='Đã hủy',cancel_reason=?,cancelled_at=?,cancel_request_key=? WHERE id=?",
            d["reason"].strip(),
            time,
            d.get("request_key") or None,
            d["id"],
        )
        return dict(id=d["id"], message="Hủy hóa đơn thành công")


def check_return(iid):
    i = invoice_detail(iid)
    if i["status"] == "Đã hủy" or not any(l["returnable"] > 0 for l in i["lines"]):
        fail("Hóa đơn không thể đổi/trả hàng")
    return i


def return_ticket(d):
    existing = one(
        "SELECT id FROM return_ticket WHERE request_key=?", d.get("request_key") or ""
    )
    if existing:
        return dict(id=existing["id"], message="Xử lý đổi/trả hàng thành công")
    check_return(d.get("invoice_id"))
    with atomic("Không thể lưu phiếu đổi/trả"):
        lock_request("return_ticket", d.get("request_key"))
        duplicate = one(
            "SELECT id FROM return_ticket WHERE request_key=?", d.get("request_key")
        )
        if duplicate:
            return dict(
                id=duplicate["id"], message="Xử lý đổi/trả hàng thành công", warnings=[]
            )
        one("SELECT id FROM invoice WHERE id=? FOR UPDATE", d["invoice_id"])
        invoice = check_return(d["invoice_id"])
        lock_products(
            [l["product_id"] for l in invoice["lines"]]
            + [l["product_id"] for l in (d.get("exchanges") or [])]
        )
        if not d.get("returns"):
            fail("Số lượng trả không hợp lệ")
        seen = set()
        returns = []
        for r in d["returns"]:
            l = next(
                (x for x in invoice["lines"] if x["id"] == ident(r.get("line_id"))),
                None,
            )
            if (
                not l
                or not integer(r.get("quantity"))
                or not positive(r.get("quantity"))
                or number(r["quantity"]) > l["returnable"]
                or l["id"] in seen
            ):
                fail("Số lượng trả không hợp lệ")
            seen.add(l["id"])
            returns.append(
                dict(
                    l,
                    quantity=ident(r["quantity"]),
                    restock=r.get("restock") is not False,
                    total=ident(r["quantity"]) * l["price"],
                )
            )
        exchanges = (
            []
            if d.get("only_return")
            else [sale_line(l) for l in (d.get("exchanges") or [])]
        )
        demand = {}
        for l in exchanges:
            demand[l["product_id"]] = (
                demand.get(l["product_id"], 0) + l["quantity"] * l["factor"]
            )
        for pid, qty in demand.items():
            available = one(
                "SELECT COALESCE(SUM(remaining),0) n FROM receipt_line WHERE product_id=? AND (expiry IS NULL OR expiry>=?)",
                pid,
                day(),
            )["n"]
            for l in [r for r in returns if r["product_id"] == pid and r["restock"]]:
                left = l["quantity"] * l["factor"]
                for a in reversed(l["allocations"]):
                    used = min(left, a["quantity"] - a["returned"])
                    if used > 0 and (not a["expiry"] or a["expiry"] >= day()):
                        available += used
                    left -= max(0, used)
                    if left <= 0:
                        break
            if qty > available:
                fail("Không đủ số lượng hàng có thể bán")
        return_total = sum(l["total"] for l in returns)
        exchange_total = sum(l["total"] for l in exchanges)
        difference = exchange_total - return_total
        if difference != 0 and not d.get("money_confirmed"):
            fail("Vui lòng xác nhận đã xử lý tiền chênh lệch")
        tid, time = code("DT"), now()
        run(
            "INSERT INTO return_ticket VALUES (?,?,?,?,?,?,?,?)",
            tid,
            invoice["id"],
            time,
            return_total,
            exchange_total,
            difference,
            int(bool(d.get("money_confirmed"))),
            d.get("request_key"),
        )
        for l in returns:
            line = run(
                "INSERT INTO return_line(ticket_id,original_line_id,kind,product_id,product_name,unit_id,unit_name,factor,quantity,price,cost,total,restock) VALUES (?,?,'return',?,?,?,?,?,?,?,?,?,?)",
                tid,
                l["id"],
                l["product_id"],
                l["product_name"],
                l["unit_id"],
                l["unit_name"],
                l["factor"],
                l["quantity"],
                l["price"],
                l["cost"],
                l["total"],
                int(l["restock"]),
            )["lastInsertRowid"]
            left = l["quantity"] * l["factor"]
            allocations = all(
                "SELECT a.*,a.quantity-COALESCE((SELECT SUM(quantity) FROM return_allocation WHERE allocation_id=a.id),0) available FROM allocation a WHERE invoice_line_id=? ORDER BY a.id DESC",
                l["id"],
            )
            for a in allocations:
                if not left:
                    break
                qty = min(a["available"], left)
                if qty <= 0:
                    continue
                run(
                    "INSERT INTO return_allocation(return_line_id,allocation_id,quantity,restock) VALUES (?,?,?,?)",
                    line,
                    a["id"],
                    qty,
                    int(l["restock"]),
                )
                if l["restock"]:
                    run(
                        "UPDATE receipt_line SET remaining=remaining+? WHERE id=?",
                        qty,
                        a["lot_id"],
                    )
                    movement(l["product_id"], a["lot_id"], "return", qty, time, tid)
                left -= qty
            if left > 0:
                fail("Số lượng trả không hợp lệ")
        for l in exchanges:
            line = run(
                "INSERT INTO return_line(ticket_id,kind,product_id,product_name,unit_id,unit_name,factor,quantity,price,cost,total,restock) VALUES (?,'exchange',?,?,?,?,?,?,?,?,?,0)",
                tid,
                l["product_id"],
                l["product_name"],
                l["unit_id"],
                l["unit_name"],
                l["factor"],
                l["quantity"],
                l["price"],
                l["cost"],
                l["total"],
            )["lastInsertRowid"]
            allocate(l, None, line, "exchange", time, tid)
        return dict(
            id=tid,
            invoice_id=invoice["id"],
            difference=difference,
            message="Xử lý đổi/trả hàng thành công",
        )


def adjust_stock(d):
    existing = one(
        "SELECT id FROM adjustment WHERE request_key=?", d.get("request_key") or ""
    )
    if existing:
        return dict(id=existing["id"], message="Điều chỉnh tồn kho thành công")
    required(d, ["reason"], "Không được để trống")
    if not d.get("lines"):
        fail("Không được để trống", {"lines": "Không được để trống"})
    seen = set()
    for l in d["lines"]:
        field = "line_" + str(l.get("lot_id"))
        if not present(l.get("quantity")):
            fail("Không được để trống", {field: "Không được để trống"})
        lot = one("SELECT * FROM receipt_line WHERE id=?", ident(l.get("lot_id")))
        if (
            not lot
            or not integer(l["quantity"])
            or number(l["quantity"]) < 0
            or number(l["quantity"]) > lot["original_quantity"]
            or l.get("lot_id") in seen
        ):
            fail(
                "Số lượng điều chỉnh không hợp lệ",
                {field: "Số lượng điều chỉnh không hợp lệ"},
            )
        seen.add(l.get("lot_id"))
    with atomic("Không thể lưu phiếu điều chỉnh"):
        lock_request("adjustment", d.get("request_key"))
        duplicate = one(
            "SELECT id FROM adjustment WHERE request_key=?", d.get("request_key")
        )
        if duplicate:
            return dict(
                id=duplicate["id"], message="Điều chỉnh tồn kho thành công", warnings=[]
            )
        ids = [ident(l.get("lot_id")) for l in d["lines"]]
        marks = ",".join("?" for _ in ids)
        lock_products(
            [
                x["product_id"]
                for x in all(
                    f"SELECT DISTINCT product_id FROM receipt_line WHERE id IN ({marks})",
                    *ids,
                )
            ]
        )
        aid, time = code("DC"), now()
        run(
            "INSERT INTO adjustment VALUES (?,?,?,?)",
            aid,
            time,
            d["reason"].strip(),
            d.get("request_key"),
        )
        for l in d["lines"]:
            lot = one("SELECT * FROM receipt_line WHERE id=?", ident(l["lot_id"]))
            qty = ident(l["quantity"])
            delta = qty - lot["remaining"]
            run(
                "INSERT INTO adjustment_line(adjustment_id,lot_id,old_quantity,new_quantity,delta) VALUES (?,?,?,?,?)",
                aid,
                lot["id"],
                lot["remaining"],
                qty,
                delta,
            )
            run("UPDATE receipt_line SET remaining=? WHERE id=?", qty, lot["id"])
            movement(lot["product_id"], lot["id"], "adjustment", delta, time, aid)
        return dict(id=aid, message="Điều chỉnh tồn kho thành công")


def print_invoice(iid, send=False):
    invoice = invoice_detail(iid)
    if invoice["status"] == "Đã hủy":
        fail("Hóa đơn đã bị hủy, không thể in")
    flag = one("SELECT value FROM setting WHERE key=?", scoped_key("printer_error"))
    if send and flag and flag["value"] == "1":
        fail("Không thể kết nối hoặc gửi yêu cầu đến máy in")
    return invoice
