import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
test('QR follows cart amount and resets transfer confirmation after editing cart', async ({page}) => {
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
  await page.getByLabel('Tìm kiếm sản phẩm', {exact:true}).fill('Sữa Milo');
  await page.getByRole('button', {name:/Sữa Milo.*SP0001/}).click();
  await page.getByLabel('Số lượng bán', {exact:true}).fill('1');
  await page.getByRole('button', {name:'Hoàn tất chọn sản phẩm',exact:true}).click();
  await page.getByRole('button', {name:'Chuyển khoản',exact:true}).click();
  const image=page.getByRole('img', {name:/Mã QR chuyển khoản/});
  await expect(image).toBeVisible();
  let src=await image.getAttribute('src');
  expect(new URL(src!).searchParams.get('amount')).toBe('18000');
  const confirmation=page.getByRole('checkbox',{name:'Đã nhận đủ tiền chuyển khoản'});
  await expect(confirmation).toBeEnabled();
  await confirmation.check();
  await page.getByLabel('Số lượng bán', {exact:true}).fill('1');
  await page.getByRole('button', {name:'Hoàn tất chọn sản phẩm',exact:true}).click();
  await expect(image).toHaveAttribute('src', /amount=36000/);
  await expect(confirmation).not.toBeChecked();
  await expect(confirmation).toBeEnabled();
  // Switching back to cash hides the QR, without writing any invoice.
  await page.getByRole('button', {name:'Tiền mặt',exact:true}).click();
  await expect(image).toHaveCount(0);
});
