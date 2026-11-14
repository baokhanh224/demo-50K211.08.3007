"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { api, Button, Field, Modal, Notice, useApp, useForm } from "./ui";
import { SupplierToast } from "./suppliers";
import { date, money } from "@/lib/format";
import { productCategoryNames, productErrors, productExpiry, productUnitNames } from "@/lib/product-validation";
import "./products.css";

function Asset({ name, size = 16 }: { name: string; size?: number }) {
  return <img src={`/figma/${name}.svg`} width={size} height={size} alt="" />;
}
function ProductSelect({ label, value, options, onChange, placeholder, inline = false, error, required = false }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), id = useId();
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => { if (open) ref.current?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')?.focus(); }, [open]);
  const choices = [{ value: "", label: placeholder }, ...options];
  return <div className={`field product-select ${inline ? "product-select-inline" : ""} ${error ? "has-error" : ""}`} ref={ref}
    onKeyDown={e => {
      if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault(); if (!open) { setOpen(true); return; }
        const nodes = Array.from(ref.current!.querySelectorAll<HTMLElement>('[role="option"]'));
        const index = nodes.indexOf(document.activeElement as HTMLElement);
        const next = e.key === "Home" ? 0 : e.key === "End" ? nodes.length - 1 : (index + (e.key === "ArrowDown" ? 1 : -1) + nodes.length) % nodes.length;
        nodes[next]?.focus();
      }
    }}>
    {!inline && <label id={id + "-label"} htmlFor={id}>{label}{required && <span className="required" aria-hidden="true"> *</span>}</label>}
    <button id={id} ref={trigger} type="button" aria-label={label} aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} aria-haspopup="listbox" aria-expanded={open} aria-controls={id + "-options"} className={!value ? "product-placeholder" : ""} onClick={() => setOpen(!open)}>
      <span>{inline && <span className="product-select-prefix">{label}: </span>}{choices.find(o => String(o.value) === String(value))?.label || placeholder}</span><Asset name="b4dfe" size={14} />
    </button>
    {open && <div className="product-select-menu" id={id + "-options"} role="listbox" aria-label={label}>
      {choices.map(o => <button type="button" role="option" key={o.value} aria-selected={String(o.value) === String(value)} onClick={() => { onChange(o.value); setOpen(false); trigger.current?.focus(); }}><span>{o.label}</span>{String(o.value) === String(value) && <Asset name="47eaa" size={13} />}</button>)}
    </div>}
    {error && <p className="field-error" id={id + "-error"} role="alert">{error}</p>}
  </div>;
}
function LockedField({ label, value, currency = false, hint }: any) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><div className={`product-input-wrap locked ${currency ? "currency" : ""}`}><input id={id} aria-label={label} value={value} readOnly /><span className="product-input-lock"><Asset name="32909" size={15} /></span>{currency && <span className="product-currency">đ</span>}</div>{hint && <small className="product-hint">{hint}</small>}</div>;
}
function MoneyField({ label, value, onChange, error, placeholder = "0" }: any) {
  const id = useId();
  return <div className={`field ${error ? "has-error" : ""}`}><label htmlFor={id}>{label}<span className="required" aria-hidden="true"> *</span></label><div className="product-input-wrap currency"><input id={id} aria-label={label} aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} inputMode="decimal" placeholder={placeholder} value={value} onChange={onChange} /><span className="product-currency">đ</span></div>{error && <p className="field-error" id={id + "-error"} role="alert">{error}</p>}</div>;
}
function ProductConfirm({ kind, onClose, onConfirm, busy = false }: any) {
  const deletion = kind === "delete", warning = kind === "warning", destructive = deletion || kind === "cancel-edit";
  return <Modal title={deletion ? "Xóa sản phẩm" : warning ? "Cảnh báo" : "Xác nhận"} onClose={busy ? undefined : onClose} showClose={false} className={`product-confirm ${deletion ? "product-delete-confirm" : ""}`} overlayClassName="product-confirm-overlay">
    <div className={`product-confirm-icon ${deletion ? "red" : warning ? "yellow" : "blue"}`}>{warning ? <span aria-hidden="true">!</span> : <Asset name={deletion ? "9c6f5" : "5eead"} size={deletion ? 26 : 22} />}</div>
    <p>{deletion ? "Bạn có chắc chắn muốn xóa sản phẩm này?" : warning ? "Giá bán thấp hơn giá nhập. Bạn có muốn tiếp tục?" : kind === "cancel-price" ? "Bạn có chắc chắn muốn hủy cập nhật giá bán không?" : kind === "cancel-edit" ? "Bạn có chắc chắn muốn hủy sửa sản phẩm không?" : "Bạn có chắc chắn muốn hủy thêm sản phẩm không?"}</p>
    <div className="actions"><Button disabled={busy} onClick={onClose}>Quay lại</Button><Button disabled={busy} variant={destructive ? "danger" : "primary"} onClick={onConfirm}>{warning ? "Tiếp tục" : "Xác nhận"}</Button></div>
  </Modal>;
}

