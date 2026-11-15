import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { installTrustedTransport } from "./public-transport";

test("Adjustments: Figma layout, selection editors, numeric save payload and cancel confirmation", async ({ page, context }) => {
  if (process.env.BASE_URL?.startsWith("https:")) await installTrustedTransport(context);
  const lots = [
    { id: 1, product_id: "SP0001", product_name: "Sữa Milo", receipt_id: "PN0001", expiry: "2026-12-18", remaining: 12, original_quantity: 20, base_unit: "Hộp" },
    { id: 2, product_id: "SP0001", product_name: "Sữa Milo", receipt_id: "PN0002", expiry: "2027-01-05", remaining: 8, original_quantity: 10, base_unit: "Hộp" },
  ];
  const searches: any[] = [], saves: any[] = [];
  await page.route("**/api/query", async route => {
    const payload = route.request().postDataJSON();
    if (payload?.scope !== "adjustments") return route.fallback();
    searches.push(payload);
    await route.fulfill({ json: payload.q === "zz-empty" ? [] : lots });
  });
  await page.route("**/api/action", async route => {
    const payload = route.request().postDataJSON();
    if (payload?.action !== "adjust") return route.fallback();
    saves.push(payload);
    await route.fulfill({ status: 400, json: { error: "Số lượng điều chỉnh không hợp lệ", fields: { line_2: "Số lượng điều chỉnh không hợp lệ" } } });
  });
  await page.setViewportSize({ width: 1440, height: 927 });
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".sidebar")).toBeVisible();
  await page.getByRole("link", { name: "Quản lý tồn kho", exact: true }).click();
  await page.getByRole("link", { name: "Điều chỉnh tồn kho", exact: true }).click();
  const root = page.locator(".adjustments-page");
  await expect(root.locator("tbody tr")).toHaveCount(2);
  await expect(root.locator(".adjustment-product-summary")).toContainText("Tổng tồn kho: 20");
  await expect(root.getByLabel("Số lượng tồn mới", { exact: true })).toBeDisabled();
  await root.getByLabel("Chọn chi tiết 1", { exact: true }).check();
  await expect(root.getByLabel("Chi tiết phiếu nhập đã chọn", { exact: true })).toHaveValue("CTN001");
  await expect(root.getByLabel("Chi tiết phiếu nhập đã chọn", { exact: true })).toHaveAttribute("readonly", "");
  await root.getByLabel("Số lượng tồn mới", { exact: true }).fill("10");
  await root.getByLabel("Lý do điều chỉnh", { exact: true }).fill("Kiểm kê thực tế");
  for (const [selector, y, height] of [[".adjustment-search-card", 170, 123], [".adjustment-lots-card", 309, 270], [".adjustment-details-card", 597, 183]] as const) {
    const box = (await root.locator(selector).boundingBox())!;
    expect(box.y).toBe(y); expect(box.height).toBe(height);
  }
  const fieldBoxes = await root.locator(".adjustment-edit-content input").evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().y));
  expect(Math.max(...fieldBoxes) - Math.min(...fieldBoxes)).toBeLessThanOrEqual(1);
  fs.mkdirSync("test-results/adjustments", { recursive: true });
  await page.screenshot({ path: "test-results/adjustments/main.png" });
  await root.getByRole("button", { name: "Hủy", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Xác nhận", exact: true });
  await expect(confirmation).toContainText("Bạn có chắc chắn muốn hủy điều chỉnh tồn kho không?");
  const modal = (await confirmation.boundingBox())!;
  expect(modal.width).toBe(442); expect(modal.height).toBe(252);
  await expect(confirmation.getByRole("button", { name: "Xác nhận", exact: true })).toHaveCSS("background-color", "rgb(220, 38, 38)");
  await expect(confirmation.locator(".adjustment-cancel-icon img")).toHaveAttribute("src", "/figma/a32c7.svg");
  await page.screenshot({ path: "test-results/adjustments/cancel.png" });
  await confirmation.getByRole("button", { name: "Quay lại", exact: true }).click();
  await expect(root.getByLabel("Số lượng tồn mới", { exact: true })).toHaveValue("10");
  await root.getByLabel("Chọn chi tiết 2", { exact: true }).check();
  const second = root.getByRole("group", { name: "Điều chỉnh CTN002", exact: true });
  await second.getByLabel("Số lượng tồn mới", { exact: true }).fill("7");
  await root.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect.poll(() => saves.length).toBe(1);
  expect(saves[0].lines).toEqual([{ lot_id: 1, quantity: "10" }, { lot_id: 2, quantity: "7" }]);
  expect(saves[0].reason).toBe("Kiểm kê thực tế");
  await expect(second.getByRole("alert")).toHaveText("Số lượng điều chỉnh không hợp lệ");
  await root.getByLabel("Từ khóa", { exact: true }).fill("zz-empty");
  await root.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(root).toContainText("Không tìm thấy sản phẩm phù hợp");
  await expect(root.getByLabel("Số lượng tồn mới", { exact: true })).toBeDisabled();
  expect(searches.at(-1).q).toBe("zz-empty");
  await root.getByRole("button", { name: "Hủy", exact: true }).click();
  await confirmation.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(root).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Tra cứu tồn kho", exact: true })).toBeVisible();
});
