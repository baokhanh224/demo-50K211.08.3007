import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import {installTrustedTransport} from './public-transport';
test('QR follows cart amount and resets transfer confirmation after editing cart', async ({page,context}) => {
  if(process.env.BASE_URL?.startsWith('https:'))await installTrustedTransport(context);
  await page.setViewportSize({width:1440,height:927});
  // Cloud Chromium does not trust the environment's proxy CA. curl uses the
  // supplied trusted CA, preserving TLS validation for the actual VietQR response.
  await page.route('https://img.vietqr.io/**', async (route) => {
    const body = execFileSync('curl', ['-fsSL', '--max-time', '25', route.request().url()]);
    const contentType = body.subarray(0, 100).toString().includes('<svg') ? 'image/svg+xml' : 'image/png';
    await route.fulfill({body, contentType});
  });
  await page.goto('/');
  await page.getByLabel('Tên đăng nhập').fill(process.env.DEMO_USERNAME!);
  await page.getByLabel('Mật khẩu', {exact:true}).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole('button', {name:'Đăng nhập',exact:true}).click();
  await expect(page.locator('.sidebar')).toBeVisible();
  const data=await page.evaluate(async()=>await(await fetch('/api/bootstrap')).json());
  const product=data.products.find((p:any)=>p.units?.length&&p.sellable>=p.units[0].factor*2);
  expect(product).toBeTruthy();
  const price=product.units[0].price;
  await page.getByLabel('Tìm kiếm sản phẩm', {exact:true}).fill(product.id);
  await page.locator('.sale-main > .product-search .suggestions button').filter({hasText:product.id}).click();
  await page.getByLabel('Số lượng bán', {exact:true}).fill('1');
  await page.getByRole('button', {name:'Hoàn tất chọn sản phẩm',exact:true}).click();
  await page.getByRole('button', {name:'Chuyển khoản',exact:true}).click();
  const image=page.getByRole('img', {name:/Mã QR chuyển khoản/});
  await expect(image).toBeVisible();
  let src=await image.getAttribute('src');
  expect(new URL(src!).searchParams.get('amount')).toBe(String(price));
  const content = new URL(src!).searchParams.get('addInfo');
  expect(content).toMatch(/^HD\d{4,}$/);
  expect(new URL(src!).pathname).toBe('/image/970423-56789222279-qr_only.png');
  await expect(page.locator('.qr')).toContainText('HKD NGUYEN DANG HOE');
  const confirmation=page.getByRole('checkbox',{name:'Đã nhận đủ tiền chuyển khoản'});
  await expect(confirmation).toBeEnabled();
  await confirmation.check();
  await page.getByLabel('Số lượng bán', {exact:true}).fill('1');
  await page.getByRole('button', {name:'Hoàn tất chọn sản phẩm',exact:true}).click();
  await expect(image).toHaveAttribute('src', new RegExp('amount='+String(price*2)));
  expect(new URL((await image.getAttribute('src'))!).searchParams.get('addInfo')).toBe(content);
  await expect(confirmation).not.toBeChecked();
  await expect(confirmation).toBeEnabled();
  // Switching back to cash hides the QR, without writing any invoice.
  await page.getByRole('button', {name:'Tiền mặt',exact:true}).click();
  await expect(image).toHaveCount(0);
});
