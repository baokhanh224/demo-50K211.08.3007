export function receiptPriceDigits(value: string): string | null {
  const digits = value.replace(/[.\sđ₫]/g, "");
  return /^\d*$/.test(digits) ? digits.replace(/^0+(?=\d)/, "") : null;
}

export function receiptPriceInputValue(value: string): string {
  return value ? new Intl.NumberFormat("vi-VN").format(BigInt(value)) + "đ" : "";
}

export function receiptUnitPrice(product: any, unit: any): string {
  const amount = Number(product.reference_cost ?? product.average_cost) * Number(unit.factor);
  return Number.isFinite(amount) ? String(Math.round(amount)) : "";
}
