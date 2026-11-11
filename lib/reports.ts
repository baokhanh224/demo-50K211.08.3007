import { randomUUID } from "node:crypto";
import { all, one, run, day, now, requestContext, transaction } from "./db";
import { products, takeFailure, validDate } from "./service";
import { fail } from "./errors";
export type Section = {
  title: string;
  columns: string[];
  rows: any[][];
  total: any[];
};
export type Report = {
  id: string;
  type: string;
  filters: any;
  filterText: string;
  sections: Section[];
  summary: any;
  trend: any[];
  hasData: boolean;
};
const sum = (rows: any[][], column: number) =>
  rows.reduce((s, r) => s + (Number(r[column]) || 0), 0);
export async function reportData(d: any): Promise<Report> {
  if (
    !validDate(d.from) ||
    !validDate(d.to) ||
    d.from > d.to ||
    d.to > day() ||
    d.from > day() ||
    ![
      "Doanh thu",
      "Lợi nhuận",
      "Sản phẩm bán chạy/chậm",
      "Xuất – nhập – tồn",
    ].includes(d.type) ||
    (d.rank && !["Số lượng bán thuần", "Doanh thu thuần"].includes(d.rank))
  )
    fail("Khoảng thời gian hoặc tiêu chí lọc không hợp lệ");
  if (await takeFailure("fail_load"))
    fail("Không thể tải báo cáo. Vui lòng thử lại");
  return transaction(async () => {
    const ps = await products();
    if (
      (d.product && !ps.some((p) => p.id === d.product)) ||
      (d.category &&
        !(await one("SELECT id FROM category WHERE id=?", Number(d.category))))
    )
      fail("Khoảng thời gian hoặc tiêu chí lọc không hợp lệ");
    const selected = ps.filter(
      (p) =>
        (!d.product || p.id === d.product) &&
        (!d.category || p.category_id === Number(d.category)),
    );
    const ids = new Set(selected.map((p) => p.id));
    const inside = (time: string) => {
      const v = day(new Date(time));
      return v >= d.from && v <= d.to;
    };
    const events: any[] = [];
    for (const l of await all(
      "SELECT l.*,i.created_at,i.cancelled_at FROM invoice_line l JOIN invoice i ON i.id=l.invoice_id",
    )) {
      if (!ids.has(l.product_id)) continue;
      const event = {
        product: l.product_id,
        invoice: l.invoice_id,
        quantity: l.quantity * l.factor,
        revenue: l.total,
        cost: l.quantity * l.factor * l.cost,
      };
      events.push({ ...event, time: l.created_at, count: 1 });
      if (l.cancelled_at)
        events.push({
          ...event,
          time: l.cancelled_at,
          quantity: -event.quantity,
          revenue: -event.revenue,
          cost: -event.cost,
          count: -1,
        });
    }
    for (const l of await all(
      "SELECT l.*,t.created_at,t.invoice_id FROM return_line l JOIN return_ticket t ON t.id=l.ticket_id",
    )) {
      if (!ids.has(l.product_id)) continue;
      const sign = l.kind === "return" ? -1 : 1;
      events.push({
        product: l.product_id,
        invoice: l.invoice_id,
        time: l.created_at,
        quantity: sign * l.quantity * l.factor,
        revenue: sign * l.total,
        cost: sign * l.quantity * l.factor * l.cost,
        count: 0,
      });
    }
    const period = events.filter((e) => inside(e.time));
    const revenue = period.reduce((s, e) => s + e.revenue, 0),
      cost = period.reduce((s, e) => s + e.cost, 0);
    const dated = new Map<string, any>();
    const counted = new Set<string>();
    for (const e of period) {
      const date = day(new Date(e.time));
      const row = dated.get(date) || {
        day: date,
        revenue: 0,
        cost: 0,
        invoices: 0,
      };
      row.revenue += e.revenue;
      row.cost += e.cost;
      const key = e.invoice + ":" + date + ":" + e.count;
      if (e.count && !counted.has(key)) {
        row.invoices += e.count;
        counted.add(key);
      }
      dated.set(date, row);
    }
    const trend = [...dated.values()].sort((a, b) =>
      a.day.localeCompare(b.day),
    );
    let sections: Section[] = [];
    let hasData = period.length > 0;
    if (d.type === "Xuất – nhập – tồn") {
      const moves = await all("SELECT * FROM movement ORDER BY id");
      const rows = selected
        .map((p) => {
          let start = 0,
            input = 0,
            output = 0,
            increase = 0,
            decrease = 0;
          for (const m of moves) {
            if (m.product_id !== p.id) continue;
            const date = day(new Date(m.created_at));
            if (date < d.from) start += m.quantity;
            else if (date <= d.to) {
              if (m.kind === "adjustment") {
                if (m.quantity > 0) increase += m.quantity;
                else decrease -= m.quantity;
              } else if (m.quantity >= 0) input += m.quantity;
              else output -= m.quantity;
            }
          }
          const end = start + input - output + increase - decrease;
          return [
            p.id + " · " + p.name,
            p.base_unit,
            start,
            input,
            output,
            increase,
            decrease,
            end,
            end * p.average_cost,
          ];
        })
        .filter((r) => r.slice(2, 8).some((x) => Number(x) !== 0));
      sections = [
        {
          title: "Báo cáo xuất – nhập – tồn",
          columns: [
            "Sản phẩm",
            "Đơn vị tính",
            "Tồn đầu kỳ",
            "Nhập",
            "Xuất",
            "Điều chỉnh tăng",
            "Điều chỉnh giảm",
            "Tồn cuối kỳ",
            "Giá trị tồn",
          ],
          rows,
          total: [
            "Tổng",
            "",
            ...Array.from({ length: 7 }, (_, i) => sum(rows, i + 2)),
          ],
        },
      ];
      hasData = rows.length > 0;
    } else if (d.type === "Sản phẩm bán chạy/chậm") {
      const metrics = selected.map((p) => {
        const es = period.filter((e) => e.product === p.id);
        return {
          p,
          quantity: es.reduce((s, e) => s + e.quantity, 0),
          revenue: es.reduce((s, e) => s + e.revenue, 0),
        };
      });
      const key = d.rank === "Doanh thu thuần" ? "revenue" : "quantity";
      const make = (title: string, items: any[]): Section => {
        const rows = items.map((m) => [
          m.p.id + " · " + m.p.name,
          m.p.base_unit,
          m.quantity,
          m.revenue,
        ]);
        return {
          title,
          columns: [
            "Sản phẩm",
            "Đơn vị tính",
            "Số lượng bán thuần",
            "Doanh thu thuần",
          ],
          rows,
          total: ["Tổng", "", sum(rows, 2), sum(rows, 3)],
        };
      };
      sections = [
        make(
          "10 sản phẩm bán chạy",
          metrics
            .filter((m) => m[key] > 0)
            .sort((a, b) => b[key] - a[key] || a.p.id.localeCompare(b.p.id))
            .slice(0, 10),
        ),
        make(
          "10 sản phẩm bán chậm",
          metrics
            .filter((m) => m.p.stock > 0)
            .sort((a, b) => a[key] - b[key] || a.p.id.localeCompare(b.p.id))
            .slice(0, 10),
        ),
      ];
      hasData = sections.some((s) => s.rows.length > 0);
    } else {
      const profit = d.type === "Lợi nhuận";
      const rows = trend.map((r) =>
        profit
          ? [r.day, r.revenue, r.cost, r.revenue - r.cost]
          : [r.day, r.invoices, r.revenue],
      );
      sections = [
        {
          title: "Báo cáo " + d.type.toLocaleLowerCase("vi"),
          columns: profit
            ? ["Ngày", "Doanh thu thuần", "Tổng giá vốn", "Lợi nhuận gộp"]
            : ["Ngày", "Số hóa đơn", "Doanh thu thuần"],
          rows,
          total: [
            "Tổng",
            ...Array.from({ length: profit ? 3 : 2 }, (_, i) =>
              sum(rows, i + 1),
            ),
          ],
        },
      ];
    }
    const category = d.category
      ? (await one("SELECT name FROM category WHERE id=?", Number(d.category)))
          ?.name
      : "Tất cả";
    const product = d.product
      ? ps.find((p) => p.id === d.product)?.name
      : "Tất cả";
    const { date } = await import("./format");
    const report: Report = {
      id: randomUUID(),
      type: d.type,
      filters: { ...d, category_name: category, product_name: product },
      filterText:
        `Từ ngày: ${date(d.from)} · Đến ngày: ${date(d.to)} · Sản phẩm: ${product} · Nhóm sản phẩm: ${category}` +
        (d.type === "Sản phẩm bán chạy/chậm"
          ? ` · Tiêu chí xếp hạng: ${d.rank || "Số lượng bán thuần"}`
          : ""),
      sections,
      summary: {
        revenue,
        cost,
        profit: revenue - cost,
        invoices: trend.reduce((s, r) => s + r.invoices, 0),
      },
      trend,
      hasData,
    };
    await run(
      "INSERT INTO report_snapshot VALUES (?,?,?,?)",
      report.id,
      requestContext.getStore()?.token || "cli",
      now(),
      JSON.stringify(report),
    );
    return report;
  });
}
export async function exportSnapshot(id: string) {
  if (await takeFailure("fail_export_read"))
    fail("Không thể xuất báo cáo, vui lòng thử lại");
  const row = await one(
    "SELECT data FROM report_snapshot WHERE id=? AND session_token=?",
    id,
    requestContext.getStore()?.token || "cli",
  );
  if (!row) fail("Không thể xuất báo cáo, vui lòng thử lại");
  const data = JSON.parse(row.data) as Report;
  if (!data.hasData) fail("Không thể xuất báo cáo, vui lòng thử lại");
  if (await takeFailure("fail_export_file"))
    fail("Xuất báo cáo không thành công, vui lòng thử lại");
  return data;
}
