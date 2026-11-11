import { BusinessError } from "./errors";

// VietQR image API: the bank app reads account, amount and transfer description.
export function paymentQr(total: number, reference: string, env: Record<string, string | undefined> = process.env) {
  const bank = env.VIETQR_BANK_BIN?.trim() || "";
  const account = env.VIETQR_ACCOUNT_NUMBER?.trim() || "";
  const name = env.VIETQR_ACCOUNT_NAME?.trim() || "";
  if (!/^\d{6}$/.test(bank) || !/^[A-Za-z0-9]{4,40}$/.test(account) || !name)
    throw new BusinessError("Chưa cấu hình tài khoản nhận chuyển khoản. Vui lòng cấu hình VietQR trên Vercel.");
  if (!Number.isSafeInteger(total) || total <= 0)
    throw new BusinessError("Số tiền chuyển khoản không hợp lệ");
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(reference))
    throw new BusinessError("Mã giao dịch không hợp lệ");
  const description = `QN ${reference.replaceAll("-", "").slice(0, 20).toUpperCase()}`;
  const url = new URL(`https://img.vietqr.io/image/${bank}-${account}-qr_only.png`);
  url.searchParams.set("amount", String(total));
  url.searchParams.set("addInfo", description);
  url.searchParams.set("accountName", name);
  return { url: url.toString(), total, bank, account, name, description };
}
