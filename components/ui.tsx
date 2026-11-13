"use client";
import React, {
  createContext,
  useContext,
  useId,
  useEffect,
  useRef,
  useState,
} from "react";
export async function api(path: string, data?: any) {
  const r = await fetch("/api/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok)
    throw Object.assign(new Error(d.error || "Không thể tải dữ liệu"), {
      fields: d.fields || {},
      status: r.status,
    });
  return d;
}
export const AppContext = createContext<any>(null);
export const useApp = () => useContext(AppContext);
export function Icon({ name, size, report = false }: { name: string; size?: number; report?: boolean }) {
  const sizes: Record<string, number> = {
    reportBusiness: 16,
    reportInventory: 16,
    cart: 40,
    chevron: 16,
    search: 18,
    bell: 24,
    user: 30,
    down: 14,
    logout: 20,
    sale: 20,
    product: 20,
    customer: 20,
    supplier: 20,
    stock: 20,
    report: 20,
  };
  const ids: Record<string, string> = {
    reportBusiness: "1f0e9",
    reportInventory: "1487e",
    cart: "88365",
    chevron: "aec9f",
    search: "3a11f",
    bell: "97139",
    user: "d29fb",
    down: "dd675",
    logout: "40bb7",
    sale: "4e66c",
    product: "f9ca9",
    customer: "52eb3",
    supplier: "b5f27",
    stock: "c205b",
    report: "683e4",
  };
  const reportIds: Record<string,string> = {sale:"ed836",product:"90b50",customer:"626f0",supplier:"886ee",stock:"82580",report:"c47d3"};
  const s = size || sizes[name] || 20;
  return (
    <img
      src={"/figma/" + (report ? reportIds[name] || ids[name] : ids[name]) + ".svg"}
      width={s}
      height={s}
      alt=""
      className="icon"
    />
  );
}
export function Field({
  label,
  error,
  children,
  required: needed,
  ...props
}: any) {
  const id = useId();
  return (
    <div className={"field " + (error ? "has-error" : "")}>
      <label htmlFor={id}>
        {label}
        {needed && (
          <span className="required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children ? (
        React.cloneElement(children, {
          id,
          "aria-invalid": !!error,
          "aria-label": label,
          "aria-describedby": error ? id + "-error" : undefined,
        })
      ) : (
        <input
          id={id}
          aria-invalid={!!error}
          aria-label={label}
          aria-describedby={error ? id + "-error" : undefined}
          {...props}
        />
      )}
      {error && (
        <p id={id + "-error"} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function Button({ children, variant = "", ...props }: any) {
  return (
    <button type="button" className={"btn " + variant} {...props}>
      {children}
    </button>
  );
}
export function Modal({ title, children, onClose, wide = false, className = "", overlayClassName = "", showClose = true, dismissOnBackdrop = false }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const h = (e: KeyboardEvent) => {
      const top = Array.from(document.querySelectorAll(".overlay")).at(-1);
      if (!ref.current || !top?.contains(ref.current)) return;
      if (e.key === "Escape") onCloseRef.current?.();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          "input,select,textarea,button,[href]",
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", h);
    ref.current?.querySelector<HTMLElement>("input,select,button,[href]")?.focus();
    return () => {
      document.removeEventListener("keydown", h);
      previous?.focus();
    };
  }, []);
  return (
    <div className={"overlay " + overlayClassName} onMouseDown={(e) => { if (dismissOnBackdrop && e.target === e.currentTarget) onClose?.(); }}>
      <div
        className={"modal " + (wide ? "wide" : "") + " " + className}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          {onClose && showClose && (
            <button className="close" onClick={onClose} aria-label="Đóng">
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
export function Notice({
  text,
  kind = "error",
}: {
  text?: string;
  kind?: string;
}) {
  return text ? (
    <div
      className={"notice " + kind}
      role={kind === "error" ? "alert" : "status"}
    >
      {text}
    </div>
  ) : null;
}
export function Empty({ text = "Chưa có dữ liệu" }: { text?: string }) {
  return <div className="empty">{text}</div>;
}
export function Badge({ children, tone = "" }: any) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function useForm(initial: any) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<any>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function set(key: string, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
    setErrors((e: any) => ({ ...e, [key]: undefined }));
    setError("");
  }
  function caught(e: any) {
    setError(e.message);
    setErrors(e.fields || {});
  }
  return {
    form,
    setForm,
    errors,
    setErrors,
    error,
    setError,
    busy,
    setBusy,
    set,
    caught,
  };
}
