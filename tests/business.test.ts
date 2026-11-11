import { test, after } from "node:test";
import assert from "node:assert/strict";
import * as s from "../lib/service";
import { db, all, one, requestContext } from "../lib/db";
// Dùng DATABASE_URL của CSDL kiểm thử. Không tự reset CSDL trong bộ kiểm tra.
test("PostgreSQL: rollback, idempotency, concurrency và phạm vi phiên", async () => {
  const id = "SP0005";
  const u = (await one("SELECT id FROM unit WHERE product_id=?", id)).id;
  const qty = (
    await one(
      "SELECT SUM(remaining) n FROM receipt_line WHERE product_id=?",
      id,
    )
  ).n;
  assert.ok(qty > 0);
  const key = "concurrent-" + Date.now();
  const payload = {
    method: "Tiền mặt",
    cash: 1000000,
    lines: [{ product_id: id, unit_id: u, quantity: qty }],
    request_key: key,
  };
  const before = await all("SELECT id,remaining FROM receipt_line ORDER BY id");
  await requestContext.run({ token: "test-one" }, async () => {
    await s.setSettings({ fail_save: true });
    await assert.rejects(
      s.checkout({ ...payload, request_key: key + "fail" }),
      { message: "Không thể lưu giao dịch. Hãy thử lại" },
    );
    assert.deepEqual(
      await all("SELECT id,remaining FROM receipt_line ORDER BY id"),
      before,
    );
  });
  const dup = await Promise.all([s.checkout(payload), s.checkout(payload)]);
  assert.equal(dup[0].id, dup[1].id);
  assert.equal(
    (await one("SELECT COUNT(*) n FROM invoice WHERE request_key=?", key)).n,
    1,
  );
  assert.equal(
    (
      await one(
        "SELECT SUM(remaining) n FROM receipt_line WHERE product_id=?",
        id,
      )
    ).n,
    0,
  );
  await s.cancelInvoice({
    id: dup[0].id,
    request_key: key + "cancel",
    reason: "Kiểm tra đồng thời",
  });
  await s.cancelInvoice({
    id: dup[0].id,
    request_key: key + "cancel",
    reason: "Gửi trùng",
  });
  assert.equal(
    (
      await one(
        "SELECT SUM(remaining) n FROM receipt_line WHERE product_id=?",
        id,
      )
    ).n,
    qty,
  );
  const outcomes = await Promise.allSettled([
    s.checkout({ ...payload, request_key: key + "a" }),
    s.checkout({ ...payload, request_key: key + "b" }),
  ]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    (await one("SELECT MIN(remaining) n FROM receipt_line")).n >= 0,
    true,
  );
  for (const x of outcomes)
    if (x.status === "fulfilled")
      await s.cancelInvoice({
        id: x.value.id,
        request_key: key + x.value.id,
        reason: "Hoàn dữ liệu sau kiểm tra",
      });
  await requestContext.run({ token: "session-a" }, () =>
    s.setSettings({ fail_load: true }),
  );
  await requestContext.run({ token: "session-b" }, async () => {
    assert.ok(Array.isArray(await s.query({ scope: "inventory" })));
  });
  await requestContext.run({ token: "session-a" }, async () => {
    await assert.rejects(
      s.query({ scope: "sales-history", from: "2026-11-10", to: "2026-11-01" }),
      { message: "Khoảng thời gian không hợp lệ" },
    );
    await assert.rejects(s.query({ scope: "inventory" }), {
      message: "Không thể tải dữ liệu tồn kho",
    });
    assert.ok(Array.isArray(await s.query({ scope: "inventory" })));
  });
  for (const p of await s.products())
    assert.equal(
      (
        await one(
          "SELECT COALESCE(SUM(quantity),0) n FROM movement WHERE product_id=?",
          p.id,
        )
      ).n,
      p.stock,
    );
});

after(async () => db.$disconnect());

