"""Explicit demo reset. Never called during application startup or deployment."""

import os
from datetime import datetime, timedelta, timezone
from .db import all, one, run, transaction, date_plus, session_token
from .auth import password_hash
from .service import (
    save_supplier,
    save_product,
    save_receipt,
    save_customer,
    checkout,
    cancel_invoice,
)


def seed_data():
    marker = session_token.set("seed")
    try:
        with transaction(reset=True):
            for table in [
                "report_snapshot",
                "movement",
                "return_allocation",
                "allocation",
                "return_line",
                "return_ticket",
                "invoice_line",
                "invoice",
                "customer",
                "adjustment_line",
                "adjustment",
                "receipt_line",
                "receipt",
                "price_history",
                "unit",
                "product",
                "supplier_category",
                "supplier",
                "category",
                "sequence",
            ]:
                run(f"DELETE FROM {table}")
            for table in [
                "category",
                "unit",
                "price_history",
                "receipt_line",
                "adjustment_line",
                "invoice_line",
                "return_line",
                "allocation",
                "return_allocation",
                "movement",
            ]:
                one("SELECT setval(pg_get_serial_sequence(?, 'id'), 1, false)", table)
            if not one("SELECT id FROM account WHERE id=?", "TK0001"):
                username = os.getenv("DEMO_USERNAME")
                password = os.getenv("DEMO_PASSWORD")
                if not username or not password:
                    raise RuntimeError(
                        "Cần cấu hình DEMO_USERNAME và DEMO_PASSWORD để tạo tài khoản ban đầu"
                    )
                run(
                    "INSERT INTO account VALUES (?,?,?)",
                    "TK0001",
                    username,
                    password_hash(password),
                )
            for name in ["Sữa & đồ uống", "Mì & thực phẩm", "Bánh kẹo", "Gia dụng"]:
                run("INSERT INTO category(name) VALUES (?)", name)
            sup = save_supplier(
                dict(
                    name="Đại lý sữa Thuận Phát",
                    phone="0905123456",
                    email="thuanphat@example.com",
                    address="Hải Châu, Đà Nẵng",
                    category_ids=[1],
                )
            )
            save_supplier(
                dict(
                    name="Nhà phân phối An Khang",
                    phone="0912345678",
                    address="Thanh Khê, Đà Nẵng",
                    category_ids=[2, 3, 4],
                )
            )
            save_supplier(
                dict(name="Công ty Minh Tâm", phone="0987654321", category_ids=[3])
            )
            fixtures = [
                [
                    "Sữa Milo",
                    1,
                    "Hộp",
                    12500,
                    18000,
                    8,
                    True,
                    "8934588012345",
                    [
                        dict(name="Lốc", factor=4, price=72000),
                        dict(name="Thùng", factor=24, price=396000),
                    ],
                ],
                [
                    "Mì Hảo Hảo",
                    2,
                    "Gói",
                    3000,
                    4000,
                    10,
                    True,
                    "8934563012345",
                    [
                        dict(name="Lốc", factor=5, price=19000),
                        dict(name="Thùng", factor=30, price=110000),
                    ],
                ],
                ["Bánh quy Cosy", 3, "Gói", 12000, 18000, 5, True, "8934684012345", []],
                [
                    "Nước suối Lavie",
                    1,
                    "Chai",
                    3500,
                    6000,
                    10,
                    False,
                    "8934588123456",
                    [dict(name="Thùng", factor=24, price=130000)],
                ],
                ["Muối I-ốt", 2, "Gói", 4000, 6000, 5, False, "8934588234567", []],
                [
                    "Nước rửa chén Sunlight",
                    4,
                    "Chai",
                    20000,
                    28000,
                    4,
                    False,
                    "8934588345678",
                    [],
                ],
                ["Kẹo bạc hà", 3, "Gói", 5000, 8000, 2, False, "8934588456789", []],
            ]
            for row in fixtures:
                save_product(
                    dict(
                        zip(
                            [
                                "name",
                                "category_id",
                                "base_unit",
                                "reference_cost",
                                "price",
                                "min_stock",
                                "expiry_managed",
                                "barcode",
                                "units",
                            ],
                            row,
                        )
                    )
                )

            def unit(pid):
                return one(
                    "SELECT id FROM unit WHERE product_id=? AND factor=1 ORDER BY id LIMIT 1",
                    pid,
                )["id"]

            def line(pid, qty, price, days=None):
                return dict(
                    product_id=pid,
                    unit_id=unit(pid),
                    quantity=qty,
                    price=price,
                    expiry=date_plus(days) if days is not None else "",
                )

            save_receipt(
                dict(
                    supplier_id=sup["id"],
                    request_key="seed-pn1",
                    lines=[
                        line("SP0001", 8, 12500, 7),
                        line("SP0001", 40, 13500, 90),
                        line("SP0003", 20, 12000, 15),
                    ],
                )
            )
            save_receipt(
                dict(
                    supplier_id="NCC002",
                    request_key="seed-pn2",
                    lines=[
                        line("SP0002", 60, 3000, 180),
                        line("SP0004", 48, 3500),
                        line("SP0005", 3, 4000),
                        line("SP0006", 12, 20000),
                    ],
                )
            )
            save_receipt(
                dict(
                    supplier_id=sup["id"],
                    request_key="seed-pn3",
                    lines=[line("SP0001", 5, 12000, 60)],
                )
            )
            historical = (
                (datetime.now(timezone.utc) - timedelta(days=20))
                .isoformat(timespec="milliseconds")
                .replace("+00:00", "Z")
            )
            run("UPDATE receipt SET created_at=?", historical)
            run("UPDATE movement SET created_at=? WHERE kind='receipt'", historical)
            run(
                "UPDATE receipt_line SET expiry=? WHERE receipt_id='PN0003'",
                date_plus(-2),
            )
            for name, phone, address in [
                ("Nguyễn Bảo Khanh", "0901234567", "Hải Châu, Đà Nẵng"),
                ("Trần Công Bằng", "0934567890", "Sơn Trà, Đà Nẵng"),
                ("Trần Quang Hoàng", "0911223344", "Thanh Khê, Đà Nẵng"),
            ]:
                save_customer(dict(name=name, phone=phone, address=address))

            def sale(pid, qty):
                return dict(product_id=pid, unit_id=unit(pid), quantity=qty)

            checkout(
                dict(
                    request_key="seed-hd1",
                    customer_id="KH0001",
                    method="Tiền mặt",
                    cash=200000,
                    lines=[sale("SP0001", 3), sale("SP0002", 4)],
                )
            )
            checkout(
                dict(
                    request_key="seed-hd2",
                    customer_id="KH0003",
                    method="Chuyển khoản",
                    confirmed=True,
                    lines=[sale("SP0003", 2), sale("SP0004", 3)],
                )
            )
            checkout(
                dict(
                    request_key="seed-hd3",
                    method="Tiền mặt",
                    cash=100000,
                    lines=[sale("SP0002", 5)],
                )
            )
            cancel_invoice(dict(id="HD0003", reason="Nhập nhầm số lượng"))
            for iid, days in [("HD0001", 3), ("HD0002", 1), ("HD0003", 1)]:
                time = (
                    (datetime.now(timezone.utc) - timedelta(days=days))
                    .isoformat(timespec="milliseconds")
                    .replace("+00:00", "Z")
                )
                run(
                    "UPDATE invoice SET created_at=?,cancelled_at=CASE WHEN cancelled_at IS NOT NULL THEN ? ELSE NULL END WHERE id=?",
                    time,
                    time,
                    iid,
                )
                run(
                    "UPDATE movement SET created_at=? WHERE reference=? AND kind IN ('sale','cancel')",
                    time,
                    iid,
                )
            run("UPDATE supplier SET status='Ngừng hợp tác' WHERE id='NCC003'")
            return dict(message="Khôi phục dữ liệu mẫu thành công")
    finally:
        session_token.reset(marker)
