export function formatDateInput(raw: string, options: { preserveSegments?: boolean; deleting?: boolean } = {}): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (options.deleting && /^\d?\/$/.test(raw)) return digits;
  if (options.preserveSegments && /^\d{0,2}\/\d{0,2}(?:\/\d{0,4})?$/.test(raw)) return raw;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const separated = /^(\d{1,2})[/.](\d{1,2})[/.](\d{0,4})$/.exec(raw.trim());
  if (separated) return `${separated[1].padStart(2, "0")}/${separated[2].padStart(2, "0")}/${separated[3]}`;
  const dayOnly = /^(\d{1,2})\/$/.exec(raw);
  if (dayOnly) return dayOnly[1].padStart(2, "0") + "/";
  const value = digits.slice(0, 8);
  return value.slice(0, 2) + (value.length >= 2 ? "/" + value.slice(2, 4) : "") + (value.length >= 4 ? "/" + value.slice(4) : "");
}
