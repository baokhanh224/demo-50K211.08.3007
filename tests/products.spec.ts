import { test, expect } from "@playwright/test";
import { money } from "../lib/format";
import fs from "node:fs";

async function login(page: any) {
  await page.setViewportSize({ width: 1440, height: 927 }); await page.goto("/");
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".sidebar")).toBeVisible(); await page.getByRole("link", { name: "Quản lý sản phẩm", exact: true }).click();
  await expect(page.locator(".product-management-card")).toBeVisible();
}
async function bootstrap(page: any) { return (await page.request.get("/api/bootstrap")).json(); }
async function action(page: any, data: any) { const r = await page.request.post("/api/action", { data }); const result = await r.json(); expect(r.ok(), JSON.stringify(result)).toBeTruthy(); return result; }
async function choose(scope: any, label: string, option: string) { await scope.getByRole("button", { name: label, exact: true }).click(); await scope.getByRole("option", { name: option, exact: true }).click(); }
async function capture(page: any, name: string) { fs.mkdirSync("test-results/products", { recursive: true }); await page.evaluate(() => document.fonts.ready); await page.locator("img").evaluateAll((a: HTMLImageElement[]) => Promise.all(a.map(i => i.decode()))); await page.screenshot({ path: `test-results/products/${name}.png` }); }
async function cleanup(page: any, prefix: string) { for (const p of (await bootstrap(page)).products.filter((p: any) => p.name.startsWith(prefix))) await action(page, { action: "delete-products", id: p.id }); }

