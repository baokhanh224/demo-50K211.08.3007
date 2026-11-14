import { test, expect } from "@playwright/test";
test("Sản phẩm, khách hàng, nhà cung cấp, cảnh báo và in", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập").fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page
    .getByRole("link", { name: "Quản lý sản phẩm", exact: true })
    .click();
  await page.getByRole("button", { name: /Thêm sản phẩm/ }).click();
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Không được để trống!", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByLabel("Tên sản phẩm", { exact: true })
    .fill("Sản phẩm kiểm tra");
  await page.getByRole("dialog", {name:"Thêm sản phẩm",exact:true}).getByRole("button",{name:"Danh mục",exact:true}).click();
  await page.getByRole("option", {name:"Sữa",exact:true}).click();
  await page.getByRole("button", {name:"Đơn vị tính",exact:true}).click();
  await page.getByRole("option", {name:"Gói",exact:true}).click();
  await page.getByLabel("Giá nhập", { exact: true }).fill("1000");
  await page.getByLabel("Giá bán", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Dữ liệu không hợp lệ!", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Giá bán", { exact: true }).fill("2000");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Thêm sản phẩm thành công!", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Từ khóa",{exact:true}).fill("Sản phẩm kiểm tra");
  await page.getByRole("button",{name:"Tìm kiếm",exact:true}).click();
  const row = page.locator("tbody tr").filter({ hasText: "Sản phẩm kiểm tra" });
  await row.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Cập nhật giá bán", exact: true })
    .click();
  await page.getByLabel("Giá bán mới", { exact: true }).fill("500");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Giá bán thấp hơn giá nhập. Bạn có muốn tiếp tục?", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(
    page.getByText("Cập nhật giá bán thành công!", { exact: true }),
  ).toBeVisible();
  await row.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xóa", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(
    page.getByText("Xóa sản phẩm thành công!", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Quản lý khách hàng", exact: true })
    .click();
  await page.getByRole("button", { name: /Thêm khách hàng/ }).click();
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Vui lòng nhập đầy đủ Tên khách hàng và Số điện thoại", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Tên khách hàng", { exact: true })
    .fill("Nguyễn Kiểm Thử");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0901234567");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Số điện thoại đã tồn tại trong hệ thống", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0999888777");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Thêm khách hàng thành công", { exact: true }),
  ).toBeVisible();
  const customer = page
    .locator("tbody tr")
    .filter({ hasText: "Nguyễn Kiểm Thử" });
  await customer.click();
  await expect(
    page.getByText("Chưa có lịch sử mua hàng", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đóng", exact: true }).last().click();
  await customer.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Xóa", exact: true }).click();
  await page.getByRole("button", { name: "Đồng ý", exact: true }).click();
  await expect(
    page.getByText("Xóa khách hàng thành công", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Quản lý nhà cung cấp", exact: true })
    .click();
  await page.getByRole("button", { name: /Thêm nhà cung cấp/ }).click();
  await page
    .getByLabel("Tên nhà cung cấp", { exact: true })
    .fill("Nhà cung cấp kiểm tra");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0912345000");
  await page.getByRole("dialog", {name:"Thêm nhà cung cấp",exact:true}).getByRole("button", {name:"Danh mục",exact:true}).click();
  await page.getByLabel("Khác", { exact: true }).click();
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Vui lòng nhập tên danh mục mới!", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Tên danh mục mới", { exact: true })
    .fill("Sữa & đồ uống");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Danh mục đã tồn tại, vui lòng chọn danh mục có sẵn!", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("dialog", {name:"Thêm nhà cung cấp",exact:true}).getByRole("button", {name:"Danh mục",exact:true}).click();
  await page.getByLabel("Khác", { exact: true }).click();
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByText("Thêm nhà cung cấp thành công!", { exact: true }),
  ).toBeVisible();
  await page
    .locator("tbody tr")
    .filter({ hasText: "Nhà cung cấp kiểm tra" })
    .getByRole("checkbox")
    .check();
  await page.getByRole("button", { name: "Xóa", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(
    page.getByText("Xóa nhà cung cấp thành công!", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Quản lý tồn kho", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Tra cứu tồn kho", exact: true })
    .click();
  await page
    .getByLabel("Trạng thái", { exact: true })
    .selectOption("Đã hết hạn");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "PN0003", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cài đặt demo", exact: true }).click();
  await page.getByLabel("Lỗi máy in", { exact: true }).check();
  await expect(page.getByLabel("Lỗi máy in", { exact: true })).not.toBeDisabled();
  await page.getByRole("link", { name: "Bán hàng", exact: true }).click();
  await page
    .getByRole("link", { name: "Tra cứu lịch sử bán hàng", exact: true })
    .click();
  await page.getByRole("cell", { name: "HD0001", exact: true }).click();
  await page.getByRole("button", { name: "In hóa đơn", exact: true }).click();
  await expect(page.locator(".invoice-print-page")).toBeVisible();
  await page.getByRole("button", { name: "In hóa đơn", exact: true }).click();
  await expect(
    page.getByText("Không thể kết nối hoặc gửi yêu cầu đến máy in", {
      exact: true,
    }),
  ).toBeVisible();
});
