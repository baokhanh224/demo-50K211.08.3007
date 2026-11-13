import { useState, useEffect } from "react";
import { Field, useApp } from "./ui";
import { money } from "../lib/format.js";
export default function ProductPicker({ onSelect, label = "Tìm kiếm sản phẩm", error, value, onNotFound, externalQuery, placeholder = "Quét mã vạch hoặc nhập tên sản phẩm", onQueryChange, clearOnNotFound = false, }) {
    const { data } = useApp();
    const [q, setQ] = useState(value || "");
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (externalQuery) {
            setQ(externalQuery);
            setOpen(true);
        }
    }, [externalQuery]);
    useEffect(() => {
        if (value !== undefined)
            setQ(value);
    }, [value]);
    const matches = data.products.filter((p) => [p.id, p.name, p.barcode].some((s) => String(s || "")
        .toLocaleLowerCase("vi")
        .includes(q.trim().toLocaleLowerCase("vi"))));
    return (<div className="product-search">
      <Field label={label} error={error} value={q} placeholder={placeholder} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onChange={(e) => {
            setQ(e.target.value);
            onQueryChange?.(e.target.value);
            setOpen(true);
        }} onKeyDown={(e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (matches.length === 1) {
                    onSelect(matches[0]);
                    setQ(matches[0].name);
                    setOpen(false);
                }
                else if (!matches.length) {
                    if (clearOnNotFound) {
                        setQ("");
                        onQueryChange?.("");
                        e.currentTarget.blur();
                    }
                    onNotFound?.();
                    setOpen(false);
                }
            }
        }}/>
      {open && (<div className="suggestions">
          {matches.length ? (matches.map((p) => (<button key={p.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => {
                    onSelect(p);
                    setQ(p.name);
                    setOpen(false);
                }}>
                <strong>{p.name}</strong>
                <small className="muted">
                  {" "}
                  · {p.id}
                  {p.barcode ? " · " + p.barcode : ""}
                </small>
                <div className="muted small">
                  {money(p.units[0]?.price)} · Tồn kho: {p.stock} {p.base_unit}
                </div>
              </button>))) : (<div className="empty" onMouseDown={() => onNotFound?.()}>
              Không tìm thấy sản phẩm
            </div>)}
        </div>)}
    </div>);
}
