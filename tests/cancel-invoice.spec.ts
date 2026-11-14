import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("UC6.3 cancel list, real cancelled-invoice toast, search and retained results", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 927 });
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".sidebar")).toBeVisible();
  await page.getByRole("link", { name: "Hủy hóa đơn", exact: true }).click();
  const card = page.locator(".cancel-invoice-card"), rows = card.locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  expect(await card.boundingBox()).toEqual({ x: 274, y: 215, width: 1110, height: 644 });
  const search = page.getByRole("textbox", { name: "Mã hóa đơn", exact: true });
  expect(await search.boundingBox()).toEqual({ x: 291, y: 280, width: 300, height: 40 });
  expect(await page.getByRole("button", { name: "Tìm kiếm", exact: true }).boundingBox()).toEqual({ x: 603, y: 280, width: 110, height: 40 });
  expect(await card.locator("thead").boundingBox()).toEqual({ x: 291, y: 360, width: 1070, height: 48 });
  expect(await card.locator("th").allTextContents()).toEqual(["Mã hóa đơn", "Ngày giờ bán", "Tổng tiền", "Trạng thái", ""]);
  await expect(page.locator(".cancel-invoice-filters input")).toHaveCount(1);
  await expect(rows.first().locator(".code")).toHaveCSS("color", "rgb(15, 23, 42)");
  await expect(rows.first().locator(".badge")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const invoices = await (await page.request.post("/api/query", { data: { scope: "sales-history" } })).json();
  const cancelled = invoices.find((i: any) => i.status === "Đã hủy"); expect(cancelled).toBeTruthy();
  const before = await rows.allTextContents();
  const capture = async (name: string) => {
    fs.mkdirSync("test-results/cancel-invoice", { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    await page.locator("img").evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())));
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `test-results/cancel-invoice/${name}.png` });
  };
  await capture("list");
  const cancelledRow = rows.filter({ hasText: cancelled.id });
  await cancelledRow.hover();
  await cancelledRow.getByRole("button", { name: "Hủy", exact: true }).click();
  const toast = page.locator(".cancel-invoice-error-toast");
  await expect(toast).toContainText("Hóa đơn này đã được hủy trước đó");
  expect(await toast.boundingBox()).toEqual({ x: 997, y: 107, width: 390, height: 56 });
  expect(await rows.allTextContents()).toEqual(before);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await capture("already-cancelled");
  await toast.getByRole("button", { name: "Đóng thông báo", exact: true }).click(); await expect(toast).toHaveCount(0);
  await search.fill(cancelled.id); await search.press("Enter"); await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(cancelled.id);
  await search.fill("zz-no-invoice"); await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(card.locator(".empty")).toContainText("Không tìm thấy hóa đơn phù hợp");
  await search.fill(""); await search.press("Enter"); await expect(rows).toHaveCount(invoices.length);
  // Read-only prechecks find an eligible existing invoice, without cancelling it.
  let eligible: any;
  for (const i of invoices.filter((i: any) => i.status !== "Đã hủy")) {
    const r = await page.request.post("/api/action", { data: { action: "check-cancel", id: i.id } });
    if (r.ok()) { eligible = i; break; }
  }
  expect(eligible).toBeTruthy();
  const eligibleRow = rows.filter({ hasText: eligible.id }); await eligibleRow.hover();
  await eligibleRow.getByRole("button", { name: "Hủy", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nhập lý do hủy hóa đơn", exact: true });
  await expect(dialog).toBeVisible(); await expect(dialog).toContainText(eligible.id);
  await dialog.getByRole("button", { name: "Quay lại", exact: true }).click(); await expect(dialog).toHaveCount(0);
  const retained = await rows.allTextContents();
  await page.route("**/api/query", route => route.fulfill({ status: 500, json: { error: "Không thể tải lịch sử bán hàng", fields: {} } }));
  await search.press("Enter"); await expect(toast).toContainText("Không thể tải lịch sử bán hàng");
  expect(await rows.allTextContents()).toEqual(retained);
  expect((await (await page.request.post("/api/query", { data: { scope: "sales-history" } })).json())).toEqual(invoices);
  expect(errors).toEqual([]);
});
