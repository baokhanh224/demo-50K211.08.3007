import { test, expect } from "@playwright/test";
import { installTrustedTransport } from "./public-transport";

test("sale success has circular check, dismiss button and payment panel width", async ({ page, context }) => {
  if (process.env.BASE_URL?.startsWith("https:")) await installTrustedTransport(context);
  await page.setViewportSize({ width: 1440, height: 927 });
  await page.route("**/api/action", async route => {
    if (route.request().postDataJSON()?.action !== "checkout") return route.fallback();
    await route.fulfill({ json: { id: "HDTEST", message: "Bán hàng thành công", warnings: [] } });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeEnabled();
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".sidebar")).toBeVisible();
  const data = await page.evaluate(async () => (await fetch("/api/bootstrap")).json());
  const product = data.products.find((p: any) => p.units?.length && p.sellable >= p.units[0].factor);
  await page.getByLabel("Tìm kiếm sản phẩm", { exact: true }).fill(product.id);
  await page.locator(".sale-main > .product-search .suggestions button").filter({ hasText: product.id }).click();
  await page.getByLabel("Số lượng bán", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Hoàn tất chọn sản phẩm", exact: true }).click();
  await expect(page.locator(".cart tbody tr")).toHaveCount(1);
  await page.getByLabel("Tiền khách đưa", { exact: true }).fill(String(product.units[0].price));
  await page.getByRole("button", { name: "Hoàn tất thanh toán", exact: true }).click();
  const toast = page.locator(".sale-success-toast");
  await expect(toast).toContainText("Bán hàng thành công");
  await expect(toast.locator("img")).toHaveAttribute("src", "/figma/8b27f.svg");
  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 927 });
    const notice = (await toast.boundingBox())!, payment = (await page.locator(".payment-card").boundingBox())!;
    expect(Math.abs(notice.width - payment.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(notice.x - payment.x)).toBeLessThanOrEqual(1);
    const heading = (await page.locator(".payment-card > h2").boundingBox())!;
    expect(notice.y + notice.height).toBeLessThanOrEqual(heading.y);
  }
  await toast.getByRole("button", { name: "Đóng thông báo", exact: true }).click();
  await expect(toast).toHaveCount(0);
  const after = await page.evaluate(async () => (await fetch("/api/bootstrap")).json());
  expect(after.products.find((p: any) => p.id === product.id).stock).toBe(product.stock);
});
