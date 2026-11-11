import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
const figma=JSON.parse(fs.readFileSync('docs/nguon-chu-figma.json','utf8'));
const word=JSON.parse(fs.readFileSync('docs/nguon-chu-word.json','utf8'));
const source=(frame:string,text:string)=>{
  expect(figma.some((r:any)=>r.frame===frame&&r.chu===text)).toBeTruthy();return text;
};
test('UC7: chữ và bốn trạng thái đăng nhập đúng nguồn Figma',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 const metrics:any[]=[];
 async function compare(id:string){
  await page.evaluate(()=>document.fonts.ready);
  await page.mouse.move(0,0);
  const actual=PNG.sync.read(await page.screenshot());
  const baseline=PNG.sync.read(fs.readFileSync(`tests/figma-baseline/${id.replace(':','-')}.png`));
  expect([actual.width,actual.height]).toEqual([baseline.width,baseline.height]);
  // Ignore only the dynamic password value. Preserve the field border and all labels.
  for(const image of [actual,baseline])for(let y=491;y<521;y++)for(let x=525;x<910;x++){
   const k=(y*image.width+x)*4;image.data[k]=image.data[k+1]=image.data[k+2]=255;image.data[k+3]=255;
  }
  const diff=new PNG({width:1440,height:900});
  const pixels=pixelmatch(baseline.data,actual.data,diff.data,1440,900,{threshold:0.1});
  fs.mkdirSync('test-results/parity',{recursive:true});
  fs.writeFileSync(`test-results/parity/${id.replace(':','-')}-actual.png`,PNG.sync.write(actual));
  fs.writeFileSync(`test-results/parity/${id.replace(':','-')}-diff.png`,PNG.sync.write(diff));
  metrics.push({frame:id,differentPixels:pixels,ratio:pixels/(1440*900)});
  expect(pixels/(1440*900), `Figma ${id}: sai lệch vượt ngưỡng 0,2%`).toBeLessThan(0.002);
  fs.writeFileSync('test-results/parity/login.json',JSON.stringify(metrics,null,2));
 }
 await page.goto('/');
 await expect(page.getByRole('button',{name:'Đăng nhập',exact:true})).toBeEnabled();
 for(const label of ['Tên đăng nhập','Mật khẩu'])await expect(page.getByLabel(source('1:8',label),{exact:true})).toBeVisible();
 for(const placeholder of ['Nhập tên đăng nhập','Nhập mật khẩu'])await expect(page.getByPlaceholder(source('1:8',placeholder))).toBeVisible();
 await expect(page.getByRole('heading',{name:source('1:8','TẠP HÓA QUỲNH NHƯ')})).toBeVisible();
 await compare('1:8');
 await page.getByLabel('Mật khẩu',{exact:true}).fill('12345678');
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await expect(page.locator('#login-error')).toHaveText(source('1:21','Vui lòng nhập đầy đủ thông tin đăng nhập'));
 await compare('1:21');
 await page.getByLabel('Tên đăng nhập').fill('khanh');
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await expect(page.locator('#login-error')).toHaveText(source('1:35','Tên đăng nhập hoặc mật khẩu không chính xác'));
 await compare('1:35');
 await page.goto('/?demo=authError');
 await page.getByLabel('Tên đăng nhập').fill('khanh');
 await page.getByLabel('Mật khẩu',{exact:true}).fill('12345678');
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await expect(page.locator('#login-error')).toHaveText(source('1:49','Không thể đăng nhập. Vui lòng thử lại'));
 await compare('1:49');
});
test('Word: đối chiếu nguyên văn lỗi nhập sản phẩm qua giao diện',async({page})=>{
 const username=process.env.DEMO_USERNAME,password=process.env.DEMO_PASSWORD;
 test.skip(!username||!password,'Cần tài khoản kiểm thử ngoài kho');
 await page.goto('/');
 await page.getByLabel('Tên đăng nhập').fill(username!);
 await page.getByLabel('Mật khẩu',{exact:true}).fill(password!);
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await page.getByRole('link',{name:'Quản lý sản phẩm',exact:true}).click();
 await page.getByRole('button',{name:'Thêm sản phẩm',exact:true}).click();
 await page.getByRole('button',{name:'Lưu',exact:true}).click();
 const error='Không được để trống!';
 expect(word.some((r:any)=>r.UC==='UC1.1'&&r.chu===error)).toBeTruthy();
 await expect(page.getByText(error,{exact:true}).first()).toBeVisible();
});
test('UC6: tra cứu hai trường, thêm nhanh khách hàng và giữ đường dẫn',async({page})=>{
 const username=process.env.DEMO_USERNAME,password=process.env.DEMO_PASSWORD;
 test.skip(!username||!password,'Cần tài khoản kiểm thử ngoài kho');
 await page.goto('/');
 await page.getByLabel('Tên đăng nhập').fill(username!);
 await page.getByLabel('Mật khẩu',{exact:true}).fill(password!);
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await page.getByRole('button',{name:'Thêm khách hàng',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog).toBeVisible();
 await dialog.getByLabel('Tên khách hàng',{exact:false}).fill('Khách Kiểm Thử');
 const phone='098'+String(Date.now()).slice(-7);
 await dialog.getByLabel('Số điện thoại',{exact:false}).fill(phone);
 await dialog.getByRole('button',{name:'Lưu',exact:true}).click();
 await expect(dialog).toHaveCount(0);
 await expect(page.locator('.payment-customer')).toContainText('Khách Kiểm Thử');
 await page.getByRole('link',{name:'Tra cứu lịch sử bán hàng',exact:true}).click();
 await expect(page).toHaveURL(/view=sales-history/);
 for(const label of ['Mã hóa đơn','Số điện thoại khách hàng','Từ ngày','Đến ngày']){
  source('336:3261',label);await expect(page.getByLabel(label,{exact:true})).toBeVisible();
 }
 await page.reload();
 await expect(page.getByRole('heading',{name:'Tra cứu lịch sử bán hàng'})).toBeVisible();
 await page.getByRole('button',{name:'Xem',exact:true}).first().click();
 await expect(page.getByRole('dialog').locator('table').first().locator('th')).toHaveText(['Sản phẩm','SL','Đơn giá','Thành tiền']);
});
