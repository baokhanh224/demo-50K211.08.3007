import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { installTrustedTransport } from "./public-transport";
import { date } from "../lib/format";

test("Inventory: Figma filters/table, expiry details, empty state and dismissible load error", async ({ page, context }) => {
  if (process.env.BASE_URL?.startsWith("https:")) await installTrustedTransport(context);
  const products = [
    { id: "SP0001", name: "Sữa Milo", stock: 20, min_stock: 5 },
    { id: "SP0002", name: "Bánh quy", stock: 5, min_stock: 10 },
    { id: "SP0003", name: "Sữa tươi", stock: 12, min_stock: 0 },
    { id: "SP0004", name: "Nước ngọt", stock: 8, min_stock: 0 },
  ];
  const soonDate = new Date(); soonDate.setUTCDate(soonDate.getUTCDate() + 10);
  const lots = [
    { id: 1, product_id: "SP0003", product_name: "Sữa tươi", receipt_id: "PN0003", remaining: 5, expiry: soonDate.toISOString().slice(0, 10) },
    { id: 2, product_id: "SP0003", product_name: "Sữa tươi", receipt_id: "PN0004", remaining: 7, expiry: soonDate.toISOString().slice(0, 10) },
  ];
  const searches: any[] = []; let failNext = false;
  await page.route("**/api/query", async route => {
    const payload = route.request().postDataJSON();
    if (payload?.scope !== "inventory") return route.fallback();
    searches.push(payload);
    if (failNext) { failNext = false; return route.fulfill({ status: 500, json: { error: "Không thể tải dữ liệu tồn kho" } }); }
    let result: any[] = payload.filter === "Sắp hết hạn" ? lots
      : payload.filter === "Đã hết hạn" ? [{ ...lots[0], expiry: "2000-01-01" }]
      : payload.filter === "Dưới mức cảnh báo tồn kho" ? products.filter(p => p.stock <= p.min_stock) : products;
    if (payload.q) result = result.filter(r => (r.product_id || r.id).includes(payload.q) || (r.product_name || r.name).includes(payload.q));
    await route.fulfill({ json: result });
  });
  await page.setViewportSize({ width: 1440, height: 927 });
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".sidebar")).toBeVisible();
  await page.getByRole("link", { name: "Quản lý tồn kho", exact: true }).click();
  await page.getByRole("link", { name: "Tra cứu tồn kho", exact: true }).click();
  const root = page.locator(".inventory-page"), rows = root.locator(".inventory-main-table tbody tr");
  const query = root.getByLabel("Tên sản phẩm hoặc mã sản phẩm", { exact: true });
  const filter = root.getByLabel("Trạng thái cảnh báo", { exact: true });
  const search = root.getByRole("button", { name: "Tìm kiếm", exact: true });
  await expect(rows).toHaveCount(4);
  await expect(root.locator(".inventory-main-table th")).toHaveText(["Mã sản phẩm", "Tên sản phẩm", "Số lượng tồn", "Trạng thái"]);
  await expect(rows.nth(1).locator("td").last()).toHaveText("Dưới mức cảnh báo");
  await expect(root.locator(".badge")).toHaveCount(0);
  for (const [selector, y, height] of [[".inventory-filter-card", 157, 170], [".inventory-results-card", 346, 474]] as const) {
    const box = (await root.locator(selector).boundingBox())!;
    expect(box.y).toBe(y); expect(box.height).toBe(height);
  }
  expect((await query.boundingBox())!.width).toBe(570);
  expect((await filter.boundingBox())!.width).toBe(333);
  expect((await search.boundingBox())!.width).toBe(157);
  fs.mkdirSync("test-results/inventory", { recursive: true });
  await page.screenshot({ path: "test-results/inventory/all.png" });
  await filter.selectOption("Dưới mức cảnh báo tồn kho"); await search.click();
  await expect(rows).toHaveCount(1); await expect(rows.first()).toContainText("Bánh quy");
  expect(searches.at(-1).filter).toBe("Dưới mức cảnh báo tồn kho");
  await filter.selectOption("Sắp hết hạn"); await search.click();
  await expect(rows).toHaveCount(1); await expect(rows.first().locator("td").nth(2)).toHaveText("12");
  const details = root.getByRole("group", { name: "Chi tiết cảnh báo hạn sử dụng", exact: true });
  await expect(details.locator("tbody tr")).toHaveCount(2);
  await expect(details).toContainText(date(lots[0].expiry));
  await page.screenshot({ path: "test-results/inventory/expiry.png" });
  await filter.selectOption("Đã hết hạn"); await search.click();
  await expect(rows.first().locator("td").last()).toHaveText("Đã hết hạn");
  await expect(details.locator(".inventory-expired")).toHaveText("Đã hết hạn");
  await filter.selectOption("Tất cả"); await query.fill("zz-empty"); await search.click();
  await expect(rows).toHaveCount(0); await expect(root).toContainText("Không tìm thấy sản phẩm phù hợp");
  const emptyToast = root.locator(".supplier-toast-error");
  await expect(emptyToast).toHaveText("Không tìm thấy sản phẩm phù hợp×");
  expect((await emptyToast.boundingBox())!.y).toBe(108);
  await expect(emptyToast.locator("img")).toHaveCount(1);
  await expect(root.locator(".inventory-main-table th")).toHaveCount(4);
  await expect(root.locator(".empty")).toHaveCount(0);
  await page.screenshot({ path: "test-results/inventory/not-found.png" });
  await emptyToast.getByRole("button", { name: "Đóng thông báo", exact: true }).click();
  await expect(emptyToast).toHaveCount(0);
  await expect(rows).toHaveCount(0);
  await expect(root.locator(".inventory-main-table th")).toHaveCount(4);
  await query.fill(""); await search.click(); await expect(rows).toHaveCount(4);
  await expect(emptyToast).toHaveCount(0);
  failNext = true; await search.click();
  const toast = root.locator(".supplier-toast-error");
  await expect(toast).toContainText("Không thể tải dữ liệu tồn kho");
  expect((await toast.boundingBox())!.y).toBe(108);
  await expect(rows).toHaveCount(0); await expect(root.locator(".inventory-main-table th")).toHaveCount(4);
  await expect(root.getByText("Không tìm thấy sản phẩm phù hợp", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: "test-results/inventory/load-error.png" });
  await toast.getByRole("button", { name: "Đóng thông báo", exact: true }).click();
  await expect(toast).toHaveCount(0);
  await expect(root.getByText("Không tìm thấy sản phẩm phù hợp", { exact: true })).toHaveCount(0);
  await search.click(); await expect(rows).toHaveCount(4);
});