test("Lỗi ghi phiếu nhập, hủy, đổi/trả và điều chỉnh đều hoàn tác đủ bảng", async () => {
  const { datePlus } = await import("../lib/db");
  const tables = [
    "product",
    "unit",
    "receipt",
    "receipt_line",
    "invoice",
    "invoice_line",
    "allocation",
    "return_ticket",
    "return_line",
    "return_allocation",
    "movement",
    "adjustment",
    "adjustment_line",
    "sequence",
  ];
  const snapshot = async () =>
    JSON.stringify(
      await Promise.all(
        tables.map((table) => all(`SELECT * FROM ${table} ORDER BY 1`)),
      ),
    );
  await requestContext.run({ token: "fault-tests" }, async () => {
    const u = (
      await one("SELECT id FROM unit WHERE product_id='SP0002' AND factor=1")
    ).id;
    const key = "fault-" + Date.now();
    async function rollback(fn: () => Promise<any>, message: string) {
      const before = await snapshot();
      await s.setSettings({ fail_save: true });
      await assert.rejects(fn, { message });
      assert.equal(await snapshot(), before);
    }
    await rollback(
      () =>
        s.saveReceipt({
          request_key: key + "pn",
          supplier_id: "NCC001",
          lines: [
            {
              product_id: "SP0002",
              unit_id: u,
              quantity: 2,
              price: 3000,
              expiry: datePlus(180),
            },
          ],
        }),
      "Không thể lưu phiếu nhập",
    );
    const sale = await s.checkout({
      request_key: key + "sale",
      method: "Tiền mặt",
      cash: 10000,
      lines: [{ product_id: "SP0002", unit_id: u, quantity: 2 }],
    });
    await rollback(
      () =>
        s.cancelInvoice({
          id: sale.id,
          request_key: key + "cancel",
          reason: "Thử rollback",
        }),
      "Không thể hủy hóa đơn",
    );
    const detail = await s.invoiceDetail(sale.id);
    await rollback(
      () =>
        s.returnTicket({
          request_key: key + "dt",
          invoice_id: sale.id,
          returns: [
            { line_id: detail.lines[0].id, quantity: 1, restock: true },
          ],
          only_return: true,
          money_confirmed: true,
        }),
      "Không thể lưu phiếu đổi/trả",
    );
    const lot = await one(
      "SELECT * FROM receipt_line WHERE product_id='SP0002' ORDER BY id LIMIT 1",
    );
    await rollback(
      () =>
        s.adjustStock({
          request_key: key + "dc",
          reason: "Thử rollback",
          lines: [{ lot_id: lot.id, quantity: 0 }],
        }),
      "Không thể lưu phiếu điều chỉnh",
    );
    await s.cancelInvoice({
      id: sale.id,
      request_key: key + "cleanup",
      reason: "Hoàn kho sau kiểm thử",
    });
    const p = (await s.products()).find((p) => p.id === "SP0001");
    assert.ok(p.sellable < p.stock);
    const milo = (
      await one("SELECT id FROM unit WHERE product_id='SP0001' AND factor=1")
    ).id;
    await assert.rejects(
      s.quoteCart({
        lines: [{ product_id: "SP0001", unit_id: milo, quantity: p.stock }],
      }),
      { message: "Số lượng bán không hợp lệ" },
    );
  });
});

test("UC1.2 cho sửa Đơn vị tính và giữ nguyên dữ liệu giao dịch cũ", async () => {
  const p = (await s.products()).find((p) => p.id === "SP0002");
  const before = await all(
    "SELECT * FROM invoice_line WHERE product_id='SP0002' ORDER BY id",
  );
  const receipts = await all(
    "SELECT * FROM receipt_line WHERE product_id='SP0002' ORDER BY id",
  );
  await s.saveProduct({ ...p, base_unit: "Gói kiểm tra" });
  assert.equal(
    (await one("SELECT base_unit FROM product WHERE id='SP0002'")).base_unit,
    "Gói kiểm tra",
  );
  assert.deepEqual(
    await all(
      "SELECT * FROM invoice_line WHERE product_id='SP0002' ORDER BY id",
    ),
    before,
  );
  assert.deepEqual(
    await all(
      "SELECT * FROM receipt_line WHERE product_id='SP0002' ORDER BY id",
    ),
    receipts,
  );
  await s.saveProduct(p);
});
