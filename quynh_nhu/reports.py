"""Report snapshots share one calculation with the screen, Excel and PDF."""

import json
from uuid import uuid4
from .db import all, one, run, transaction, day, now, session_token
from .service import products, take_failure, valid_date, ident
from .errors import fail


def date_text(value):
    return value[8:10] + "/" + value[5:7] + "/" + value[:4]


def report_data(d):
    if (
        not valid_date(d.get("from"))
        or not valid_date(d.get("to"))
        or d["from"] > d["to"]
        or d["to"] > day()
        or d["from"] > day()
        or d.get("type")
        not in ["Doanh thu", "Lợi nhuận", "Sản phẩm bán chạy/chậm", "Xuất – nhập – tồn"]
        or (
            d.get("rank") and d["rank"] not in ["Số lượng bán thuần", "Doanh thu thuần"]
        )
    ):
        fail("Khoảng thời gian hoặc tiêu chí lọc không hợp lệ")
    if take_failure("fail_load"):
        fail("Không thể tải báo cáo. Vui lòng thử lại")
    with transaction():
        ps = products()
        if (d.get("product") and not any(p["id"] == d["product"] for p in ps)) or (
            d.get("category")
            and not one("SELECT id FROM category WHERE id=?", ident(d["category"]))
        ):
            fail("Khoảng thời gian hoặc tiêu chí lọc không hợp lệ")
        pids = d.get("products", [])
        cids = d.get("categories", [])
        if (
            not isinstance(pids, list)
            or not isinstance(cids, list)
            or any(
                not isinstance(v, str) or not any(p["id"] == v for p in ps)
                for v in pids
            )
            or any(
                not isinstance(v, (int, str)) or not str(v).lstrip("-").isdigit()
                for v in cids
            )
        ):
            fail("Khoảng thời gian hoặc tiêu chí lọc không hợp lệ")
        selection_names = []
        for cid in cids:
            c = one("SELECT name FROM category WHERE id=?", ident(cid))
            if not c:
                fail("Khoảng thời gian hoặc tiêu chí lọc không hợp lệ")
            selection_names.append(c["name"])
        selection_names.extend(p["name"] for p in ps if p["id"] in pids)
        chosen = [
            p
            for p in ps
            if (not d.get("product") or p["id"] == d["product"])
            and (not d.get("category") or p["category_id"] == ident(d["category"]))
            and (
                (not pids and not cids)
                or p["id"] in pids
                or p["category_id"] in [ident(c) for c in cids]
            )
        ]
        ids = {p["id"] for p in chosen}
        events = []
        for l in all(
            "SELECT l.*,i.created_at,i.cancelled_at FROM invoice_line l JOIN invoice i ON i.id=l.invoice_id"
        ):
            if l["product_id"] not in ids:
                continue
            e = dict(
                product=l["product_id"],
                invoice=l["invoice_id"],
                quantity=l["quantity"] * l["factor"],
                revenue=l["total"],
                cost=l["quantity"] * l["factor"] * l["cost"],
            )
            events.append(dict(e, time=l["created_at"], count=1))
            if l["cancelled_at"]:
                events.append(
                    dict(
                        e,
                        time=l["cancelled_at"],
                        quantity=-e["quantity"],
                        revenue=-e["revenue"],
                        cost=-e["cost"],
                        count=-1,
                    )
                )
        for l in all(
            "SELECT l.*,t.created_at,t.invoice_id FROM return_line l JOIN return_ticket t ON t.id=l.ticket_id"
        ):
            if l["product_id"] not in ids:
                continue
            sign = -1 if l["kind"] == "return" else 1
            events.append(
                dict(
                    product=l["product_id"],
                    invoice=l["invoice_id"],
                    time=l["created_at"],
                    quantity=sign * l["quantity"] * l["factor"],
                    revenue=sign * l["total"],
                    cost=sign * l["quantity"] * l["factor"] * l["cost"],
                    count=0,
                )
            )
        period = [e for e in events if d["from"] <= day(e["time"]) <= d["to"]]
        revenue = sum(e["revenue"] for e in period)
        cost = sum(e["cost"] for e in period)
        dated = {}
        counted = set()
        for e in period:
            date = day(e["time"])
            row = dated.setdefault(date, dict(day=date, revenue=0, cost=0, invoices=0))
            row["revenue"] += e["revenue"]
            row["cost"] += e["cost"]
            key = (e["invoice"], date, e["count"])
            if e["count"] and key not in counted:
                row["invoices"] += e["count"]
                counted.add(key)
        trend = [dated[k] for k in sorted(dated)]
        has_data = bool(period)
        if d["type"] == "Xuất – nhập – tồn":
            moves = all("SELECT * FROM movement ORDER BY id")
            rows = []
            for p in chosen:
                start = inp = out = inc = dec = 0
                for m in moves:
                    if m["product_id"] != p["id"]:
                        continue
                    date = day(m["created_at"])
                    if date < d["from"]:
                        start += m["quantity"]
                    elif date <= d["to"]:
                        if m["kind"] == "adjustment":
                            if m["quantity"] > 0:
                                inc += m["quantity"]
                            else:
                                dec -= m["quantity"]
                        elif m["quantity"] >= 0:
                            inp += m["quantity"]
                        else:
                            out -= m["quantity"]
                end = start + inp - out + inc - dec
                row = [
                    p["name"],
                    start,
                    inp,
                    out,
                    inc,
                    dec,
                    end,
                    end * p["average_cost"],
                ]
                if any(row[1:7]):
                    rows.append(row)
            sections = [
                dict(
                    title="Báo cáo xuất – nhập – tồn",
                    columns=[
                        "Sản phẩm",
                        "Tồn đầu kỳ",
                        "Nhập",
                        "Xuất",
                        "Điều chỉnh tăng",
                        "Điều chỉnh giảm",
                        "Tồn cuối kỳ",
                        "Giá trị tồn",
                    ],
                    rows=rows,
                    total=["Tổng"] + [sum(r[i] for r in rows) for i in range(1, 8)],
                )
            ]
            has_data = bool(rows)
        elif d["type"] == "Sản phẩm bán chạy/chậm":
            metrics = [
                dict(
                    p=p,
                    quantity=sum(
                        e["quantity"] for e in period if e["product"] == p["id"]
                    ),
                    revenue=sum(
                        e["revenue"] for e in period if e["product"] == p["id"]
                    ),
                )
                for p in chosen
            ]
            by_revenue = d.get("rank") == "Doanh thu thuần"
            key = "revenue" if by_revenue else "quantity"

            def make(title, items, slow=False):
                rows = [
                    [
                        i + 1,
                        m["p"]["name"],
                        m["quantity"],
                        m["p"]["stock"] if slow else m["revenue"],
                    ]
                    for i, m in enumerate(items)
                ]
                columns = (
                    ["#", "Sản phẩm", "SL bán thuần ↑", "Tồn kho"]
                    if slow
                    else [
                        "#",
                        "Sản phẩm",
                        "SL bán thuần" if by_revenue else "SL bán thuần ↓",
                        "Doanh thu thuần ↓" if by_revenue else "Doanh thu thuần",
                    ]
                )
                return dict(
                    title=title,
                    columns=columns,
                    rows=rows,
                    total=[
                        "Tổng",
                        "",
                        sum(r[2] for r in rows),
                        sum(r[3] for r in rows),
                    ],
                )

            fast = sorted(
                [m for m in metrics if m[key] > 0],
                key=lambda m: (-m[key], m["p"]["id"]),
            )[:10]
            slow = sorted(
                [m for m in metrics if m["p"]["stock"] > 0],
                key=lambda m: (m["quantity"], m["p"]["id"]),
            )[:10]
            sections = [
                make("Top 10 sản phẩm bán chạy", fast),
                make("Top 10 sản phẩm bán chậm", slow, True),
            ]
            has_data = any(s["rows"] for s in sections)
        else:
            profit = d["type"] == "Lợi nhuận"
            rows = [
                (
                    [r["day"], r["revenue"], r["cost"], r["revenue"] - r["cost"]]
                    if profit
                    else [r["day"], r["invoices"], r["revenue"]]
                )
                for r in trend
            ]
            columns = (
                ["Ngày", "Doanh thu thuần", "Tổng giá vốn", "Lợi nhuận gộp"]
                if profit
                else ["Ngày", "Số hóa đơn", "Doanh thu thuần"]
            )
            sections = [
                dict(
                    title="Báo cáo " + d["type"].lower(),
                    columns=columns,
                    rows=rows,
                    total=["Tổng"]
                    + [sum(r[i] for r in rows) for i in range(1, len(columns))],
                )
            ]
        category = (
            one("SELECT name FROM category WHERE id=?", ident(d["category"]))["name"]
            if d.get("category")
            else "Tất cả"
        )
        product = next((p["name"] for p in ps if p["id"] == d.get("product")), "Tất cả")
        text = f"Từ ngày: {date_text(d['from'])} · Đến ngày: {date_text(d['to'])} · Sản phẩm: {product} · Nhóm sản phẩm: {category}"
        if selection_names:
            text += " · Sản phẩm / nhóm sản phẩm: " + ", ".join(selection_names)
        if d["type"] == "Sản phẩm bán chạy/chậm":
            text += " · Tiêu chí xếp hạng: " + (d.get("rank") or "Số lượng bán thuần")
        report = dict(
            id=str(uuid4()),
            type=d["type"],
            filters=dict(
                d,
                category_name=category,
                product_name=product,
                selection_names=selection_names,
            ),
            filterText=text,
            sections=sections,
            summary=dict(
                revenue=revenue,
                cost=cost,
                profit=revenue - cost,
                invoices=sum(r["invoices"] for r in trend),
            ),
            trend=trend,
            hasData=has_data,
        )
        run(
            "INSERT INTO report_snapshot VALUES (?,?,?,?)",
            report["id"],
            session_token.get(),
            now(),
            json.dumps(report, ensure_ascii=False),
        )
        return report


def export_snapshot(rid):
    if take_failure("fail_export_read"):
        fail("Không thể xuất báo cáo, vui lòng thử lại")
    row = one(
        "SELECT data FROM report_snapshot WHERE id=? AND session_token=?",
        rid,
        session_token.get(),
    )
    if not row:
        fail("Không thể xuất báo cáo, vui lòng thử lại")
    data = json.loads(row["data"])
    if not data["hasData"]:
        fail("Không thể xuất báo cáo, vui lòng thử lại")
    if take_failure("fail_export_file"):
        fail("Xuất báo cáo không thành công, vui lòng thử lại")
    return data
