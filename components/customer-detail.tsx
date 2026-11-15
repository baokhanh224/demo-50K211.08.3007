"use client";
import { Modal } from "./ui";
import { datetime, money } from "@/lib/format";
import "./customer-detail.css";

type Customer = {
  id: string; name: string; phone: string; address?: string;
  invoices?: { id: string; created_at: string; total: number; status: string }[];
};
export default function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  return <Modal title="Thông tin khách hàng" className="customer-detail" overlayClassName="customer-detail-overlay" showClose={false} onClose={onClose}>
    <button type="button" className="customer-detail-close" onClick={onClose}>Đóng</button>
    <dl className="customer-detail-info">
      <div><dt>Mã khách hàng</dt><dd>{customer.id}</dd></div>
      <div><dt>Tên khách hàng</dt><dd>{customer.name}</dd></div>
      <div><dt>Số điện thoại</dt><dd>{customer.phone || "—"}</dd></div>
      <div><dt>Địa chỉ</dt><dd>{customer.address || "—"}</dd></div>
    </dl>
    <section className="customer-purchase-history" aria-labelledby="customer-purchase-history-title">
      <h3 id="customer-purchase-history-title">Lịch sử mua hàng</h3>
      <table>
        <thead><tr><th>Mã hóa đơn</th><th>Ngày giờ bán</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
        <tbody>{customer.invoices?.length ? customer.invoices.map(invoice => <tr key={invoice.id}>
          <td>{invoice.id}</td><td>{datetime(invoice.created_at)}</td><td>{money(invoice.total)}</td><td>{invoice.status}</td>
        </tr>) : <tr><td colSpan={4} className="customer-history-empty">Chưa có lịch sử mua hàng</td></tr>}</tbody>
      </table>
    </section>
  </Modal>;
}
