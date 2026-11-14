export const productCategoryNames = ["Sữa", "Mì ăn liền", "Nước uống", "Bánh mì", "Bánh kẹo", "Gia vị", "Khác"];
export const productUnitNames = ["Hộp", "Gói", "Chai", "Lon", "Cái", "Túi", "Kg", "Lít", "Lốc", "Thùng", "Vỉ", "Quả", "Gam", "Bịch", "Viên", "Cây", "Hũ", "Lọ"];

export function productExpiry(value: string) {
  const input = String(value || "").trim();
  if (!input) return "";
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : input;
}
export function productErrors(data: any, today: string) {
  const errors: Record<string, string> = {};
  for (const key of ["name", "category_id", "base_unit", "reference_cost", ...(!data.id ? ["price"] : [])]) {
    if (data[key] == null || !String(data[key]).trim()) errors[key] = "Không được để trống!";
  }
  for (const key of ["reference_cost", ...(!data.id ? ["price"] : [])]) {
    if (!errors[key] && (!Number.isFinite(Number(data[key])) || Number(data[key]) <= 0)) errors[key] = "Dữ liệu không hợp lệ!";
  }
  const expiry = productExpiry(data.expiry);
  if (expiry && (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || Number.isNaN(Date.parse(expiry)) || new Date(expiry + "T12:00:00Z").toISOString().slice(0, 10) !== expiry || expiry < today)) errors.expiry = "Dữ liệu không hợp lệ!";
  return errors;
}
