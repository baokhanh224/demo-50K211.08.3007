import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, one, run, transaction, requestContext } from "../lib/db";
import { createPaymentQr, checkout, products } from "../lib/service";

test("reserved invoice survives QR edits, rejects stale amounts and saves exactly once", { skip: process.env.RUN_PAYMENT_DB_TESTS !== "1" }, async () => {
  const before = await one("SELECT COUNT(*) AS n FROM invoice");
  const reference = "qr-test-" + randomUUID();
  const owner = "qr-test-owner";
  try {
    await assert.rejects(transaction(() => requestContext.run({ token: owner }, async () => {
      const product = (await products()).find(p => p.sellable >= 5)!;
      assert(product);
      const unit = product.units.find((u: any) => u.factor === 1);
      const lines = [{ product_id: product.id, unit_id: unit.id, quantity: 1 }];
      const qr = await createPaymentQr({ reference, lines });
      assert.equal(qr.total, unit.price); assert.match(qr.description, /^HD\d{4,}$/);
      assert.equal(qr.account, "56789222279"); assert.equal(qr.bank, "970423");
      const edited = await createPaymentQr({ reference, lines: [{ ...lines[0], quantity: 2 }] });
      assert.equal(qr.invoiceId, edited.invoiceId); assert.equal(edited.total, 2 * unit.price);
      await assert.rejects(requestContext.run({ token: "another-user" }, () => createPaymentQr({ reference, lines })));
      const payment = { request_key: reference, lines: [{ ...lines[0], quantity: 2 }], method: "Chuyển khoản", confirmed: true };
      await assert.rejects(checkout({ ...payment, confirmed: false }), /xác nhận đã nhận đủ tiền/);
      await run("UPDATE unit SET price=? WHERE id=?", unit.price + 1000, unit.id);
      await assert.rejects(checkout(payment), /Số tiền thanh toán đã thay đổi/);
      const refreshed = await createPaymentQr({ reference, lines: payment.lines });
      assert.equal(refreshed.invoiceId, qr.invoiceId); assert.equal(refreshed.total, 2 * (unit.price + 1000));
      const saved = await checkout(payment); assert.equal(saved.id, qr.invoiceId);
      const invoice = await one("SELECT * FROM invoice WHERE id=?", saved.id);
      assert.equal(invoice.total, refreshed.total); assert.equal(invoice.method, "Chuyển khoản");
      assert.equal(await one("SELECT * FROM payment_intent WHERE request_key=?", reference), undefined);
      assert.equal((await checkout(payment)).id, saved.id);
      await assert.rejects(createPaymentQr({ reference, lines }), /đã hoàn tất/);
      await assert.rejects(checkout({ ...payment, request_key: "no-qr-" + randomUUID() }), /tạo lại mã QR/);
      const second = await createPaymentQr({ reference: "second-" + reference, lines });
      assert.notEqual(second.invoiceId, qr.invoiceId);
      const cash = await checkout({ request_key: "second-" + reference, lines, method: "Tiền mặt", cash: unit.price + 1000 });
      assert.equal(cash.id, second.invoiceId);
      throw new Error("ROLLBACK_PAYMENT_TEST");
    })), { message: "ROLLBACK_PAYMENT_TEST" });
    assert.equal((await one("SELECT COUNT(*) AS n FROM invoice")).n, before.n);
    assert.equal(await one("SELECT * FROM payment_intent WHERE request_key=?", reference), undefined);
  } finally { await db.$disconnect(); }
});

test("concurrent QR requests reserve distinct invoice numbers and retry idempotently", {
  skip: process.env.RUN_PAYMENT_CONCURRENCY_TESTS !== "1",
}, async () => {
  assert(new URL(process.env.DATABASE_URL!).hostname.startsWith("ep-proud-lab-"), "Review branch only");
  const keys = ["qr-concurrent-" + randomUUID(), "qr-concurrent-" + randomUUID()];
  const before = await one("SELECT COUNT(*) AS n FROM invoice");
  try {
    const product = (await products()).find(p => p.sellable >= 5)!;
    const unit = product.units.find((u: any) => u.factor === 1);
    const lines = [{ product_id: product.id, unit_id: unit.id, quantity: 1 }];
    const request = (reference: string) => requestContext.run({ token: "qr-concurrency" }, () => createPaymentQr({ reference, lines }));
    const [a,b] = await Promise.all(keys.map(request));
    assert.notEqual(a.invoiceId,b.invoiceId);
    const again = await Promise.all([request(keys[0]),request(keys[0])]);
    assert(again.every(qr => qr.invoiceId === a.invoiceId));
    assert.equal((await one("SELECT COUNT(*) AS n FROM invoice")).n,before.n);
  } finally {
    await run("DELETE FROM payment_intent WHERE request_key IN (?,?)", ...keys);
    await db.$disconnect();
  }
});
