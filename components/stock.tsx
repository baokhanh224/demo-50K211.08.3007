"use client";
import { useState, useEffect, useRef, useId } from "react";
import { api, Button, Field, Notice, Empty, Badge, Modal, useApp } from "./ui";
import { date, today } from "@/lib/format";
import "./adjustments.css";
import { SupplierToast } from "./suppliers";
function lotStatus(l: any) {
  if (!l.remaining) return "Hết hàng";
  if (l.expiry && l.expiry < today()) return "Đã hết hạn";
  const t = new Date();
  t.setDate(t.getDate() + 30);
  const in30 = t.toISOString().slice(0, 10);
  if (l.expiry && l.expiry <= in30) return "Sắp hết hạn";
  return "Bình thường";
}
export function Inventory() {
  const { navigate } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Tất cả");
  const [applied, setApplied] = useState("Tất cả");
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setApplied(filter);
    try {
      setRows(await api("query", { scope: "inventory", q, filter }));
    } catch (e: any) {
      setRows([]);
      setError(e.message);
    }
  }
  useEffect(() => {
    search();
  }, []);
  const byLot = ["Sắp hết hạn", "Đã hết hạn"].includes(applied);
  return (
    <>
      <h1>Tra cứu tồn kho và cảnh báo</h1>
      <section className="card">
        <h2>Tra cứu tồn kho</h2>
        <form className="filters" onSubmit={search}>
          <div className="field search">
            <input
              aria-label="Từ khóa"
              placeholder="Tên sản phẩm, mã sản phẩm hoặc mã vạch"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Field label="Trạng thái">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {[
                "Tất cả",
                "Dưới mức cảnh báo tồn kho",
                "Sắp hết hạn",
                "Đã hết hạn",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Button variant="primary" type="submit">
            Tìm kiếm
          </Button>
        </form>
        <Notice text={error} />
        <table>
          <thead>
            <tr>
              <th>Mã sản phẩm</th>
              <th>Tên sản phẩm</th>
              {byLot ? (
                <>
                  <th>Mã phiếu nhập</th>
                  <th>Chi tiết phiếu nhập</th>
                  <th>Hạn sử dụng</th>
                  <th className="num">Số lượng còn</th>
                </>
              ) : (
                <>
                  <th>Đơn vị tính</th>
                  <th className="num">Số lượng tồn</th>
                  <th className="num">Có thể bán</th>
                  <th className="num">Mức tồn tối thiểu</th>
                </>
              )}
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td className="code">{r.product_id || r.id}</td>
                <td>{r.product_name || r.name}</td>
                {byLot ? (
                  <>
                    <td>{r.receipt_id}</td>
                    <td>#{r.id}</td>
                    <td>{date(r.expiry)}</td>
                    <td className="num">
                      {r.remaining} {r.base_unit}
                    </td>
                  </>
                ) : (
                  <>
                    <td>{r.base_unit}</td>
                    <td className="num">{r.stock}</td>
                    <td className="num">{r.sellable}</td>
                    <td className="num">{r.min_stock}</td>
                  </>
                )}
                <td>
                  <Badge
                    tone={
                      byLot
                        ? r.expiry < today()
                          ? "red"
                          : "orange"
                        : r.stock <= r.min_stock
                          ? "orange"
                          : "green"
                    }
                  >
                    {byLot
                      ? lotStatus(r)
                      : r.stock <= r.min_stock
                        ? "Dưới mức cảnh báo tồn kho"
                        : "Bình thường"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !error && (
          <Empty text="Không tìm thấy sản phẩm phù hợp" />
        )}
        <div className="table-footer">
          {rows.length} {byLot ? "chi tiết phiếu nhập" : "sản phẩm"}
        </div>
      </section>
      <div className="actions">
        <Button onClick={() => navigate("adjustments")}>
          Điều chỉnh tồn kho
        </Button>
        <Button variant="primary" onClick={() => navigate("receipts")}>
          Nhập hàng
        </Button>
      </div>
    </>
  );
}
function adjustmentLotCode(id: number) { return "CTN" + String(id).padStart(3, "0"); }
function AdjustmentLotField({ value }: { value: string }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>Chi tiết phiếu nhập đã chọn</label><div className="adjustment-locked-input"><input id={id} aria-label="Chi tiết phiếu nhập đã chọn" value={value} placeholder="Chưa chọn chi tiết" readOnly /><img src="/figma/74fe3.svg" width="15" height="15" alt="" /></div></div>;
}
export function Adjustments() {
  const { refresh, navigate } = useApp();
  const [q, setQ] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 6500);
    return () => clearTimeout(timer);
  }, [success]);
  const [busy, setBusy] = useState(false);
  const key = useRef(crypto.randomUUID());
  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setSuccess("");
    try {
      setRows(await api("query", { scope: "adjustments", q }));
      setQuantities({});
      return true;
    } catch (e: any) {
      setRows([]);
      setError(e.message);
      return false;
    }
  }
  useEffect(() => {
    search();
  }, []);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const r = await api("action", {
        action: "adjust",
        request_key: key.current,
        reason,
        lines: Object.entries(quantities).map(([id, quantity]) => ({
          lot_id: Number(id),
          quantity,
        })),
      });
      await refresh();
      setQuantities({});
      setReason("");
      key.current = crypto.randomUUID();
      if (await search()) setSuccess(r.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const groups = [...new Set(rows.map(r => r.product_id))].map(id => ({
    id, rows: rows.filter(r => r.product_id === id),
  }));
  const selected = rows.filter(r => r.id in quantities);
  return <div className="adjustments-page">
    <h1>Điều chỉnh tồn kho</h1>
    {(error || success) && <SupplierToast error={!!error} text={error || success} onClose={() => { setError(""); setSuccess(""); }} />}
    <section className="card adjustment-search-card">
      <h2>Tìm sản phẩm</h2>
      <form className="adjustment-search-form" onSubmit={search}>
        <div className="adjustment-search-input"><img src="/figma/7b2e8.svg" width="16" height="16" alt="" /><input aria-label="Từ khóa" value={q} placeholder="Tìm theo mã hoặc tên sản phẩm" onChange={e => setQ(e.target.value)} /></div>
        <Button type="submit" variant="primary"><img src="/figma/86d1d.svg" width="18" height="18" alt="" />Tìm kiếm</Button>
      </form>
    </section>
    <section className="card adjustment-lots-card">
      <h2>Tồn kho theo chi tiết phiếu nhập</h2>
      {groups.map(group => <div className="adjustment-lot-group" key={group.id}>
        <p className="adjustment-product-summary">{group.rows[0].product_name}  -  Tổng tồn kho: {group.rows.reduce((sum, r) => sum + r.remaining, 0)}</p>
        <div className="table-wrap"><table>
          <thead><tr><th>Chọn</th><th>Mã chi tiết nhập</th><th>Mã phiếu nhập</th><th>Hạn sử dụng</th><th>Số lượng còn</th></tr></thead>
          <tbody>{group.rows.map(r => <tr key={r.id}>
            <td><input aria-label={"Chọn chi tiết " + r.id} type="checkbox" checked={r.id in quantities} onChange={e => setQuantities(prev => {
              const next = { ...prev };
              if (e.target.checked) next[r.id] = String(r.remaining);
              else delete next[r.id];
              return next;
            })} /></td>
            <td>{adjustmentLotCode(r.id)}</td><td>{r.receipt_id}</td><td>{date(r.expiry)}</td><td>{r.remaining}</td>
          </tr>)}</tbody>
        </table></div>
      </div>)}
      {!rows.length && <Empty text="Không tìm thấy sản phẩm phù hợp" />}
    </section>
    <section className="card adjustment-details-card">
      <h2>Thông tin điều chỉnh</h2>
      <div className="adjustment-edit-content">
        <div className="adjustment-edit-rows">{(selected.length ? selected : [null]).map(r => <div className="adjustment-edit-row" role="group" aria-label={r ? "Điều chỉnh " + adjustmentLotCode(r.id) : "Chưa chọn chi tiết"} key={r?.id ?? "empty"}>
          <AdjustmentLotField value={r ? adjustmentLotCode(r.id) : ""} />
          <Field label="Số lượng tồn mới" placeholder="Nhập số lượng" inputMode="numeric" value={r ? quantities[r.id] : ""} disabled={!r} onChange={(e: any) => r && setQuantities({ ...quantities, [r.id]: e.target.value })} />
        </div>)}</div>
        <Field label="Lý do điều chỉnh" placeholder="Nhập lý do điều chỉnh" value={reason} onChange={(e: any) => setReason(e.target.value)} />
      </div>
    </section>
    <div className="actions adjustment-page-actions"><Button disabled={busy} onClick={() => setCancelOpen(true)}>Hủy</Button><Button variant="primary" disabled={busy} onClick={save}>Lưu</Button></div>
    {cancelOpen && <Modal title="Xác nhận" onClose={() => setCancelOpen(false)} showClose={false} className="adjustment-cancel" overlayClassName="adjustment-cancel-overlay">
      <div className="adjustment-cancel-icon"><img src="/figma/a32c7.svg" width="26" height="26" alt="" /></div>
      <p>Bạn có chắc chắn muốn hủy điều chỉnh tồn kho không?</p>
      <div className="actions"><Button onClick={() => setCancelOpen(false)}>Quay lại</Button><Button variant="danger" onClick={() => { setCancelOpen(false); navigate("inventory"); }}>Xác nhận</Button></div>
    </Modal>}
  </div>;
}
export function Settings() {
  const { data, refresh, notify, confirm } = useApp();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [local, setLocal] = useState<any>(data.settings || {});
  useEffect(() => setLocal(data.settings || {}), [data.settings]);
  async function toggle(key: string, value: boolean) {
    setPending(true);
    setError("");
    setLocal((prev: any) => ({ ...prev, [key]: value }));
    try {
      await api("action", { action: "settings", [key]: value });
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <h1>Cài đặt demo</h1>
      <section className="card">
        <div className="card-head">
          <h2>Mô phỏng ngoại lệ</h2>
          <Button
            variant="danger"
            onClick={() =>
              confirm(
                "Bạn có chắc chắn muốn khôi phục dữ liệu mẫu? Toàn bộ dữ liệu demo hiện tại sẽ được thay thế.",
                async () => {
                  try {
                    const r = await api("action", { action: "reset-demo" });
                    await refresh();
                    notify(r.message);
                  } catch (e: any) {
                    setError(e.message);
                  }
                },
              )
            }
          >
            Khôi phục dữ liệu mẫu
          </Button>
        </div>
        <p className="muted">
          Bật công tắc, sau đó trở lại màn hình cần trình diễn. Lỗi lưu xảy ra
          trong transaction để kiểm tra hoàn tác. Lỗi một lần tự tắt sau khi
          được sử dụng.
        </p>
        <Notice text={error} />
        <div style={{ display: "grid", gap: 24, margin: "30px 0" }}>
          {[
            ["printer_error", "Lỗi máy in"],
            ["fail_save", "Buộc lỗi lưu một lần"],
            ["fail_load", "Buộc lỗi tải dữ liệu một lần"],
            [
              "fail_export_read",
              "Buộc lỗi truy xuất dữ liệu xuất báo cáo một lần",
            ],
            ["fail_export_file", "Buộc lỗi tạo tệp báo cáo một lần"],
          ].map(([key, label]) => (
            <label className="checkbox" key={key}>
              <input
                type="checkbox"
                disabled={pending}
                checked={!!local[key]}
                onChange={(e) => toggle(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
        <p className="muted small">
          Máy in sử dụng hộp thoại in của trình duyệt. VietQR chứa số tiền
          theo giỏ hàng; kiểm tra tiền vào tài khoản trước khi xác nhận.
        </p>
      </section>
    </>
  );
}
