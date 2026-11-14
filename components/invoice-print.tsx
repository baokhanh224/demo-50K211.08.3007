"use client";
import { useEffect, useRef, useState } from "react";
import { api, Button, Modal } from "./ui";
import { flushSync } from "react-dom";
import { datetime, money } from "@/lib/format";
import "./invoice-print.css";

const cancelledMessage = "Hóa đơn đã bị hủy, không thể in";

export default function InvoicePrint({ invoice, onClose }: any) {
  const [snapshot, setSnapshot] = useState(invoice);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(invoice.status === "Đã hủy");
  const [confirmation, setConfirmation] = useState(false);
  const [toast, setToast] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const printLock = useRef(false);

  useEffect(() => {
    let active = true;
    api("action", { action: "print-preview", id: invoice.id })
      .then((result) => {
        if (!active) return;
        setSnapshot(result);
        setBlocked(result.status === "Đã hủy");
      })
      .catch((error) => {
        if (!active) return;
        if (error.message === cancelledMessage) setBlocked(true);
        setToast({ kind: "error", text: error.message });
      })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [invoice.id]);

  async function printInvoice() {
    if (printLock.current || checking || blocked) return;
    printLock.current = true;
    setBusy(true);
    setToast(null);
    try {
      // Recheck with the server in case the invoice was cancelled after preview.
      const result = await api("action", { action: "print", id: snapshot.id });
      flushSync(() => setSnapshot(result));
      window.print();
      setToast({ kind: "success", text: "In hóa đơn thành công" });
    } catch (error: any) {
      if (error.message === cancelledMessage) setBlocked(true);
      setToast({ kind: "error", text: error.message });
    } finally {
      printLock.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="invoice-print-page">
      <h1>In hóa đơn</h1>
      <article className="invoice-print-sheet" aria-label="Hóa đơn bán hàng">
        <header className="invoice-print-brand">
          <h2>TẠP HÓA QUỲNH NHƯ</h2>
          <p>HÓA ĐƠN BÁN HÀNG</p>
        </header>
        <div className="invoice-print-meta">
          <p>Mã hóa đơn: {snapshot.id}</p>
          <p>Ngày giờ bán: {datetime(snapshot.created_at)}</p>
        </div>
        <table>
          <colgroup>{[257, 120, 144, 165].map((width, i) => <col key={i} style={{ width: `${width / 686 * 100}%` }} />)}</colgroup>
          <thead><tr><th>Tên sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
          <tbody>{snapshot.lines.map((line: any) => (
            <tr key={line.id}>
              <td>{line.product_name} ({line.unit_name})</td>
              <td>{line.quantity}</td>
              <td>{money(line.price)}</td>
              <td>{money(line.total)}</td>
            </tr>
          ))}</tbody>
        </table>
        <p className="invoice-print-total">Tổng tiền: {money(snapshot.total)}</p>
        <p className="invoice-print-method">Phương thức thanh toán: {snapshot.method}</p>
      </article>
      <div className="invoice-print-actions">
        <Button onClick={() => setConfirmation(true)} disabled={busy}>Hủy</Button>
        <Button variant="primary" onClick={printInvoice} disabled={checking || busy || blocked}>In hóa đơn</Button>
      </div>
      {toast && (
        <div className={`invoice-print-toast ${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
          {toast.kind === "error" ? <span className="invoice-print-alert"><img src="/figma/print-alert.svg" width="18" height="18" alt="" /></span> : <span className="invoice-print-tick" aria-hidden="true">✓</span>}
          <span>{toast.text}</span>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>×</button>
        </div>
      )}
      {confirmation && (
        <Modal title="Hủy in hóa đơn?" onClose={() => setConfirmation(false)} showClose={false} className="invoice-print-confirm" overlayClassName="invoice-print-overlay">
          <div className="invoice-print-warning" aria-hidden="true"><img src="/figma/print-warning-circle.svg" width="56" height="56" alt="" /><span>!</span></div>
          <p>Bạn có chắc chắn muốn hủy in hóa đơn không?</p>
          <div className="actions">
            <Button onClick={() => setConfirmation(false)}>Quay lại</Button>
            <Button variant="danger" onClick={onClose}>Xác nhận</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
