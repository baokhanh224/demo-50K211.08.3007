// Shared by the supplier form and API so every invalid field is reported together.
export function supplierErrors(data: any, categories: { name: string }[]) {
  const fields: Record<string, string> = {};
  if (!String(data.name ?? "").trim()) fields.name = "Không được để trống!";
  if (!String(data.phone ?? "").trim()) fields.phone = "Không được để trống!";
  else if (!/^\d{10}$/.test(String(data.phone))) fields.phone = "Dữ liệu không hợp lệ!";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    fields.email = "Dữ liệu không hợp lệ!";
  if (data.id && !["Đang hợp tác", "Ngừng hợp tác"].includes(data.status))
    fields.status = "Dữ liệu không hợp lệ!";
  if (data.other) {
    const name = String(data.new_category ?? "").trim();
    if (!name) fields.new_category = "Vui lòng nhập tên danh mục mới!";
    else if (categories.some(c => c.name.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi")))
      fields.new_category = "Danh mục đã tồn tại, vui lòng chọn danh mục có sẵn!";
  }
  return fields;
}
