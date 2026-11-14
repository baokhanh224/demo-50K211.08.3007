import { productCategoryNames, productErrors, productExpiry } from "./product-validation";
import { supplierErrors } from "./supplier-validation";
import {
  db,
  all,
  one,
  run,
  code,
  now,
  day,
  transaction,
  lockProducts,
  requestContext,
} from "./db";
import {
  BusinessError,
  fail,
  present,
  positive,
  integer,
  required,
} from "./errors";
const scopedKey = (key: string) =>
  (requestContext.getStore()?.token || "cli") + ":" + key;
export async function takeFailure(key: string) {
  return !!(await one(
    "DELETE FROM setting WHERE key=? AND value='1' RETURNING key",
    scopedKey(key),
  ));
}
export async function atomic<T>(message: string, fn: () => T) {
  const force = await takeFailure("fail_save");
  try {
    return await transaction(async () => {
      const result = await fn();
      if (force) throw new Error("DEMO_ROLLBACK");
      return result;
    });
  } catch (e) {
    if (e instanceof BusinessError) throw e;
    throw new BusinessError(message, {}, 500);
  }
}
export async function settings() {
  return Object.fromEntries(
    (await all("SELECT * FROM setting WHERE key LIKE ?", scopedKey("%"))).map(
      (s) => [s.key.slice(s.key.indexOf(":") + 1), s.value === "1"],
    ),
  );
}
export async function setSettings(d: any) {
  const keys = [
    "printer_error",
    "fail_save",
    "fail_load",
    "fail_export_read",
    "fail_export_file",
  ];
  await transaction(async () => {
    for (const k of keys)
      if (k in d)
        await run(
          "INSERT INTO setting VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
          scopedKey(k),
          d[k] ? "1" : "0",
        );
  });
  return await settings();
}
export async function products() {
  const [ps, units, histories] = await Promise.all([
    all(
      `SELECT p.*,c.name category,COALESCE((SELECT SUM(remaining) FROM receipt_line l WHERE l.product_id=p.id),0) stock,COALESCE((SELECT SUM(remaining) FROM receipt_line l WHERE l.product_id=p.id AND (l.expiry IS NULL OR l.expiry>=?)),0) sellable FROM product p JOIN category c ON c.id=p.category_id ORDER BY p.id`,
      day(),
    ),
    all("SELECT * FROM unit ORDER BY factor,id"),
    all(
      "SELECT h.*,u.name unit_name,u.product_id FROM price_history h JOIN unit u ON u.id=h.unit_id ORDER BY h.id DESC",
    ),
  ]);
  return ps.map((p) => ({
    ...p,
    units: units.filter((u) => u.product_id === p.id),
    price_history: histories.filter((h) => h.product_id === p.id),
  }));
}
export async function suppliers() {
  const [ss, cs] = await Promise.all([
    all("SELECT * FROM supplier ORDER BY id"),
    all(
      "SELECT sc.*,c.name FROM supplier_category sc JOIN category c ON c.id=sc.category_id",
    ),
  ]);
  return ss.map((s) => ({
    ...s,
    category_ids: cs
      .filter((c) => c.supplier_id === s.id)
      .map((c) => c.category_id),
    categories: cs.filter((c) => c.supplier_id === s.id).map((c) => c.name),
  }));
}
export async function lots() {
  return await all(
    `SELECT l.*,p.name product_name,p.barcode,p.base_unit,p.min_stock,r.created_at,s.name supplier_name FROM receipt_line l JOIN product p ON p.id=l.product_id JOIN receipt r ON r.id=l.receipt_id JOIN supplier s ON s.id=r.supplier_id ORDER BY r.created_at,l.id`,
  );
}
export async function bootstrap() {
  const categories = await all("SELECT * FROM category ORDER BY id");
  return {
    today: day(),
    categories,
    product_categories: categories.filter(c => productCategoryNames.includes(c.name)).sort((a,b) => productCategoryNames.indexOf(a.name)-productCategoryNames.indexOf(b.name)),
    products: await products(),
    suppliers: await suppliers(),
    customers: await all("SELECT * FROM customer ORDER BY id"),
    settings: await settings(),
  };
}
export async function saveProduct(d: any) {
  const edit = !!d.id;
  if (edit) {
    const existing = await one("SELECT * FROM product WHERE id=?", d.id);
    if (!existing) fail("Sản phẩm không tồn tại!");
    d = { ...existing, ...d };
  }
  const fields = productErrors(d, day());
  const categoryId = Number(d.category_id);
  const category = Number.isSafeInteger(categoryId) && categoryId > 0 ? await one("SELECT id,name FROM category WHERE id=?", categoryId) : null;
  if (!category || !productCategoryNames.includes(category.name)) fields.category_id = fields.category_id || "Dữ liệu không hợp lệ!";
  if (!integer(d.min_stock ?? 0) || Number(d.min_stock ?? 0) < 0)
    fields.min_stock = "Dữ liệu không hợp lệ!";
  const extras = d.units || [];
  if (!edit) {
    const names = new Set([String(d.base_unit).trim().toLocaleLowerCase("vi")]);
    for (const u of extras) {
      if (
        !present(u.name) ||
        !integer(u.factor) ||
        Number(u.factor) <= 0 ||
        !positive(u.price) ||
        names.has(String(u.name).trim().toLocaleLowerCase("vi"))
      )
        fields.units = "Dữ liệu không hợp lệ!";
      names.add(String(u.name).trim().toLocaleLowerCase("vi"));
    }
  }
  if (Object.keys(fields).length) fail("Dữ liệu không hợp lệ!", fields);
  return await transaction(async () => {
    if (edit && !(await one("SELECT id FROM product WHERE id=?", d.id)))
      fail("Sản phẩm không tồn tại!");
    const id = d.id || (await code("SP"));
    if (edit) {
      await run(
        "UPDATE product SET name=?,category_id=?,barcode=?,base_unit=?,reference_cost=?,average_cost=CASE WHEN EXISTS(SELECT 1 FROM receipt_line WHERE product_id=?) THEN average_cost ELSE ? END,min_stock=?,expiry_managed=?,description=?,expiry=? WHERE id=?",
        d.name.trim(),
        Number(d.category_id),
        d.barcode?.trim() || "",
        d.base_unit.trim(),
        Number(d.reference_cost),
        id,
        Number(d.reference_cost),
        Number(d.min_stock || 0),
        d.expiry_managed ? 1 : 0,
        d.description?.trim() || "",
        productExpiry(d.expiry) || null,
        id,
      );
      const base = await one(
        "SELECT * FROM unit WHERE product_id=? AND factor=1 ORDER BY id LIMIT 1",
        id,
      );
      if (base && base.name !== d.base_unit.trim()) {
        if (
          await one(
            "SELECT id FROM unit WHERE product_id=? AND name=? AND id<>?",
            id,
            d.base_unit.trim(),
            base.id,
          )
        )
          fail("Dữ liệu không hợp lệ!", { base_unit: "Dữ liệu không hợp lệ!" });
        await run(
          "UPDATE unit SET name=? WHERE id=?",
          d.base_unit.trim(),
          base.id,
        );
      }
    } else {
      await run(
        "INSERT INTO product(id,name,category_id,barcode,base_unit,reference_cost,average_cost,min_stock,expiry_managed,description,expiry) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        id,
        d.name.trim(),
        Number(d.category_id),
        d.barcode?.trim() || "",
        d.base_unit.trim(),
        Number(d.reference_cost),
        Number(d.reference_cost),
        Number(d.min_stock || 0),
        d.expiry_managed ? 1 : 0,
        d.description?.trim() || "",
        productExpiry(d.expiry) || null,
      );
      for (const u of [
        { name: d.base_unit, factor: 1, price: d.price },
        ...extras,
      ])
        await run(
          "INSERT INTO unit(product_id,name,factor,price) VALUES (?,?,?,?)",
          id,
          u.name.trim(),
          Number(u.factor),
          Number(u.price),
        );
    }
    return {
      id,
      message: edit
        ? "Cập nhật sản phẩm thành công!"
        : "Thêm sản phẩm thành công!",
    };
  });
}
export async function deleteProduct(id: string) {
  return await transaction(async () => {
    if (!(await one("SELECT id FROM product WHERE id=?", id)))
      fail("Sản phẩm không tồn tại!");
    if (
      (await one("SELECT id FROM receipt_line WHERE product_id=?", id)) ||
      (await one("SELECT id FROM invoice_line WHERE product_id=?", id)) ||
      (await one("SELECT id FROM return_line WHERE product_id=?", id))
    )
      fail("Không thể xóa sản phẩm đã có tồn kho hoặc giao dịch!");
    await run(
      "DELETE FROM price_history WHERE unit_id IN (SELECT id FROM unit WHERE product_id=?)",
      id,
    );
    await run("DELETE FROM unit WHERE product_id=?", id);
    await run("DELETE FROM product WHERE id=?", id);
    return { message: "Xóa sản phẩm thành công!" };
  });
}
export async function updatePrice(d: any) {
  required(d, ["price"]);
  if (!positive(d.price))
    fail("Giá bán không hợp lệ!", { price: "Giá bán không hợp lệ!" });
  const u = await one(
    "SELECT u.*,p.reference_cost FROM unit u JOIN product p ON p.id=u.product_id WHERE u.id=?",
    Number(d.unit_id),
  );
  if (!u) fail("Sản phẩm không tồn tại!");
  if (Number(d.price) < u.reference_cost * u.factor && !d.confirmed)
    return { warning: "Giá bán thấp hơn giá nhập. Bạn có muốn tiếp tục?" };
  return await transaction(async () => {
    await run(
      "INSERT INTO price_history(unit_id,old_price,new_price,created_at) VALUES (?,?,?,?)",
      u.id,
      u.price,
      Number(d.price),
      now(),
    );
    await run("UPDATE unit SET price=? WHERE id=?", Number(d.price), u.id);
    return { message: "Cập nhật giá bán thành công!" };
  });
}
export async function saveSupplier(d: any) {
  const categories = await all("SELECT * FROM category");
  const fields = supplierErrors(d, categories);
  if (Object.keys(fields).length) fail(Object.values(fields)[0], fields);
  return await transaction(async () => {
    const id = d.id || (await code("NCC"));
    if (d.id) {
      if (!(await one("SELECT id FROM supplier WHERE id=?", id)))
        fail("Dữ liệu không hợp lệ!");
      await run(
        "UPDATE supplier SET name=?,phone=?,email=?,address=?,description=?,status=? WHERE id=?",
        d.name.trim(),
        d.phone,
        d.email?.trim() || "",
        d.address?.trim() || "",
        d.description?.trim() || "",
        d.status,
        id,
      );
      await run("DELETE FROM supplier_category WHERE supplier_id=?", id);
    } else
      await run(
        "INSERT INTO supplier(id,name,phone,email,address,description) VALUES (?,?,?,?,?,?)",
        id,
        d.name.trim(),
        d.phone,
        d.email?.trim() || "",
        d.address?.trim() || "",
        d.description?.trim() || "",
      );
    const ids = new Set<number>((d.category_ids || []).map(Number));
    if (d.other)
      ids.add(
        Number(
          (
            await run(
              "INSERT INTO category(name) VALUES (?)",
              d.new_category.trim(),
            )
          ).lastInsertRowid,
        ),
      );
    for (const c of ids) {
      if (!categories.some((x) => x.id === c) && !d.other)
        fail("Dữ liệu không hợp lệ!");
      await run("INSERT INTO supplier_category VALUES (?,?)", id, c);
    }
    return {
      id,
      message: d.id
        ? "Cập nhật thông tin nhà cung cấp thành công!"
        : "Thêm nhà cung cấp thành công!",
    };
  });
}
export async function deleteSupplier(id: string) {
  return await transaction(async () => {
    if (await one("SELECT id FROM receipt WHERE supplier_id=?", id))
      fail("Không thể xóa nhà cung cấp đã phát sinh giao dịch nhập hàng!");
    await run("DELETE FROM supplier_category WHERE supplier_id=?", id);
    await run("DELETE FROM supplier WHERE id=?", id);
    return { message: "Xóa nhà cung cấp thành công!" };
  });
}
export async function validateReceiptLine(d: any, index?: number) {
  const prefix = index === undefined ? "" : `lines.${index}.`;
  const fields: Record<string, string> = {};
  const p = await one("SELECT * FROM product WHERE id=?", d.product_id || "");
  const unit = await one(
    "SELECT * FROM unit WHERE id=? AND product_id=?",
    Number(d.unit_id) || 0,
    d.product_id || "",
  );
  for (const k of [
    "product_id",
    "unit_id",
    "quantity",
    "price",
    ...(p?.expiry_managed ? ["expiry"] : []),
  ])
    if (!present(d[k])) fields[prefix + k] = "Không được để trống";
  if (Object.keys(fields).length) fail("Không được để trống", fields);
  if (
    !p ||
    !unit ||
    !integer(d.quantity) ||
    !positive(d.quantity) ||
    !positive(d.price)
  )
    fail("Số lượng nhập và giá nhập phải lớn hơn 0", {
      [prefix + "quantity"]: "Số lượng nhập và giá nhập phải lớn hơn 0",
      [prefix + "price"]: "Số lượng nhập và giá nhập phải lớn hơn 0",
    });
  if (p.expiry_managed && (!validDate(d.expiry) || d.expiry <= day()))
    fail("Hạn sử dụng phải sau ngày nhập hàng", {
      [prefix + "expiry"]: "Hạn sử dụng phải sau ngày nhập hàng",
    });
  return { p, unit };
}
export function validDate(v: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(v || "") &&
    !Number.isNaN(Date.parse(v)) &&
    new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v
  );
}
export async function movement(
  product: string,
  lot: number,
  kind: string,
  quantity: number,
  time: string,
  reference: string,
) {
  await run(
    "INSERT INTO movement(product_id,lot_id,kind,quantity,created_at,reference) VALUES (?,?,?,?,?,?)",
    product,
    lot,
    kind,
    quantity,
    time,
    reference,
  );
}
export async function saveReceipt(d: any) {
  const existing = await one(
    "SELECT id FROM receipt WHERE request_key=?",
    d.request_key || "",
  );
  if (existing) return { id: existing.id, message: "Nhập hàng thành công" };
  required(d, ["supplier_id"], "Không được để trống");
  if (!(await one("SELECT id FROM supplier WHERE id=?", d.supplier_id)))
    fail("Không được để trống", { supplier_id: "Không được để trống" });
  if (!d.lines?.length)
    fail("Không được để trống", { lines: "Không được để trống" });
  await Promise.all(
    d.lines.map(async (l: any, i: number) => await validateReceiptLine(l, i)),
  );
  return await atomic("Không thể lưu phiếu nhập", async () => {
    await one(
      "SELECT pg_advisory_xact_lock(hashtextextended(?::text,0))::text",
      "receipt:" + d.request_key,
    );
    const duplicate = await one(
      "SELECT id FROM receipt WHERE request_key=?",
      d.request_key,
    );
    if (duplicate)
      return {
        id: duplicate.id,
        message: "Nhập hàng thành công",
        warnings: [],
      };
    await lockProducts(d.lines.map((l: any) => l.product_id));
    const id = await code("PN"),
      time = now();
    await run(
      "INSERT INTO receipt VALUES (?,?,?,?,?)",
      id,
      d.supplier_id,
      time,
      d.lines.reduce(
        (s: number, l: any) => s + Number(l.quantity) * Number(l.price),
        0,
      ),
      d.request_key,
    );
    for (const l of d.lines) {
      const { p, unit } = await validateReceiptLine(l);
      const base = Number(l.quantity) * unit.factor;
      const stock = (
        await one(
          "SELECT COALESCE(SUM(remaining),0) n FROM receipt_line WHERE product_id=?",
          p.id,
        )
      ).n;
      const average =
        (stock * p.average_cost + Number(l.quantity) * Number(l.price)) /
        (stock + base);
      const lot = Number(
        (
          await run(
            "INSERT INTO receipt_line(receipt_id,product_id,unit_id,unit_name,factor,quantity,price,total,expiry,original_quantity,remaining) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            id,
            p.id,
            unit.id,
            unit.name,
            unit.factor,
            Number(l.quantity),
            Number(l.price),
            Number(l.quantity) * Number(l.price),
            p.expiry_managed ? l.expiry : null,
            base,
            base,
          )
        ).lastInsertRowid,
      );
      await run("UPDATE product SET average_cost=? WHERE id=?", average, p.id);
      await movement(p.id, lot, "receipt", base, time, id);
    }
    return { id, message: "Nhập hàng thành công" };
  });
}
export async function receiptDetail(id: string) {
  const r = await one(
    "SELECT r.*,s.name supplier_name FROM receipt r JOIN supplier s ON s.id=r.supplier_id WHERE r.id=?",
    id,
  );
  if (!r) fail("Không tìm thấy phiếu nhập");
  return {
    ...r,
    lines: await all(
      "SELECT l.*,p.name product_name,p.base_unit FROM receipt_line l JOIN product p ON p.id=l.product_id WHERE receipt_id=? ORDER BY l.id",
      id,
    ),
  };
}
export async function query(d: any) {
  const errors: Record<string, string> = {
    inventory: "Không thể tải dữ liệu tồn kho",
    "receipt-history": "Không thể tải lịch sử nhập hàng",
    "sales-history": "Không thể tải lịch sử bán hàng",
    reports: "Không thể tải báo cáo. Vui lòng thử lại",
  };
  const q = String(d.q || "")
    .trim()
    .toLocaleLowerCase("vi");
  const matches = (...ss: any[]) =>
    ss.some((s) =>
      String(s || "")
        .toLocaleLowerCase("vi")
        .includes(q),
    );
  if (d.from && d.to && d.from > d.to) fail("Khoảng thời gian không hợp lệ");
  if ((d.from && !validDate(d.from)) || (d.to && !validDate(d.to)))
    fail("Khoảng thời gian không hợp lệ");
  if (await takeFailure("fail_load"))
    fail(errors[d.scope] || "Không thể tải dữ liệu");
  if (d.scope === "receipt-history")
    return (
      await all(
        "SELECT r.*,s.name supplier_name FROM receipt r JOIN supplier s ON s.id=r.supplier_id ORDER BY r.created_at DESC,r.id DESC",
      )
    ).filter(
      (r) =>
        matches(r.id, r.supplier_name) &&
        (!d.from || day(new Date(r.created_at)) >= d.from) &&
        (!d.to || day(new Date(r.created_at)) <= d.to),
    );
  if (d.scope === "inventory") {
    const ps = (await products()).filter((p) =>
      matches(p.id, p.name, p.barcode),
    );
    if (["Sắp hết hạn", "Đã hết hạn"].includes(d.filter)) {
      const future = new Date();
      future.setUTCDate(future.getUTCDate() + 30);
      return (await lots()).filter(
        (l) =>
          ps.some((p) => p.id === l.product_id) &&
          l.remaining > 0 &&
          l.expiry &&
          (d.filter === "Đã hết hạn"
            ? l.expiry < day()
            : l.expiry >= day() && l.expiry <= day(future)),
      );
    }
    return ps.filter(
      (p) => d.filter !== "Dưới mức cảnh báo tồn kho" || p.stock <= p.min_stock,
    );
  }
  if (d.scope === "products")
    return (await products()).filter(
      (p) =>
        matches(p.id, p.name) &&
        (!d.category || p.category_id === Number(d.category)),
    );
  if (d.scope === "suppliers")
    return (await suppliers()).filter(
      (s) =>
        matches(s.id, s.name) &&
        (!d.category || s.category_ids.includes(Number(d.category))) &&
        (!d.status || s.status === d.status),
    );
  if (d.scope === "customers")
    return (await all("SELECT * FROM customer ORDER BY id")).filter((c) =>
      matches(c.id, c.name, c.phone),
    );
  if (d.scope === "adjustments")
    return (await lots()).filter((l) =>
      matches(l.product_id, l.product_name, l.barcode),
    );
  if (d.scope === "sales-history")
    return (
      await all(
        "SELECT i.*,c.name customer_name,c.phone FROM invoice i LEFT JOIN customer c ON c.id=i.customer_id ORDER BY i.created_at DESC,i.id DESC",
      )
    ).filter(
      (i) =>
        matches(i.id, i.phone) &&
        (!d.invoice_id || i.id.toLocaleLowerCase("vi").includes(String(d.invoice_id).trim().toLocaleLowerCase("vi"))) &&
        (!d.phone || String(i.phone || "").includes(String(d.phone).trim())) &&
        (!d.from || day(new Date(i.created_at)) >= d.from) &&
        (!d.to || day(new Date(i.created_at)) <= d.to),
    );
  return [];
}
export async function saveCustomer(d: any) {
  if (!present(d.name) || !present(d.phone))
    fail("Vui lòng nhập đầy đủ Tên khách hàng và Số điện thoại");
  if (
    !/^[\p{L}\p{M} .'-]+$/u.test(d.name.trim()) ||
    !/[\p{L}]/u.test(d.name) ||
    !/^0\d{9}$/.test(d.phone)
  )
    fail("Tên khách hàng hoặc Số điện thoại không đúng định dạng");
  if (
    await one(
      "SELECT id FROM customer WHERE phone=? AND id<>?",
      d.phone,
      d.id || "",
    )
  )
    fail("Số điện thoại đã tồn tại trong hệ thống");
  return await transaction(async () => {
    const id = d.id || (await code("KH"));
    if (d.id)
      await run(
        "UPDATE customer SET name=?,phone=?,address=? WHERE id=?",
        d.name.trim(),
        d.phone,
        d.address?.trim() || "",
        id,
      );
    else
      await run(
        "INSERT INTO customer VALUES (?,?,?,?)",
        id,
        d.name.trim(),
        d.phone,
        d.address?.trim() || "",
      );
    return {
      id,
      message: d.id
        ? "Cập nhật thông tin khách hàng thành công"
        : "Thêm khách hàng thành công",
    };
  });
}
export async function deleteCustomer(id: string) {
  return await transaction(async () => {
    if (await one("SELECT id FROM invoice WHERE customer_id=?", id))
      fail("Không thể xóa khách hàng đã có lịch sử mua hàng");
    await run("DELETE FROM customer WHERE id=?", id);
    return { message: "Xóa khách hàng thành công" };
  });
}
export async function customerDetail(id: string) {
  const c = await one("SELECT * FROM customer WHERE id=?", id);
  if (!c) fail("Không tìm thấy khách hàng phù hợp");
  return {
    ...c,
    invoices: await all(
      "SELECT * FROM invoice WHERE customer_id=? ORDER BY created_at DESC,id DESC",
      id,
    ),
  };
}
export async function findCustomer(phone: string) {
  const c = await one("SELECT * FROM customer WHERE phone=?", phone);
  if (!c) fail("Không tìm thấy khách hàng");
  return c;
}
async function saleLine(l: any) {
  const p = await one("SELECT * FROM product WHERE id=?", l.product_id || "");
  const u = await one(
    "SELECT * FROM unit WHERE id=? AND product_id=?",
    Number(l.unit_id) || 0,
    l.product_id || "",
  );
  if (!p || !u) fail("Không tìm thấy sản phẩm");
  if (!integer(l.quantity) || !positive(l.quantity))
    fail("Số lượng bán không hợp lệ", {
      quantity: "Số lượng bán không hợp lệ",
    });
  return {
    product_id: p.id,
    product_name: p.name,
    unit_id: u.id,
    unit_name: u.name,
    factor: u.factor,
    quantity: Number(l.quantity),
    price: u.price,
    cost: p.average_cost,
    total: Number(l.quantity) * u.price,
  };
}
export async function quoteCart(d: any) {
  if (!d.lines?.length) fail("Số lượng bán không hợp lệ");
  const lines = await Promise.all(d.lines.map(saleLine));
  const wanted = new Map<string, number>();
  for (const l of lines)
    wanted.set(
      l.product_id,
      (wanted.get(l.product_id) || 0) + l.quantity * l.factor,
    );
  for (const [id, qty] of wanted) {
    const available = (
      await one(
        "SELECT COALESCE(SUM(remaining),0) n FROM receipt_line WHERE product_id=? AND (expiry IS NULL OR expiry>=?)",
        id,
        day(),
      )
    ).n;
    if (qty > available)
      fail("Số lượng bán không hợp lệ", {
        quantity: "Số lượng bán không hợp lệ",
      });
  }
  return { lines, total: lines.reduce((s: number, l: any) => s + l.total, 0) };
}
async function allocate(
  l: any,
  invoiceLine: number | null,
  exchangeLine: number | null,
  kind: string,
  time: string,
  reference: string,
) {
  const sources = await all(
    "SELECT l.* FROM receipt_line l JOIN receipt r ON r.id=l.receipt_id WHERE l.product_id=? AND l.remaining>0 AND (l.expiry IS NULL OR l.expiry>=?) ORDER BY CASE WHEN l.expiry IS NULL THEN 1 ELSE 0 END,l.expiry,r.created_at,l.id",
    l.product_id,
    day(),
  );
  let left = l.quantity * l.factor;
  for (const source of sources) {
    if (!left) break;
    const qty = Math.min(source.remaining, left);
    await run(
      "UPDATE receipt_line SET remaining=remaining-? WHERE id=? AND remaining>=?",
      qty,
      source.id,
      qty,
    );
    await run(
      "INSERT INTO allocation(lot_id,invoice_line_id,exchange_line_id,quantity) VALUES (?,?,?,?)",
      source.id,
      invoiceLine,
      exchangeLine,
      qty,
    );
    await movement(l.product_id, source.id, kind, -qty, time, reference);
    left -= qty;
  }
  if (left > 0) fail("Không đủ số lượng hàng có thể bán");
}
export async function checkout(d: any) {
  const existing = await one(
    "SELECT id FROM invoice WHERE request_key=?",
    d.request_key || "",
  );
  if (existing)
    return { id: existing.id, message: "Bán hàng thành công", warnings: [] };
  if (!d.lines?.length) fail("Số lượng bán không hợp lệ");
  return await atomic("Không thể lưu giao dịch. Hãy thử lại", async () => {
    await one(
      "SELECT pg_advisory_xact_lock(hashtextextended(?::text,0))::text",
      "invoice:" + d.request_key,
    );
    const duplicate = await one(
      "SELECT id FROM invoice WHERE request_key=?",
      d.request_key,
    );
    if (duplicate)
      return { id: duplicate.id, message: "Bán hàng thành công", warnings: [] };
    await lockProducts(d.lines.map((l: any) => l.product_id));
    const lines = await Promise.all(d.lines.map(saleLine));
    const total = lines.reduce((s: number, l: any) => s + l.total, 0);
    if (!["Tiền mặt", "Chuyển khoản"].includes(d.method))
      fail("Dữ liệu không hợp lệ!");
    if (
      d.method === "Tiền mặt" &&
      (!Number.isFinite(Number(d.cash)) || Number(d.cash) < total)
    )
      fail("Tiền khách đưa chưa đủ để thanh toán", {
        cash: "Tiền khách đưa chưa đủ để thanh toán",
      });
    if (d.method === "Chuyển khoản" && !d.confirmed)
      fail("Vui lòng xác nhận đã nhận đủ tiền");
    if (
      d.customer_id &&
      !(await one("SELECT id FROM customer WHERE id=?", d.customer_id))
    )
      fail("Không tìm thấy khách hàng");
    const id = await code("HD"),
      time = now(),
      cash = d.method === "Tiền mặt" ? Number(d.cash) : total;
    await run(
      "INSERT INTO invoice(id,customer_id,created_at,total,method,cash,change,request_key) VALUES (?,?,?,?,?,?,?,?)",
      id,
      d.customer_id || null,
      time,
      total,
      d.method,
      cash,
      cash - total,
      d.request_key,
    );
    for (const l of lines) {
      const line = Number(
        (
          await run(
            "INSERT INTO invoice_line(invoice_id,product_id,product_name,unit_id,unit_name,factor,quantity,price,cost,total) VALUES (?,?,?,?,?,?,?,?,?,?)",
            id,
            l.product_id,
            l.product_name,
            l.unit_id,
            l.unit_name,
            l.factor,
            l.quantity,
            l.price,
            l.cost,
            l.total,
          )
        ).lastInsertRowid,
      );
      await allocate(l, line, null, "sale", time, id);
    }
    const warnings = (await products())
      .filter(
        (p) =>
          lines.some((l: any) => l.product_id === p.id) &&
          p.stock <= p.min_stock,
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        base_unit: p.base_unit,
        min_stock: p.min_stock,
      }));
    return { id, message: "Bán hàng thành công", warnings };
  });
}
export async function invoiceDetail(id: string) {
  const i = await one(
    "SELECT i.*,c.name customer_name,c.phone customer_phone,c.address customer_address FROM invoice i LEFT JOIN customer c ON c.id=i.customer_id WHERE i.id=?",
    id,
  );
  if (!i) fail("Không tìm thấy hóa đơn phù hợp");
  const lines = await Promise.all(
    (
      await all(
        "SELECT l.*,l.quantity-COALESCE((SELECT SUM(r.quantity) FROM return_line r WHERE r.original_line_id=l.id AND r.kind='return'),0) returnable FROM invoice_line l WHERE invoice_id=? ORDER BY l.id",
        id,
      )
    ).map(async (l) => ({
      ...l,
      allocations: await all(
        "SELECT a.*,s.receipt_id,s.expiry,COALESCE((SELECT SUM(quantity) FROM return_allocation WHERE allocation_id=a.id),0) returned,COALESCE((SELECT SUM(quantity) FROM return_allocation WHERE allocation_id=a.id AND restock=1),0) restocked FROM allocation a JOIN receipt_line s ON s.id=a.lot_id WHERE invoice_line_id=? ORDER BY a.id",
        l.id,
      ),
    })),
  );
  return {
    ...i,
    lines,
    tickets: await Promise.all(
      (
        await all(
          "SELECT * FROM return_ticket WHERE invoice_id=? ORDER BY created_at,id",
          id,
        )
      ).map(async (t) => ({
        ...t,
        lines: await all(
          "SELECT * FROM return_line WHERE ticket_id=? ORDER BY id",
          t.id,
        ),
      })),
    ),
  };
}
export async function checkCancel(id: string) {
  const i = await one("SELECT * FROM invoice WHERE id=?", id);
  if (!i) fail("Không tìm thấy hóa đơn phù hợp");
  if (i.status === "Đã hủy") fail("Hóa đơn này đã được hủy trước đó");
  if (await one("SELECT id FROM return_ticket WHERE invoice_id=?", id))
    fail("Hóa đơn có giao dịch đổi/trả hàng, không thể hủy trực tiếp");
  return i;
}
export async function cancelInvoice(d: any) {
  if (
    d.request_key &&
    (await one(
      "SELECT id FROM invoice WHERE cancel_request_key=?",
      d.request_key,
    ))
  )
    return { id: d.id, message: "Hủy hóa đơn thành công" };
  await checkCancel(d.id);
  if (!present(d.reason))
    fail("Vui lòng nhập lý do hủy hóa đơn", {
      reason: "Vui lòng nhập lý do hủy hóa đơn",
    });
  return await atomic("Không thể hủy hóa đơn", async () => {
    await one("SELECT id FROM invoice WHERE id=? FOR UPDATE", d.id);
    const repeated =
      d.request_key &&
      (await one(
        "SELECT id FROM invoice WHERE cancel_request_key=?",
        d.request_key,
      ));
    if (repeated) return { id: d.id, message: "Hủy hóa đơn thành công" };
    await checkCancel(d.id);
    await lockProducts(
      (
        await all(
          "SELECT product_id FROM invoice_line WHERE invoice_id=?",
          d.id,
        )
      ).map((x) => x.product_id),
    );
    const time = now();
    const allocations = await all(
      "SELECT a.*,l.product_id FROM allocation a JOIN invoice_line l ON l.id=a.invoice_line_id WHERE l.invoice_id=? ORDER BY a.id",
      d.id,
    );
    for (const a of allocations) {
      await run(
        "UPDATE receipt_line SET remaining=remaining+? WHERE id=?",
        a.quantity,
        a.lot_id,
      );
      await movement(a.product_id, a.lot_id, "cancel", a.quantity, time, d.id);
    }
    await run(
      "UPDATE invoice SET status='Đã hủy',cancel_reason=?,cancelled_at=?,cancel_request_key=? WHERE id=?",
      d.reason.trim(),
      time,
      d.request_key || null,
      d.id,
    );
    return { id: d.id, message: "Hủy hóa đơn thành công" };
  });
}
export async function checkReturn(id: string) {
  const i = await invoiceDetail(id);
  if (i.status === "Đã hủy" || !i.lines.some((l: any) => l.returnable > 0))
    fail("Hóa đơn không thể đổi/trả hàng");
  return i;
}
export async function returnTicket(d: any) {
  const existing = await one(
    "SELECT id FROM return_ticket WHERE request_key=?",
    d.request_key || "",
  );
  if (existing)
    return { id: existing.id, message: "Xử lý đổi/trả hàng thành công" };
  await checkReturn(d.invoice_id);
  return await atomic("Không thể lưu phiếu đổi/trả", async () => {
    await one(
      "SELECT pg_advisory_xact_lock(hashtextextended(?::text,0))::text",
      "return_ticket:" + d.request_key,
    );
    const duplicate = await one(
      "SELECT id FROM return_ticket WHERE request_key=?",
      d.request_key,
    );
    if (duplicate)
      return {
        id: duplicate.id,
        message: "Xử lý đổi/trả hàng thành công",
        warnings: [],
      };
    await one("SELECT id FROM invoice WHERE id=? FOR UPDATE", d.invoice_id);
    const invoice = await checkReturn(d.invoice_id);
    await lockProducts([
      ...invoice.lines.map((l: any) => l.product_id),
      ...(d.exchanges || []).map((l: any) => l.product_id),
    ]);
    if (!d.returns?.length) fail("Số lượng trả không hợp lệ");
    const seen = new Set();
    const returns = d.returns.map((r: any) => {
      const l = invoice.lines.find((x: any) => x.id === Number(r.line_id));
      if (
        !l ||
        !integer(r.quantity) ||
        !positive(r.quantity) ||
        Number(r.quantity) > l.returnable ||
        seen.has(l.id)
      )
        fail("Số lượng trả không hợp lệ");
      seen.add(l.id);
      return {
        ...l,
        quantity: Number(r.quantity),
        restock: r.restock !== false,
        total: Number(r.quantity) * l.price,
      };
    });
    const exchanges = d.only_return
      ? []
      : await Promise.all((d.exchanges || []).map(saleLine));
    const demand = new Map<string, number>();
    for (const l of exchanges)
      demand.set(
        l.product_id,
        (demand.get(l.product_id) || 0) + l.quantity * l.factor,
      );
    for (const [product, qty] of demand) {
      let available = (
        await one(
          "SELECT COALESCE(SUM(remaining),0) n FROM receipt_line WHERE product_id=? AND (expiry IS NULL OR expiry>=?)",
          product,
          day(),
        )
      ).n;
      for (const l of returns.filter(
        (r: any) => r.product_id === product && r.restock,
      )) {
        let left = l.quantity * l.factor;
        for (const a of [...l.allocations].reverse()) {
          const used = Math.min(left, a.quantity - a.returned);
          if (used > 0 && (!a.expiry || a.expiry >= day())) available += used;
          left -= Math.max(0, used);
          if (left <= 0) break;
        }
      }
      if (qty > available) fail("Không đủ số lượng hàng có thể bán");
    }
    const returnTotal = returns.reduce((s: number, l: any) => s + l.total, 0),
      exchangeTotal = exchanges.reduce((s: number, l: any) => s + l.total, 0),
      difference = exchangeTotal - returnTotal;
    if (difference !== 0 && !d.money_confirmed)
      fail("Vui lòng xác nhận đã xử lý tiền chênh lệch");
    const id = await code("DT"),
      time = now();
    await run(
      "INSERT INTO return_ticket VALUES (?,?,?,?,?,?,?,?)",
      id,
      invoice.id,
      time,
      returnTotal,
      exchangeTotal,
      difference,
      d.money_confirmed ? 1 : 0,
      d.request_key,
    );
    for (const l of returns) {
      const line = Number(
        (
          await run(
            "INSERT INTO return_line(ticket_id,original_line_id,kind,product_id,product_name,unit_id,unit_name,factor,quantity,price,cost,total,restock) VALUES (?,?,'return',?,?,?,?,?,?,?,?,?,?)",
            id,
            l.id,
            l.product_id,
            l.product_name,
            l.unit_id,
            l.unit_name,
            l.factor,
            l.quantity,
            l.price,
            l.cost,
            l.total,
            l.restock ? 1 : 0,
          )
        ).lastInsertRowid,
      );
      let left = l.quantity * l.factor;
      const allocations = await all(
        "SELECT a.*,a.quantity-COALESCE((SELECT SUM(quantity) FROM return_allocation WHERE allocation_id=a.id),0) available FROM allocation a WHERE invoice_line_id=? ORDER BY a.id DESC",
        l.id,
      );
      for (const a of allocations) {
        if (!left) break;
        const qty = Math.min(a.available, left);
        if (qty <= 0) continue;
        await run(
          "INSERT INTO return_allocation(return_line_id,allocation_id,quantity,restock) VALUES (?,?,?,?)",
          line,
          a.id,
          qty,
          l.restock ? 1 : 0,
        );
        if (l.restock) {
          await run(
            "UPDATE receipt_line SET remaining=remaining+? WHERE id=?",
            qty,
            a.lot_id,
          );
          await movement(l.product_id, a.lot_id, "return", qty, time, id);
        }
        left -= qty;
      }
      if (left > 0) fail("Số lượng trả không hợp lệ");
    }
    for (const l of exchanges) {
      const line = Number(
        (
          await run(
            "INSERT INTO return_line(ticket_id,kind,product_id,product_name,unit_id,unit_name,factor,quantity,price,cost,total,restock) VALUES (?,'exchange',?,?,?,?,?,?,?,?,?,0)",
            id,
            l.product_id,
            l.product_name,
            l.unit_id,
            l.unit_name,
            l.factor,
            l.quantity,
            l.price,
            l.cost,
            l.total,
          )
        ).lastInsertRowid,
      );
      await allocate(l, null, line, "exchange", time, id);
    }
    return {
      id,
      invoice_id: invoice.id,
      difference,
      message: "Xử lý đổi/trả hàng thành công",
    };
  });
}
export async function adjustStock(d: any) {
  const existing = await one(
    "SELECT id FROM adjustment WHERE request_key=?",
    d.request_key || "",
  );
  if (existing)
    return { id: existing.id, message: "Điều chỉnh tồn kho thành công" };
  required(d, ["reason"], "Không được để trống");
  if (!d.lines?.length)
    fail("Không được để trống", { lines: "Không được để trống" });
  const seen = new Set();
  for (const [index, l] of d.lines.entries()) {
    if (!present(l.quantity))
      fail("Không được để trống", {
        ["line_" + l.lot_id]: "Không được để trống",
      });
    const lot = await one(
      "SELECT * FROM receipt_line WHERE id=?",
      Number(l.lot_id),
    );
    if (
      !lot ||
      !integer(l.quantity) ||
      Number(l.quantity) < 0 ||
      Number(l.quantity) > lot.original_quantity ||
      seen.has(l.lot_id)
    )
      fail("Số lượng điều chỉnh không hợp lệ", {
        ["line_" + l.lot_id]: "Số lượng điều chỉnh không hợp lệ",
      });
    seen.add(l.lot_id);
  }
  return await atomic("Không thể lưu phiếu điều chỉnh", async () => {
    await one(
      "SELECT pg_advisory_xact_lock(hashtextextended(?::text,0))::text",
      "adjustment:" + d.request_key,
    );
    const duplicate = await one(
      "SELECT id FROM adjustment WHERE request_key=?",
      d.request_key,
    );
    if (duplicate)
      return {
        id: duplicate.id,
        message: "Điều chỉnh tồn kho thành công",
        warnings: [],
      };
    await lockProducts(
      (
        await all(
          "SELECT DISTINCT product_id FROM receipt_line WHERE id IN (" +
            d.lines.map(() => "?").join(",") +
            ")",
          ...d.lines.map((l: any) => Number(l.lot_id)),
        )
      ).map((x) => x.product_id),
    );
    const id = await code("DC"),
      time = now();
    await run(
      "INSERT INTO adjustment VALUES (?,?,?,?)",
      id,
      time,
      d.reason.trim(),
      d.request_key,
    );
    for (const l of d.lines) {
      const lot = await one(
        "SELECT * FROM receipt_line WHERE id=?",
        Number(l.lot_id),
      );
      const qty = Number(l.quantity),
        delta = qty - lot.remaining;
      await run(
        "INSERT INTO adjustment_line(adjustment_id,lot_id,old_quantity,new_quantity,delta) VALUES (?,?,?,?,?)",
        id,
        lot.id,
        lot.remaining,
        qty,
        delta,
      );
      await run("UPDATE receipt_line SET remaining=? WHERE id=?", qty, lot.id);
      await movement(lot.product_id, lot.id, "adjustment", delta, time, id);
    }
    return { id, message: "Điều chỉnh tồn kho thành công" };
  });
}
export async function printInvoice(id: string, send = false) {
  const i = await invoiceDetail(id);
  if (i.status === "Đã hủy") fail("Hóa đơn đã bị hủy, không thể in");
  if (
    send &&
    (
      await one(
        "SELECT value FROM setting WHERE key=?",
        scopedKey("printer_error"),
      )
    )?.value === "1"
  )
    fail("Không thể kết nối hoặc gửi yêu cầu đến máy in");
  return i;
}
