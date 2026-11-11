import { test, expect } from "@playwright/test";
import { one } from "../lib/db";
test("Hai phiên trình duyệt cùng bán hàng gần hết", async ({ browser }) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  const pages = [await a.newPage(), await b.newPage()];
  const stock = (
    await one(
      "SELECT SUM(remaining) n FROM receipt_line WHERE product_id='SP0005'",
    )
  ).n;
  for (const page of pages) {
    await page.goto("/");
    await page.getByLabel("Tên đăng nhập").fill(process.env.DEMO_USERNAME!);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Tạo giao dịch bán hàng" }),
    ).toBeVisible();
    await page
      .getByLabel("Tìm kiếm sản phẩm", { exact: true })
      .fill("Muối I-ốt");
    await page.getByRole("button", { name: /Muối I-ốt.*SP0005/ }).click();
    await page.getByLabel("Số lượng bán", { exact: true }).fill(String(stock));
    await page
      .getByRole("button", { name: "Hoàn tất chọn sản phẩm", exact: true })
      .click();
    await page.getByLabel("Tiền khách đưa", { exact: true }).fill("100000");
  }
  await Promise.all(
    pages.map((p) =>
      p
        .getByRole("button", { name: "Hoàn tất thanh toán", exact: true })
        .click(),
    ),
  );
  await expect
    .poll(
      async () =>
        (await pages[0]
          .getByText("Bán hàng thành công", { exact: true })
          .count()) +
        (await pages[1]
          .getByText("Bán hàng thành công", { exact: true })
          .count()),
    )
    .toBe(1);
  const winner = (await pages[0]
    .getByText("Bán hàng thành công", { exact: true })
    .count())
    ? pages[0]
    : pages[1];
  const loser = winner === pages[0] ? pages[1] : pages[0];
  await expect(
    loser.getByText("Không đủ số lượng hàng có thể bán", { exact: true }),
  ).toBeVisible();
  expect(
    (
      await one(
        "SELECT SUM(remaining) n FROM receipt_line WHERE product_id='SP0005'",
      )
    ).n,
  ).toBe(0);
  expect(
    (await one("SELECT MIN(remaining) n FROM receipt_line")).n,
  ).toBeGreaterThanOrEqual(0);
  await winner.screenshot({
    path: "test-results/05-hai-phien.png",
    fullPage: true,
  });
  await winner
    .getByRole("button", { name: "Xem hóa đơn", exact: true })
    .click();
  await winner.getByRole("button", { name: "Hủy", exact: true }).click();
  await winner
    .getByLabel("Lý do hủy hóa đơn", { exact: true })
    .fill("Hoàn kho sau kiểm tra hai phiên");
  await winner
    .getByRole("dialog", { name: "Nhập lý do hủy hóa đơn" })
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await expect(
    winner.getByText("Hủy hóa đơn thành công", { exact: true }),
  ).toBeVisible();
  expect(
    (
      await one(
        "SELECT SUM(remaining) n FROM receipt_line WHERE product_id='SP0005'",
      )
    ).n,
  ).toBe(stock);
  await a.close();
  await b.close();
});
