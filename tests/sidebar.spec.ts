import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test('Shared sidebar: fixed geometry and icons across every page, stable expanded menus and pinned logout',async({page})=>{
 await page.setViewportSize({width:1440,height:927});await page.goto('/');await page.getByLabel('Tên đăng nhập',{exact:true}).fill(process.env.DEMO_USERNAME!);await page.getByLabel('Mật khẩu',{exact:true}).fill(process.env.DEMO_PASSWORD!);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page.locator('.sidebar')).toBeVisible();
 const views=['sale','products','customers','suppliers','receipts','inventory','adjustments','receipt-history','sales-history','cancel-invoice','returns','reports','stock-report','settings'];let reference:any;
 for(const view of views){
  await page.goto('/?view='+view);await expect(page.locator('.app-sidebar')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const snapshot=await page.locator('.app-sidebar').evaluate(el=>{
   const box=el.getBoundingClientRect();const groups=Array.from(el.querySelectorAll(':scope>nav>.nav-group'));return {width:box.width,x:box.x,top:box.y,items:Array.from(el.querySelectorAll('.nav-item')).map((n:any,index:number)=>{const offset=groups.slice(0,index).reduce((sum,g)=>{const sub=g.querySelector('.subnav');return sum+(sub?sub.getBoundingClientRect().height+8:0)},0);const b=n.getBoundingClientRect(),img=n.querySelector(':scope>.icon'),ib=img.getBoundingClientRect(),label=n.querySelector('span:not(.chevron)'),lb=label.getBoundingClientRect();return {x:b.x,y:b.y-offset,width:b.width,height:b.height,icon:img.getAttribute('src'),ix:ib.x,iy:ib.y-offset,iw:ib.width,ih:ib.height,labelX:lb.x,font:getComputedStyle(n).fontSize}}),logout:(()=>{const b=el.querySelector('.sidebar-bottom')!.getBoundingClientRect();return {x:b.x,y:b.y,height:b.height}})()};
  });
  if(reference)expect(snapshot,view).toEqual(reference);else reference=snapshot;
  expect(await page.locator('.main').evaluate(el=>getComputedStyle(el).marginLeft)).toBe('250px');
 }
 // Keep an expanded sales group in place while moving between single-level pages.
 await page.goto('/?view=sale');await expect(page.locator('.app-sidebar .subnav')).toBeVisible();
 const before=await page.getByRole('link',{name:'Quản lý sản phẩm',exact:true}).boundingBox();await page.getByRole('link',{name:'Quản lý sản phẩm',exact:true}).click();await expect(page.locator('.app-sidebar .subnav')).toBeVisible();const after=await page.getByRole('link',{name:'Quản lý sản phẩm',exact:true}).boundingBox();expect(after).toEqual(before);
 await page.getByRole('link',{name:'Quản lý khách hàng',exact:true}).click();await expect(page.locator('.app-sidebar .subnav')).toBeVisible();
 await page.setViewportSize({width:1440,height:600});const footer=await page.locator('.sidebar-bottom').boundingBox();await page.locator('.app-sidebar>nav').evaluate(el=>el.scrollTop=el.scrollHeight);expect(await page.locator('.sidebar-bottom').boundingBox()).toEqual(footer);expect(footer!.y+footer!.height).toBeLessThanOrEqual(600);
 fs.mkdirSync('test-results/sidebar',{recursive:true});await page.screenshot({path:'test-results/sidebar/short-height.png'});await page.setViewportSize({width:1440,height:927});await page.screenshot({path:'test-results/sidebar/unified.png'});
});
