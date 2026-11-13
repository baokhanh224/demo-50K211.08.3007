"""Explicit database commands. Importing/running the server never migrates or seeds."""

import argparse
from pathlib import Path
from dotenv import load_dotenv
from .db import database, connection, transaction, one, run
from .seed import seed_data

ROOT = Path(__file__).resolve().parent.parent


def init_db():
    with database(), transaction():
        conn = connection.get()
        conn.execute(
            "CREATE TABLE IF NOT EXISTS python_migration (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())"
        )
        exists = one("SELECT to_regclass('public.product') AS name")["name"] is not None
        for file in sorted((ROOT / "migrations").glob("*.sql")):
            if one("SELECT name FROM python_migration WHERE name=?", file.name):
                continue
            if exists and file.name.startswith("001"):
                # Adopt the existing compatible schema without dropping or rebuilding tables.
                required = {
                    "account",
                    "session",
                    "setting",
                    "category",
                    "supplier",
                    "supplier_category",
                    "product",
                    "unit",
                    "price_history",
                    "receipt",
                    "receipt_line",
                    "adjustment",
                    "adjustment_line",
                    "customer",
                    "invoice",
                    "invoice_line",
                    "return_ticket",
                    "return_line",
                    "allocation",
                    "return_allocation",
                    "movement",
                    "report_snapshot",
                    "sequence",
                }
                found = {
                    r["table_name"]
                    for r in conn.execute(
                        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
                    ).fetchall()
                }
                if not required <= found:
                    raise RuntimeError(
                        "CSDL hiện có chưa đủ bảng; không tự thay thế cấu trúc"
                    )
            elif file.name.startswith("002") and exists:
                if not one(
                    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='invoice' AND column_name='cancel_request_key'"
                ):
                    conn.execute(
                        "ALTER TABLE invoice ADD COLUMN cancel_request_key TEXT UNIQUE"
                    )
                conn.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS category_name_lower ON category(lower(name))"
                )
            else:
                conn.execute(file.read_text())
            run("INSERT INTO python_migration(name) VALUES (?)", file.name)


def main():
    load_dotenv(ROOT / ".env")
    parser = argparse.ArgumentParser(description="Quỳnh Như Python database tools")
    parser.add_argument("command", choices=["init", "seed", "check"])
    parser.add_argument(
        "--replace-demo-data",
        action="store_true",
        help="Required for seed: replaces existing business demo data",
    )
    args = parser.parse_args()
    if args.command == "init":
        init_db()
        print("Cấu trúc CSDL sẵn sàng; không thay thế dữ liệu")
    elif args.command == "seed":
        if not args.replace_demo_data:
            parser.error(
                "seed yêu cầu --replace-demo-data; lệnh thay thế dữ liệu nghiệp vụ demo"
            )
        with database():
            print(seed_data()["message"])
    else:
        with database():
            print(
                "Kết nối PostgreSQL thành công"
                if one("SELECT 1 AS ok")["ok"] == 1
                else "Lỗi kết nối"
            )


if __name__ == "__main__":
    main()
