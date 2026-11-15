"use client";
import { forwardRef, useRef, type InputHTMLAttributes } from "react";
import { formatDateInput } from "@/lib/date-input";

const DateInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function DateInput({ onChange, onKeyDown, ...props }, forwardedRef) {
  const input = useRef<HTMLInputElement | null>(null);
  return <input {...props} inputMode="numeric" autoComplete={props.autoComplete ?? "off"}
    ref={node => {
      input.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }}
    onKeyDown={e => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      const node = e.currentTarget, position = node.selectionStart ?? 0;
      if (node.selectionEnd !== position) return;
      if (e.key === "Backspace" && node.value[position - 1] === "/") node.setSelectionRange(position - 1, position - 1);
      if (e.key === "Delete" && node.value[position] === "/") node.setSelectionRange(position + 1, position + 1);
    }}
    onChange={e => {
      const node = e.currentTarget, raw = node.value, position = node.selectionStart ?? raw.length;
      const deleting = (e.nativeEvent as InputEvent).inputType?.startsWith("delete") ?? false;
      const atEnd = position === raw.length;
      const formatted = formatDateInput(raw, { deleting, preserveSegments: !atEnd });
      const digitCount = raw.slice(0, position).replace(/\D/g, "").length;
      node.value = formatted;
      onChange?.(e);
      requestAnimationFrame(() => {
        if (!node.isConnected || input.current !== node || document.activeElement !== node) return;
        let caret = atEnd ? formatted.length : formatted === raw ? position : 0;
        if (!atEnd && formatted !== raw) {
          let count = 0;
          while (caret < formatted.length && count < digitCount) {
            if (/\d/.test(formatted[caret])) count++;
            caret++;
          }
          if (!deleting && formatted[caret] === "/") caret++;
        }
        node.setSelectionRange(caret, caret);
      });
    }} />;
});
export default DateInput;
