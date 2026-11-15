import { test, expect } from "@playwright/test";
import { installTrustedTransport } from "./public-transport";

test("data table headings share customer reference colors and typography across screens", async ({ page, context }) => {
  if (process.env.BASE_URL?.startsWith("https:")) await installTrustedTransport(context);
  await page.setViewportSize({ width: 1440, height: 927 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeEnabled();
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".sidebar")).toBeVisible();
  const views = ["sale", "products", "customers", "suppliers", "receipts", "inventory", "adjustments", "receipt-history", "sales-history", "cancel-invoice", "returns"];
  for (const view of views) {
    await page.goto("/?view=" + view);
    await expect(page.locator(".main thead th").first()).toBeVisible();
    const headings = await page.locator(".main thead th").evaluateAll(nodes => nodes.map(n => {
      const s = getComputedStyle(n);
      return { text: n.textContent, background: s.backgroundColor, color: s.color, font: s.fontFamily, size: s.fontSize, weight: s.fontWeight };
    }));
    expect(headings.length, view).toBeGreaterThan(0);
    for (const heading of headings) {
      expect(heading.background, view + ": " + heading.text).toBe("rgb(237, 243, 252)");
      expect(heading.color, view + ": " + heading.text).toBe("rgb(15, 23, 42)");
      expect(heading.font).toContain("Inter");
      expect(heading.size).toBe("13px");
      expect(heading.weight).toBe("600");
    }
  }
});
