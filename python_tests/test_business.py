"""Run only against a dedicated disposable database ending in _test.
Tests create business records, but never reset a production database.
"""

import os, unittest, uuid, json
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from urllib.parse import urlsplit
from openpyxl import load_workbook
from quynh_nhu import service as s
from quynh_nhu.db import database, one, all, day, date_plus, session_token
from quynh_nhu.errors import BusinessError
from quynh_nhu.reports import report_data, export_snapshot
from quynh_nhu.export import excel, pdf
from quynh_nhu.payment_qr import payment_qr


class BusinessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not urlsplit(os.getenv("PYTHON_DATABASE_URL", "")).path.endswith("_test"):
            raise RuntimeError("Tests require a dedicated database ending in _test")

    def setUp(self):
        self.ctx = database()
        self.ctx.__enter__()
        self.token = session_token.set("python-test")
        self.key = uuid.uuid4().hex

    def tearDown(self):
        session_token.reset(self.token)
        self.ctx.__exit__(None, None, None)

    def unit(self, p="SP0002"):
        return one(
            "SELECT id FROM unit WHERE product_id=? AND factor=1 ORDER BY id", p
        )["id"]

    def payload(self, p="SP0002", qty=2):
        return dict(
            request_key=self.key,
            method="Tiền mặt",
            cash=100000000,
            lines=[dict(product_id=p, unit_id=self.unit(p), quantity=qty)],
        )

    def snapshot(self):
        return [
            all("SELECT * FROM " + t + " ORDER BY 1")
            for t in [
                "product",
                "unit",
                "receipt",
                "receipt_line",
                "invoice",
                "invoice_line",
                "allocation",
                "return_ticket",
                "return_line",
                "return_allocation",
                "movement",
                "adjustment",
                "adjustment_line",
                "sequence",
            ]
        ]

    def rollback(self, fn, message):
        before = self.snapshot()
        s.set_settings({"fail_save": True})
        with self.assertRaisesRegex(BusinessError, message):
            fn()
        self.assertEqual(self.snapshot(), before)

    def test_01_checkout_cancel_idempotency_and_concurrency(self):
        p = "SP0005"
        qty = one("SELECT SUM(remaining) n FROM receipt_line WHERE product_id=?", p)[
            "n"
        ]
        self.assertGreater(qty, 0)
        payload = self.payload(p, qty)
        self.rollback(
            lambda: s.checkout(dict(payload, request_key=self.key + "fail")),
            "Không thể lưu giao dịch",
        )

        def sale(d):
            with database():
                return s.checkout(d)

        with ThreadPoolExecutor(2) as pool:
            dups = list(pool.map(sale, [payload, payload]))
        self.assertEqual(dups[0]["id"], dups[1]["id"])
        self.assertEqual(
            one("SELECT count(*) n FROM invoice WHERE request_key=?", self.key)["n"], 1
        )
        self.assertEqual(
            one("SELECT SUM(remaining) n FROM receipt_line WHERE product_id=?", p)["n"],
            0,
        )
        cancel = dict(
            id=dups[0]["id"], reason="Kiểm thử Python", request_key=self.key + "cancel"
        )
        s.cancel_invoice(cancel)
        s.cancel_invoice(cancel)
        self.assertEqual(
            one("SELECT SUM(remaining) n FROM receipt_line WHERE product_id=?", p)["n"],
            qty,
        )

        def compete(key):
            try:
                return sale(dict(payload, request_key=key))
            except BusinessError:
                return None

        with ThreadPoolExecutor(2) as pool:
            results = list(pool.map(compete, [self.key + "a", self.key + "b"]))
        self.assertEqual(sum(r is not None for r in results), 1)
        self.assertGreaterEqual(
            one("SELECT min(remaining) n FROM receipt_line")["n"], 0
        )
        for r in results:
            if r:
                s.cancel_invoice(
                    dict(
                        id=r["id"],
                        reason="Hoàn kho kiểm thử",
                        request_key=self.key + r["id"],
                    )
                )

    def test_02_all_write_faults_rollback(self):
        receipt = dict(
            request_key=self.key + "pn",
            supplier_id="NCC001",
            lines=[
                dict(
                    product_id="SP0002",
                    unit_id=self.unit(),
                    quantity=2,
                    price=3000,
                    expiry=date_plus(180),
                )
            ],
        )
        self.rollback(lambda: s.save_receipt(receipt), "Không thể lưu phiếu nhập")
        sale = s.checkout(self.payload())
        detail = s.invoice_detail(sale["id"])
        self.rollback(
            lambda: s.cancel_invoice(
                dict(id=sale["id"], reason="Thử lỗi", request_key=self.key + "cancel")
            ),
            "Không thể hủy hóa đơn",
        )
        self.rollback(
            lambda: s.return_ticket(
                dict(
                    invoice_id=sale["id"],
                    request_key=self.key + "return",
                    returns=[
                        dict(line_id=detail["lines"][0]["id"], quantity=1, restock=True)
                    ],
                    only_return=True,
                    money_confirmed=True,
                )
            ),
            "Không thể lưu phiếu đổi/trả",
        )
        lot = one(
            "SELECT * FROM receipt_line WHERE product_id='SP0002' ORDER BY id LIMIT 1"
        )
        self.rollback(
            lambda: s.adjust_stock(
                dict(
                    request_key=self.key + "adj",
                    reason="Thử lỗi",
                    lines=[dict(lot_id=lot["id"], quantity=0)],
                )
            ),
            "Không thể lưu phiếu điều chỉnh",
        )
        s.cancel_invoice(
            dict(
                id=sale["id"],
                reason="Hoàn kho kiểm thử",
                request_key=self.key + "cleanup",
            )
        )

    def test_03_crud_validation_and_historical_units(self):
        with self.assertRaisesRegex(BusinessError, "Không được để trống"):
            s.save_product(dict(name="Thiếu"))
        category = one("SELECT id FROM category ORDER BY id LIMIT 1")["id"]
        data = dict(
            name="Sản phẩm kiểm thử Python",
            category_id=category,
            base_unit="Gói",
            reference_cost=1000,
            price=2000,
            min_stock=2,
            units=[dict(name="Lốc", factor=6, price=11000)],
        )
        pid = s.save_product(data)["id"]
        p = next(p for p in s.products() if p["id"] == pid)
        self.assertEqual(len(p["units"]), 2)
        u = p["units"][0]["id"]
        self.assertIn("warning", s.update_price(dict(unit_id=u, price=500)))
        s.update_price(dict(unit_id=u, price=500, confirmed=True))
        s.delete_product(pid)
        sid = s.save_supplier(
            dict(name="NCC kiểm thử", phone="0901122334", category_ids=[category])
        )["id"]
        s.delete_supplier(sid)
        with self.assertRaisesRegex(BusinessError, "đầy đủ"):
            s.save_customer(dict(name="Nguyễn An"))
        phone = "09" + str(uuid.uuid4().int)[:8]
        cid = s.save_customer(dict(name="Nguyễn An", phone=phone))["id"]
        self.assertEqual(s.find_customer(phone)["id"], cid)
        self.assertEqual(s.customer_detail(cid)["invoices"], [])
        with self.assertRaisesRegex(BusinessError, "đã tồn tại"):
            s.save_customer(dict(name="Nguyễn An", phone=phone))
        s.save_customer(
            dict(id=cid, name="Nguyễn Bình", phone=phone, address="Đà Nẵng")
        )
        s.delete_customer(cid)
        p = next(p for p in s.products() if p["id"] == "SP0002")
        before = all("SELECT * FROM invoice_line WHERE product_id='SP0002' ORDER BY id")
        s.save_product(dict(p, base_unit="Gói kiểm thử"))
        self.assertEqual(
            all("SELECT * FROM invoice_line WHERE product_id='SP0002' ORDER BY id"),
            before,
        )
        s.save_product(p)

    def test_04_fefo_two_lots_underpayment_and_partial_return(self):
        category = one("SELECT id FROM category ORDER BY id LIMIT 1")["id"]
        pid = s.save_product(
            dict(
                name="Hai hạn Python " + self.key[:6],
                category_id=category,
                base_unit="Hộp",
                reference_cost=1000,
                price=2000,
                min_stock=2,
                expiry_managed=True,
            )
        )["id"]
        u = self.unit(pid)
        receipt = dict(
            request_key=self.key + "pn",
            supplier_id="NCC001",
            lines=[
                dict(
                    product_id=pid,
                    unit_id=u,
                    quantity=3,
                    price=1000,
                    expiry=date_plus(3),
                ),
                dict(
                    product_id=pid,
                    unit_id=u,
                    quantity=5,
                    price=1200,
                    expiry=date_plus(30),
                ),
            ],
        )
        rid = s.save_receipt(receipt)["id"]
        self.assertEqual(s.save_receipt(receipt)["id"], rid)
        lots = s.receipt_detail(rid)["lines"]
        self.assertEqual(len(lots), 2)
        sale = self.payload(pid, 5)
        with self.assertRaisesRegex(BusinessError, "Tiền khách đưa chưa đủ"):
            s.checkout(dict(sale, cash=1))
        self.assertIsNone(one("SELECT id FROM invoice WHERE request_key=?", self.key))
        saved = s.checkout(sale)
        self.assertEqual(s.checkout(sale)["id"], saved["id"])
        detail = s.invoice_detail(saved["id"])
        a = detail["lines"][0]["allocations"]
        self.assertEqual([x["quantity"] for x in a], [3, 2])
        s.cancel_invoice(
            dict(
                id=saved["id"],
                reason="Hoàn đúng nguồn",
                request_key=self.key + "cancel",
            )
        )
        self.assertEqual(
            [r["remaining"] for r in s.receipt_detail(rid)["lines"]], [3, 5]
        )
        sale2 = s.checkout(dict(sale, request_key=self.key + "2"))
        line = s.invoice_detail(sale2["id"])["lines"][0]
        before = [r["remaining"] for r in s.receipt_detail(rid)["lines"]]
        rev = report_data(dict(type="Doanh thu", **{"from": day(), "to": day()}))[
            "summary"
        ]["revenue"]
        d = dict(
            request_key=self.key + "dt",
            invoice_id=sale2["id"],
            returns=[dict(line_id=line["id"], quantity=1, restock=False)],
            only_return=True,
            money_confirmed=True,
        )
        ticket = s.return_ticket(d)
        self.assertEqual(s.return_ticket(d)["id"], ticket["id"])
        self.assertEqual(
            [r["remaining"] for r in s.receipt_detail(rid)["lines"]], before
        )
        self.assertEqual(s.invoice_detail(sale2["id"])["lines"][0]["returnable"], 4)
        self.assertEqual(
            report_data(dict(type="Doanh thu", **{"from": day(), "to": day()}))[
                "summary"
            ]["revenue"],
            rev - 2000,
        )
        with self.assertRaisesRegex(BusinessError, "không thể hủy trực tiếp"):
            s.check_cancel(sale2["id"])
        s.return_ticket(
            dict(
                d,
                request_key=self.key + "dt2",
                returns=[dict(line_id=line["id"], quantity=2, restock=True)],
            )
        )
        self.assertEqual(
            [r["remaining"] for r in s.receipt_detail(rid)["lines"]], [1, 4]
        )

    def test_05_expired_stock_and_aggregate_cart(self):
        p = next(p for p in s.products() if p["id"] == "SP0001")
        self.assertLess(p["sellable"], p["stock"])
        with self.assertRaisesRegex(BusinessError, "Số lượng bán không hợp lệ"):
            s.quote_cart(dict(lines=self.payload("SP0001", p["stock"])["lines"]))
        qty = one(
            "SELECT SUM(remaining) n FROM receipt_line WHERE product_id='SP0002'"
        )["n"]
        with self.assertRaisesRegex(BusinessError, "Số lượng bán không hợp lệ"):
            s.quote_cart(
                dict(
                    lines=self.payload(qty=qty)["lines"] + self.payload(qty=1)["lines"]
                )
            )

    def test_06_exchange_adjustment_print_and_session_failures(self):
        saved = s.checkout(self.payload())
        line = s.invoice_detail(saved["id"])["lines"][0]
        s.return_ticket(
            dict(
                request_key=self.key + "dt",
                invoice_id=saved["id"],
                returns=[dict(line_id=line["id"], quantity=1, restock=True)],
                exchanges=[dict(product_id="SP0002", unit_id=self.unit(), quantity=1)],
                money_confirmed=True,
            )
        )
        self.assertEqual(s.invoice_detail(saved["id"])["status"], "Đã thanh toán")
        lot = one(
            "SELECT * FROM receipt_line WHERE product_id='SP0002' AND remaining>0 ORDER BY id LIMIT 1"
        )
        cost = one("SELECT average_cost FROM product WHERE id='SP0002'")["average_cost"]
        adj = dict(
            request_key=self.key + "adj",
            reason="Kiểm kê",
            lines=[dict(lot_id=lot["id"], quantity=lot["remaining"] - 1)],
        )
        aid = s.adjust_stock(adj)["id"]
        self.assertEqual(s.adjust_stock(adj)["id"], aid)
        self.assertEqual(
            one("SELECT average_cost FROM product WHERE id='SP0002'")["average_cost"],
            cost,
        )
        with self.assertRaisesRegex(BusinessError, "Số lượng điều chỉnh không hợp lệ"):
            s.adjust_stock(
                dict(
                    reason="Thử",
                    lines=[
                        dict(lot_id=lot["id"], quantity=lot["original_quantity"] + 1)
                    ],
                )
            )
        s.print_invoice(saved["id"])
        s.set_settings(dict(printer_error=True))
        with self.assertRaisesRegex(
            BusinessError, "Không thể kết nối hoặc gửi yêu cầu đến máy in"
        ):
            s.print_invoice(saved["id"], True)
        s.set_settings(dict(printer_error=False, fail_load=True))
        marker = session_token.set("other-session")
        self.assertIsInstance(s.query(dict(scope="inventory")), list)
        session_token.reset(marker)
        with self.assertRaisesRegex(BusinessError, "Khoảng thời gian không hợp lệ"):
            s.query(
                dict(scope="inventory", **{"from": "2026-12-01", "to": "2026-01-01"})
            )
        with self.assertRaisesRegex(BusinessError, "Không thể tải dữ liệu tồn kho"):
            s.query(dict(scope="inventory"))
        self.assertIsInstance(s.query(dict(scope="inventory")), list)

    def test_07_reports_exports_and_snapshot_ownership(self):
        for kind in [
            "Doanh thu",
            "Lợi nhuận",
            "Sản phẩm bán chạy/chậm",
            "Xuất – nhập – tồn",
        ]:
            report = report_data(
                dict(type=kind, **{"from": date_plus(-365), "to": day()})
            )
            self.assertTrue(report["hasData"])
            same = export_snapshot(report["id"])
            self.assertEqual(same, report)
            book = load_workbook(BytesIO(excel(same)), data_only=False)
            sheet = book.active
            self.assertIn(kind, sheet["A2"].value)
            rows = list(sheet.values)
            offset = 0
            for section in report["sections"]:
                expected = section["total"]
                idx = next(i for i in range(offset, len(rows)) if rows[i][0] == "Tổng")
                actual = rows[idx]
                offset = idx + 1
                for got, want in zip(actual, expected):
                    if isinstance(want, (int, float)):
                        self.assertAlmostEqual(got, want, places=6)
                    else:
                        self.assertEqual(got, None if want == "" else want)
            self.assertTrue(pdf(same).startswith(b"%PDF-"))
            marker = session_token.set("other-session")
            with self.assertRaisesRegex(BusinessError, "Không thể xuất báo cáo"):
                export_snapshot(report["id"])
            session_token.reset(marker)
        s.set_settings(dict(fail_export_read=True))
        with self.assertRaisesRegex(BusinessError, "Không thể xuất báo cáo"):
            export_snapshot(report["id"])
        s.set_settings(dict(fail_export_file=True))
        with self.assertRaisesRegex(BusinessError, "Xuất báo cáo không thành công"):
            export_snapshot(report["id"])

    def test_08_inventory_ledger_and_qr(self):
        for p in s.products():
            self.assertEqual(
                one(
                    "SELECT COALESCE(SUM(quantity),0) n FROM movement WHERE product_id=?",
                    p["id"],
                )["n"],
                p["stock"],
            )
        quote = s.quote_cart(dict(lines=self.payload(qty=1)["lines"]))
        qr = payment_qr(quote["total"], "PYTHON-TEST")
        self.assertIn(str(int(quote["total"])), str(qr))


if __name__ == "__main__":
    unittest.main(verbosity=2)
