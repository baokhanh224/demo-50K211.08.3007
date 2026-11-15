import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { installTrustedTransport } from "./public-transport";

test("invoice detail matches reference and keeps close, return and print preview actions", async ({ page, context }) => {
  if (process.env.BASE_URL?.startsWith("https:")) await installTrustedTransport(context);
  const invoice = { id: "HD0001", created_at: "2026-11-04T02:30:00.000Z", customer_name: "Nguyễn Bảo Khanh", customer_phone: "0901234567", total: 174000, method: "Tiền mặt", status: "Đã thanh toán", cash: 200000, change: 26000,
    lines: [{ id: 1, product_name: "Sữa Milo", unit_name: "lốc", quantity: 2, price: 72000, total: 144000 }, { id: 2, product_name: "Mì ăn liền", unit_name: "gói", quantity: 3, price: 4000, total: 12000 }, { id: 3, product_name: "Bánh quy", unit_name: "gói", quantity: 2, price: 9000, total: 18000 }] };
  await page.route("**/api/detail?type=invoice&id=*", r => r.fulfill({ json: invoice }));
  let returns = 0;
  await page.route("**/api/action", async r => {
    if (r.request().postDataJSON()?.action !== "check-return") return r.fallback();
    returns++;
    await r.fulfill({ status: 400, json: { error: "Không thể đổi/trả hóa đơn này" } });
  });
  await page.setViewportSize({ width: 1440, height: 927 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeEnabled();
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".sidebar")).toBeVisible();
  await page.getByRole("link", { name: "Tra cứu lịch sử bán hàng", exact: true }).click();
  await expect(page.locator(".history-list-card tbody tr .btn").first()).toBeVisible();
  for (const button of await page.locator(".history-list-card tbody tr .btn").all()) await expect(button).toHaveCSS("opacity", "1");
  const open = () => page.locator(".history-list-card tbody tr").first().getByRole("button", { name: "Xem", exact: true }).click();
  await open();
  const dialog = page.getByRole("dialog", { name: "Chi tiết hóa đơn", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".invoice-detail-meta")).toContainText("Nguyễn Bảo Khanh (0901234567)");
  await expect(dialog.locator("thead th")).toHaveText(["Sản phẩm", "SL", "Đơn giá", "Thành tiền"]);
  await expect(dialog.locator("tbody tr")).toHaveCount(3);
  await expect(dialog.locator("tbody tr").last().locator("td").first()).toHaveCSS("border-bottom-width", "1px");
  await expect(dialog.locator(".invoice-detail-total")).toHaveText("Tổng tiền: 174.000đ");
  await expect(dialog.locator(".invoice-detail-summary")).toContainText("Trạng thái: Đã thanh toán");
  expect((await dialog.boundingBox())!.width).toBe(786);
  expect(await dialog.evaluate(e => e.scrollHeight <= e.clientHeight)).toBe(true);
  fs.mkdirSync("test-results/invoice-detail", { recursive: true });
  await page.screenshot({ path: "test-results/invoice-detail/detail.png" });
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click(); await expect(dialog).toHaveCount(0);
  await open(); await expect(dialog).toBeVisible(); await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
  await open(); await dialog.getByRole("button", { name: "Đổi/trả hàng", exact: true }).click();
  await expect(dialog).toContainText("Không thể đổi/trả hóa đơn này"); expect(returns).toBe(1);
  await dialog.getByRole("button", { name: "In hóa đơn", exact: true }).click();
  await expect(page.locator(".invoice-print-page")).toBeVisible();
  await expect(page.locator(".invoice-print-sheet")).toContainText("174.000đ");
});

test("history, cancellation and returns use the same invoice detail component", async ({ page, context }) => {
  if (process.env.BASE_URL?.startsWith("https:")) await installTrustedTransport(context);
  const invoice = { id:"HD0001",created_at:"2026-11-04T02:30:00.000Z",customer_name:"Nguyễn Bảo Khanh",customer_phone:"0901234567",total:18000,method:"Tiền mặt",status:"Đã thanh toán",cash:20000,change:2000,tickets:[],
    lines:[{id:1,product_id:"SP0001",product_name:"Sữa Milo",unit_name:"Hộp",quantity:1,price:18000,total:18000,allocations:[{id:1,receipt_id:"PN0001",lot_id:1,expiry:"2099-12-31",quantity:1,returned:0,restocked:0}]}] };
  await page.route("**/api/query", async r => {
    if(r.request().postDataJSON()?.scope!=="sales-history")return r.fallback();
    await r.fulfill({json:[invoice]});
  });
  await page.route("**/api/detail?type=invoice&id=*",r=>r.fulfill({json:invoice}));
  await page.route("**/api/action",async r=>{
    if(r.request().postDataJSON()?.action!=="check-cancel")return r.fallback();
    await r.fulfill({json:invoice});
  });
  await page.setViewportSize({width:1440,height:927});await page.goto("/");
  await expect(page.getByRole("button",{name:"Đăng nhập",exact:true})).toBeEnabled();
  await page.getByLabel("Tên đăng nhập",{exact:true}).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu",{exact:true}).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page.locator(".sidebar")).toBeVisible();
  for(const view of ["sales-history","cancel-invoice","returns"]){
    await page.goto("/?view="+view);
    await page.locator(".main tbody tr").first().click();
    const dialog=page.getByRole("dialog",{name:"Chi tiết hóa đơn",exact:true});
    await expect(dialog).toHaveClass(/invoice-detail/);
    expect((await dialog.boundingBox())!.width).toBe(786);
    await expect(dialog.locator(".invoice-detail-meta")).toContainText("HD0001");
    await expect(dialog.locator(".invoice-detail-table th")).toHaveText(["Sản phẩm","SL","Đơn giá","Thành tiền"]);
    await expect(dialog.locator(".invoice-detail-total")).toHaveText("Tổng tiền: 18.000đ");
    await expect(dialog.getByRole("button",{name:"Đổi/trả hàng",exact:true})).toBeVisible();
    await expect(dialog.getByRole("button",{name:"In hóa đơn",exact:true})).toBeVisible();
    if(view!=="sales-history"){
      await dialog.getByText("Phân bổ xuất kho",{exact:true}).click();
      await expect(dialog.locator(".invoice-detail-audit")).toContainText("PN0001");
      await dialog.getByText("Phân bổ xuất kho",{exact:true}).click();
    }
    if(view==="cancel-invoice"){
      await dialog.getByRole("button",{name:"Hủy",exact:true}).click();
      const reason=page.getByRole("dialog",{name:"Nhập lý do hủy hóa đơn",exact:true});
      await expect(reason).toBeVisible();await reason.getByRole("button",{name:"Quay lại",exact:true}).click();
      await expect(reason).toHaveCount(0);await expect(dialog).toBeVisible();
    }
    await dialog.getByRole("button",{name:"Đóng",exact:true}).click();await expect(dialog).toHaveCount(0);
  }
});
