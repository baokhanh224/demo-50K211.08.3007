"""PostgreSQL access: one connection per request, atomic writes and stable row locks."""

import os
import re
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
import psycopg
from psycopg.rows import dict_row
from psycopg.pq import TransactionStatus

connection = ContextVar("connection", default=None)
session_token = ContextVar("session_token", default="cli")
TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def now():
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def day(value=None):
    if value is None:
        value = datetime.now(TZ)
    elif isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(TZ).strftime("%Y-%m-%d")


def date_plus(days):
    return day(datetime.now(timezone.utc) + timedelta(days=days))


def connect(url=None):
    url = url or os.environ.get("PYTHON_DATABASE_URL", "")
    if not url:
        raise RuntimeError("PYTHON_DATABASE_URL chưa được cấu hình")
    parts = urlsplit(url)
    query = [
        (k, v)
        for k, v in parse_qsl(parts.query)
        if k not in {"pgbouncer", "connection_limit", "pool_timeout", "schema"}
    ]
    return psycopg.connect(
        urlunsplit(parts._replace(query=urlencode(query))),
        autocommit=True,
        row_factory=dict_row,
        connect_timeout=15,
    )


@contextmanager
def database(url=None):
    if connection.get() is not None:
        yield connection.get()
        return
    with connect(url) as conn:
        marker = connection.set(conn)
        try:
            yield conn
        finally:
            connection.reset(marker)


def all(sql, *params):
    conn = connection.get()
    if conn is None:
        with database():
            return all(sql, *params)
    # Application queries use ? placeholders; no SQL interpolation of values.
    return conn.execute(sql.replace("%", "%%").replace("?", "%s"), params).fetchall()


def one(sql, *params):
    rows = all(sql, *params)
    return rows[0] if rows else None


def run(sql, *params):
    conn = connection.get()
    if conn is None:
        with database():
            return run(sql, *params)
    if re.match(
        r"^INSERT INTO\s+(category|unit|price_history|receipt_line|adjustment_line|invoice_line|return_line|allocation|return_allocation|movement)\b",
        sql,
        re.I,
    ):
        rows = all(sql + " RETURNING id", *params)
        return {
            "lastInsertRowid": rows[0]["id"] if rows else None,
            "changes": len(rows),
        }
    cur = conn.execute(sql.replace("%", "%%").replace("?", "%s"), params)
    return {"lastInsertRowid": 0, "changes": cur.rowcount}


@contextmanager
def transaction(reset=False):
    conn = connection.get()
    if conn is None:
        with database(), transaction(reset):
            yield
        return
    if conn.info.transaction_status == TransactionStatus.INTRANS:
        yield
        return
    with conn.transaction():
        fn = "pg_advisory_xact_lock" if reset else "pg_advisory_xact_lock_shared"
        one(f"SELECT {fn}(774411)::text")
        yield


def code(prefix):
    row = one(
        "INSERT INTO sequence(prefix,value) VALUES (?,1) ON CONFLICT(prefix) DO UPDATE SET value=sequence.value+1 RETURNING value",
        prefix,
    )
    return prefix + str(row["value"]).zfill(3 if prefix == "NCC" else 4)


def lock_products(ids):
    ids = sorted(set(ids))
    if not ids:
        return
    placeholders = ",".join("?" for _ in ids)
    all(
        f"SELECT id FROM product WHERE id IN ({placeholders}) ORDER BY id FOR UPDATE",
        *ids,
    )
    all(
        f"SELECT id FROM receipt_line WHERE product_id IN ({placeholders}) ORDER BY id FOR UPDATE",
        *ids,
    )


def lock_request(kind, key):
    one(
        "SELECT pg_advisory_xact_lock(hashtextextended(?::text,0))::text",
        kind + ":" + str(key or ""),
    )
