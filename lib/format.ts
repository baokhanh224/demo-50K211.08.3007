export const money = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n || 0) +
  "đ";
export const number = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(n || 0);
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function date(v: string) {
  if (!v) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(v.length === 10 ? v + "T12:00:00+07:00" : v));
}
export function datetime(v: string) {
  if (!v) return "—";
  return (
    date(v) +
    " " +
    new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(v))
  );
}
export function iso(v: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : v;
}
