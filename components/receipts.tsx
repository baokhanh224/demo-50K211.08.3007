"use client";
import { useEffect, useState, useRef } from "react";
import { api, Button, Field, Notice, Empty, useApp } from "./ui";
import ProductPicker from "./picker";
import { money, date, iso, today } from "@/lib/format";
export default function Receipts() {
  const { data, refresh, notify, confirm, navigate } = useApp();
  const [supplier, setSupplier] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [expiry, setExpiry] = useState("");
  const [lines, setLines] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef(crypto.randomUUID());
  const lock = useRef(false);
  function choose(p: any) {
    setProduct(p);
    setUnit(String(p.units[0].id));
    setPrice(String(p.average_cost * p.units[0].factor));
    setQuantity("");
    setExpiry("");
    setErrors({});
    setError("");
  }
  async function add() {
    setError("");
    setErrors({});
    const l = {
      product_id: product?.id || "",
      unit_id: unit,
      quantity,
      price,
      expiry: iso(expiry),
    };
    try {
      await api("action", { action: "validate-receipt-line", ...l });
      const u = product.units.find((x: any) => x.id === Number(unit));
      setLines([
        ...lines,
        {
          ...l,
          product_name: product.name,
          unit_name: u.name,
          factor: u.factor,
        },
      ]);
      setQuantity("");
      setExpiry("");
    } catch (e: any) {
      setErrors(e.fields);
      setError(e.message);
    }
  }
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setErrors({});
    setError("");
    try {
      const r = await api("action", {
        action: "receipt",
        supplier_id: supplier,
        lines,
        request_key: key.current,
      });
      await refresh();
      notify(r.message);
      setLines([]);
      setSupplier("");
      setProduct(null);
      setUnit("");
      setQuantity("");
      setPrice("");
      setExpiry("");
      key.current = crypto.randomUUID();
    } catch (e: any) {
      setError(e.message);
      setErrors(e.fields || {});
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function cancel() {
    if (supplier || lines.length || product || quantity || price || expiry)
      confirm("Bạn có chắc chắn muốn hủy nhập hàng không?", () =>
        navigate("receipt-history"),
      );
    else navigate("receipt-history");
  }
  return (
    <>
      <h1>Nhập hàng</h1>
      <section className="card">
        <h2>Thông tin phiếu nhập</h2>
        <div className="row between">
          <div style={{ width: 380 }}>
            <Field label="Nhà cung cấp" error={errors.supplier_id}>
              <select
                value={supplier}
                onChange={(e) => {
                  setSupplier(e.target.value);
                  setErrors({ ...errors, supplier_id: undefined });
                }}
              >
                <option value="">Chọn nhà cung cấp</option>
                {data.suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <span>Ngày nhập: {date(today())}</span>
        </div>
      </section>
      <section className="card">
        <h2>Nhập sản phẩm</h2>
        <div className="receipt-input-grid">
          <ProductPicker onSelect={choose} error={errors.product_id} />
          <Field label="Đơn vị nhập" error={errors.unit_id}>
            <select
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                const u = product?.units.find(
                  (x: any) => x.id === Number(e.target.value),
                );
                if (u) setPrice(String(product.average_cost * u.factor));
              }}
            >
              <option value="">Chọn đơn vị nhập</option>
              {product?.units.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Số lượng nhập"
            inputMode="numeric"
            value={quantity}
            onChange={(e: any) => setQuantity(e.target.value)}
            error={errors.quantity}
          />
          <Field
            label="Giá nhập"
            inputMode="decimal"
            value={price}
            onChange={(e: any) => setPrice(e.target.value)}
            error={errors.price}
          />
          <Field
            label="Hạn sử dụng"
            placeholder="dd/mm/yyyy"
            value={expiry}
            disabled={!product?.expiry_managed}
            onChange={(e: any) => setExpiry(e.target.value)}
            error={errors.expiry}
          />
        </div>
        <Notice text={error && !Object.keys(errors).length ? error : ""} />
        <div className="actions" style={{ marginTop: 10 }}>
          <Button onClick={add}>Thêm sản phẩm</Button>
        </div>
      </section>
      <section className="card" style={{ minHeight: 270 }}>
        <h2>Danh sách sản phẩm nhập</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Đơn vị nhập</th>
                <th className="num">Số lượng</th>
                <th className="num">Giá nhập</th>
                <th>Hạn sử dụng</th>
                <th className="num">Thành tiền</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l: any, i: number) => (
                <tr key={i}>
                  <td>{l.product_name}</td>
                  <td>{l.unit_name}</td>
                  <td className="num">{l.quantity}</td>
                  <td className="num">{money(Number(l.price))}</td>
                  <td>{l.expiry ? date(l.expiry) : "—"}</td>
                  <td className="num">
                    {money(Number(l.quantity) * Number(l.price))}
                  </td>
                  <td>
                    <Button
                      variant="link"
                      onClick={() =>
                        setLines(lines.filter((_: any, j: number) => j !== i))
                      }
                    >
                      Xóa
                    </Button>
                    <Notice
                      text={Object.entries(errors)
                        .filter(([k]) => k.startsWith("lines." + i + "."))
                        .map(([, v]) => v)
                        .join(" · ")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!lines.length && (
          <Empty text={errors.lines || "Chưa có sản phẩm nhập"} />
        )}
        <div className="total-row">
          <span>Tổng tiền phiếu nhập</span>
          <strong>
            {money(
              lines.reduce(
                (s, l) => s + Number(l.quantity) * Number(l.price),
                0,
              ),
            )}
          </strong>
        </div>
      </section>
      {error === "Không thể lưu phiếu nhập" && <Notice text={error} />}
      <div className="actions">
        <Button onClick={cancel}>Hủy</Button>
        <Button variant="primary" onClick={save} disabled={busy}>
          Lưu phiếu nhập
        </Button>
      </div>
    </>
  );
}
export function ReceiptHistory() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<any>(null);
  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setDetail(null);
    try {
      setRows(
        await api("query", {
          scope: "receipt-history",
          q,
          from: iso(from),
          to: iso(to),
        }),
      );
    } catch (e: any) {
      setRows([]);
      setError(e.message);
    }
  }
  useEffect(() => {
    search();
  }, []);
  return (
    <>
      <h1>Tra cứu lịch sử nhập hàng</h1>
      <section className="card">
        <h2>Danh sách phiếu nhập</h2>
        <form className="filters" onSubmit={search}>
          <div className="field search">
            <input
              aria-label="Từ khóa"
              placeholder="Mã phiếu nhập, Tên nhà cung cấp"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Field
            label="Từ ngày"
            value={from}
            placeholder="dd/mm/yyyy"
            onChange={(e: any) => setFrom(e.target.value)}
          />
          <Field
            label="Đến ngày"
            value={to}
            placeholder="dd/mm/yyyy"
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
              <th>Mã phiếu nhập</th>
              <th>Ngày nhập</th>
              <th>Nhà cung cấp</th>
              <th className="num">Tổng tiền</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr
                className="clickable"
                key={r.id}
                onClick={async () => {
                  try {
                    setDetail(await api("detail?type=receipt&id=" + r.id));
                  } catch (e: any) {
                    setError(e.message);
                  }
                }}
              >
                <td className="code">{r.id}</td>
                <td>{date(r.created_at)}</td>
                <td>{r.supplier_name}</td>
                <td className="num">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !error && <Empty text="Không tìm thấy phiếu nhập" />}
      </section>
      {detail && (
        <section className="card">
          <div className="card-head">
            <h2>Chi tiết phiếu nhập {detail.id}</h2>
            <Button onClick={() => setDetail(null)}>Đóng</Button>
          </div>
          <p className="muted">
            Ngày nhập: {date(detail.created_at)} · Nhà cung cấp:{" "}
            {detail.supplier_name}
          </p>
          <table>
            <thead>
              <tr>
                <th>Chi tiết phiếu nhập</th>
                <th>Sản phẩm</th>
                <th>Đơn vị nhập</th>
                <th className="num">Số lượng nhập</th>
                <th className="num">Giá nhập</th>
                <th>Hạn sử dụng</th>
                <th className="num">Số lượng còn</th>
                <th className="num">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {detail.lines.map((l: any) => (
                <tr key={l.id}>
                  <td>#{l.id}</td>
                  <td>{l.product_name}</td>
                  <td>{l.unit_name}</td>
                  <td className="num">{l.quantity}</td>
                  <td className="num">{money(l.price)}</td>
                  <td>{date(l.expiry)}</td>
                  <td className="num">
                    {l.remaining} {l.base_unit}
                  </td>
                  <td className="num">{money(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-row">
            <span>Tổng tiền phiếu nhập</span>
            <strong>{money(detail.total)}</strong>
          </div>
        </section>
      )}
    </>
  );
}
