"""Compatible with the existing Node scrypt hashes and signed session cookies."""

import os
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from .db import one, run, now
from .errors import BusinessError


def password_hash(password):
    salt = secrets.token_hex(16)
    return (
        salt
        + ":"
        + hashlib.scrypt(
            password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64
        ).hex()
    )


def login(username, password):
    if not str(username).strip() or not password:
        raise BusinessError("Vui lòng nhập đầy đủ thông tin đăng nhập")
    account = one("SELECT * FROM account WHERE username=?", username)
    valid = False
    if account:
        try:
            salt, hashed = account["password"].split(":")
            actual = hashlib.scrypt(
                password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64
            )
            valid = hmac.compare_digest(bytes.fromhex(hashed), actual)
        except (ValueError, TypeError):
            pass
    if not valid:
        raise BusinessError("Tên đăng nhập hoặc mật khẩu không chính xác")
    token = secrets.token_hex(32)
    run("DELETE FROM session WHERE expires_at<?", now())
    expiry = (
        (datetime.now(timezone.utc) + timedelta(days=1))
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )
    run("INSERT INTO session VALUES (?,?,?)", token, account["id"], expiry)
    return token


def signed_token(token):
    secret = os.environ.get("SESSION_SECRET", "")
    if len(secret) < 32:
        raise RuntimeError("SESSION_SECRET chưa được cấu hình")
    return (
        token
        + "."
        + hmac.new(secret.encode(), token.encode(), hashlib.sha256).hexdigest()
    )


def authenticate(cookie):
    raw = cookie.split(".")[0] if cookie else ""
    if not raw or not hmac.compare_digest(cookie, signed_token(raw)):
        raise BusinessError("Vui lòng đăng nhập", status=401)
    if not one("SELECT * FROM session WHERE token=? AND expires_at>?", raw, now()):
        raise BusinessError("Vui lòng đăng nhập", status=401)
    return raw
