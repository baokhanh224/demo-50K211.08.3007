"use client";
import { date, money, number } from "@/lib/format";
import { ReportIcon } from "./report-picker";
import { chartScale } from "@/lib/chart-scale";
export function ReportPlaceholder({ stock, busy, error, empty }: any) {
  const isEmpty = !!empty && !busy && !error;
  const icon = busy
    ? "report-busy"
    : error
      ? error.includes("không hợp lệ")
        ? "report-invalid"
        : "report-load-error"
      : empty
        ? "report-empty"
        : stock
          ? "report-idle-stock"
          : "report-idle";
  const size = busy
    ? 20
    : error?.includes("không hợp lệ") || (!error && !empty)
      ? 40
      : 32;
  return (
    <section
      className={`report-placeholder${isEmpty ? " report-empty-state" : ""}`}
      aria-busy={busy}
      role={error ? "alert" : "status"}
    >
      {isEmpty ? <span className="report-empty-icon"><ReportIcon name={icon} size={size} /></span> : <ReportIcon
        name={icon}
        size={size}
        className={busy ? "report-spinning" : ""}
      />}
      <p className={error ? "report-error-copy" : ""}>
        {busy
          ? stock
            ? "Đang kiểm tra tiêu chí và truy xuất dữ liệu tồn kho, giao dịch nhập – xuất – điều chỉnh..."
            : "Đang kiểm tra tiêu chí lọc và truy xuất dữ liệu báo cáo..."
          : error ||
            (empty
              ? "Không có dữ liệu phù hợp"
              : stock
                ? "Chọn khoảng thời gian, sau đó nhấn “Xem báo cáo”."
                : "Chọn loại báo cáo và tiêu chí lọc, sau đó nhấn “Xem báo cáo”.")}
      </p>
    </section>
  );
}
function Stat({ label, value, note, testid }: any) {
  return (
    <div className="report-stat">
      <p>{label}</p>
      <strong data-testid={testid}>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
function Chart({ report, profit }: any) {
  const values = report.trend.flatMap((r: any) =>
    profit ? [r.revenue, r.cost] : [r.revenue],
  );
  const { upper, span, ticks } = chartScale(values);
  const labelEvery = Math.max(1, Math.ceil(report.trend.length / 8));
  const points = report.trend.map((r: any, i: number) => ({
    x: ((i + 0.5) / report.trend.length) * 568,
    y: ((upper - r.revenue) / span) * 240,
  }));
  const zeroY = (upper / span) * 240;
  const zero = (upper / span) * 100;
  const compact = (v: number) =>
    Math.abs(v) >= 1000000 ? `${number(v / 1000000)}tr` : number(v);
  return (
    <section className="report-chart-card">
      <div className="report-result-title">
        <h2>
          {profit
            ? "Doanh thu thuần và giá vốn theo ngày"
            : "Biểu đồ xu hướng doanh thu thuần"}
        </h2>
        {profit && (
          <div className="report-legend">
            <span>Doanh thu thuần</span>
            <span>Giá vốn</span>
          </div>
        )}
      </div>
      <div className="report-chart">
        <div className="report-chart-axis">
          {ticks.map((v: number) => <span key={v} style={{ top: `${((upper - v) / span) * 100}%` }}>{compact(v)}</span>)}
        </div>
        <div className="report-plot">
          <div className="report-grid-lines">
            {ticks.map((v: number) => <i key={v} style={{ top: `${((upper - v) / span) * 100}%` }} />)}
          </div>
          <div className="report-zero" style={{ top: zero + "%" }} />
          {!profit && (
            <svg
              className="report-revenue-line"
              viewBox="0 0 568 240"
              preserveAspectRatio="none"
              aria-label="Biểu đồ xu hướng doanh thu thuần"
              role="img"
            >
              <path
                fill="#103a9b"
                fillOpacity=".08"
                d={`M ${points[0]?.x || 0},${zeroY} ${points.map((p: any) => `L ${p.x},${p.y}`).join(" ")} L ${points.at(-1)?.x || 0},${zeroY} Z`}
              />
              <polyline
                points={points.map((p: any) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#103a9b"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          {!profit && points.map((p: any, i: number) => <span key={report.trend[i].day} className="report-revenue-point" style={{ left: `${p.x / 568 * 100}%`, top: `${p.y / 240 * 100}%` }} title={`${date(report.trend[i].day)}: ${money(report.trend[i].revenue)}`} />)}
          <div className="report-chart-columns" style={{ gridTemplateColumns: `repeat(${report.trend.length || 1}, minmax(0, 1fr))` }}>
            {report.trend.map((r: any, index: number) => (
              <div className="report-chart-day" key={r.day}>
                {(profit ? [r.revenue, r.cost] : []).map(
                  (v: number, i: number) => (
                    <div
                      key={i}
                      className={`report-chart-bar ${i ? "cost" : ""}`}
                      data-negative={v < 0}
                      style={{
                        height: `${(Math.abs(v) / span) * 100}%`,
                        top: `${v >= 0 ? ((upper - v) / span) * 100 : zero}%`,
                      }}
                      title={`${date(r.day)} · ${i ? "Giá vốn" : "Doanh thu thuần"}: ${money(v)}`}
                    />
                  ),
                )}
                <span style={{ visibility: index === report.trend.length - 1 || (index % labelEvery === 0 && report.trend.length - 1 - index >= labelEvery) ? "visible" : "hidden" }} title={date(r.day)}>{date(r.day).slice(0, 5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export default function ReportResults({ report, stock }: any) {
  const ranking = report.type === "Sản phẩm bán chạy/chậm",
    profit = report.type === "Lợi nhuận";
  const range = `${date(report.filters.from)} – ${date(report.filters.to)}`;
  const total = report.sections[0]?.total;
  const show = (v: any, c: string) =>
    typeof v === "number"
      ? /Doanh thu|Giá trị|giá vốn|Lợi nhuận/.test(c)
        ? money(v)
        : number(v)
      : typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)
        ? date(v)
        : v;
  return (
    <>
      {!ranking && (
        <div
          className={`report-stats ${stock ? "stock-stats" : profit ? "profit-stats" : "revenue-stats"}`}
        >
          {stock ? (
            <>
              <Stat label="Tồn đầu kỳ" value={number(total[1])} />
              <Stat label="Tổng nhập" value={number(total[2])} />
              <Stat label="Tổng xuất" value={number(total[3])} />
              <Stat label="Tồn cuối kỳ" value={number(total[6])} />
              <Stat label="Giá trị tồn" value={money(total[7])} />
            </>
          ) : (
            <>
              <Stat
                label={profit ? "Doanh thu thuần" : "Tổng doanh thu thuần"}
                value={money(report.summary.revenue)}
                note={range}
                testid="report-revenue"
              />
              {profit ? (
                <>
                  <Stat
                    label="Tổng giá vốn"
                    value={money(report.summary.cost)}
                    note="Số lượng bán thuần × giá nhập bình quân"
                  />
                  <Stat
                    label="Lợi nhuận gộp"
                    value={money(report.summary.profit)}
                    note="Doanh thu thuần − Tổng giá vốn"
                  />
                </>
              ) : (
                <Stat
                  label="Số hóa đơn"
                  value={number(report.summary.invoices)}
                  note="Hóa đơn đã thanh toán, không tính hóa đơn đã hủy"
                />
              )}
            </>
          )}
        </div>
      )}
      <div
        className={`report-details ${!stock && !ranking && !profit ? "report-revenue-details" : ""}`}
      >
        {!stock && !ranking && <Chart report={report} profit={profit} />}
        <div className={ranking ? "report-rankings" : "report-tables"}>
          {(!profit ? report.sections : []).map((s: any, i: number) => (
            <section
              className={`report-table-card ${ranking ? "report-ranking-card" : ""}`}
              key={s.title}
            >
              <div className="report-result-title">
                <div>
                  <h2>
                    {stock
                      ? `${s.title}, ${range}`
                      : ranking
                        ? s.title
                        : "Bảng số liệu theo ngày"}
                  </h2>
                  {ranking && (
                    <p>
                      {i === 0
                        ? `Xếp hạng theo ${report.filters.rank === "Doanh thu thuần" ? "doanh thu thuần" : "số lượng bán thuần"}, giảm dần`
                        : "Số lượng bán thuần thấp nhất, chỉ xét sản phẩm còn tồn kho > 0"}
                    </p>
                  )}
                </div>
                {stock && (
                  <small>
                    Tồn cuối kỳ = Tồn đầu kỳ + Nhập − Xuất + Điều chỉnh tăng −
                    Điều chỉnh giảm
                  </small>
                )}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {s.columns.map((c: string, j: number) => (
                        <th
                          key={c}
                          className={`${j >= (ranking ? 2 : 1) ? "num" : ""} ${c.includes("↓") || c.includes("↑") ? "sort-column" : ""}`}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((row: any[], ri: number) => (
                      <tr key={ri}>
                        {row.map((v, j) => (
                          <td
                            key={j}
                            className={`${typeof v === "number" ? "num" : ""} ${(stock && j === 6) || (ranking && j === (i === 0 && report.filters.rank === "Doanh thu thuần" ? 3 : 2)) ? "report-emphasis" : ""}`}
                          >
                            {show(v, s.columns[j])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {!ranking && (
                    <tfoot>
                      <tr>
                        {s.total.map((v: any, j: number) => (
                          <td
                            key={j}
                            className={typeof v === "number" ? "num" : ""}
                            data-testid={`report-total-${i}-${j}`}
                          >
                            {show(v, s.columns[j])}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              {!s.rows.length && (
                <p className="report-no-rows">Không có dữ liệu phù hợp</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
