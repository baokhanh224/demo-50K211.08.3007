"""HTTP tests against an explicitly selected Python test server; stdlib only."""

import json, os, unittest, urllib.request, urllib.error, http.cookiejar

BASE = os.getenv("PYTHON_HTTP_BASE_URL")


@unittest.skipUnless(
    BASE, "Set PYTHON_HTTP_BASE_URL to a running isolated Python server"
)
class HTTPTests(unittest.TestCase):
    def setUp(self):
        self.jar = http.cookiejar.CookieJar()
        self.client = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPCookieProcessor(self.jar),
        )

    def call(self, path, data=None):
        request = urllib.request.Request(
            BASE + path,
            data=json.dumps(data).encode() if data is not None else None,
            headers={"Content-Type": "application/json"},
        )
        try:
            with self.client.open(request, timeout=15) as r:
                return r.status, json.load(r)
        except urllib.error.HTTPError as e:
            return e.code, json.load(e)

    def login(self):
        status, _ = self.call(
            "/api/login",
            dict(
                username=os.environ["DEMO_USERNAME"],
                password=os.environ["DEMO_PASSWORD"],
            ),
        )
        self.assertEqual(status, 200)

    def test_auth_login_logout(self):
        status, data = self.call("/api/bootstrap")
        self.assertEqual(status, 401)
        self.assertEqual(data["error"], "Vui lòng đăng nhập")
        status, data = self.call(
            "/api/login", dict(username="invalid", password="invalid")
        )
        self.assertEqual(status, 400)
        self.assertEqual(data["error"], "Tên đăng nhập hoặc mật khẩu không chính xác")
        self.login()
        self.assertEqual(self.call("/api/bootstrap")[0], 200)
        self.assertTrue(any(c.name == "qn_python_session" for c in self.jar))
        self.assertEqual(self.call("/api/logout", {})[0], 200)
        self.assertEqual(self.call("/api/bootstrap")[0], 401)

    def test_api_pages_qr_and_fresh_session(self):
        self.login()
        for scope in [
            "products",
            "suppliers",
            "customers",
            "inventory",
            "receipt-history",
            "sales-history",
            "adjustments",
        ]:
            status, rows = self.call("/api/query", dict(scope=scope))
            self.assertEqual(status, 200)
            self.assertIsInstance(rows, list)
        _, data = self.call("/api/bootstrap")
        p = next(p for p in data["products"] if p["id"] == "SP0002")
        unit = next(u for u in p["units"] if u["factor"] == 1)
        payload = dict(
            reference="HTTP-TEST",
            lines=[dict(product_id=p["id"], unit_id=unit["id"], quantity=1)],
            total=1,
        )
        status, qr = self.call("/api/payment-qr", payload)
        self.assertEqual(status, 200)
        self.assertEqual(qr["total"], unit["price"])
        self.assertIn("amount=" + str(int(unit["price"])), qr["url"])

    def test_health_and_assets(self):
        status, data = self.call("/health")
        self.assertEqual(status, 200)
        self.assertEqual(data["runtime"], "python")
        self.assertTrue(data["database_configured"])
        for path in [
            "/",
            "/build/app.js",
            "/build/app.css",
            "/figma/sale-alert.svg",
            "/fonts/DejaVuSans.ttf",
        ]:
            with self.client.open(BASE + path) as r:
                self.assertEqual(r.status, 200)
                self.assertGreater(len(r.read()), 50)
