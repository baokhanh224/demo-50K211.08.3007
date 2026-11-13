import { useEffect, useId, useRef, useState } from "react";
import { date, iso, today } from "../lib/format.js";
function parse(value) {
    const key = iso(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key))
        return null;
    const d = new Date(key + "T12:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === key ? d : null;
}
export default function ReportDate({ label, value, onChange, from, to, open, onOpen, onClose }) {
    const id = useId(), root = useRef(null), input = useRef(null);
    const [month, setMonth] = useState(() => parse(value) || parse(today()));
    useEffect(() => {
        if (open)
            setMonth(parse(value) || parse(today()));
    }, [open, value]);
    useEffect(() => {
        if (!open)
            return;
        const outside = (e) => { if (!root.current?.contains(e.target))
            onClose(); };
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, [open, onClose]);
    const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1, 12));
    const offset = (first.getUTCDay() + 6) % 7;
    const start = parse(from)?.toISOString().slice(0, 10), end = parse(to)?.toISOString().slice(0, 10);
    const days = Array.from({ length: 42 }, (_, i) => {
        const d = new Date(first);
        d.setUTCDate(1 - offset + i);
        return d;
    });
    const select = (d) => { onChange(date(d.toISOString().slice(0, 10))); onClose(); input.current?.focus(); };
    return <div className="field report-date" ref={root} onKeyDown={e => {
            if (e.key === "Escape" && open) {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                input.current?.focus();
            }
        }}>
    <label htmlFor={id}>{label}</label>
    <div className={"report-date-input" + (open ? " is-open" : "")}>
      <input id={id} ref={input} aria-label={label} value={value} placeholder="dd/mm/yyyy" autoComplete="off" onChange={e => onChange(e.target.value)} onClick={onOpen} aria-expanded={open} aria-controls={open ? id + "-calendar" : undefined} aria-haspopup="dialog" onKeyDown={e => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                onOpen();
            }
            if (e.key === "Enter" && open) {
                e.preventDefault();
                onClose();
            }
        }}/>
      <button type="button" className="report-calendar-toggle" aria-label={"Mở lịch " + label.toLowerCase()} onClick={open ? onClose : onOpen}>
        <img src="/figma/65f50.svg" width="16" height="16" alt=""/>
      </button>
    </div>
    {open && <div className="report-calendar" id={id + "-calendar"} role="dialog" aria-label={"Lịch " + label.toLowerCase()}>
      <div className="report-calendar-head">
        <button type="button" aria-label="Tháng trước" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1, 12)))}>
          <img src="/figma/0001c.svg" width="16" height="16" alt=""/>
        </button>
        <strong aria-live="polite">Tháng {month.getUTCMonth() + 1}, {month.getUTCFullYear()}</strong>
        <button type="button" aria-label="Tháng sau" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1, 12)))}>
          <img src="/figma/1688e.svg" width="16" height="16" alt=""/>
        </button>
      </div>
      <div className="report-calendar-weekdays">{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => <span key={d}>{d}</span>)}</div>
      <div className="report-calendar-days">
        {days.map(d => {
                const key = d.toISOString().slice(0, 10), endpoint = key === start || key === end;
                const between = !!(start && end && start <= end && key > start && key < end);
                return <button type="button" key={key} aria-label={date(key)} aria-pressed={endpoint} data-date={key} className={(endpoint ? "endpoint " : between ? "between " : "") + (d.getUTCMonth() !== month.getUTCMonth() ? "other-month" : "")} onClick={() => select(d)}>{d.getUTCDate()}</button>;
            })}
      </div>
    </div>}
  </div>;
}
