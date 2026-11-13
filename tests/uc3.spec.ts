import { test, expect } from "@playwright/test";
import { installTrustedTransport } from "./public-transport";
import fs from "node:fs";
import ExcelJS from "exceljs";
import { date, today } from "../lib/format";
const origin = process.env.BASE_URL || "http://localhost:3000";
const out =
  "test-results/uc3-" + (origin.startsWith("https:") ? "public" : "local");
test("UC3: bộ lọc, bốn kết quả, hủy xuất và tổng Excel/PDF", async ({
  browser,
}) => {
  test.skip(
    origin.startsWith("https:") && process.env.PUBLIC_QA !== "1",
    "Kiểm tra public cần PUBLIC_QA=1",
  );
  fs.mkdirSync("test-results", { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  if (origin.startsWith("https:")) await installTrustedTransport(context);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin);
  await page
    .getByLabel("Tên đăng nhập", { exact: true })
    .fill(process.env.DEMO_USERNAME!);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page
    .getByRole("link", { name: "Báo cáo thống kê", exact: true })
    .click();
  await expect(
    page.getByText(
      "Chọn loại báo cáo và tiêu chí lọc, sau đó nhấn “Xem báo cáo”.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Xuất báo cáo", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: out + "-idle.png" });
  const chip = await page
    .getByRole("button", { name: "Hôm nay", exact: true })
    .evaluate((e) => ({
      radius: getComputedStyle(e).borderRadius,
      box: e.getBoundingClientRect().toJSON(),
    }));
  expect(chip.radius).toBe("16px");
  const choose = async (x: string) => {
    await page
      .getByRole("button", { name: "Loại báo cáo", exact: true })
      .click();
    await page.getByRole("option", { name: x, exact: true }).click();
  };
  await page.getByRole("button", { name: "Loại báo cáo", exact: true }).click();
  await page.screenshot({ path: out + "-type-menu.png" });
  await page.getByRole("option", { name: "Doanh thu", exact: true }).click();
  const from = page.getByLabel("Từ ngày", { exact: true }),
    to = page.getByLabel("Đến ngày", { exact: true });
  await from.fill("01/01/2020");
  await to.fill(date(today()));
  const view = async () => {
    const [r] = await Promise.all([
      page.waitForResponse((r) => new URL(r.url()).pathname === "/api/report"),
      page.getByRole("button", { name: "Xem báo cáo", exact: true }).click(),
    ]);
    return r.json();
  };
  const revenue = await view();
  await expect(page.getByTestId("report-revenue")).toBeVisible();
  await page.screenshot({ path: out + "-revenue.png" });
  const heading = await page.locator(".report-page-heading").boundingBox(),
    exportBox = await page
      .getByRole("button", { name: "Xuất báo cáo", exact: true })
      .boundingBox();
  expect(exportBox).not.toBeNull();
  expect(heading).not.toBeNull();
  expect(exportBox!.y).toBe(heading!.y);
  const productButton = page.getByRole("button", {
    name: "Sản phẩm / nhóm sản phẩm (không bắt buộc)",
    exact: true,
  });
  await productButton.click();
  await page.screenshot({ path: out + "-product-menu.png" });
  await page
    .getByRole("dialog", { name: "Chọn sản phẩm / nhóm sản phẩm" })
    .getByRole("button", { name: "Áp dụng", exact: true })
    .click();
  await choose("Lợi nhuận");
  const profit = await view();
  await expect(page.locator(".profit-stats .report-stat")).toHaveCount(3);
  await expect(
    page.getByText("Doanh thu thuần và giá vốn theo ngày", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: out + "-profit.png" });
  await choose("Sản phẩm bán chạy/chậm");
  const ranking = await view();
  const radioBox = await page
    .getByRole("radio", { name: "Số lượng bán thuần", exact: true })
    .boundingBox();
  expect(radioBox?.width).toBe(16);
  expect(radioBox?.height).toBe(16);
  await expect(page.locator(".report-ranking-card")).toHaveCount(2);
  const cols = await page
    .locator(".report-ranking-card")
    .evaluateAll((a) => a.map((e) => e.getBoundingClientRect().toJSON()));
  expect(cols[0].y).toBe(cols[1].y);
  expect(cols[1].x).toBeGreaterThan(cols[0].x + cols[0].width);
  await page.screenshot({ path: out + "-rank-quantity.png" });
  await page
    .getByRole("radio", { name: "Doanh thu thuần", exact: true })
    .check();
  const rankRevenue = await view();
  await expect(
    page.getByRole("columnheader", { name: "Doanh thu thuần ↓", exact: true }),
  ).toBeVisible();
  expect(rankRevenue.sections[1].rows).toEqual(ranking.sections[1].rows);
  if (rankRevenue.sections[0].rows.length) {
    const first = page
      .locator(".report-ranking-card")
      .first()
      .locator("tbody tr")
      .first();
    await expect(first.locator("td").nth(3)).toHaveCSS("font-weight", "600");
    await expect(first.locator("td").first()).toHaveCSS("text-align", "left");
  }
  await page.screenshot({ path: out + "-rank-revenue.png" });
  await page
    .getByRole("link", { name: "Báo cáo xuất – nhập – tồn", exact: true })
    .click();
  await expect(
    page.getByText("Chọn khoảng thời gian, sau đó nhấn “Xem báo cáo”.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({ path: out + "-stock-idle.png" });
  await from.fill("01/01/2020");
  await to.fill(date(today()));
  const stock = await view();
  await expect(page.locator(".stock-stats .report-stat")).toHaveCount(5);
  await page.screenshot({ path: out + "-stock.png" });
  const exported: Record<string, any> = {};
  for (const format of ["xlsx", "pdf"]) {
    await page
      .getByRole("button", { name: "Xuất báo cáo", exact: true })
      .click();
    const modal = page.getByRole("dialog", {
      name: "Xuất báo cáo",
      exact: true,
    });
    await expect(
      modal.getByText("Nội dung sẽ xuất", { exact: true }),
    ).toHaveCount(0);
    await expect(
      modal.getByText("Định dạng được hỗ trợ", { exact: true }),
    ).toHaveCount(0);
    await expect(
      modal.getByText(
        "Chọn định dạng tệp. Nội dung xuất gồm loại báo cáo, tiêu chí lọc và số liệu đang hiển thị.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      modal.getByRole("radio", { name: "Excel (.xlsx)", exact: true }),
    ).toBeChecked();
    await page.screenshot({ path: out + "-export-formats.png" });
    await modal
      .getByRole("radio", {
        name: format === "xlsx" ? "Excel (.xlsx)" : "PDF (.pdf)",
        exact: true,
      })
      .check();
    await page.screenshot({ path: out + "-export-preview-" + format + ".png" });
    if (format === "xlsx") {
      await modal.getByRole("button", { name: "Hủy", exact: true }).click();
      await expect(
        page.getByRole("dialog", { name: "Xác nhận", exact: true }),
      ).toBeVisible();
      await page.screenshot({ path: out + "-export-confirm.png" });
      await page.getByRole("button", { name: "Quay lại", exact: true }).click();
      await expect(
        modal.getByRole("radio", { name: "Excel (.xlsx)", exact: true }),
      ).toBeChecked();
    }
    const wait = page.waitForEvent("download");
    await modal
      .getByRole("button", { name: "Xuất báo cáo", exact: true })
      .click();
    const download = await wait;
    const target = out + "." + format;
    await download.saveAs(target);
    exported[format] = {
      filename: download.suggestedFilename(),
      bytes: fs.statSync(target).size,
    };
    expect(exported[format].bytes).toBeGreaterThan(1000);
    await expect(
      page.getByRole("dialog", {
        name: "Xuất báo cáo thành công",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({ path: out + "-export-success-" + format + ".png" });
    await page.keyboard.press("Escape");
  }
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(out + ".xlsx");
  const rows: any[] = [];
  book.worksheets[0].eachRow((r) => rows.push(r.values));
  const total = rows.find((r) => r[1] === "Tổng");
  expect(total.slice(1)).toEqual(stock.sections[0].total);
  let totalCurrencyFormat = "";
  book.worksheets[0].eachRow((r) => {
    if (r.getCell(1).value === "Tổng")
      totalCurrencyFormat = r.getCell(8).numFmt;
  });
  expect(totalCurrencyFormat).toBe('#,##0"đ"');
  expect(
    fs
      .readFileSync(out + ".pdf")
      .subarray(0, 4)
      .toString(),
  ).toBe("%PDF");
  await from.fill(date(new Date(Date.now() + 86400000).toISOString()));
  await to.fill(date(today()));
  const invalid = await view();
  expect(invalid.error).toBe("Khoảng thời gian hoặc tiêu chí lọc không hợp lệ");
  await expect(
    page.getByText("Không vượt quá ngày hiện tại", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Không nhỏ hơn Từ ngày", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: out + "-invalid.png" });
  await from.fill("01/01/2000");
  await to.fill("02/01/2000");
  const empty = await view();
  expect(empty.hasData).toBe(false);
  await expect(
    page.getByText("Không có dữ liệu phù hợp", { exact: true }),
  ).toBeVisible();
  const missingImages = () =>
    page
      .locator(".reports-page img,.sidebar img")
      .evaluateAll((a) =>
        a
          .filter(
            (n) =>
              !(n as HTMLImageElement).complete ||
              !(n as HTMLImageElement).naturalWidth,
          )
          .map((n) => (n as HTMLImageElement).src),
      );
  await expect.poll(missingImages).toEqual([]);
  const missing = await missingImages();
  await page.screenshot({ path: out + "-empty.png" });
  expect(errors).toEqual([]);
  const result = {
    origin,
    chip,
    heading,
    exportBox,
    cols,
    revenue: revenue.summary,
    profit: profit.summary,
    rankRows: ranking.sections.map((s: any) => s.rows.length),
    rankRevenueColumns: rankRevenue.sections.map((s: any) => s.columns),
    stockTotal: stock.sections[0].total,
    exported,
    excelTotal: total.slice(1),
    invalid: invalid.error,
    empty: true,
    missing,
    errors,
  };
  fs.writeFileSync(out + ".json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  await context.close();
});

test("UC3: chọn nhiều tiêu chí, lịch, xử lý một lần và các ngoại lệ xuất", async ({
  page,
  context,
}) => {
  test.skip(
    origin.startsWith("https:") && process.env.PUBLIC_QA !== "1",
    "Kiểm tra public cần PUBLIC_QA=1",
  );
  if (origin.startsWith("https:")) await installTrustedTransport(context);
  await page.goto("/");
  await page
    .getByLabel("Tên đăng nhập", { exact: true })
    .fill(process.env.DEMO_USERNAME!);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page
    .getByRole("link", { name: "Báo cáo thống kê", exact: true })
    .click();
  await page.getByRole("button", { name: "Loại báo cáo", exact: true }).click();
  await page.getByRole("option", { name: "Doanh thu", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Sản phẩm / nhóm sản phẩm (không bắt buộc)",
      exact: true,
    })
    .click();
  const choices = page.getByRole("dialog", {
    name: "Chọn sản phẩm / nhóm sản phẩm",
    exact: true,
  });
  const cb = choices.locator(".report-options input[type=checkbox]");
  await cb.nth(1).check();
  await cb.last().check();
  await choices.getByRole("button", { name: "Áp dụng", exact: true }).click();
  const from = page.getByLabel("Từ ngày", { exact: true }),
    to = page.getByLabel("Đến ngày", { exact: true });
  await from.fill("01/01/2020");
  await to.fill(date(today()));
  let reportRequests = 0;
  await page.route("**/api/report", async (route) => {
    reportRequests++;
    await new Promise((r) => setTimeout(r, 1500));
    await route.fallback();
  });
  const view = page.getByRole("button", { name: "Xem báo cáo", exact: true });
  const response = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/report",
  );
  await view.evaluate((el: HTMLButtonElement) => {
    el.click();
    el.click();
  });
  await expect(
    page.getByRole("button", { name: "Đang xử lý...", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Đang kiểm tra tiêu chí lọc và truy xuất dữ liệu báo cáo...",
      { exact: true },
    ),
  ).toBeVisible();
  await page.screenshot({ path: out + "-loading.png" });
  const r = await response;
  expect(r.request().postDataJSON().products).toHaveLength(1);
  expect(r.request().postDataJSON().categories).toHaveLength(1);
  expect(reportRequests).toBe(1);
  await page.unroute("**/api/report");
  await page
    .getByRole("button", {
      name: "Sản phẩm / nhóm sản phẩm (không bắt buộc)",
      exact: true,
    })
    .click();
  await choices
    .getByRole("button", { name: "Bỏ chọn tất cả", exact: true })
    .click();
  await choices.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await to.fill("03/11/2026");
  await from.fill("28/10/2026");
  await to.click();
  const cal = page.getByRole("dialog", { name: "Lịch đến ngày" });
  await expect(cal).toBeVisible();
  await expect(cal.locator(".report-calendar-days button")).toHaveCount(42);
  await expect(
    cal.getByRole("button", { name: "28/10/2026", exact: true }),
  ).toHaveClass(/endpoint/);
  await expect(
    cal.getByRole("button", { name: "03/11/2026", exact: true }),
  ).toHaveClass(/endpoint/);
  await expect(
    cal.getByRole("button", { name: "02/11/2026", exact: true }),
  ).toHaveClass(/between/);
  await page.screenshot({ path: out + "-calendar.png" });
  await page.keyboard.press("Escape");
  for (const label of [
    "Hôm nay",
    "Hôm qua",
    "7 ngày qua",
    "Tháng này",
    "Tháng trước",
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(from).not.toHaveValue("");
    await expect(to).not.toHaveValue("");
  }
  await from.fill("01/01/2020");
  await to.fill(date(today()));
  async function toggle(label: string) {
    const settings = await context.newPage();
    await settings.goto(origin + "/?view=settings");
    const flag = settings.getByRole("checkbox", { name: label, exact: true });
    await expect(flag).not.toBeChecked();
    await Promise.all([
      settings.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === "/api/action" &&
          r.request().method() === "POST",
      ),
      flag.check(),
    ]);
    await settings.close();
  }
  await toggle("Buộc lỗi tải dữ liệu một lần");
  await view.click();
  await expect(
    page.getByText("Không thể tải báo cáo. Vui lòng thử lại", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: out + "-load-error.png" });
  await view.click();
  await expect(page.getByTestId("report-revenue")).toBeVisible();
  for (const [flag, message] of [
    [
      "Buộc lỗi truy xuất dữ liệu xuất báo cáo một lần",
      "Không thể xuất báo cáo, vui lòng thử lại",
    ],
    [
      "Buộc lỗi tạo tệp báo cáo một lần",
      "Xuất báo cáo không thành công, vui lòng thử lại",
    ],
  ]) {
    await page
      .getByRole("button", { name: "Xuất báo cáo", exact: true })
      .click();
    const modal = page.getByRole("dialog", {
      name: "Xuất báo cáo",
      exact: true,
    });
    await modal
      .getByRole("radio", { name: "Excel (.xlsx)", exact: true })
      .check();
    await toggle(flag);
    await modal
      .getByRole("button", { name: "Xuất báo cáo", exact: true })
      .click();
    const failed = page.getByRole("dialog", { name: message, exact: true });
    await expect(failed).toBeVisible();
    await page.screenshot({
      path:
        out +
        (flag.includes("truy xuất")
          ? "-export-read-error"
          : "-export-file-error") +
        ".png",
    });
    if (flag.includes("tạo tệp")) {
      const download = page.waitForEvent("download");
      await failed
        .getByRole("button", { name: "Thực hiện lại", exact: true })
        .click();
      await download;
      await expect(
        page.getByRole("dialog", {
          name: "Xuất báo cáo thành công",
          exact: true,
        }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    } else
      await failed.getByRole("button", { name: "Đóng", exact: true }).click();
  }
  await page.getByRole("button", { name: "Xuất báo cáo", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Xuất báo cáo", exact: true })
    .getByRole("button", { name: "Hủy", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Xác nhận", exact: true })
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("report-revenue")).toBeVisible();
  const stockBefore = await page.evaluate(async () => {
    const r = await fetch("/api/bootstrap");
    return (await r.json()).products.map((p: any) => ({
      id: p.id,
      stock: p.stock,
    }));
  });
  await page.reload();
  await expect(
    page.getByText(
      "Chọn loại báo cáo và tiêu chí lọc, sau đó nhấn “Xem báo cáo”.",
      { exact: true },
    ),
  ).toBeVisible();
  const stockAfter = await page.evaluate(async () => {
    const r = await fetch("/api/bootstrap");
    return (await r.json()).products.map((p: any) => ({
      id: p.id,
      stock: p.stock,
    }));
  });
  expect(stockAfter).toEqual(stockBefore);
});
