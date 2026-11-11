"use client";
import { useState, useEffect, useRef } from "react";
import { api, Button, Field, Notice, Empty, Badge, useApp } from "./ui";
import { date, today } from "@/lib/format";
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
export function Adjustments() {
  const { refresh, notify, confirm, navigate } = useApp();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const key = useRef(crypto.randomUUID());
  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    try {
      setRows(await api("query", { scope: "adjustments", q }));
      setQuantities({});
    } catch (e: any) {
      setRows([]);
      setError(e.message);
    }
  }
  useEffect(() => {
    search();
  }, []);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setErrors({});
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
      notify(r.message);
      setQuantities({});
      setReason("");
      key.current = crypto.randomUUID();
      await search();
    } catch (e: any) {
      setError(e.message);
      setErrors(e.fields || {});
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Điều chỉnh tồn kho</h1>
      <section className="card">
        <h2>Tìm sản phẩm cần điều chỉnh</h2>
        <form className="filters" onSubmit={search}>
          <div className="field search">
            <input
              aria-label="Từ khóa"
              value={q}
              placeholder="Tên sản phẩm, mã sản phẩm hoặc mã vạch"
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary">
            Tìm kiếm
          </Button>
        </form>
        <Notice text={error && !Object.keys(errors).length ? error : ""} />
        <div className="row" style={{ flexWrap: "wrap", marginBottom: 20 }}>
          {[...new Set(rows.map((r) => r.product_id))].map((id) => (
            <div className="summary" key={id}>
              <strong>
                {rows.find((r) => r.product_id === id)?.product_name}
              </strong>
              <div className="small muted">
                Tổng tồn kho hiện tại:{" "}
                {rows
                  .filter((r) => r.product_id === id)
                  .reduce((s, r) => s + r.remaining, 0)}
              </div>
            </div>
          ))}
        </div>
        <h3>Số lượng còn theo từng chi tiết phiếu nhập</h3>
        <table>
          <thead>
            <tr>
              <th>Chọn</th>
              <th>Sản phẩm</th>
              <th>Mã phiếu nhập</th>
              <th>Chi tiết phiếu nhập</th>
              <th>Hạn sử dụng</th>
              <th className="num">Số lượng đã nhập</th>
              <th className="num">Số lượng còn</th>
              <th>Số lượng thực tế</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td>
                  <input
                    style={{ height: 16 }}
                    aria-label={"Chọn chi tiết " + r.id}
                    type="checkbox"
                    checked={r.id in quantities}
                    onChange={(e) =>
                      setQuantities((prev) => {
                        const next = { ...prev };
                        if (e.target.checked) next[r.id] = String(r.remaining);
                        else delete next[r.id];
                        return next;
                      })
                    }
                  />
                </td>
                <td>
                  {r.product_name}
                  <small className="muted" style={{ display: "block" }}>
                    {r.product_id}
                  </small>
                </td>
                <td>{r.receipt_id}</td>
                <td>#{r.id}</td>
                <td>{date(r.expiry)}</td>
                <td className="num">{r.original_quantity}</td>
                <td className="num">
                  {r.remaining} {r.base_unit}
                </td>
                <td style={{ width: 180 }}>
                  <Field
                    label={"Số lượng thực tế #" + r.id}
                    value={quantities[r.id] ?? ""}
                    disabled={!(r.id in quantities)}
                    inputMode="numeric"
                    error={errors["line_" + r.id]}
                    onChange={(e: any) =>
                      setQuantities({ ...quantities, [r.id]: e.target.value })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty text="Không tìm thấy sản phẩm phù hợp" />}
        <Notice text={errors.lines} />
      </section>
      <section className="card">
        <Field label="Lý do điều chỉnh" error={errors.reason}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </section>
      <div className="actions">
        <Button
          onClick={() =>
            confirm("Bạn có chắc chắn muốn hủy điều chỉnh tồn kho không?", () =>
              navigate("inventory"),
            )
          }
        >
          Hủy
        </Button>
        <Button variant="primary" disabled={busy} onClick={save}>
          Lưu
        </Button>
      </div>
    </>
  );
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
