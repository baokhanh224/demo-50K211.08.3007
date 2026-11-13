import {test,expect} from '../frontend/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
test('DOM geometry, text, icons and styles match the reference Next.js release',async({browser})=>{
 test.skip(!process.env.REFERENCE_URL,'Set REFERENCE_URL to the preserved reference release');
 const pages=[];
 for(const url of [process.env.REFERENCE_URL,process.env.BASE_URL||'http://localhost:8100']){
  const context=await browser.newContext({viewport:{width:1440,height:927}});const page=await context.newPage();await page.goto(url);await page.getByLabel('Tên đăng nhập',{exact:true}).fill(process.env.DEMO_USERNAME);await page.getByLabel('Mật khẩu',{exact:true}).fill(process.env.DEMO_PASSWORD);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await expect(page.locator('.sidebar')).toBeVisible();pages.push(page);
 }
 const views=['sale','products','suppliers','customers','receipts','inventory','adjustments','receipt-history','sales-history','returns','cancel-invoice','reports','stock-report','settings'];
 for(const view of views){
  const results=[];
  for(let i=0;i<2;i++){
   const page=pages[i];const origin=i===0?process.env.REFERENCE_URL:(process.env.BASE_URL||'http://localhost:8100');await page.goto(origin+'/?view='+view);await expect(page.locator('.sidebar')).toBeVisible();await page.evaluate(()=>document.fonts.ready);await page.mouse.move(0,0);await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode().catch(()=>{}))));await page.waitForTimeout(500);
   results.push(await page.locator('main').evaluate(el=>Array.from(el.querySelectorAll('h1,h2,h3,label,input,select,button,th,td,img')).map(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,text:e.textContent?.trim(),placeholder:e.getAttribute('placeholder'),src:e.getAttribute('src'),x:b.x,y:b.y,width:b.width,height:b.height,font:s.fontFamily,size:s.fontSize,color:s.color,bg:s.backgroundColor,border:s.borderRadius}})));
   await page.screenshot({path:`python-evidence/${view}-${i===0?'reference':'python'}.png`});
  }
  expect(results[1],view).toEqual(results[0]);
 }
 for(const p of pages)await p.context().close();
});
