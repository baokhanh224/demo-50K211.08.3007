import os, re
from urllib.parse import urlencode
from .errors import fail


def payment_qr(total, reference):
    bank = os.getenv("VIETQR_BANK_BIN", "").strip()
    account = os.getenv("VIETQR_ACCOUNT_NUMBER", "").strip()
    name = os.getenv("VIETQR_ACCOUNT_NAME", "").strip()
    if (
        not re.fullmatch(r"\d{6}", bank)
        or not re.fullmatch(r"[A-Za-z0-9]{4,40}", account)
        or not name
    ):
        fail(
            "Chưa cấu hình tài khoản nhận chuyển khoản. Vui lòng cấu hình VietQR trên Vercel."
        )
    if (
        not isinstance(total, (int, float))
        or total != int(total)
        or total <= 0
        or total > 9007199254740991
    ):
        fail("Số tiền chuyển khoản không hợp lệ")
    if not re.fullmatch(r"[a-zA-Z0-9-]{1,64}", str(reference)):
        fail("Mã giao dịch không hợp lệ")
    description = "QN " + str(reference).replace("-", "")[:20].upper()
    url = f"https://img.vietqr.io/image/{bank}-{account}-qr_only.png?" + urlencode(
        dict(amount=str(int(total)), addInfo=description, accountName=name)
    )
    return dict(
        url=url,
        total=total,
        bank=bank,
        account=account,
        name=name,
        description=description,
    )