export function ProductForm({ item = {}, onClose, onSaved, onNotice }: any) {
  const { data, refresh, notify } = useApp();
  const initial = { id: item.id, name: item.name || "", category_id: item.category_id || "", base_unit: item.base_unit || "", reference_cost: item.reference_cost ?? "", price: item.units?.find((u: any) => u.factor === 1)?.price ?? "", expiry: item.expiry ? date(item.expiry) : "", description: item.description || "", barcode: item.barcode || "", min_stock: item.min_stock ?? 0, expiry_managed: !!item.expiry_managed };
  const f = useForm(initial), saving = useRef(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const changed = JSON.stringify(initial) !== JSON.stringify(f.form);
  const categories = data.product_categories || data.categories.filter((c: any) => productCategoryNames.includes(c.name));
  const units = Array.from(new Set([...productUnitNames, ...(item.base_unit ? [item.base_unit] : [])]));
  function close() { if (saving.current) return; if (changed) setCancelOpen(true); else onClose(); }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (saving.current) return;
    const errors = productErrors(f.form, data.today); f.setErrors(errors); f.setError(""); if (Object.keys(errors).length) return;
    saving.current = true; f.setBusy(true);
    try {
      const result = await api("action", { action: "save-products", ...f.form, expiry: productExpiry(f.form.expiry) });
      const fresh = await refresh();
      if (onNotice) onNotice(result.message); else notify(result.message);
      onSaved?.(fresh.products.find((p: any) => p.id === result.id), fresh); onClose();
    } catch (e: any) {
      if (e.message === "Sản phẩm không tồn tại!") { onClose(); await refresh().catch(() => {}); onNotice?.(e.message, true); }
      else f.caught(e);
    } finally { saving.current = false; f.setBusy(false); }
  }
  return <>
    <Modal title={item.id ? "Sửa sản phẩm" : "Thêm sản phẩm"} onClose={close} className="product-form" overlayClassName="product-form-overlay">
      <form onSubmit={save} noValidate>
        <Notice text={f.error && !Object.values(f.errors).some(Boolean) ? f.error : ""} />
        <div className="product-form-grid">
          <LockedField label="Mã sản phẩm" value={item.id || "Tự động tạo"} />
          <Field label="Tên sản phẩm" required placeholder="Nhập tên sản phẩm" value={f.form.name} onChange={(e: any) => f.set("name", e.target.value)} error={f.errors.name} />
          <ProductSelect label="Danh mục" required value={f.form.category_id} onChange={(v: string) => f.set("category_id", v)} placeholder="Chọn danh mục" options={categories.map((c: any) => ({ value: c.id, label: c.name }))} error={f.errors.category_id} />
          <ProductSelect label="Đơn vị tính" required value={f.form.base_unit} onChange={(v: string) => f.set("base_unit", v)} placeholder="Chọn đơn vị tính" options={units.map(u => ({ value: u, label: u }))} error={f.errors.base_unit} />
          <MoneyField label="Giá nhập" value={f.form.reference_cost} onChange={(e: any) => f.set("reference_cost", e.target.value)} error={f.errors.reference_cost} />
          {item.id ? <LockedField label="Giá bán" value={money(f.form.price).replace(/đ$/, "")} currency hint="Dùng chức năng Cập nhật giá bán để thay đổi giá" /> : <MoneyField label="Giá bán" value={f.form.price} onChange={(e: any) => f.set("price", e.target.value)} error={f.errors.price} />}
          <Field label="Hạn sử dụng (không bắt buộc)" placeholder="dd/mm/yyyy" value={f.form.expiry} onChange={(e: any) => f.set("expiry", e.target.value)} error={f.errors.expiry} />
          <div className="product-full"><Field label="Mô tả"><textarea placeholder="Nhập mô tả sản phẩm" value={f.form.description} onChange={e => f.set("description", e.target.value)} /></Field></div>
        </div>
        <div className="actions"><Button disabled={f.busy} onClick={close}>Hủy</Button><Button variant="primary" type="submit" disabled={f.busy}>Lưu</Button></div>
      </form>
    </Modal>
    {cancelOpen && <ProductConfirm kind={item.id ? "cancel-edit" : "cancel-add"} onClose={() => setCancelOpen(false)} onConfirm={onClose} />}
  </>;
}
function ProductPriceForm({ item, onClose, onNotice }: any) {
  const { refresh } = useApp();
  const unit = item.units.find((u: any) => u.factor === 1) || item.units[0];
  const f = useForm({ price: "" }), saving = useRef(false);
  const [confirmation, setConfirmation] = useState("");
  function close() { if (saving.current) return; if (f.form.price !== "") setConfirmation("cancel-price"); else onClose(); }
  async function save(confirmed = false) {
    if (saving.current) return;
    if (!String(f.form.price).trim()) { f.setErrors({ price: "Không được để trống!" }); return; }
    saving.current = true; f.setBusy(true); f.setError(""); f.setErrors({});
    try {
      const result = await api("action", { action: "price", unit_id: unit?.id, price: f.form.price, confirmed });
      if (result.warning) { setConfirmation("warning"); return; }
      await refresh(); onNotice(result.message); onClose();
    } catch (e: any) {
      if (e.message === "Sản phẩm không tồn tại!") { onClose(); await refresh().catch(() => {}); onNotice(e.message, true); }
      else f.caught(e);
    } finally { saving.current = false; f.setBusy(false); }
  }
  return <>
    <Modal title="Cập nhật giá bán" onClose={close} className="product-price-form" overlayClassName="product-form-overlay">
      <p className="product-price-identity">{item.id} - {item.name}</p>
      <div className="product-form-grid"><LockedField label="Giá nhập" currency value={money(item.reference_cost).replace(/đ$/, "")} /><LockedField label="Giá bán hiện tại" currency value={money(unit?.price).replace(/đ$/, "")} /></div>
      <Notice text={f.error && !f.errors.price ? f.error : ""} />
      <MoneyField label="Giá bán mới" placeholder="Nhập giá bán mới" value={f.form.price} onChange={(e: any) => f.set("price", e.target.value)} error={f.errors.price} />
      <div className="actions"><Button disabled={f.busy} onClick={close}>Hủy</Button><Button disabled={f.busy} variant="primary" onClick={() => save()}>Lưu</Button></div>
    </Modal>
    {confirmation && <ProductConfirm kind={confirmation} onClose={() => setConfirmation("")} onConfirm={() => { const kind = confirmation; setConfirmation(""); if (kind === "warning") save(true); else onClose(); }} />}
  </>;
}

