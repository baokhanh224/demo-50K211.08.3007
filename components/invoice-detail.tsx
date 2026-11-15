"use client";
import { Button, Modal, Notice } from "./ui";
import { datetime, money } from "@/lib/format";
import "./invoice-detail.css";

export default function InvoiceDetail({ invoice, error, onClose, onReturn, onPrint }: any) {
  return <Modal title="Chi tiết hóa đơn" className="invoice-detail" overlayClassName="invoice-detail-overlay" showClose={false} onClose={onClose}>
    <button type="button" className="invoice-detail-close" onClick={onClose}>Đóng</button>
    <div className="invoice-detail-meta">
      <p>Mã hóa đơn: {invoice.id}</p>
      <p>Ngày giờ bán: {datetime(invoice.created_at)}</p>
      <p>Khách hàng: {invoice.customer_name ? `${invoice.customer_name}${invoice.customer_phone ? ` (${invoice.customer_phone})` : ""}` : "—"}</p>
    </div>
    <div className="invoice-detail-table"><table>
      <colgroup><col style={{ width: "40%" }} /><col style={{ width: "12.5%" }} /><col style={{ width: "20%" }} /><col style={{ width: "27.5%" }} /></colgroup>
      <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
      <tbody>{invoice.lines.map((line: any) => <tr key={line.id}>
        <td>{line.product_name} ({line.unit_name})</td><td>{line.quantity}</td><td>{money(line.price)}</td><td>{money(line.total)}</td>
      </tr>)}</tbody>
    </table></div>
    <div className="invoice-detail-summary">
      <p className="invoice-detail-total">Tổng tiền: {money(invoice.total)}</p>
      <p>Phương thức thanh toán: {invoice.method}</p>
      <p>Trạng thái: {invoice.status}</p>
    </div>
    <Notice text={error} />
    <div className="invoice-detail-actions"><Button onClick={onReturn}>Đổi/trả hàng</Button><Button variant="primary" onClick={onPrint}>In hóa đơn</Button></div>
  </Modal>;
}
