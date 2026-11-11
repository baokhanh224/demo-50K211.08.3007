import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paymentQr } from '../lib/payment-qr';
const env = { VIETQR_BANK_BIN: '970436', VIETQR_ACCOUNT_NUMBER: '123456789', VIETQR_ACCOUNT_NAME: 'NGUYEN VAN A' };
test('QR carries exact VND amount, account and unique reference; edits change amount', () => {
  const a = paymentQr(144000, '1234-abcd', env);
  const b = paymentQr(18000, '1234-abcd', env);
  const url = new URL(a.url);
  assert.equal(url.hostname, 'img.vietqr.io');
  assert.equal(url.pathname, '/image/970436-123456789-qr_only.png');
  assert.equal(url.searchParams.get('amount'), '144000');
  assert.equal(url.searchParams.get('addInfo'), 'QN 1234ABCD');
  assert.equal(url.searchParams.get('accountName'), env.VIETQR_ACCOUNT_NAME);
  assert.equal(new URL(b.url).searchParams.get('amount'), '18000');
  assert.notEqual(a.url, b.url);
});
test('rejects missing recipient, fractional/invalid VND and malformed reference', () => {
  assert.throws(() => paymentQr(10000, 'abc', {}));
  for (const amount of [0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => paymentQr(amount, 'abc', env));
  assert.throws(() => paymentQr(10000, '../abc', env));
});