export default function Products() {
  const { data, refresh } = useApp();
  const [q, setQ] = useState(""), [appliedQ, setAppliedQ] = useState(""), [category, setCategory] = useState("");
  const [selectedId, setSelectedId] = useState(""), [page, setPage] = useState(1);
  const [form, setForm] = useState<any>(null), [detail, setDetail] = useState<any>(null), [price, setPrice] = useState<any>(null);
  const [deleting, setDeleting] = useState(false), [busy, setBusy] = useState(false), [toast, setToast] = useState<any>(null);
  const deletingRef = useRef(false);
  useEffect(() => { if (toast && !toast.error) { const timer = setTimeout(() => setToast(null), 6500); return () => clearTimeout(timer); } }, [toast]);
  const categories = data.product_categories || data.categories.filter((c: any) => productCategoryNames.includes(c.name));
  const filtered = useMemo(() => data.products.filter((p: any) => (!category || String(p.category_id) === String(category)) && [p.id, p.name].some(v => String(v).toLocaleLowerCase("vi").includes(appliedQ.toLocaleLowerCase("vi")))), [data.products, category, appliedQ]);
  const total = filtered.length, pages = Math.max(1, Math.ceil(total / 10)), currentPage = Math.min(page, pages), start = (currentPage - 1) * 10;
  const rows = filtered.slice(start, start + 10), selected = filtered.find((p: any) => p.id === selectedId);
  useEffect(() => { setPage(p => Math.min(p, pages)); if (selectedId && !filtered.some((p: any) => p.id === selectedId)) setSelectedId(""); }, [filtered, pages, selectedId]);
  function notice(text: string, error = false) { setToast({ text, error }); }
  function search(e?: React.FormEvent) { e?.preventDefault(); setAppliedQ(q.trim()); setPage(1); setSelectedId(""); }
  async function remove() {
    if (deletingRef.current || !selected) return; deletingRef.current = true; setBusy(true);
    try { const result = await api("action", { action: "delete-products", id: selected.id }); await refresh(); setDeleting(false); setSelectedId(""); notice(result.message); }
    catch (e: any) { setDeleting(false); notice(e.message, true); if (e.message === "Sản phẩm không tồn tại!") await refresh().catch(() => {}); }
    finally { deletingRef.current = false; setBusy(false); }
  }
  return <div className="products-page">
    <h1>Quản lý sản phẩm</h1>
    <section className="product-management-card">
      <div className="product-heading"><h2>Danh sách sản phẩm</h2><div className="row product-actions">
        <Button variant="primary" onClick={() => setForm({})}><Asset name="9fda3" />Thêm sản phẩm</Button>
        <Button disabled={!selected} onClick={() => setForm(selected)}><Asset name="b3751" />Sửa</Button>
        <Button disabled={!selected} variant="danger" onClick={() => setDeleting(true)}><Asset name="a04e9" />Xóa</Button>
        <Button disabled={!selected} onClick={() => setPrice(selected)}><Asset name="dbe96" />Cập nhật giá bán</Button>
      </div></div>
      <form className="product-controls" onSubmit={search}>
        <div className="product-search-input"><Asset name="35b85" /><input aria-label="Từ khóa" placeholder="Tìm theo mã hoặc tên sản phẩm..." value={q} onChange={e => setQ(e.target.value)} />{q && <button type="button" aria-label="Xóa từ khóa" onClick={() => { setQ(""); setAppliedQ(""); setPage(1); setSelectedId(""); }}>×</button>}</div>
        <ProductSelect label="Danh mục" inline placeholder="Tất cả" value={category} onChange={(v: string) => { setCategory(String(v)); setAppliedQ(q.trim()); setPage(1); setSelectedId(""); }} options={categories.map((c: any) => ({ value: c.id, label: c.name }))} />
        <Button variant="primary" type="submit"><Asset name="bb29d" />Tìm kiếm</Button>
      </form>
      {total ? <div className="product-table-wrap"><table><thead><tr><th></th><th>Mã sản phẩm</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Đơn vị</th><th>Giá nhập</th><th>Giá bán</th><th>Tồn kho</th><th>Hạn sử dụng</th></tr></thead><tbody>
        {rows.map((p: any) => <tr key={p.id} className={selectedId === p.id ? "selected" : ""} onClick={() => setDetail(p)}>
          <td onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={`Chọn ${p.id}`} checked={selectedId === p.id} onChange={() => setSelectedId(selectedId === p.id ? "" : p.id)} /></td>
          <td><button className="btn link" onClick={e => { e.stopPropagation(); setDetail(p); }}>{p.id}</button></td><td>{p.name}</td><td>{p.category}</td><td>{p.base_unit}</td><td>{money(p.reference_cost)}</td><td>{money(p.units.find((u: any) => u.factor === 1)?.price)}</td><td>{p.stock}</td><td>{p.expiry ? date(p.expiry) : "—"}</td>
        </tr>)}
      </tbody></table></div> : <div className="product-empty"><span><Asset name="35b85" /></span><strong>Không tìm thấy sản phẩm!</strong><p>Hãy thử từ khóa khác hoặc đổi bộ lọc.</p></div>}
      <div className="product-list-footer"><span>{total ? `Hiển thị ${start + 1}-${Math.min(start + 10, total)} / ${total} sản phẩm` : "Hiển thị 0 / 0 sản phẩm"}</span><nav aria-label="Phân trang sản phẩm"><Button aria-label="Trang trước" disabled={currentPage === 1} onClick={() => { setPage(currentPage - 1); setSelectedId(""); }}>&lt;</Button>{Array.from({ length: pages }, (_, i) => i + 1).filter(p => p === 1 || p === pages || Math.abs(p - currentPage) <= 1).map((p, i, visible) => <span key={p}>{i > 0 && p - visible[i - 1] > 1 && <span className="product-page-gap">…</span>}<Button aria-label={`Trang ${p}`} aria-current={currentPage === p ? "page" : undefined} onClick={() => { setPage(p); setSelectedId(""); }}>{p}</Button></span>)}<Button aria-label="Trang sau" disabled={currentPage === pages} onClick={() => { setPage(currentPage + 1); setSelectedId(""); }}>&gt;</Button></nav></div>
    </section>
    {form && <ProductForm item={form} onClose={() => setForm(null)} onNotice={notice} />}
    {price && <ProductPriceForm item={price} onClose={() => setPrice(null)} onNotice={notice} />}
    {deleting && <ProductConfirm kind="delete" busy={busy} onClose={() => setDeleting(false)} onConfirm={remove} />}
    {detail && <Modal title="Chi tiết sản phẩm" className="product-drawer" overlayClassName="product-drawer-overlay" dismissOnBackdrop onClose={() => setDetail(null)}><dl>{[
      ["Mã sản phẩm", detail.id], ["Tên sản phẩm", detail.name], ["Danh mục", detail.category], ["Đơn vị tính", detail.base_unit], ["Giá nhập", money(detail.reference_cost)], ["Giá bán", money(detail.units.find((u: any) => u.factor === 1)?.price)], ["Tồn kho", detail.stock], ["Hạn sử dụng", detail.expiry ? date(detail.expiry) : "—"], ["Mô tả", detail.description || "—"],
    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><Button onClick={() => setDetail(null)}>Đóng</Button></Modal>}
    {toast && <SupplierToast text={toast.text} error={toast.error} onClose={() => setToast(null)} />}
  </div>;
}
