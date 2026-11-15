import { BusinessError } from "./errors";

// Public receiving account supplied by the shop owner; no banking login secrets.
export const shopPaymentRecipient = {
  VIETQR_BANK_BIN: "970423",
  VIETQR_ACCOUNT_NUMBER: "56789222279",
  VIETQR_ACCOUNT_NAME: "HKD NGUYEN DANG HOE",
};
function configuredRecipient() {
  const keys = Object.keys(shopPaymentRecipient);
  return keys.every(key => process.env[key]?.trim()) ? process.env : shopPaymentRecipient;
}

// VietQR carries the server-quoted amount and a reserved, real invoice number.
export function paymentQr(total: number, reference: string, env: Record<string, string | undefined> = configuredRecipient()) {
  const bank = env.VIETQR_BANK_BIN?.trim() || "";
  const account = env.VIETQR_ACCOUNT_NUMBER?.trim() || "";
  const name = env.VIETQR_ACCOUNT_NAME?.trim() || "";
  if (!/^\d{6}$/.test(bank) || !/^[A-Za-z0-9]{4,40}$/.test(account) || !name)
    throw new BusinessError("Chưa cấu hình tài khoản nhận chuyển khoản. Vui lòng cấu hình VietQR trên Vercel.");
  if (!Number.isSafeInteger(total) || total <= 0)
    throw new BusinessError("Số tiền chuyển khoản không hợp lệ");
  if (!/^HD\d{4,}$/.test(reference))
    throw new BusinessError("Mã hóa đơn không hợp lệ");
  const description = reference;
  const url = new URL(`https://img.vietqr.io/image/${bank}-${account}-qr_only.png`);
  url.searchParams.set("amount", String(total));
  url.searchParams.set("addInfo", description);
  url.searchParams.set("accountName", name);
  return { url: url.toString(), total, bank, bankName: bank === "970423" ? "TPBank" : undefined, account, name, description, invoiceId: reference };
}