test("Products: required fields, expiry, CRUD, filters, pagination, drawer and price dialogs", async ({ page }) => {
  await login(page); const prefix = "QA-spec-" + Date.now(); const data = await bootstrap(page);
  expect(data.product_categories.map((c: any) => c.name)).toEqual(["Sữa", "Mì ăn liền", "Nước uống", "Bánh mì", "Bánh kẹo", "Gia vị", "Khác"]);
  const category = data.product_categories.find((c: any) => c.name === "Sữa"); const year = Number(data.today.slice(0, 4)) + 1;
  try {
    await page.getByLabel("Từ khóa", { exact: true }).fill(prefix); await choose(page.locator(".product-controls"), "Danh mục", "Sữa");
    await expect(page.locator(".product-list-footer")).toContainText("Hiển thị 0 / 0 sản phẩm");
    await page.getByRole("button", { name: "Thêm sản phẩm", exact: true }).click();
    const form = page.getByRole("dialog", { name: "Thêm sản phẩm", exact: true });
    await expect(form.getByLabel("Mã sản phẩm", { exact: true })).toHaveValue("Tự động tạo");
    await expect(form.locator(".product-input-lock img")).toHaveCount(1);
    await expect(form.getByLabel("Mã vạch", { exact: true })).toHaveCount(0);
    await expect(form.getByText("Có quản lý hạn sử dụng", { exact: true })).toHaveCount(0);
    await form.getByRole("button", { name: "Lưu", exact: true }).click(); await expect(form.getByText("Không được để trống!", { exact: true })).toHaveCount(5);
    await form.getByPlaceholder("Nhập tên sản phẩm", { exact: true }).fill(prefix + "00");
    await choose(form, "Danh mục", "Sữa"); await choose(form, "Đơn vị tính", "Gói");
    await form.getByLabel("Giá nhập", { exact: true }).fill("10000"); await form.getByLabel("Giá bán", { exact: true }).fill("20000");
    await form.getByPlaceholder("Nhập mô tả sản phẩm", { exact: true }).fill("Mô tả kiểm tra");
    await form.getByPlaceholder("dd/mm/yyyy", { exact: true }).fill("01/01/2026"); await form.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(form.getByRole("alert")).toContainText("Dữ liệu không hợp lệ!");
    await form.getByPlaceholder("dd/mm/yyyy", { exact: true }).fill(`31/02/${year}`); await form.getByRole("button", { name: "Lưu", exact: true }).click(); await expect(form.getByRole("alert")).toContainText("Dữ liệu không hợp lệ!");
    await form.getByPlaceholder("dd/mm/yyyy", { exact: true }).fill(`01/01/${year}`); await capture(page, "add-form");
    await form.getByRole("button", { name: "Lưu", exact: true }).click(); await expect(form).toHaveCount(0); await expect(page.getByRole("status")).toContainText("Thêm sản phẩm thành công!");
    await expect(page.getByLabel("Từ khóa", { exact: true })).toHaveValue(prefix); await expect(page.locator(".product-list-footer")).toContainText("Hiển thị 1-1 / 1 sản phẩm");
    for (let i = 1; i <= 10; i++) await action(page, { action: "save-products", name: prefix + String(i).padStart(2, "0"), category_id: category.id, base_unit: "Gói", reference_cost: 10000, price: 20000 });
    await page.reload(); await expect(page.locator(".product-management-card")).toBeVisible(); await page.getByLabel("Từ khóa", { exact: true }).fill(prefix);
    await choose(page.locator(".product-controls"), "Danh mục", "Sữa"); // Selection filters immediately, without clicking Search.
    await expect(page.locator(".product-list-footer")).toContainText("Hiển thị 1-10 / 11 sản phẩm");
    await page.locator(".product-controls").getByRole("button", { name: "Danh mục", exact: true }).click(); await expect(page.getByRole("option", { name: "Sữa", exact: true })).toHaveAttribute("aria-selected", "true"); await expect(page.getByRole("option", { name: "Sữa", exact: true }).locator("img")).toHaveCount(1); await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Trang 2", exact: true }).click(); await expect(page.locator(".product-list-footer")).toContainText("Hiển thị 11-11 / 11 sản phẩm");
    const row = page.locator(".product-management-card tbody tr"); await expect(row).toHaveCount(1);
    const id = (await row.getByRole("checkbox").getAttribute("aria-label"))!.replace("Chọn ", "");
    await row.getByRole("checkbox").check(); await expect(row).toHaveCSS("background-color", "rgb(227, 237, 253)");
    await page.getByRole("button", { name: "Sửa", exact: true }).click(); const edit = page.getByRole("dialog", { name: "Sửa sản phẩm", exact: true });
    await expect(edit.getByLabel("Giá bán", { exact: true })).toHaveAttribute("readonly", "");
    await expect(edit.getByText("Dùng chức năng Cập nhật giá bán để thay đổi giá", { exact: true })).toBeVisible();
    await expect(edit.locator(".product-input-lock img")).toHaveCount(2);
    await edit.getByLabel("Giá nhập", { exact: true }).fill("18000"); await edit.getByPlaceholder("dd/mm/yyyy", { exact: true }).fill(`02/01/${year}`); await edit.getByLabel("Mô tả", { exact: true }).fill("Mô tả sau sửa");
    await edit.getByRole("button", { name: "Hủy", exact: true }).click(); const confirm = page.getByRole("dialog", { name: "Xác nhận", exact: true });
    await expect(confirm.getByRole("button", { name: "Xác nhận", exact: true })).toHaveCSS("background-color", "rgb(220, 38, 38)"); await confirm.getByRole("button", { name: "Quay lại", exact: true }).click();
    await edit.getByRole("button", { name: "Lưu", exact: true }).click(); await expect(edit).toHaveCount(0);
    await expect(page.getByLabel("Từ khóa", { exact: true })).toHaveValue(prefix); await expect(page.locator(".product-list-footer")).toContainText("Hiển thị 11-11 / 11 sản phẩm");
    await expect(row.locator("td").nth(5)).toHaveText("18.000đ"); await expect(row.locator("td").nth(8)).toHaveText(`02/01/${year}`);
    await row.locator("td").nth(2).click(); const drawer = page.getByRole("dialog", { name: "Chi tiết sản phẩm", exact: true });
    const box = await drawer.boundingBox(); expect(box!.x + box!.width).toBe(1440); expect(box!.width).toBe(460);
    for (const text of ["Mô tả sau sửa", "Đơn vị tính", "Giá bán", "18.000đ", `02/01/${year}`]) await expect(drawer).toContainText(text);
    await expect(drawer.getByText("Lịch sử giá bán", { exact: true })).toHaveCount(0); await capture(page, "drawer"); await drawer.getByRole("button", { name: "Đóng", exact: true }).last().click();
    await page.getByRole("button", { name: "Cập nhật giá bán", exact: true }).click(); const price = page.getByRole("dialog", { name: "Cập nhật giá bán", exact: true });
    await expect(price.locator(".product-price-identity")).toContainText(id + " - "); await expect(price.getByLabel("Giá nhập", { exact: true })).toHaveValue("18.000"); await expect(price.locator(".product-input-lock img")).toHaveCount(2);
    await price.getByRole("button", { name: "Lưu", exact: true }).click(); await expect(price.getByRole("alert")).toContainText("Không được để trống!");
    await price.getByPlaceholder("Nhập giá bán mới", { exact: true }).fill("17000"); await price.getByRole("button", { name: "Lưu", exact: true }).click(); const warning = page.getByRole("dialog", { name: "Cảnh báo", exact: true });
    await expect(warning.locator(".yellow")).toBeVisible(); await capture(page, "price-warning"); await warning.getByRole("button", { name: "Quay lại", exact: true }).click(); await expect(price.getByLabel("Giá bán mới", { exact: true })).toHaveValue("17000");
    await price.getByRole("button", { name: "Lưu", exact: true }).click(); await warning.getByRole("button", { name: "Tiếp tục", exact: true }).click(); await expect(price).toHaveCount(0); await expect(row.locator("td").nth(6)).toHaveText("17.000đ");
    await page.getByRole("button", { name: "Cập nhật giá bán", exact: true }).click(); await price.getByLabel("Giá bán mới", { exact: true }).fill("19000"); await price.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(confirm.getByRole("button", { name: "Xác nhận", exact: true })).toHaveCSS("background-color", "rgb(16, 58, 155)"); await confirm.getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(price).toHaveCount(0);
    await page.getByRole("button", { name: "Xóa", exact: true }).click(); const deletion = page.getByRole("dialog", { name: "Xóa sản phẩm", exact: true }); await expect(deletion.locator(".red img")).toHaveCount(1); await deletion.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await expect(page.locator(".product-list-footer")).toContainText("Hiển thị 1-10 / 10 sản phẩm"); await expect(page.getByLabel("Từ khóa", { exact: true })).toHaveValue(prefix);
    await page.locator(".product-management-card tbody tr").first().getByRole("checkbox").check(); await page.getByRole("button", { name: "Sửa", exact: true }).click();
    await choose(edit, "Danh mục", "Nước uống"); await edit.getByRole("button", { name: "Lưu", exact: true }).click(); await expect(edit).toHaveCount(0);
    await expect(page.locator(".product-list-footer")).toContainText("Hiển thị 1-9 / 9 sản phẩm"); await expect(page.getByRole("button", { name: "Sửa", exact: true })).toBeDisabled();
    await page.getByLabel("Từ khóa", { exact: true }).fill("zz-none-" + prefix); await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click(); await expect(page.locator(".product-management-card table")).toHaveCount(0); await expect(page.locator(".product-empty img")).toHaveCount(1); await expect(page.locator(".product-empty")).toContainText("Hãy thử từ khóa khác hoặc đổi bộ lọc."); await expect(page.locator(".product-list-footer")).toContainText("Hiển thị 0 / 0 sản phẩm"); await capture(page, "empty");
    await page.getByRole("button", { name: "Xóa từ khóa", exact: true }).click(); await expect(page.getByLabel("Từ khóa", { exact: true })).toHaveValue("");
  } finally { await cleanup(page, prefix); }
});

