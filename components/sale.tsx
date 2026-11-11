"use client";
import { useState, useRef, useEffect } from "react";
import { api, Button, Field, Notice, Empty, useApp } from "./ui";
import ProductPicker from "./picker";
import { MasterForm } from "./masters";
import { money } from "@/lib/format";
export default function Sale() {
  const { data, refresh, notify, navigate } = useApp();
  const [externalQuery, setExternalQuery] = useState("");
  useEffect(() => {
    const search = () => {
      const q = sessionStorage.getItem("globalSearch");
      if (q) {
        setExternalQuery(q);
        sessionStorage.removeItem("globalSearch");
      }
    };
    search();
    window.addEventListener("qn:search", search);
    return () => window.removeEventListener("qn:search", search);
  }, []);
  const [product, setProduct] = useState<any>(null);
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [method, setMethod] = useState("Tiền mặt");
  const [cash, setCash] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [phone, setPhone] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [customerError, setCustomerError] = useState("");
  const [productError, setProductError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<any>(null);
  const key = useRef(crypto.randomUUID());
  const lock = useRef(false);
  const total = cart.reduce((s, l) => s + l.total, 0);
  const [qr, setQr] = useState<any>(null);
  const [qrError, setQrError] = useState("");
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrRetry, setQrRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setConfirmed(false);
    setQr(null);
    setQrLoaded(false);
    setQrError("");
    if (method === "Chuyển khoản" && cart.length) {
      api("payment-qr", { lines: cart, reference: key.current })
        .then((r) => {
          if (!active) return;
          if (r.total !== total) {
            setQrError("Giá bán đã thay đổi. Vui lòng chọn lại sản phẩm.");
            return;
          }
          setQr(r);
        })
        .catch((e) => { if (active) setQrError(e.message); });
    }
    return () => { active = false; };
  }, [cart, method, total, qrRetry]);
  const selected = product?.units.find((u: any) => u.id === Number(unit));
  function choose(p: any) {
    setProduct(p);
    setUnit(String(p.units[0].id));
    setQuantity("");
    setProductError("");
    setQuantityError("");
  }
  async function add() {
    setQuantityError("");
    setProductError("");
    if (!product) {
      setProductError("Không tìm thấy sản phẩm");
      return;
    }
    try {
      const r = await api("action", {
        action: "quote",
        lines: [...cart, { product_id: product.id, unit_id: unit, quantity }],
      });
      setCart(r.lines);
      setQuantity("");
      setPaymentError("");
    } catch (e: any) {
      setQuantityError(e.message);
    }
  }
  async function find() {
    setCustomerError("");
    setCustomer(null);
    try {
      setCustomer(await api("action", { action: "find-customer", phone }));
    } catch (e: any) {
      setCustomerError(e.message);
    }
  }
  async function pay() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setPaymentError("");
    try {
      const r = await api("action", {
        action: "checkout",
        request_key: key.current,
        lines: cart,
        method,
        cash,
        confirmed,
        customer_id: customer?.id,
      });
      await refresh();
      notify(r.message);
      setLast(r);
      setCart([]);
      setProduct(null);
      setUnit("");
      setQuantity("");
      setCash("");
      setConfirmed(false);
      setPhone("");
      setCustomer(null);
      setCustomerError("");
      key.current = crypto.randomUUID();
    } catch (e: any) {
      setPaymentError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="sale-layout">
      <div className="sale-main">
        <h1>Tạo giao dịch bán hàng</h1>
        <ProductPicker
          externalQuery={externalQuery}
          onSelect={choose}
          error={productError}
          onNotFound={() => setProductError("Không tìm thấy sản phẩm")}
        />
        <section className="card">
          <h2>Thông tin sản phẩm</h2>
          <div className="product-info-grid">
            <Field
              label="Tên sản phẩm"
              value={product?.name || "Chưa chọn sản phẩm"}
              readOnly
            />
            <Field label="Đơn vị bán">
              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setQuantityError("");
                }}
              >
                <option value="">Chọn đơn vị</option>
                {product?.units.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Giá bán"
              value={money(selected?.price || 0)}
              readOnly
            />
            <Field
              label="Số lượng tồn kho"
              value={
                product && selected
                  ? `${Math.floor(product.sellable / selected.factor)} ${selected.name}`
                  : "—"
              }
              readOnly
            />
          </div>
          <div className="product-info-bottom">
            <Field
              label="Số lượng bán"
              value={quantity}
              inputMode="numeric"
              placeholder="Nhập số lượng"
              error={quantityError}
              onChange={(e: any) => {
                setQuantity(e.target.value);
                setQuantityError("");
              }}
              onKeyDown={(e: any) => {
                if (e.key === "Enter") add();
              }}
            />
            <Button variant="primary" onClick={add}>
              Hoàn tất chọn sản phẩm
            </Button>
          </div>
        </section>
        <section className="card cart">
          <h2>Giỏ hàng</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn vị</th>
                  <th className="num">SL</th>
                  <th className="num">Đơn giá</th>
                  <th className="num">Thành tiền</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((l: any, i: number) => (
                  <tr key={i}>
                    <td>{l.product_name}</td>
                    <td>{l.unit_name}</td>
                    <td className="num">{l.quantity}</td>
                    <td className="num">{money(l.price)}</td>
                    <td className="num">{money(l.total)}</td>
                    <td>
                      <Button
                        variant="link"
                        onClick={() => setCart(cart.filter((_, j) => j !== i))}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!cart.length && <Empty text="Chưa có sản phẩm trong giỏ hàng" />}
          <div className="cart-total">
            <span>Tổng tiền</span>
            <strong>{money(total)}</strong>
          </div>
        </section>
        {last && (
          <section className="card">
            <div className="row between">
              <p className="muted">
                Hóa đơn: <strong className="code">{last.id}</strong>
              </p>
              <Button
                onClick={() => {
                  sessionStorage.setItem("invoiceToOpen", last.id);
                  navigate("sales-history");
                }}
              >
                Xem hóa đơn
              </Button>
            </div>
            {last.warnings?.map((w: any) => (
              <Notice
                key={w.id}
                kind="info"
                text={`Tồn kho sản phẩm xuống mức cảnh báo`}
              />
            ))}
          </section>
        )}
      </div>
      <section className="card payment-card">
        <h2>Thanh toán</h2>
        <span className="muted small">Tổng thanh toán</span>
        <div className="total" data-testid="checkout-total">
          {money(total)}
        </div>
        <h3>Phương thức thanh toán</h3>
        <div className="payment-method">
          {["Tiền mặt", "Chuyển khoản"].map((m) => (
            <Button
              key={m}
              variant={method === m ? "chosen" : ""}
              onClick={() => {
                setMethod(m);
                setConfirmed(false);
                setPaymentError("");
              }}
            >
              {m}
            </Button>
          ))}
        </div>
        {method === "Tiền mặt" ? (
          <>
            <Field
              label="Tiền khách đưa"
              value={cash}
              inputMode="numeric"
              placeholder="Nhập số tiền"
              onChange={(e: any) => {
                setCash(e.target.value);
                setPaymentError("");
              }}
              error={
                paymentError === "Tiền khách đưa chưa đủ để thanh toán"
                  ? paymentError
                  : ""
              }
            />
            <div className="payment-change">
              <span>Tiền thừa</span>
              <strong>{money(Math.max(0, (Number(cash) || 0) - total))}</strong>
            </div>
          </>
        ) : (
          <>
            <div className="qr">
              {qr && !qrError && <img
                key={qr.url}
                src={qr.url}
                alt={`Mã QR chuyển khoản ${money(qr.total)}`}
                width="240"
                height="240"
                onLoad={() => setQrLoaded(true)}
                onError={() => {
                  setQrLoaded(false);
                  setQrError("Không thể tải mã QR. Vui lòng thử lại.");
                }}
              />}
              {!cart.length ? <p>Chưa có sản phẩm trong giỏ hàng</p> :
                !qr && !qrError ? <p>Đang tạo mã QR…</p> : null}
              {qr && !qrError && <div className="small">
                <p><strong>{qr.name}</strong> · {qr.account}</p>
                <p>Số tiền: <strong>{money(qr.total)}</strong></p>
                <p>Nội dung: {qr.description}</p>
              </div>}
              <Notice text={qrError} />
              {qrError && <Button onClick={() => setQrRetry((n) => n + 1)}>Thử lại</Button>}
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={!qrLoaded || !!qrError || !qr}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setPaymentError("");
                }}
              />
              Đã nhận đủ tiền chuyển khoản
            </label>
          </>
        )}
        {paymentError !== "Tiền khách đưa chưa đủ để thanh toán" && (
          <Notice text={paymentError} />
        )}
        <div className="payment-customer">
          <h3>Khách hàng (không bắt buộc)</h3>
          <label htmlFor="sale-customer">Tra cứu khách hàng</label>
          <div className="row">
            <input
              id="sale-customer"
              placeholder="Nhập thông tin khách hàng"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setCustomer(null);
                setCustomerError("");
              }}
            />
          </div>
          <div className="row customer-actions">
            <Button onClick={find}>Tra cứu</Button>
            <Button onClick={() => setAddingCustomer(true)}>Thêm khách hàng</Button>
          </div>
          {customer && (
            <p className="small">
              {customer.name} · {customer.id}
            </p>
          )}
          <Notice text={customerError} />
        </div>
        <Button
          variant="primary checkout"
          onClick={pay}
          disabled={busy || !cart.length || (method === "Chuyển khoản" && (!qrLoaded || !!qrError || !qr))}
        >
          Hoàn tất thanh toán
        </Button>
      </section>
      {addingCustomer && <MasterForm kind="customers" item={{phone}} onClose={() => setAddingCustomer(false)}
        onSaved={(saved: any) => {setCustomer(saved);setPhone(saved.phone);setCustomerError("");}} />}
    </div>
  );
}
