import { test, expect } from "@playwright/test";
import { installTrustedTransport } from "./public-transport";

test("management screens share dimensions across navigation and selection", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 927 });
  if (baseURL?.startsWith("https:")) await installTrustedTransport(page.context());
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeEnabled();
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const names = ["Quản lý sản phẩm", "Quản lý khách hàng", "Quản lý nhà cung cấp"];
  for (const name of [...names, ...names.toReversed()]) {
    await page.getByRole("link", { name, exact: true }).click();
    const rects = await page.evaluate(() => {
      const rect = (selector: string) => {
        const { x, y, width, height } = document.querySelector(selector)!.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        header: rect(".header"), sidebar: rect(".sidebar"), title: rect(".main h1"),
        card: rect(".product-management-card,.customer-list-card,.supplier-list-card"),
        search: rect(".product-search-input,.customer-list-controls .search,.supplier-search"),
        head: rect(".main thead tr"),
      };
    });
    expect(rects.header.height).toBe(90);
    expect(rects.sidebar.width).toBe(250);
    expect(rects.title).toMatchObject({ x: 274, y: 114, height: 27 });
    expect(rects.card).toMatchObject({ x: 274, y: 157, width: 1142 });
    expect(rects.card.height).toBeGreaterThanOrEqual(600);
    expect(rects.search).toEqual({ x: 295, y: 178, width: 360, height: 40 });
    if (name === "Quản lý khách hàng") {
      await page.evaluate(() => document.fonts.ready);
      const textFits = await page.locator(".customer-list-controls .search input").evaluate((input: HTMLInputElement) => {
        const style = getComputedStyle(input), context = document.createElement("canvas").getContext("2d")!;
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const available = input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        return context.measureText(input.placeholder).width <= available;
      });
      expect(textFits).toBe(true);
    }
    expect(rects.head).toMatchObject({ x: 296, y: 291, height: 44 });
    const search = page.locator(".product-controls > .btn,.supplier-filters > .btn,.customer-list-controls .filters > .btn");
    expect(await search.boundingBox()).toMatchObject({ width: 112, height: 40 });
    const buttons = page.locator(".product-actions .btn,.supplier-toolbar .btn,.customer-list-controls .card-head .btn");
    const widths = name === names[0] ? [180, 80, 80, 180] : [180, 80, 80];
    for (let i = 0; i < widths.length; i++) expect(await buttons.nth(i).boundingBox()).toMatchObject({ width: widths[i], height: 40 });
    const checkbox = page.locator(".main tbody input[type=checkbox]").first();
    await checkbox.check();
    await expect(buttons.nth(1)).toBeEnabled();
    expect(await buttons.nth(1).boundingBox()).toMatchObject({ width: 80, height: 40 });
    await checkbox.uncheck();
  }
});
