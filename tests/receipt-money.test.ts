import { test } from "node:test";
import assert from "node:assert/strict";
import { receiptPriceDigits, receiptPriceInputValue, receiptUnitPrice } from "../lib/receipt-money";

test("Receipt VND input separates display grouping from numeric payload", () => {
  assert.equal(receiptPriceInputValue("600000"), "600.000đ");
  assert.equal(receiptPriceInputValue("1234567"), "1.234.567đ");
  assert.equal(receiptPriceInputValue("0"), "0đ");
  assert.equal(receiptPriceInputValue(""), "");
  assert.equal(receiptPriceDigits("600.000đ"), "600000");
  assert.equal(receiptPriceDigits(" 600.000 ₫ "), "600000");
  assert.equal(receiptPriceDigits("000600"), "600");
  assert.equal(receiptPriceDigits("đ"), "");
  for (const value of ["-600", "abc", "1,5", "NaN"]) assert.equal(receiptPriceDigits(value), null);
});

test("Receipt suggestion uses reference cost per import unit, rounded to whole VND", () => {
  const product = { reference_cost: 18000, average_cost: 13135.14699429575 };
  assert.equal(receiptUnitPrice(product, { factor: 1 }), "18000");
  assert.equal(receiptUnitPrice(product, { factor: 24 }), "432000");
  assert.equal(receiptUnitPrice({ reference_cost: 13135.14699429575 }, { factor: 1 }), "13135");
});
