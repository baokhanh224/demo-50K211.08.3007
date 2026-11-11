import { paymentQr } from "@/lib/payment-qr";
import { reportData, exportSnapshot } from "@/lib/reports";
import { excel, pdf } from "@/lib/export";
import { NextResponse } from "next/server";
import { authenticate, login, signedToken } from "@/lib/auth";
import * as service from "@/lib/service";
import { seedData } from "@/lib/seed";
import { all, run, requestContext } from "@/lib/db";
import { BusinessError } from "@/lib/errors";
export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await params).path.join("/");
    if (path === "login" && request.method === "POST") {
      const d = await request.json();
      let token;
      try {
        if (d.simulateError) throw new Error("demo-auth");
        token = await login(d.username || "", d.password || "");
      } catch (e) {
        if (e instanceof BusinessError) throw e;
        throw new BusinessError("Không thể đăng nhập. Vui lòng thử lại");
      }
      const r = NextResponse.json({ ok: true });
      r.cookies.set("qn_session", signedToken(token), {
        httpOnly: true,
        secure: new URL(request.url).protocol === "https:",
        sameSite: "strict",
        path: "/",
        maxAge: 86400,
      });
      return r;
    }
    const token = await authenticate(request);
    return await requestContext.run({ token }, async () => {
      if (path === "logout" && request.method === "POST") {
        await run("DELETE FROM session WHERE token=?", token);
        const r = NextResponse.json({ ok: true });
        r.cookies.set("qn_session", "", { path: "/", maxAge: 0 });
        return r;
      }
      if (path === "payment-qr" && request.method === "POST") {
        const d = await request.json();
        const quote = await service.quoteCart(d);
        return NextResponse.json(paymentQr(quote.total, d.reference || ""), {
          headers: { "Cache-Control": "no-store" },
        });
      }
      if (path === "bootstrap")
        return NextResponse.json(await service.bootstrap());
      if (path === "report" && request.method === "POST")
        return NextResponse.json(await reportData(await request.json()));
      if (path === "export") {
        const u = new URL(request.url);
        const format = u.searchParams.get("format");
        if (!["xlsx", "pdf"].includes(format || ""))
          throw new BusinessError(
            "Xuất báo cáo không thành công, vui lòng thử lại",
          );
        const report = await exportSnapshot(u.searchParams.get("id") || "");
        try {
          const bytes =
            format === "xlsx" ? await excel(report) : await pdf(report);
          return new Response(new Uint8Array(bytes), {
            headers: {
              "Content-Type":
                format === "xlsx"
                  ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  : "application/pdf",
              "Content-Disposition": `attachment; filename="Bao-cao-Quynh-Nhu.${format}"`,
              "Cache-Control": "no-store",
            },
          });
        } catch {
          throw new BusinessError(
            "Xuất báo cáo không thành công, vui lòng thử lại",
          );
        }
      }
      if (path === "query" && request.method === "POST")
        return NextResponse.json(await service.query(await request.json()));
      if (path === "detail") {
        const url = new URL(request.url);
        if (url.searchParams.get("type") === "customer")
          return NextResponse.json(
            await service.customerDetail(url.searchParams.get("id") || ""),
          );
        if (url.searchParams.get("type") === "invoice")
          return NextResponse.json(
            await service.invoiceDetail(url.searchParams.get("id") || ""),
          );
        if (url.searchParams.get("type") === "receipt")
          return NextResponse.json(
            await service.receiptDetail(url.searchParams.get("id") || ""),
          );
      }
      if (path === "action" && request.method === "POST") {
        const d = await request.json();
        let result;
        switch (d.action) {
          case "save-products":
            result = await service.saveProduct(d);
            break;
          case "delete-products":
            result = await service.deleteProduct(d.id);
            break;
          case "save-suppliers":
            result = await service.saveSupplier(d);
            break;
          case "delete-suppliers":
            result = await service.deleteSupplier(d.id);
            break;
          case "price":
            result = await service.updatePrice(d);
            break;
          case "validate-receipt-line":
            await service.validateReceiptLine(d);
            result = { ok: true };
            break;
          case "receipt":
            result = await service.saveReceipt(d);
            break;
          case "save-customers":
            result = await service.saveCustomer(d);
            break;
          case "delete-customers":
            result = await service.deleteCustomer(d.id);
            break;
          case "find-customer":
            result = await service.findCustomer(d.phone);
            break;
          case "quote":
            result = await service.quoteCart(d);
            break;
          case "checkout":
            result = await service.checkout(d);
            break;
          case "print-preview":
            result = await service.printInvoice(d.id);
            break;
          case "print":
            result = await service.printInvoice(d.id, true);
            break;
          case "check-cancel":
            result = await service.checkCancel(d.id);
            break;
          case "cancel-invoice":
            result = await service.cancelInvoice(d);
            break;
          case "check-return":
            result = await service.checkReturn(d.id);
            break;
          case "return":
            result = await service.returnTicket(d);
            break;
          case "adjust":
            result = await service.adjustStock(d);
            break;
          case "reset-demo":
            result = await seedData();
            break;
          case "settings":
            result = await service.setSettings(d);
            break;
          default:
            throw new BusinessError("Không tìm thấy chức năng");
        }
        return NextResponse.json(result);
      }
      return NextResponse.json(
        { error: "Không tìm thấy chức năng" },
        { status: 404 },
      );
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e instanceof BusinessError ? e.message : "Không thể tải dữ liệu",
        fields: e.fields || {},
      },
      { status: e.status || 500 },
    );
  }
}
export { handler as GET, handler as POST };
