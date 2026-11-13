import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import fs from "node:fs";
import { all, one } from "../lib/db";
import { today, date } from "../lib/format";
test("Báo cáo, Excel, PDF và dữ liệu sau tải lại", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập").fill(process.env.DEMO_USERNAME!);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page
    .getByRole("link", { name: "Báo cáo thống kê", exact: true })
    .click();
  await page.getByRole("button", { name: "Loại báo cáo", exact: true }).click();
  await page.getByRole("option", { name: "Doanh thu", exact: true }).click();
  await page.getByLabel("Từ ngày", { exact: true }).fill(date(today()));
  await page.getByLabel("Đến ngày", { exact: true }).fill(date(today()));
  await page.getByLabel("Đến ngày", { exact: true }).fill(date(today()));
  await page.getByRole("button", { name: "Xem báo cáo", exact: true }).click();
  await expect(page.getByTestId("report-revenue")).toHaveText("72.000đ");
  await page.screenshot({
    path: "test-results/04-bao-cao.png",
    fullPage: true,
  });
  const exported: any = {};
  for (const format of ["Excel", "PDF"]) {
    await page
      .getByRole("button", { name: "Xuất báo cáo", exact: true })
      .click();
    await page
      .getByRole("radio", {
        name: format === "Excel" ? "Excel (.xlsx)" : "PDF (.pdf)",
        exact: true,
      })
      .check();
    const download = page.waitForEvent("download");
    await page
      .getByRole("dialog", { name: "Xuất báo cáo" })
      .getByRole("button", { name: "Xuất báo cáo", exact: true })
      .click();
    const file = await download;
    const target =
      "test-results/" + (format === "Excel" ? "bao-cao.xlsx" : "bao-cao.pdf");
    await file.saveAs(target);
    expect(fs.statSync(target).size).toBeGreaterThan(1000);
    if (format === "Excel") {
      const book = new ExcelJS.Workbook();
      await book.xlsx.readFile(target);
      const sheet = book.worksheets[0];
      const rows: any[] = [];
      sheet.eachRow((r) => rows.push(r.values));
      const total = rows.find((r) => r[1] === "Tổng");
      expect(total[3]).toBe(72000);
      exported.xlsx = total;
    } else {
      expect(fs.readFileSync(target).subarray(0, 4).toString()).toBe("%PDF");
      exported.pdfBytes = fs.statSync(target).size;
    }
    await expect(
      page.getByText("Xuất báo cáo thành công", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
  await page
    .getByRole("link", { name: "Báo cáo xuất – nhập – tồn", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Báo cáo xuất – nhập – tồn" }).first(),
  ).toBeVisible();
  await page.getByLabel("Từ ngày", { exact: true }).fill(date(today()));
  await page.getByLabel("Đến ngày", { exact: true }).fill(date(today()));
  await page.getByRole("button", { name: "Xem báo cáo", exact: true }).click();
  const row = page.locator("tbody tr").filter({ hasText: "Sữa Milo" });
  await expect(row).toBeVisible();
  const stock = (
    await one(
      "SELECT SUM(remaining) n FROM receipt_line WHERE product_id='SP0001'",
    )
  ).n;
  expect(await row.locator("td").nth(6).innerText()).toBe(String(stock));
  const before = await all("SELECT id,remaining FROM receipt_line ORDER BY id");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Báo cáo xuất – nhập – tồn" }).first(),
  ).toBeVisible();
  expect(
    await all("SELECT id,remaining FROM receipt_line ORDER BY id"),
  ).toEqual(before);
  fs.writeFileSync(
    "test-results/verification-reports.json",
    JSON.stringify(
      { revenue: 72000, exported, stock, persisted: true },
      null,
      2,
    ),
  );
});
