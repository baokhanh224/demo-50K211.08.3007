import { test, expect } from "@playwright/test";
// Explicit opt-in only: performs demo writes on the public website without reset.
let qaPage: any;
async function remote(path: string, data?: any) {
 return qaPage.evaluate(async ({path,data}:any) => {
  const r=await fetch('/api/'+path,{method:data===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  const d=await r.json();if(!r.ok)throw new Error(d.error);return d;
 },{path,data});
}
async function all(sql: string) {
 if(sql.includes('SELECT id,remaining FROM receipt_line'))return (await remote('query',{scope:'adjustments'})).map((r:any)=>({id:r.id,remaining:r.remaining})).sort((a:any,b:any)=>a.id-b.id);
 if(sql.includes('SELECT a.* FROM allocation')){
  const id=(await remote('query',{scope:'sales-history'})).map((r:any)=>r.id).sort().at(-1);
  return (await remote('detail?type=invoice&id='+id)).lines.flatMap((l:any)=>l.allocations);
 }
 throw new Error('Unsupported QA read');
}
async function one(sql: string) {
 if(sql.includes('COUNT(*) n FROM invoice'))return {n:(await remote('query',{scope:'sales-history'})).length};
 throw new Error('Unsupported QA read');
}
import { datePlus } from "../lib/db";
import { date } from "../lib/format";
import fs from "node:fs";
import { installTrustedTransport } from "./public-transport";
// Chạy sau npm run db:seed trên CSDL demo riêng. Tất cả thao tác ghi đi qua giao diện.
test("Public: nhập, bán, hủy, trả không nhập kho và tải lại", async ({ page, context }) => {
  test.skip(process.env.PUBLIC_QA !== '1', 'Chỉ chạy khi chủ website cho phép');
  qaPage=page;
  await installTrustedTransport(context);
  const count = async () => (await one("SELECT COUNT(*) n FROM invoice")).n;
  const stocks = async () =>
    await all("SELECT id,remaining FROM receipt_line ORDER BY id");
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập").fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tạo giao dịch bán hàng" }),
  ).toBeVisible();
  const oldInvoices=await remote('query',{scope:'sales-history'});
  const oldReceipts=await remote('query',{scope:'receipt-history'});
  const next=(prefix:string,rows:any[])=>prefix+String(Math.max(0,...rows.map(r=>Number(r.id.slice(2))))+1).padStart(4,'0');
  const receiptCode=next('PN',oldReceipts),saleCode=next('HD',oldInvoices);
  const secondCode='HD'+String(Number(saleCode.slice(2))+1).padStart(4,'0');
  await page
    .getByRole("link", { name: "Quản lý tồn kho", exact: true })
    .click();
  await page.getByLabel("Nhà cung cấp", { exact: true }).selectOption("NCC001");
  await page.getByLabel("Tìm kiếm sản phẩm", { exact: true }).fill("Sữa Milo");
  await page.getByRole("button", { name: /Sữa Milo.*SP0001/ }).click();
  for (const [index, [quantity, days]] of [
    [5, 1],
    [5, 2],
  ].entries()) {
    await page
      .getByLabel("Số lượng nhập", { exact: true })
      .fill(String(quantity));
    await page.getByLabel("Giá nhập", { exact: true }).fill("13000");
    await page
      .getByLabel("Hạn sử dụng", { exact: true })
      .fill(date(datePlus(days)));
    await page
      .getByRole("button", { name: "Thêm sản phẩm", exact: true })
      .click();
    await expect(
      page.locator("tbody tr"),
    ).toHaveCount(index + 1);
  }
  await page
    .getByRole("button", { name: "Lưu phiếu nhập", exact: true })
    .click();
  await expect(
    page.getByText("Nhập hàng thành công", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Lịch sử nhập hàng", exact: true })
    .click();
  await page.getByRole("cell", { name: receiptCode, exact: true }).click();
  await expect(page.locator("section").last().locator("tbody tr")).toHaveCount(
    2,
  );
  await page.screenshot({
    path: "test-results/01-nhap-hang.png",
    fullPage: true,
  });
  const beforeSale = await stocks();
  const beforeCount = await count();
  await page.getByRole("link", { name: "Bán hàng", exact: true }).click();
  await page
    .getByLabel("Tìm kiếm sản phẩm", { exact: true })
    .fill("8934588012345");
  await page.getByRole("button", { name: /Sữa Milo.*SP0001/ }).click();
  await page
    .getByLabel("Đơn vị bán", { exact: true })
    .selectOption({ label: "Lốc" });
  await page.getByLabel("Số lượng bán", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Hoàn tất chọn sản phẩm", exact: true })
    .click();
  await page.getByLabel("Tiền khách đưa", { exact: true }).fill("100000");
  await page
    .getByRole("button", { name: "Hoàn tất thanh toán", exact: true })
    .click();
  await expect(
    page.getByText("Tiền khách đưa chưa đủ để thanh toán", { exact: true }),
  ).toBeVisible();
  expect(await count()).toBe(beforeCount);
  await page.getByLabel("Tiền khách đưa", { exact: true }).fill("200000");
  const settings = await context.newPage();
  await settings.goto("/?view=settings");
  await settings.getByLabel("Buộc lỗi lưu một lần", { exact: true }).check();
  await expect(
    settings.getByLabel("Buộc lỗi lưu một lần", { exact: true }),
  ).not.toBeDisabled();
  await expect(
    settings.getByLabel("Buộc lỗi lưu một lần", { exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Hoàn tất thanh toán", exact: true })
    .click();
  await expect(
    page.getByText("Không thể lưu giao dịch. Hãy thử lại", { exact: true }),
  ).toBeVisible();
  expect(await count()).toBe(beforeCount);
  expect(await stocks()).toEqual(beforeSale);
  await settings.close();
  await page
    .getByRole("button", { name: "Hoàn tất thanh toán", exact: true })
    .dblclick();
  await expect(
    page.getByText("Bán hàng thành công", { exact: true }),
  ).toBeVisible();
  expect(await count()).toBe(beforeCount + 1);
  const allocations = (await all(
    "SELECT a.* FROM allocation a JOIN invoice_line l ON l.id=a.invoice_line_id WHERE l.invoice_id='HD0004'",
  )) as any[];
  expect(allocations).toHaveLength(2);
  expect(allocations.reduce((s, a) => s + a.quantity, 0)).toBe(8);
  await page.screenshot({
    path: "test-results/02-ban-hang.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Xem hóa đơn", exact: true }).click();
  await page.getByRole("dialog", { name: "Chi tiết hóa đơn" }).waitFor();
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Nhập lý do hủy hóa đơn" })
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await expect(
    page.getByText("Vui lòng nhập lý do hủy hóa đơn", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Lý do hủy hóa đơn", { exact: true })
    .fill("Nhập nhầm số lượng khi trình diễn");
  await page
    .getByRole("dialog", { name: "Nhập lý do hủy hóa đơn" })
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await expect(
    page.getByText("Hủy hóa đơn thành công", { exact: true }),
  ).toBeVisible();
  expect(await stocks()).toEqual(beforeSale);
  await page.getByRole("button", { name: "Đóng", exact: true }).last().click();
  await page
    .getByRole("link", { name: "Bán hàng", exact: true })
    .click();
  await page.getByLabel("Tìm kiếm sản phẩm", { exact: true }).fill("Sữa Milo");
  await page.getByRole("button", { name: /Sữa Milo.*SP0001/ }).click();
  await page.getByLabel("Số lượng bán", { exact: true }).fill("6");
  await page
    .getByRole("button", { name: "Hoàn tất chọn sản phẩm", exact: true })
    .click();
  await page
    .getByLabel("Tra cứu khách hàng", { exact: true })
    .fill("0901234567");
  await page.getByRole("button", { name: "Tra cứu", exact: true }).click();
  await expect(page.getByText(/Nguyễn Bảo Khanh · KH0001/)).toBeVisible();
  await page.getByLabel("Tiền khách đưa", { exact: true }).fill("200000");
  await page
    .getByRole("button", { name: "Hoàn tất thanh toán", exact: true })
    .click();
  await expect(
    page.getByText("Bán hàng thành công", { exact: true }),
  ).toBeVisible();
  const afterSale = await stocks();
  await page.getByRole("button", { name: "Xem hóa đơn", exact: true }).click();
  await page.getByRole("button", { name: "Đổi/trả hàng", exact: true }).click();
  await page.getByLabel("Chọn trả Sữa Milo", { exact: true }).check();
  await page.getByLabel("Số lượng trả Sữa Milo", { exact: true }).fill("2");
  await page
    .getByLabel("Nhập kho Sữa Milo", { exact: true })
    .selectOption("no");
  await page.getByLabel("Chỉ trả hàng", { exact: true }).check();
  await page
    .getByRole("button", { name: "Hoàn tất đổi/trả", exact: true })
    .click();
  await expect(
    page.getByText("Vui lòng xác nhận đã xử lý tiền chênh lệch", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Đã hoàn tiền", { exact: true }).check();
  await page.screenshot({
    path: "test-results/03-tra-hang.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Hoàn tất đổi/trả", exact: true })
    .click();
  await expect(
    page.getByText("Xử lý đổi/trả hàng thành công", { exact: true }),
  ).toBeVisible();
  expect(await stocks()).toEqual(afterSale);
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(
    page.getByText(
      "Hóa đơn có giao dịch đổi/trả hàng, không thể hủy trực tiếp",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đổi/trả hàng", exact: true }).click();
  const remaining = page
    .locator("tbody tr")
    .filter({ hasText: "Sữa Milo" })
    .first();
  await expect(
    remaining.getByRole("cell", { name: "4", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await page.getByRole("button", { name: "Đóng", exact: true }).last().click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Tra cứu lịch sử bán hàng" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: secondCode, exact: true }),
  ).toBeVisible();
  fs.writeFileSync(
    "test-results/verification-stage3.json",
    JSON.stringify(
      {
        receipt: receiptCode,
        cancelledInvoice: saleCode,
        partialReturnInvoice: secondCode,
        returnAmount: 36000,
        saleSources: allocations,
        afterSaleStock: afterSale,
        afterReturnStock: await stocks(),
        passed: true,
      },
      null,
      2,
    ),
  );
});
