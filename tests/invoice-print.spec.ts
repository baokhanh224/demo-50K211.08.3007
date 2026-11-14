import { test, expect } from "@playwright/test";
import fs from "node:fs";

async function openPrint(page: any) {
  await page.setViewportSize({ width: 1440, height: 927 });
  await page.addInitScript(() => { (window as any).__printCalls = 0; window.print = () => { (window as any).__printCalls++; }; });
  await page.goto("/?view=sales-history");
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".sidebar")).toBeVisible();
  await page.getByRole("link", { name: "Tra cứu lịch sử bán hàng", exact: true }).click();
  await expect(page.locator(".history-list-card tbody tr").first()).toBeVisible();
  const rows = await (await page.request.post("/api/query", { data: { scope: "sales-history" } })).json();
  const invoice = rows.find((row: any) => row.status !== "Đã hủy");
  expect(invoice).toBeTruthy();
  await page.locator(".history-list-card tbody tr").filter({ hasText: invoice.id }).click();
  await page.getByRole("dialog", { name: "Chi tiết hóa đơn", exact: true }).getByRole("button", { name: "In hóa đơn", exact: true }).click();
  await expect(page.locator(".invoice-print-page")).toBeVisible();
  return invoice;
}
async function capture(page: any, name: string) {
  fs.mkdirSync("test-results/invoice-print", { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.locator("img").evaluateAll((images: HTMLImageElement[]) => Promise.all(images.map(image => image.decode())));
  await page.screenshot({ path: `test-results/invoice-print/${name}.png` });
}

test("UC6.2 page, cancel confirmation, successful print and printable document", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const invoice = await openPrint(page);
  const print = page.locator(".invoice-print-actions").getByRole("button", { name: "In hóa đơn", exact: true });
  await expect(print).toBeEnabled();
  await expect(page.locator(".invoice-print-sheet")).toContainText(invoice.id);
  expect(await page.locator(".invoice-print-sheet").boundingBox()).toEqual({ x: 476, y: 212, width: 733, height: 557 });
  expect(await page.locator(".invoice-print-actions").getByRole("button", { name: "Hủy", exact: true }).boundingBox()).toEqual({ x: 699, y: 800, width: 110, height: 40 });
  expect(await print.boundingBox()).toEqual({ x: 841, y: 800, width: 145, height: 40 });
  await capture(page, "preview");
  await page.locator(".invoice-print-actions").getByRole("button", { name: "Hủy", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Hủy in hóa đơn?", exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.boundingBox()).toEqual({ x: 500, y: 350, width: 440, height: 250 });
  await expect(dialog.getByRole("button", { name: "Xác nhận", exact: true })).toHaveCSS("background-color", "rgb(217, 33, 38)");
  await capture(page, "cancel-confirmation");
  await dialog.getByRole("button", { name: "Quay lại", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".invoice-print-sheet")).toContainText(invoice.id);
  await print.click();
  const success = page.locator(".invoice-print-toast.success");
  await expect(success).toHaveText(/In hóa đơn thành công/);
  expect(await page.evaluate(() => (window as any).__printCalls)).toBe(1);
  expect(await success.boundingBox()).toEqual({ x: 1171, y: 107, width: 245, height: 56 });
  await capture(page, "success");
  await success.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(success).toHaveCount(0);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".invoice-print-sheet")).toBeVisible();
  await expect(page.locator(".header")).toBeHidden();
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".invoice-print-actions")).toBeHidden();
  await expect(page.locator(".invoice-print-page>h1")).toBeHidden();
  await page.pdf({ path: "test-results/invoice-print/invoice.pdf", format: "A4", printBackground: true });
  await page.emulateMedia({ media: "screen" });
  await page.locator(".invoice-print-actions").getByRole("button", { name: "Hủy", exact: true }).click();
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
  await page.locator(".invoice-print-actions").getByRole("button", { name: "Hủy", exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.locator(".invoice-print-page")).toHaveCount(0);
  await expect(page.locator(".history-list-card")).toBeVisible();
  expect(errors).toEqual([]);
});

test("UC6.2 print failures, retry, cancellation after preview and initially blocked invoice", async ({ page }) => {
  await openPrint(page);
  const print = page.locator(".invoice-print-actions").getByRole("button", { name: "In hóa đơn", exact: true });
  await expect(print).toBeEnabled();
  let cancellation = false;
  await page.route("**/api/action", async route => {
    if (route.request().postDataJSON()?.action === "print")
      return route.fulfill({ status: 400, json: { error: cancellation ? "Hóa đơn đã bị hủy, không thể in" : "Không thể kết nối hoặc gửi yêu cầu đến máy in", fields: {} } });
    await route.fallback();
  });
  await print.click();
  await expect(page.locator(".invoice-print-toast.error")).toContainText("Không thể kết nối hoặc gửi yêu cầu đến máy in");
  await expect(print).toBeEnabled();
  expect(await page.evaluate(() => (window as any).__printCalls)).toBe(0);
  await capture(page, "printer-error");
  cancellation = true;
  await print.click();
  const toast = page.locator(".invoice-print-toast.error");
  await expect(toast).toContainText("Hóa đơn đã bị hủy, không thể in");
  await expect(print).toBeDisabled();
  expect(await toast.boundingBox()).toEqual({ x: 1097, y: 107, width: 290, height: 56 });
  await capture(page, "cancelled-invoice");
  await toast.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(print).toBeDisabled();
  expect(await page.evaluate(() => (window as any).__printCalls)).toBe(0);
  await page.locator(".invoice-print-actions").getByRole("button", { name: "Hủy", exact: true }).click();
  await page.getByRole("dialog", { name: "Hủy in hóa đơn?" }).getByRole("button", { name: "Xác nhận" }).click();
  await page.route("**/api/action", async route => {
    if (route.request().postDataJSON()?.action === "print-preview")
      return route.fulfill({ status: 400, json: { error: "Hóa đơn đã bị hủy, không thể in", fields: {} } });
    await route.fallback();
  });
  await page.locator(".history-list-card tbody tr").first().click();
  await page.getByRole("dialog", { name: "Chi tiết hóa đơn", exact: true }).getByRole("button", { name: "In hóa đơn", exact: true }).click();
  await expect(page.locator(".invoice-print-toast.error")).toContainText("Hóa đơn đã bị hủy, không thể in");
  await expect(print).toBeDisabled();
});
