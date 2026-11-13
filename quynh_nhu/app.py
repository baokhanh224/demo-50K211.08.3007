"""Python is the only production server: API, auth, transactions, exports and static UI."""

import logging
import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool
from . import auth, service
from .db import database, run, session_token
from .errors import BusinessError
from .reports import report_data, export_snapshot
from .export import excel, pdf
from .payment_qr import payment_qr
from .seed import seed_data

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
app = FastAPI(
    title="Hệ thống quản lý bán hàng tạp hóa Quỳnh Như", docs_url=None, redoc_url=None
)
COOKIE = os.getenv("PYTHON_COOKIE_NAME", "qn_python_session")
ACTIONS = {
    "save-products": service.save_product,
    "delete-products": lambda d: service.delete_product(d.get("id")),
    "save-suppliers": service.save_supplier,
    "delete-suppliers": lambda d: service.delete_supplier(d.get("id")),
    "price": service.update_price,
    "validate-receipt-line": lambda d: (
        service.validate_receipt_line(d) and {"ok": True}
    ),
    "receipt": service.save_receipt,
    "save-customers": service.save_customer,
    "delete-customers": lambda d: service.delete_customer(d.get("id")),
    "find-customer": lambda d: service.find_customer(d.get("phone")),
    "quote": service.quote_cart,
    "checkout": service.checkout,
    "print-preview": lambda d: service.print_invoice(d.get("id")),
    "print": lambda d: service.print_invoice(d.get("id"), True),
    "check-cancel": lambda d: service.check_cancel(d.get("id")),
    "cancel-invoice": service.cancel_invoice,
    "check-return": lambda d: service.check_return(d.get("id")),
    "return": service.return_ticket,
    "adjust": service.adjust_stock,
    "settings": service.set_settings,
    "reset-demo": lambda d: seed_data(),
}


def handle_api(path, method, data, cookie, params, secure):
    marker = None
    try:
        with database():
            if path == "login" and method == "POST":
                if data.get("simulateError"):
                    raise BusinessError("Không thể đăng nhập. Vui lòng thử lại")
                token = auth.login(
                    data.get("username") or "", data.get("password") or ""
                )
                response = JSONResponse({"ok": True})
                response.set_cookie(
                    COOKIE,
                    auth.signed_token(token),
                    httponly=True,
                    secure=secure,
                    samesite="strict",
                    max_age=86400,
                    path="/",
                )
                return response
            token = auth.authenticate(cookie or "")
            marker = session_token.set(token)
            if path == "logout" and method == "POST":
                run("DELETE FROM session WHERE token=?", token)
                response = JSONResponse({"ok": True})
                response.delete_cookie(COOKIE, path="/")
                return response
            if path == "bootstrap":
                result = service.bootstrap()
            elif path == "payment-qr" and method == "POST":
                result = payment_qr(
                    service.quote_cart(data)["total"], data.get("reference") or ""
                )
            elif path == "report" and method == "POST":
                result = report_data(data)
            elif path == "query" and method == "POST":
                result = service.query(data)
            elif path == "action" and method == "POST":
                fn = ACTIONS.get(data.get("action"))
                if fn is None:
                    raise BusinessError("Không tìm thấy chức năng")
                result = fn(data)
            elif path == "detail" and params.get("type") in [
                "customer",
                "invoice",
                "receipt",
            ]:
                result = {
                    "customer": service.customer_detail,
                    "invoice": service.invoice_detail,
                    "receipt": service.receipt_detail,
                }[params["type"]](params.get("id") or "")
            elif path == "export":
                fmt = params.get("format")
                if fmt not in ["xlsx", "pdf"]:
                    raise BusinessError(
                        "Xuất báo cáo không thành công, vui lòng thử lại"
                    )
                report = export_snapshot(params.get("id") or "")
                try:
                    content = excel(report) if fmt == "xlsx" else pdf(report)
                except Exception as exc:
                    raise BusinessError(
                        "Xuất báo cáo không thành công, vui lòng thử lại"
                    ) from exc
                mime = (
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    if fmt == "xlsx"
                    else "application/pdf"
                )
                return Response(
                    content,
                    media_type=mime,
                    headers={
                        "Content-Disposition": f'attachment; filename="Bao-cao-Quynh-Nhu.{fmt}"',
                        "Cache-Control": "no-store",
                    },
                )
            else:
                return JSONResponse(
                    {"error": "Không tìm thấy chức năng", "fields": {}}, status_code=404
                )
            return JSONResponse(result, headers={"Cache-Control": "no-store"})
    except BusinessError as exc:
        return JSONResponse(
            {"error": str(exc), "fields": exc.fields}, status_code=exc.status
        )
    except Exception as exc:
        # Do not print payloads, credentials or database URLs.
        logging.getLogger(__name__).error("API %s failed: %s", path, type(exc).__name__)
        message = (
            "Không thể đăng nhập. Vui lòng thử lại"
            if path == "login"
            else "Không thể tải dữ liệu"
        )
        return JSONResponse({"error": message, "fields": {}}, status_code=500)
    finally:
        if marker is not None:
            session_token.reset(marker)


@app.api_route("/api/{path:path}", methods=["GET", "POST"])
async def api(path: str, request: Request):
    try:
        data = await request.json() if request.method == "POST" else {}
    except ValueError:
        return JSONResponse(
            {"error": "Dữ liệu không hợp lệ!", "fields": {}}, status_code=400
        )
    return await run_in_threadpool(
        handle_api,
        path,
        request.method,
        data,
        request.cookies.get(COOKIE),
        dict(request.query_params),
        request.url.scheme == "https",
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "runtime": "python",
        "database_configured": bool(os.getenv("PYTHON_DATABASE_URL")),
    }


@app.get("/")
def index():
    return FileResponse(
        ROOT / "templates/index.html", headers={"Cache-Control": "no-store"}
    )


# Static UI contains the same components, CSS, fonts and Figma SVGs as the reference release.
app.mount("/build", StaticFiles(directory=ROOT / "static/build"), name="build")
app.mount("/figma", StaticFiles(directory=ROOT / "static/figma"), name="figma")
app.mount("/fonts", StaticFiles(directory=ROOT / "static/fonts"), name="fonts")
