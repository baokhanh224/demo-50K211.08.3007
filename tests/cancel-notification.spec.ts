import { test, expect } from "@playwright/test";
import { installTrustedTransport } from "./public-transport";

test("cancellation reason is bold, invoice code regular, success has circular check and close", async ({ page, context }) => {
  if (process.env.BASE_URL?.startsWith("https:")) await installTrustedTransport(context);
  const invoice = { id: "HD0001", created_at: "2026-11-04T02:30:00.000Z", total: 174000, status: "Đã thanh toán" };
  let cancelled = false, payload: any;
  await page.route("**/api/query", async r => {
    if (r.request().postDataJSON()?.scope !== "sales-history") return r.fallback();
    await r.fulfill({ json: [{ ...invoice, status: cancelled ? "Đã hủy" : invoice.status }] });
  });
  await page.route("**/api/action", async r => {
    const data = r.request().postDataJSON();
    if (data.action === "check-cancel") return r.fulfill({ json: invoice });
    if (data.action !== "cancel-invoice") return r.fallback();
    payload = data; cancelled = true;
    await r.fulfill({ json: { id: invoice.id, message: "Hủy hóa đơn thành công" } });
  });
  await page.setViewportSize({ width: 1440, height: 927 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeEnabled();
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".sidebar")).toBeVisible();
  await page.getByRole("link", { name: "Hủy hóa đơn", exact: true }).click();
  await page.locator(".cancel-invoice-card tbody tr").getByRole("button", { name: "Hủy", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nhập lý do hủy hóa đơn", exact: true });
  await expect(dialog.locator("label")).toHaveText("Lý do hủy hóa đơn");
  await expect(dialog.locator("label")).toHaveCSS("font-weight", "700");
  await expect(dialog.locator("p").first()).toHaveText("Hóa đơn: HD0001");
  await expect(dialog.locator("p").first()).toHaveCSS("font-weight", "400");
  await dialog.getByLabel("Lý do hủy hóa đơn", { exact: true }).fill("Khách yêu cầu hủy");
  await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
  const toast = page.locator(".supplier-toast:not(.supplier-toast-error)");
  await expect(toast).toContainText("Hủy hóa đơn thành công");
  await expect(toast.locator("img")).toHaveAttribute("src", "/figma/8b27f.svg");
  expect(payload.reason).toBe("Khách yêu cầu hủy");
  await expect(dialog).toHaveCount(0);
  await toast.getByRole("button", { name: "Đóng thông báo", exact: true }).click();
  await expect(toast).toHaveCount(0);
});
