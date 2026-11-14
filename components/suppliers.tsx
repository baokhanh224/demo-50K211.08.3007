"use client";
import { useEffect, useId, useRef, useState } from "react";
import { api, Button, Field, Modal, Notice, useApp, useForm } from "./ui";
import "./suppliers.css";
import { supplierErrors } from "@/lib/supplier-validation";

const statuses = ["Đang hợp tác", "Ngừng hợp tác"];
function Asset({ file, size, ...props }: any) {
  return <img src={`/figma/${file}.svg`} width={size} height={size} alt="" {...props} />;
}
export function SupplierToast({ text, error = false, onClose }: any) {
  return <div className={`supplier-toast ${error ? "supplier-toast-error" : ""}`} role={error ? "alert" : "status"}>
    <Asset file={error ? "2d146" : "b066b"} size={error ? 18 : 16} />
    <span>{text}</span><button type="button" aria-label="Đóng thông báo" onClick={onClose}>×</button>
  </div>;
}
function Status({ value, compact = false }: { value: string; compact?: boolean }) {
  return <span className={`supplier-status ${value === statuses[0] ? "cooperating" : "stopped"}`}>{value === statuses[1] && !compact ? <>Ngừng hợp<br />tác</> : value}</span>;
}
function Select({ label, value, options, onChange, inline = false }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, []);
  return <div ref={ref} className={`supplier-select ${inline ? "supplier-inline-select" : ""} ${inline && label === "Danh mục" ? "supplier-filter-category" : ""}`} onKeyDown={e => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); } }}>
    <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      {inline && <span className="supplier-filter-label">{label}:</span>}<span className="supplier-select-value">{options.find((o: any) => String(o.value) === String(value))?.label || "Tất cả"}</span><Asset file={inline ? "002a0" : "7b65a"} size={14} />
    </button>
    {open && <div className="supplier-select-menu" id={id} role="listbox" aria-label={label}>
      {options.map((o: any) => <button type="button" role="option" key={o.value} aria-selected={String(value) === String(o.value)} onClick={() => { onChange(o.value); setOpen(false); }}>
        <span>{o.label}</span>{String(value) === String(o.value) && <Asset file="47eaa" size={13} />}
      </button>)}
    </div>}
  </div>;
}
function SupplierConfirm({ deletion = false, busy = false, onClose, onConfirm }: any) {
  return <Modal title={deletion ? "Xóa nhà cung cấp" : "Xác nhận"} className={`supplier-confirm ${deletion ? "supplier-delete-confirm" : ""}`} overlayClassName={`supplier-confirm-overlay ${deletion ? "supplier-delete-overlay" : ""}`} showClose={false} onClose={busy ? undefined : onClose}>
    <div className="supplier-confirm-icon"><Asset file={deletion ? "9c6f5" : "5eead"} size={deletion ? 26 : 22} /></div>
    <p>{deletion ? "Bạn có chắc chắn muốn xóa nhà cung cấp này?" : "Bạn có chắc chắn muốn hủy không?"}</p>
    <div className="supplier-confirm-actions"><Button disabled={busy} onClick={onClose}>Quay lại</Button><Button disabled={busy} variant="primary" onClick={onConfirm}>Xác nhận</Button></div>
  </Modal>;
}
function CategoryPicker({ form, set, error, validate }: any) {
  const { data } = useApp();
  const [open, setOpen] = useState(false);
  const [committed, setCommitted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (error) setCommitted(false); }, [error]);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, []);
  const selected = data.categories.filter((c: any) => form.category_ids.includes(c.id));
  return <div className="supplier-category-field supplier-full">
    <label id={id}>Danh mục</label>
    <div className="supplier-category-picker" ref={ref} onKeyDown={e => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); } }}>
      <button ref={trigger} type="button" aria-labelledby={id} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)} className="supplier-category-trigger">
        <span className="supplier-category-chips">{!selected.length && !form.other ? <span className="supplier-placeholder">Chọn một hoặc nhiều danh mục</span> : <>{selected.map((c: any) => <span className="supplier-chip" key={c.id}>{c.name}</span>)}{form.other && <span className="supplier-chip">{committed ? form.new_category.trim() : "Khác"}</span>}</>}</span><Asset file="68810" size={14} />
      </button>
      {open && <div className="supplier-category-menu" role="dialog" aria-label="Chọn danh mục">
        {data.categories.map((c: any) => <label className="supplier-category-option" key={c.id}><input type="checkbox" checked={form.category_ids.includes(c.id)} onChange={e => set("category_ids", e.target.checked ? [...form.category_ids, c.id] : form.category_ids.filter((id: number) => id !== c.id))} />{c.name === "Khác" ? "Khác (có sẵn)" : c.name}</label>)}
        <label className="supplier-category-option"><input type="checkbox" checked={form.other} onChange={e => { set("other", e.target.checked); set("new_category", ""); setCommitted(false); setOpen(false); }} />Khác</label>
      </div>}
    </div>
    {form.other && !committed && <div className="supplier-new-category">
      <input aria-label="Tên danh mục mới" placeholder="Nhập tên danh mục mới" value={form.new_category} aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined}
        onChange={e => set("new_category", e.target.value)} onBlur={validate}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (!validate()) { set("new_category", form.new_category.trim()); setCommitted(true); trigger.current?.focus(); } } }} />
      {error && <p id={id + "-error"} className="field-error" role="alert">{error}</p>}
    </div>}
  </div>;
}
export function SupplierForm({ item = {}, onClose, onSaved }: any) {
  const { data, refresh, notify } = useApp();
  const initial = { id: item.id, name: item.name || "", phone: item.phone || "", email: item.email || "", address: item.address || "", description: item.description || "", status: item.status || statuses[0], category_ids: item.category_ids || [], other: false, new_category: "" };
  const f = useForm(initial);
  const changed = JSON.stringify(initial) !== JSON.stringify(f.form);
  const [cancelOpen, setCancelOpen] = useState(false);
  const saving = useRef(false);
  function close() { if (saving.current) return; if (changed) setCancelOpen(true); else onClose(); }
  function validateCategory() {
    if (!f.form.other) return "";
    const error = supplierErrors(f.form, data.categories).new_category || "";
    f.setErrors((prev: any) => ({ ...prev, new_category: error || undefined }));
    return error;
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (saving.current) return;
    const errors = supplierErrors(f.form, data.categories);
    f.setErrors(errors); f.setError("");
    if (Object.keys(errors).length) return;
    saving.current = true; f.setBusy(true);
    try {
      const r = await api("action", { action: "save-suppliers", ...f.form });
      const fresh = await refresh(); notify(r.message); onSaved?.(fresh.suppliers.find((s: any) => s.id === r.id) || { ...f.form, id: r.id }, fresh); onClose();
    } catch (error) { f.caught(error); }
    finally { saving.current = false; f.setBusy(false); }
  }
  const extended = f.form.other || Object.values(f.errors).some(Boolean) || f.error;
  return <>
    <Modal title={item.id ? "Sửa thông tin nhà cung cấp" : "Thêm nhà cung cấp"} onClose={close} className={`supplier-form ${item.id ? "supplier-edit-form" : ""} ${extended ? "supplier-form-extended" : ""}`} overlayClassName="supplier-form-overlay">
      <form onSubmit={save} noValidate>
        <Notice text={f.error && !Object.values(f.errors).some(Boolean) ? f.error : ""} />
        <div className="supplier-form-grid">
          <div className="supplier-code-field"><Field label="Mã nhà cung cấp" value={item.id || "Tự động tạo"} readOnly /><Asset file="32909" size={15} /></div>
          <Field label="Tên nhà cung cấp" required placeholder="Nhập tên nhà cung cấp" value={f.form.name} onChange={(e: any) => f.set("name", e.target.value)} error={f.errors.name} />
          <Field label="Số điện thoại" required placeholder="Nhập số điện thoại" value={f.form.phone} onChange={(e: any) => f.set("phone", e.target.value)} error={f.errors.phone} />
          <Field label="Email" placeholder="Nhập email" value={f.form.email} onChange={(e: any) => f.set("email", e.target.value)} error={f.errors.email} />
          <div className="supplier-full"><Field label="Địa chỉ" placeholder="Nhập địa chỉ" value={f.form.address} onChange={(e: any) => f.set("address", e.target.value)} /></div>
          <CategoryPicker form={f.form} set={f.set} error={f.errors.new_category} validate={validateCategory} />
          <div className="supplier-full"><Field label="Mô tả"><textarea placeholder="Nhập mô tả nhà cung cấp" value={f.form.description} onChange={e => f.set("description", e.target.value)} /></Field></div>
          {item.id && <Field label="Trạng thái" error={f.errors.status}><Select label="Trạng thái" value={f.form.status} options={statuses.map(s => ({value: s, label: s}))} onChange={(value: string) => f.set("status", value)} /></Field>}
        </div>
        <div className="supplier-form-actions"><Button disabled={f.busy} onClick={close}>Hủy</Button><Button variant="primary" disabled={f.busy} type="submit">Lưu</Button></div>
      </form>
    </Modal>
    {cancelOpen && <SupplierConfirm onClose={() => setCancelOpen(false)} onConfirm={onClose} />}
  </>;
}
export default function Suppliers() {
  const { data, refresh, notify } = useApp();
  const [q, setQ] = useState(""); const [category, setCategory] = useState(""); const [status, setStatus] = useState("");
  const [rows, setRows] = useState<any[]>(data.suppliers || []);
  const [selected, setSelected] = useState<any>(null); const [form, setForm] = useState<any>(null); const [detail, setDetail] = useState<any>(null);
  const [page, setPage] = useState(1); const [error, setError] = useState(""); const [deleting, setDeleting] = useState(false); const [busy, setBusy] = useState(false);
  const searchId = useRef(0); const deletingRef = useRef(false);
  const pageSize = 6; const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setRows(data.suppliers || []); setSelected(null); setPage(p => Math.min(p, Math.max(1, Math.ceil((data.suppliers || []).length / pageSize)))); }, [data.suppliers]);
  async function search(e?: React.FormEvent) {
    e?.preventDefault(); const key = ++searchId.current; setError("");
    try { const r = await api("query", { scope: "suppliers", q, category, status }); if (key === searchId.current) { setRows(r); setSelected(null); setPage(1); } }
    catch (e: any) { if (key === searchId.current) { setRows([]); setError(e.message); } }
  }
  async function remove() {
    if (!selected || deletingRef.current) return; deletingRef.current = true; setBusy(true);
    try { const r = await api("action", { action: "delete-suppliers", id: selected.id }); notify(r.message); await refresh(); }
    catch (e: any) { setError(e.message); }
    finally { setDeleting(false); setBusy(false); deletingRef.current = false; }
  }
  function changePage(value: number) { setPage(value); setSelected(null); }
  return <div className="supplier-page">
    <h1>Quản lý nhà cung cấp</h1>
    <section className="supplier-list-card">
      <form className="supplier-filters" onSubmit={search}>
        <div className="supplier-search"><Asset file="21532" size={16} /><input aria-label="Từ khóa" placeholder="Tìm theo mã hoặc tên nhà cung cấp..." value={q} onChange={e => setQ(e.target.value)} />{q && <button type="button" aria-label="Xóa từ khóa" onClick={() => setQ("")}><Asset file="6edac" size={13} /></button>}</div>
        <Select label="Danh mục" inline value={category} options={[{value:"",label:"Tất cả"}, ...data.categories.map((c: any) => ({value:String(c.id),label:c.name}))]} onChange={setCategory} />
        <Select label="Trạng thái" inline value={status} options={[{value:"",label:"Tất cả"},...statuses.map(s=>({value:s,label:s}))]} onChange={setStatus} />
        <Button type="submit" variant="primary"><Asset file="ebdb2" size={16} />Tìm kiếm</Button>
      </form>
      <div className="supplier-toolbar"><Button variant="primary" onClick={() => setForm({})}><Asset file="a3829" size={16} />Thêm nhà cung cấp</Button><Button disabled={!selected} onClick={() => setForm(selected)}><Asset file={selected ? "9c4c6" : "390c0"} size={16} />Sửa</Button><Button variant="danger" disabled={!selected} onClick={() => { setError(""); setDeleting(true); }}><Asset file={selected ? "89bb8" : "f8244"} size={16} />Xóa</Button></div>
      {rows.length ? <div className="supplier-table-wrap"><table><colgroup>{[39.078,122,200.339,90.845,103.491,196.866,226,113.381].map((w,i)=><col key={i} style={{width:`${w/1092*100}%`}} />)}</colgroup><thead><tr><th aria-label="Chọn nhà cung cấp"></th>{["Mã nhà cung cấp","Tên nhà cung cấp","Danh mục","Số điện thoại","Email","Địa chỉ","Trạng thái"].map(s=><th key={s}>{s}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id} className={selected?.id===r.id ? "supplier-selected" : ""} onClick={() => setSelected(selected?.id===r.id ? null : r)} onDoubleClick={() => {setSelected(r);setDetail(r);}}><td><input type="checkbox" aria-label={`Chọn ${r.id}`} checked={selected?.id===r.id} onClick={e=>e.stopPropagation()} onChange={()=>setSelected(selected?.id===r.id?null:r)} /></td><td><button className="supplier-code-link" onClick={e=>{e.stopPropagation();setSelected(r);setDetail(r);}}>{r.id}</button></td><td><button className="supplier-name-link" onClick={e=>{e.stopPropagation();setSelected(r);setDetail(r);}}>{r.name}</button></td><td>{r.categories.join(", ")||"—"}</td><td>{r.phone}</td><td className="supplier-email">{r.email||"—"}</td><td>{r.address||"—"}</td><td><Status value={r.status} /></td></tr>)}</tbody></table></div> : <div className="supplier-empty"><span><Asset file="e8f51" size={20} /></span><strong>Không tìm thấy nhà cung cấp!</strong></div>}
      <div className="supplier-footer"><span>Hiển thị {rows.length ? (page-1)*pageSize+1 : 0}-{Math.min(page*pageSize,rows.length)} / {rows.length} nhà cung cấp</span><nav aria-label="Phân trang nhà cung cấp"><Button aria-label="Trang trước" disabled={page===1} onClick={()=>changePage(page-1)}><Asset file="f3530" size={14}/></Button>{Array.from({length:pages},(_,i)=>i+1).map(n=><Button key={n} aria-label={`Trang ${n}`} aria-current={page===n?"page":undefined} variant={page===n?"primary":""} onClick={()=>changePage(n)}>{n}</Button>)}<Button aria-label="Trang sau" disabled={page===pages} onClick={()=>changePage(page+1)}><Asset file="f9c56" size={14}/></Button></nav></div>
    </section>
    {error && <SupplierToast error text={error} onClose={()=>setError("")} />}
    {form && <SupplierForm item={form} onClose={()=>setForm(null)} onSaved={(saved: any, fresh: any) => { setRows(fresh.suppliers); setPage(Math.floor(fresh.suppliers.findIndex((s: any) => s.id === saved.id) / pageSize) + 1); }} />}
    {deleting && <SupplierConfirm deletion busy={busy} onClose={()=>setDeleting(false)} onConfirm={remove} />}
    {detail && <Modal title="Chi tiết nhà cung cấp" className="supplier-drawer" overlayClassName="supplier-drawer-overlay" onClose={()=>setDetail(null)} dismissOnBackdrop>
      <dl>{[["Mã nhà cung cấp",detail.id],["Tên nhà cung cấp",detail.name],["Danh mục",detail.categories.join(", ")||"—"],["Số điện thoại",detail.phone],["Email",detail.email||"—"],["Địa chỉ",detail.address||"—"],["Trạng thái",<Status key="status" compact value={detail.status}/>],["Mô tả",detail.description||"—"]].map(([label,value])=><div key={label as string}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="supplier-drawer-footer"><Button onClick={()=>setDetail(null)}>Đóng</Button></div>
    </Modal>}
  </div>;
}
