import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { installTrustedTransport } from "./public-transport";

test("revenue and profit charts have readable axes, aligned days and contained negative values", async ({ page, context }) => {
  if (process.env.BASE_URL?.startsWith("https:")) await installTrustedTransport(context);
  let dense = false;
  const revenue = [48000,272000,112000,4000,-36000,288000], cost = [31000,201000,80000,3000,-27000,218497];
  const trend = revenue.map((value,i) => ({ day: `2026-11-${String([9,10,11,12,14,15][i]).padStart(2,"0")}`, revenue:value,cost:cost[i] }));
  await page.route("**/api/report", async route => {
    const d = route.request().postDataJSON();
    const rows = dense ? Array.from({length:30},(_,i)=>({day:`2026-10-${String(i+1).padStart(2,"0")}`,revenue:revenue[i%6],cost:cost[i%6]})) : trend;
    await route.fulfill({ json: { type:d.type,hasData:true,filters:{from:d.from,to:d.to},summary:{revenue:688000,cost:506497,profit:181503,invoices:10},trend:rows,
      sections:[{title:"Doanh thu theo ngày",columns:["Ngày","Doanh thu thuần"],rows:rows.map(r=>[r.day,r.revenue]),total:["Tổng cộng",688000]}] } });
  });
  await page.setViewportSize({width:1440,height:927});await page.goto("/");
  await expect(page.getByRole("button",{name:"Đăng nhập",exact:true})).toBeEnabled();
  await page.getByLabel("Tên đăng nhập",{exact:true}).fill(process.env.DEMO_USERNAME!);
  await page.getByLabel("Mật khẩu",{exact:true}).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page.locator(".sidebar")).toBeVisible();
  await page.getByRole("link",{name:"Báo cáo thống kê",exact:true}).click();
  const choose=async(type:string)=>{await page.getByRole("button",{name:"Loại báo cáo",exact:true}).click();await page.getByRole("option",{name:type,exact:true}).click();await page.getByRole("button",{name:"7 ngày qua",exact:true}).click();await page.getByRole("button",{name:"Xem báo cáo",exact:true}).click();await expect(page.locator(".report-chart-card")).toBeVisible();};
  const chart=page.locator(".report-chart-card");
  await choose("Doanh thu");
  await expect(chart.locator(".report-chart-axis span")).toHaveText(["300.000","200.000","100.000","0","-100.000"]);
  const contained=await chart.evaluate(el=>{const card=el.getBoundingClientRect(),plot=el.querySelector('.report-plot')!.getBoundingClientRect();return [...el.querySelectorAll('.report-chart-axis span')].every(n=>{const b=n.getBoundingClientRect();return b.left>=card.left&&b.right<plot.left&&b.top>=card.top&&b.bottom<=card.bottom;});});expect(contained).toBe(true);
  const offsets=await chart.evaluate(el=>{const points=[...el.querySelectorAll('.report-revenue-point')],days=[...el.querySelectorAll('.report-chart-day')];return points.map((p,i)=>{const a=p.getBoundingClientRect(),b=days[i].getBoundingClientRect();return Math.abs(a.x+a.width/2-b.x-b.width/2);});});expect(offsets.every(v=>v<1)).toBe(true);
  fs.mkdirSync('test-results/report-chart',{recursive:true});await page.screenshot({path:'test-results/report-chart/revenue.png',fullPage:true});
  await choose("Lợi nhuận");await expect(chart.locator('.report-chart-bar')).toHaveCount(12);
  const negatives=await chart.evaluate(el=>{const zero=el.querySelector('.report-zero')!.getBoundingClientRect(),plot=el.querySelector('.report-plot')!.getBoundingClientRect();return [...el.querySelectorAll('[data-negative=true]')].every(n=>{const b=n.getBoundingClientRect();return Math.abs(b.top-zero.top)<1&&b.bottom<=plot.bottom+1;});});expect(negatives).toBe(true);
  await expect(page.getByTestId('report-revenue')).toHaveText('688.000đ');await page.screenshot({path:'test-results/report-chart/profit.png',fullPage:true});
  dense=true;await choose('Doanh thu');await expect(chart.locator('.report-revenue-point')).toHaveCount(30);
  for(const width of [1440,640]){await page.setViewportSize({width,height:927});const labels=await chart.locator('.report-chart-day > span').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).visibility==='visible').map(n=>{const b=n.getBoundingClientRect();return {left:b.left,right:b.right};}));expect(labels.length).toBeLessThanOrEqual(8);for(let i=1;i<labels.length;i++)expect(labels[i].left).toBeGreaterThanOrEqual(labels[i-1].right);}
});