test("Products: blocked deletion stays selected; reference cost is consistent without changing stock cost", async ({ page }) => {
  await login(page); const data = await bootstrap(page), p = data.products.find((p: any) => p.stock > 0); expect(p).toBeTruthy();
  const cost = Number(p.reference_cost) + 1111;
  try {
    await action(page, { action: "save-products", ...p, reference_cost: cost });
    const updated = (await bootstrap(page)).products.find((x: any) => x.id === p.id); expect(updated.average_cost).toBe(p.average_cost); expect(updated.stock).toBe(p.stock); expect(updated.units).toEqual(p.units);
    await page.reload(); await page.getByLabel("Từ khóa", { exact: true }).fill(p.id); await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click(); const row = page.locator(".product-management-card tbody tr"); await expect(row).toHaveCount(1); await expect(row.locator("td").nth(5)).toHaveText(money(cost)); await row.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Xóa", exact: true }).click(); await page.getByRole("dialog", { name: "Xóa sản phẩm", exact: true }).getByRole("button", { name: "Xác nhận", exact: true }).click(); const toast = page.locator(".supplier-toast-error"); await expect(toast).toContainText("Không thể xóa sản phẩm đã có tồn kho hoặc giao dịch!"); await expect(row.getByRole("checkbox")).toBeChecked(); await capture(page, "delete-blocked"); await toast.getByRole("button", { name: "Đóng thông báo" }).click();
    await page.getByRole("button", { name: "Sửa", exact: true }).click(); const edit = page.getByRole("dialog", { name: "Sửa sản phẩm", exact: true }); await expect(edit.getByLabel("Giá nhập", { exact: true })).toHaveValue(String(cost)); await edit.getByRole("button", { name: "Hủy", exact: true }).click();
    await page.getByRole("button", { name: "Cập nhật giá bán", exact: true }).click(); const price = page.getByRole("dialog", { name: "Cập nhật giá bán", exact: true }); await expect(price.getByLabel("Giá nhập", { exact: true })).toHaveValue(money(cost).replace(/đ$/, "")); await price.getByRole("button", { name: "Hủy", exact: true }).click();
  } finally { await action(page, { action: "save-products", ...p }); }
});

test("Products: concurrent deletion closes edit form, refreshes list and displays red toast", async ({ page }) => {
  await login(page); const data = await bootstrap(page), prefix = "QA-missing-" + Date.now();
  const r = await action(page, { action: "save-products", name: prefix, category_id: data.product_categories[0].id, base_unit: "Gói", reference_cost: 1000, price: 2000 });
  try {
    await page.reload(); await page.getByLabel("Từ khóa", { exact: true }).fill(r.id); await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click(); await page.getByRole("checkbox", { name: "Chọn " + r.id, exact: true }).check(); await page.getByRole("button", { name: "Sửa", exact: true }).click();
    const edit = page.getByRole("dialog", { name: "Sửa sản phẩm", exact: true }); await expect(edit).toBeVisible(); await action(page, { action: "delete-products", id: r.id });
    await edit.getByRole("button", { name: "Lưu", exact: true }).click(); await expect(edit).toHaveCount(0); await expect(page.locator(".supplier-toast-error")).toContainText("Sản phẩm không tồn tại!"); await expect(page.locator(".product-list-footer")).toContainText("Hiển thị 0 / 0 sản phẩm"); await expect(page.getByLabel("Từ khóa", { exact: true })).toHaveValue(r.id); await capture(page, "edit-missing");
  } finally { await cleanup(page, prefix); }
});
