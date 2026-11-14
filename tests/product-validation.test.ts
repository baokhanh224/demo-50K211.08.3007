import { test } from "node:test";
import assert from "node:assert/strict";
import { productErrors, productExpiry } from "../lib/product-validation";
const valid = { name: "Sản phẩm", category_id: 1, base_unit: "Gói", reference_cost: 1000, price: 2000 };
test("Product expiry: strict calendar, optional date and past date", () => {
  assert.deepEqual(productErrors(valid, "2026-11-14"), {});
  assert.equal(productErrors({ ...valid, expiry: "01/01/2026" }, "2026-11-14").expiry, "Dữ liệu không hợp lệ!");
  for (const expiry of ["31/02/2027", "29/02/2027", "2027-13-01", "not a date"])
    assert.equal(productErrors({ ...valid, expiry }, "2026-11-14").expiry, "Dữ liệu không hợp lệ!");
  for (const expiry of ["", "2026-11-14", "29/02/2028", "2028-02-29"])
    assert.deepEqual(productErrors({ ...valid, expiry }, "2026-11-14"), {});
  assert.equal(productExpiry("02/01/2027"), "2027-01-02");
});
test("Product required fields and invalid amounts retain exact messages", () => {
  const errors = productErrors({}, "2026-11-14"); assert.equal(Object.keys(errors).length, 5);
  assert.ok(Object.values(errors).every(v => v === "Không được để trống!"));
  for (const amount of [0, -1, "abc", Infinity]) {
    assert.equal(productErrors({ ...valid, reference_cost: amount }, "2026-11-14").reference_cost, "Dữ liệu không hợp lệ!");
    assert.equal(productErrors({ ...valid, price: amount }, "2026-11-14").price, "Dữ liệu không hợp lệ!");
  }
  assert.deepEqual(productErrors({ ...valid, id: "SP1", price: "" }, "2026-11-14"), {});
});
