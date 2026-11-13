import { test, expect } from "@playwright/test";
import { installTrustedTransport } from "./public-transport";
test("UC6.1: placeholder, chọn sản phẩm và toast theo Figma", async ({
  page,
  context,
}) => {
  if (process.env.BASE_URL?.startsWith("https:"))
    await installTrustedTransport(context);
  await page.setViewportSize({ width: 1440, height: 927 });
  await page.goto("/");
  await page
    .getByLabel("Tên đăng nhập", { exact: true })
    .fill(process.env.DEMO_USERNAME!);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const name = page.getByLabel("Tên sản phẩm", { exact: true });
  await expect(name).toHaveValue("");
  await expect(name).toHaveAttribute("placeholder", "Chưa chọn sản phẩm");
  await expect(name).toBeEditable();
  const ghost = await name.evaluate(el=>getComputedStyle(el,"::placeholder").color);
  expect(ghost).toBe("rgb(148, 163, 184)");
  expect(await page.getByLabel("Số lượng bán",{exact:true}).evaluate(el=>getComputedStyle(el,"::placeholder").color)).toBe(ghost);
  await expect(page.getByLabel("Giá bán", { exact: true })).toHaveValue("");
  await expect(
    page.getByLabel("Số lượng tồn kho", { exact: true }),
  ).toHaveValue("");
  await name.fill("SP0001");
  await expect(name).toHaveValue("SP0001");
  await page
    .locator(".product-info-grid .suggestions button")
    .filter({ hasText: "SP0001" })
    .click();
  await expect(name).not.toHaveValue("SP0001");
  await expect(page.getByLabel("Giá bán", { exact: true })).not.toHaveValue("");
  await page.getByLabel("Số lượng bán", { exact: true }).fill("1");
  await page
    .getByRole("button", { name: "Hoàn tất chọn sản phẩm", exact: true })
    .click();
  await expect(page.locator(".cart tbody tr")).toHaveCount(1);
  await expect(page.getByTestId("checkout-total")).not.toHaveText(/^0\s?đ$/);
  await page
    .locator(".cart tbody tr")
    .getByRole("button", { name: "Xóa", exact: true })
    .click();
  const search = page.getByLabel("Tìm kiếm sản phẩm", { exact: true });
  await search.fill("zz_no_product_qa");
  await search.press("Enter");
  const toast = page
    .getByRole("alert")
    .filter({ hasText: "Không tìm thấy sản phẩm" });
  await expect(toast).toBeVisible();
  await expect(name).toHaveValue("");
  await expect(name).toHaveAttribute("placeholder", "Chưa chọn sản phẩm");
  const box = await toast.boundingBox();
  expect(box?.width).toBe(320);
  expect(box?.height).toBe(56);
  expect(box?.y).toBe(106);
  await expect(page.locator(".sale-product-card")).toHaveJSProperty(
    "offsetHeight",
    224,
  );
  expect((await page.locator(".sale-product-card").boundingBox())?.y).toBe(252);
  expect((await page.locator(".cart").boundingBox())?.y).toBe(495);
  await page
    .locator(".sale-layout img")
    .evaluateAll((a) =>
      Promise.all(a.map((i) => (i as HTMLImageElement).decode())),
    );
  console.log(
    JSON.stringify({
      toast: box,
      product: await page.locator(".sale-product-card").boundingBox(),
      cart: await page.locator(".cart").boundingBox(),
      payment: await page.locator(".payment-card").boundingBox(),
      name: await name.boundingBox(),
    }),
  );
  await page.screenshot({
    path: "test-results/sale-ui-not-found.png",
    fullPage: true,
  });
  await toast.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(toast).toHaveCount(0);
});
