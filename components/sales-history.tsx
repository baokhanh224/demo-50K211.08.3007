"use client";
import { useState, useEffect, useRef } from "react";
import { api, Button, Field, Notice, Empty, Badge, Modal, useApp } from "./ui";
import { money, date, datetime, iso } from "@/lib/format";
export default function SalesHistory({ operation = "history" }: any) {
  const { refresh, notify, confirm } = useApp();
  const cancelKey = useRef(crypto.randomUUID());
  const [q, setQ] = useState("");
  const [phone, setPhone] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [cancel, setCancel] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [mode, setMode] = useState("detail");
  const [returning, setReturning] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    try {
      setRows(
        await api("query", {
          scope: "sales-history",
          invoice_id: q,
          phone,
          from: iso(from),
          to: iso(to),
        }),
      );
    } catch (e: any) {
      setRows([]);
      setError(e.message);
    }
  }
  async function open(id: string) {
    setError("");
    try {
      setDetail(await api("detail?type=invoice&id=" + id));
      setMode("detail");
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    search();
    const id = sessionStorage.getItem("invoiceToOpen");
    if (id) {
      sessionStorage.removeItem("invoiceToOpen");
      open(id);
    }
  }, []);
  async function requestCancel(id: string) {
    setCancelError("");
    setError("");
    try {
      const i = await api("action", { action: "check-cancel", id });
      cancelKey.current = crypto.randomUUID();
      setReason("");
      setCancel(i);
    } catch (e: any) {
      if (detail) setCancelError(e.message);
      else setError(e.message);
    }
  }
  async function doCancel() {
    if (busy) return;
    setBusy(true);
    setCancelError("");
    try {
      const r = await api("action", {
        action: "cancel-invoice",
        id: cancel.id,
        reason,
        request_key: cancelKey.current,
      });
      setCancel(null);
      notify(r.message);
      await refresh();
      await search();
      if (detail) await open(detail.id);
    } catch (e: any) {
      setCancelError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function requestReturn(id: string) {
    setError("");
    setCancelError("");
    try {
      const i = await api("action", { action: "check-return", id });
      setDetail(null);
      setReturning(i);
    } catch (e: any) {
      if (detail) setCancelError(e.message);
      else setError(e.message);
    }
  }
  async function printPreview() {
    setCancelError("");
    try {
      const i = await api("action", { action: "print-preview", id: detail.id });
      setDetail(i);
      setMode("print");
    } catch (e: any) {
      setCancelError(e.message);
    }
  }
  async function print() {
    try {
      await api("action", { action: "print", id: detail.id });
      window.print();
      notify("In hóa đơn thành công");
    } catch (e: any) {
      setCancelError(e.message);
    }
  }
  if (returning)
    return (
      <ReturnForm
        invoice={returning}
        onClose={() => {
          setReturning(null);
          open(returning.id);
        }}
        onSuccess={async () => {
          const id = returning.id;
          setReturning(null);
          await refresh();
          await search();
          await open(id);
        }}
      />
    );
  const title =
    operation === "cancel"
      ? "Hủy hóa đơn"
      : operation === "return"
        ? "Xử lý đổi/trả hàng"
        : "Tra cứu lịch sử bán hàng";
  return (
    <>
      <h1>{title}</h1>
      <section className="card">
        <h2>
          {operation === "cancel"
            ? "Chọn hóa đơn cần hủy"
            : "Danh sách hóa đơn"}
        </h2>
        <form className="filters" onSubmit={search}>
          <Field label="Mã hóa đơn" placeholder="Nhập mã hóa đơn" value={q} onChange={(e:any) => setQ(e.target.value)} />
          <Field label="Số điện thoại khách hàng" placeholder="Nhập số điện thoại" value={phone} onChange={(e:any) => setPhone(e.target.value)} />
          <Field
            label="Từ ngày"
            placeholder="dd/mm/yyyy"
            value={from}
            onChange={(e: any) => setFrom(e.target.value)}
          />
          <Field
            label="Đến ngày"
            placeholder="dd/mm/yyyy"
            value={to}
            onChange={(e: any) => setTo(e.target.value)}
          />
          <Button variant="primary" type="submit">
            Tìm kiếm
          </Button>
        </form>
        <Notice text={error} />
        <table>
          <thead>
            <tr>
              <th>Mã hóa đơn</th>
              <th>Ngày giờ bán</th>
              <th>Khách hàng</th>
              <th className="num">Tổng tiền</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="clickable" onClick={() => open(r.id)}>
                <td className="code">{r.id}</td>
                <td>{datetime(r.created_at)}</td>
                <td>{r.customer_name || "—"}</td>
                <td className="num">{money(r.total)}</td>
                <td>
                  <Badge tone={r.status === "Đã hủy" ? "red" : "green"}>
                    {r.status}
                  </Badge>
                </td>
                {operation === "history" ? <td onClick={(e) => e.stopPropagation()}><Button variant="tiny" onClick={() => open(r.id)}>Xem</Button></td> : (
                  <td onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="tiny"
                      onClick={() =>
                        operation === "cancel"
                          ? requestCancel(r.id)
                          : requestReturn(r.id)
                      }
                    >
                      {operation === "cancel" ? "Hủy" : "Đổi/trả hàng"}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !error && (
          <Empty text="Không tìm thấy hóa đơn phù hợp" />
        )}
      </section>
      {detail && (
        <Modal
          wide
          title={mode === "print" ? "Xem trước hóa đơn" : "Chi tiết hóa đơn"}
          onClose={() => {
            if (mode === "print")
              confirm("Bạn có chắc chắn muốn hủy in hóa đơn không?", () => {
                setDetail(null);
                setMode("detail");
              });
            else {
              setDetail(null);
              setCancelError("");
            }
          }}
        >
          <div className={mode === "print" ? "print-sheet" : ""}>
            {mode === "print" && (
              <div className="print-brand">
                <p>TIỆM TẠP HÓA</p>
                <h2>Quỳnh Như</h2>
                <p>HÓA ĐƠN BÁN HÀNG</p>
              </div>
            )}
            <div className="detail-meta">
              <div>
                <small>Mã hóa đơn</small>
                <strong>{detail.id}</strong>
              </div>
              <div>
                <small>Ngày giờ bán</small>
                {datetime(detail.created_at)}
              </div>
              <div>
                <small>Khách hàng</small>
                {detail.customer_name
                  ? `${detail.customer_name} (${detail.customer_phone})`
                  : "—"}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th className="num">SL</th>
                  <th className="num">Đơn giá</th>
                  <th className="num">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.map((l: any) => (
                  <tr key={l.id}>
                    <td>{l.product_name} ({l.unit_name})</td>
                    <td className="num">{l.quantity}</td>
                    <td className="num">{money(l.price)}</td>
                    <td className="num">{money(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="total-row">
              <span>Tổng tiền</span>
              <strong>{money(detail.total)}</strong>
            </div>
            <p>Phương thức thanh toán: {detail.method}</p>
            {detail.method === "Tiền mặt" && (
              <p>
                Tiền khách đưa: {money(detail.cash)} · Tiền thừa:{" "}
                {money(detail.change)}
              </p>
            )}
            <p>
              Trạng thái:{" "}
              <Badge tone={detail.status === "Đã hủy" ? "red" : "green"}>
                {detail.status}
              </Badge>
            </p>
            {detail.cancelled_at && (
              <p>
                Lý do hủy hóa đơn: {detail.cancel_reason}
                <br />
                Thời gian hủy: {datetime(detail.cancelled_at)}
              </p>
            )}
          </div>
          {mode === "detail" && (
            <>
              <details className="no-print">
                <summary>Phân bổ xuất kho</summary>
                <table style={{ marginTop: 16 }}>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Mã phiếu nhập</th>
                      <th>Chi tiết phiếu nhập</th>
                      <th>Hạn sử dụng</th>
                      <th className="num">Số lượng xuất</th>
                      <th className="num">Đã trả</th>
                      <th className="num">Đã hoàn kho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.flatMap((l: any) =>
                      l.allocations.map((a: any) => (
                        <tr key={a.id}>
                          <td>{l.product_name}</td>
                          <td>{a.receipt_id}</td>
                          <td>#{a.lot_id}</td>
                          <td>{date(a.expiry)}</td>
                          <td className="num">{a.quantity}</td>
                          <td className="num">{a.returned}</td>
                          <td className="num">
                            {detail.status === "Đã hủy"
                              ? a.quantity
                              : a.restocked}
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </details>
              {detail.tickets.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3>Lịch sử đổi/trả hàng</h3>
                  {detail.tickets.map((t: any) => (
                    <details key={t.id} style={{ marginBottom: 16 }}>
                      <summary>
                        {t.id} · {datetime(t.created_at)} · Tiền chênh lệch:{" "}
                        {money(t.difference)}
                      </summary>
                      <table>
                        <thead>
                          <tr>
                            <th>Sản phẩm</th>
                            <th>Loại</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                            <th>Nhập kho</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.lines.map((l: any) => (
                            <tr key={l.id}>
                              <td>{l.product_name}</td>
                              <td>
                                {l.kind === "return" ? "Hàng trả" : "Hàng đổi"}
                              </td>
                              <td>
                                {l.quantity} {l.unit_name}
                              </td>
                              <td>{money(l.total)}</td>
                              <td>
                                {l.kind === "return"
                                  ? l.restock
                                    ? "Nhập lại kho"
                                    : "Không nhập lại kho"
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="no-print">
            <Notice text={cancel ? "" : cancelError} />
          </div>
          <div className="actions">
            {mode === "print" ? (
              <>
                <Button
                  onClick={() =>
                    confirm(
                      "Bạn có chắc chắn muốn hủy in hóa đơn không?",
                      () => {
                        setDetail(null);
                        setMode("detail");
                      },
                    )
                  }
                >
                  Hủy
                </Button>
                <Button variant="primary" onClick={print}>
                  In hóa đơn
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setDetail(null);
                    setCancelError("");
                  }}
                >
                  Đóng
                </Button>
                <Button
                  variant="danger"
                  onClick={() => requestCancel(detail.id)}
                >
                  Hủy
                </Button>
                <Button onClick={() => requestReturn(detail.id)}>
                  Đổi/trả hàng
                </Button>
                <Button variant="primary" onClick={printPreview}>
                  In hóa đơn
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}
      {cancel && (
        <Modal
          title="Nhập lý do hủy hóa đơn"
          onClose={() => {
            setCancel(null);
            setCancelError("");
          }}
        >
          <p>
            Hóa đơn: <strong>{cancel.id}</strong>
          </p>
          <Field
            label="Lý do hủy hóa đơn"
            error={
              cancelError === "Vui lòng nhập lý do hủy hóa đơn"
                ? cancelError
                : ""
            }
          >
            <textarea
              placeholder="Nhập lý do hủy hóa đơn"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setCancelError("");
              }}
            />
          </Field>
          <Notice
            text={
              cancelError !== "Vui lòng nhập lý do hủy hóa đơn"
                ? cancelError
                : ""
            }
          />
          <div className="actions">
            <Button
              onClick={() => {
                setCancel(null);
                setCancelError("");
              }}
            >
              Quay lại
            </Button>
            <Button variant="primary" disabled={busy} onClick={doCancel}>
              Xác nhận
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function ReturnForm({ invoice, onClose, onSuccess }: any) {
  const { data, notify } = useApp();
  const [returns, setReturns] = useState<any>({});
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [onlyReturn, setOnlyReturn] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const key = useRef(crypto.randomUUID());
  const returnTotal = invoice.lines.reduce(
    (s: number, l: any) =>
      s + (returns[l.id] ? Number(returns[l.id].quantity || 0) * l.price : 0),
    0,
  );
  const exchangeTotal = onlyReturn
    ? 0
    : exchanges.reduce((s, l) => {
        const p = data.products.find((p: any) => p.id === l.product_id);
        const u = p?.units.find((u: any) => u.id === Number(l.unit_id));
        return s + Number(l.quantity || 0) * (u?.price || 0);
      }, 0);
  const difference = exchangeTotal - returnTotal;
  function changeReturn(id: number, field: string, value: any) {
    setReturns((prev: any) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    setConfirmed(false);
    setError("");
  }
  function changeExchange(index: number, field: string, value: any) {
    setExchanges(
      exchanges.map((l, i) =>
        i !== index
          ? l
          : field === "product_id"
            ? {
                ...l,
                product_id: value,
                unit_id:
                  data.products.find((p: any) => p.id === value)?.units[0]
                    ?.id || "",
              }
            : { ...l, [field]: value },
      ),
    );
    setConfirmed(false);
    setError("");
  }
  async function finish() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await api("action", {
        action: "return",
        invoice_id: invoice.id,
        request_key: key.current,
        returns: Object.entries(returns).map(([id, l]: any) => ({
          line_id: Number(id),
          ...l,
        })),
        exchanges,
        only_return: onlyReturn,
        money_confirmed: confirmed,
      });
      notify(r.message);
      await onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Xử lý đổi/trả hàng</h1>
      <div className="card detail-meta">
        <div>
          <small>Mã hóa đơn</small>
          <strong>{invoice.id}</strong>
        </div>
        <div>
          <small>Ngày bán</small>
          {datetime(invoice.created_at)}
        </div>
      </div>
      <div className="sale-layout">
        <div>
          <section className="card">
            <h2>Hàng trả</h2>
            <div className="table-wrap">
              <table className="return-table">
                <thead>
                  <tr>
                    <th>Chọn</th>
                    <th>Tên sản phẩm</th>
                    <th>Đơn vị bán</th>
                    <th className="num">Số lượng đã mua</th>
                    <th className="num">Số lượng còn được trả</th>
                    <th>Số lượng trả</th>
                    <th className="num">Đơn giá</th>
                    <th>Nhập kho</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((l: any) => (
                    <tr key={l.id}>
                      <td>
                        <input
                          style={{ height: 16 }}
                          aria-label={"Chọn trả " + l.product_name}
                          type="checkbox"
                          disabled={!l.returnable}
                          checked={!!returns[l.id]}
                          onChange={(e) => {
                            if (e.target.checked)
                              setReturns({
                                ...returns,
                                [l.id]: { quantity: "1", restock: true },
                              });
                            else
                              setReturns((prev: any) => {
                                const next = { ...prev };
                                delete next[l.id];
                                return next;
                              });
                            setConfirmed(false);
                          }}
                        />
                      </td>
                      <td>{l.product_name}</td>
                      <td>{l.unit_name}</td>
                      <td className="num">{l.quantity}</td>
                      <td className="num" data-testid={"returnable-" + l.id}>
                        {l.returnable}
                      </td>
                      <td>
                        <input
                          style={{ width: 85 }}
                          aria-label={"Số lượng trả " + l.product_name}
                          disabled={!returns[l.id]}
                          value={returns[l.id]?.quantity ?? "0"}
                          onChange={(e) =>
                            changeReturn(l.id, "quantity", e.target.value)
                          }
                        />
                      </td>
                      <td className="num">{money(l.price)}</td>
                      <td>
                        <select
                          style={{ width: 150, fontSize: 12 }}
                          aria-label={"Nhập kho " + l.product_name}
                          disabled={!returns[l.id]}
                          value={
                            returns[l.id]?.restock === false ? "no" : "yes"
                          }
                          onChange={(e) =>
                            changeReturn(
                              l.id,
                              "restock",
                              e.target.value === "yes",
                            )
                          }
                        >
                          <option value="yes">Nhập lại kho</option>
                          <option value="no">Không nhập lại kho</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <div className="card-head">
              <h2>Hàng đổi</h2>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={onlyReturn}
                  onChange={(e) => {
                    setOnlyReturn(e.target.checked);
                    setConfirmed(false);
                  }}
                />
                Chỉ trả hàng
              </label>
            </div>
            {!onlyReturn && (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Đơn vị bán</th>
                      <th>Số lượng</th>
                      <th className="num">Đơn giá</th>
                      <th className="num">Thành tiền</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchanges.map((l, index) => {
                      const p = data.products.find(
                        (p: any) => p.id === l.product_id,
                      );
                      const u = p?.units.find(
                        (u: any) => u.id === Number(l.unit_id),
                      );
                      return (
                        <tr key={index}>
                          <td>
                            <select
                              aria-label={"Sản phẩm đổi " + (index + 1)}
                              value={l.product_id}
                              onChange={(e) =>
                                changeExchange(
                                  index,
                                  "product_id",
                                  e.target.value,
                                )
                              }
                            >
                              {data.products.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              aria-label={"Đơn vị bán đổi " + (index + 1)}
                              value={l.unit_id}
                              onChange={(e) =>
                                changeExchange(index, "unit_id", e.target.value)
                              }
                            >
                              {p?.units.map((u: any) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              aria-label={"Số lượng đổi " + (index + 1)}
                              style={{ width: 75 }}
                              value={l.quantity}
                              onChange={(e) =>
                                changeExchange(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="num">{money(u?.price || 0)}</td>
                          <td className="num">
                            {money(Number(l.quantity || 0) * (u?.price || 0))}
                          </td>
                          <td>
                            <Button
                              variant="link"
                              onClick={() => {
                                setExchanges(
                                  exchanges.filter((_, i) => i !== index),
                                );
                                setConfirmed(false);
                              }}
                            >
                              Xóa
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop: 18 }}>
                  <Button
                    onClick={() => {
                      const p = data.products[0];
                      if (p)
                        setExchanges([
                          ...exchanges,
                          {
                            product_id: p.id,
                            unit_id: p.units[0].id,
                            quantity: "1",
                          },
                        ]);
                      setConfirmed(false);
                    }}
                  >
                    <span aria-hidden="true">＋</span>Thêm sản phẩm đổi
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
        <section className="card" style={{ alignSelf: "start" }}>
          <h2>Thanh toán chênh lệch</h2>
          <div className="row between">
            <span className="muted small">Tiền hàng trả</span>
            <strong>{money(returnTotal)}</strong>
          </div>
          <div className="row between" style={{ marginTop: 18 }}>
            <span className="muted small">Tiền hàng đổi</span>
            <strong>{money(exchangeTotal)}</strong>
          </div>
          <div className="summary" style={{ margin: "22px 0" }}>
            <span className="muted small">
              {difference > 0
                ? "Cần thu thêm"
                : difference < 0
                  ? "Cần hoàn lại"
                  : "Không có tiền chênh lệch"}
            </span>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "var(--blue)",
                marginTop: 8,
              }}
            >
              {money(Math.abs(difference))}
            </div>
          </div>
          {difference !== 0 && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setError("");
                }}
              />
              {difference > 0 ? "Đã thu thêm tiền" : "Đã hoàn tiền"}
            </label>
          )}
          <Notice text={error} />
          <Button variant="primary checkout" disabled={busy} onClick={finish}>
            Hoàn tất đổi/trả
          </Button>
          <Button onClick={onClose} style={{ width: "100%", marginTop: 12 }}>
            Hủy
          </Button>
        </section>
      </div>
    </>
  );
}
