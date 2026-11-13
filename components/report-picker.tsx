"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./ui";
export const ReportIcon = ({
  name,
  size = 16,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) => (
  <img
    src={`/figma/${name}.svg`}
    width={size}
    height={size}
    alt=""
    className={className}
  />
);
export default function ReportPicker({
  kind,
  value,
  onChange,
  open,
  onOpen,
  onClose,
  disabled,
}: any) {
  const { data } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<string[]>([]);
  const type = kind === "type";
  const label = type
    ? "Loại báo cáo"
    : "Sản phẩm / nhóm sản phẩm (không bắt buộc)";
  useEffect(() => {
    if (open) {
      setDraft(Array.isArray(value) ? value : []);
      setSearch("");
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    function outside(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        ref.current?.querySelector("button")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open, onClose]);
  const groups = [
    {
      title: "NHÓM SẢN PHẨM",
      items: data.categories.map((c: any) => ({
        id: "c:" + c.id,
        name: c.name,
      })),
    },
    {
      title: "SẢN PHẨM",
      items: data.products.map((p: any) => ({ id: "p:" + p.id, name: p.name })),
    },
  ];
  const names = groups
    .flatMap((g) => g.items)
    .filter((i: any) => !type && value.includes(i.id))
    .map((i: any) => i.name);
  function toggle(id: string) {
    setDraft((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  }
  return (
    <div
      ref={ref}
      className={`field report-picker ${type ? "report-type" : "report-products"}`}
    >
      <label>{label}</label>
      <button
        type="button"
        className={`report-select ${open ? "is-open" : ""} ${!(type ? value : names.length) ? "placeholder" : ""}`}
        aria-label={label}
        aria-haspopup={type ? "listbox" : "dialog"}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? onClose() : onOpen())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <span>
          {type
            ? value || "Chọn loại báo cáo"
            : names.join(", ") || "Tất cả sản phẩm"}
        </span>
        <ReportIcon name="b8118" />
      </button>
      {open &&
        (type ? (
          <div
            className="report-menu report-type-menu"
            role="listbox"
            aria-label={label}
          >
            {["Doanh thu", "Lợi nhuận", "Sản phẩm bán chạy/chậm"].map((x) => (
              <button
                type="button"
                role="option"
                aria-selected={value === x}
                key={x}
                onClick={() => {
                  onChange(x);
                  onClose();
                }}
              >
                {x}
                {value === x && <ReportIcon name="report-type-check" />}
              </button>
            ))}
          </div>
        ) : (
          <div
            className="report-menu report-product-menu"
            role="dialog"
            aria-label="Chọn sản phẩm / nhóm sản phẩm"
          >
            <div className="report-filter-search">
              <ReportIcon name="report-filter-search" size={14} />
              <input
                aria-label="Tìm sản phẩm / nhóm sản phẩm"
                placeholder="Tìm sản phẩm / nhóm sản phẩm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="report-options">
              {groups.map((g, i) => (
                <div key={g.title}>
                  <p>{g.title}</p>
                  {i === 0 && !search && (
                    <label className={!draft.length ? "checked" : ""}>
                      <input
                        type="checkbox"
                        checked={!draft.length}
                        onChange={() => setDraft([])}
                      />
                      Tất cả
                    </label>
                  )}
                  {g.items
                    .filter((x: any) =>
                      x.name
                        .toLocaleLowerCase("vi")
                        .includes(search.toLocaleLowerCase("vi")),
                    )
                    .map((x: any) => (
                      <label
                        key={x.id}
                        className={draft.includes(x.id) ? "checked" : ""}
                      >
                        <input
                          type="checkbox"
                          checked={draft.includes(x.id)}
                          onChange={() => toggle(x.id)}
                        />
                        {x.name}
                      </label>
                    ))}
                </div>
              ))}
            </div>
            <div className="report-menu-footer">
              <button type="button" onClick={() => setDraft([])}>
                Bỏ chọn tất cả
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  onChange(draft);
                  onClose();
                }}
              >
                Áp dụng
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
