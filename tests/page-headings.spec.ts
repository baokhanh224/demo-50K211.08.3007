import { test, expect } from "@playwright/test";
import { installTrustedTransport } from "./public-transport";

test("screen headings share font and inset and scroll with content", async ({ page, context }) => {
  if(process.env.BASE_URL?.startsWith("https:"))await installTrustedTransport(context);
  await page.setViewportSize({width:1440,height:927});await page.goto("/");
  await expect(page.getByRole("button",{name:"Đăng nhập",exact:true})).toBeEnabled();
  await page.getByLabel("Tên đăng nhập",{exact:true}).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu",{exact:true}).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page.locator(".sidebar")).toBeVisible();
  const views=["sale","products","customers","suppliers","receipts","inventory","adjustments","receipt-history","sales-history","cancel-invoice","returns","reports","stock-report","settings"];
  for(const view of views){
    await page.goto("/?view="+view);const heading=page.locator(".main h1");await expect(heading).toBeVisible();
    expect(await heading.boundingBox(),view).toMatchObject({x:274,y:114,height:27});
    await expect(heading).toHaveCSS("font-size","22px");await expect(heading).toHaveCSS("font-weight","700");await expect(heading).toHaveCSS("position","static");
  }
  const heading=page.locator(".main h1"),original=(await heading.boundingBox())!;
  await page.locator(".main").evaluate(el=>(el as HTMLElement).style.minHeight="1600px");
  await page.evaluate(()=>window.scrollTo(0,300));await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(300);
  expect((await heading.boundingBox())!.y).toBe(original.y-300);
  expect((await page.locator(".header").boundingBox())!.y).toBe(0);
  expect((await page.locator(".sidebar").boundingBox())!.y).toBe(90);
  await page.evaluate(()=>window.scrollTo(0,0));await page.setViewportSize({width:800,height:927});
  expect(await heading.boundingBox()).toMatchObject({x:244,y:98,height:27});
  await page.goto("/?view=stock-report");await expect(heading).toBeVisible();
  await page.setViewportSize({width:480,height:927});
  const small=(await heading.boundingBox())!,filter=(await page.locator(".report-filter-card").boundingBox())!;
  expect(small.y+small.height).toBeLessThanOrEqual(filter.y);
});
