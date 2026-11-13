import { date, money, number } from "../lib/format.js";
import { ReportIcon } from "./report-picker";
export function ReportPlaceholder({ stock, busy, error, empty }) {
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
    return (<section className="report-placeholder" aria-busy={busy} role={error ? "alert" : "status"}>
      <ReportIcon name={icon} size={size} className={busy ? "report-spinning" : ""}/>
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
    </section>);
}
function Stat({ label, value, note, testid }) {
    return (<div className="report-stat">
      <p>{label}</p>
      <strong data-testid={testid}>{value}</strong>
      {note && <small>{note}</small>}
    </div>);
}
function Chart({ report, profit }) {
    const values = report.trend.flatMap((r) => profit ? [r.revenue, r.cost] : [r.revenue]);
    const max = Math.max(1, ...values), min = Math.min(0, ...values);
    const unit = 10 ** Math.floor(Math.log10(Math.max(max, Math.abs(min)) / 3));
    const step = Math.ceil(max / 3 / unit) * unit;
    const upper = step * 3, lower = min < 0 ? -Math.ceil(Math.abs(min) / unit) * unit : 0, span = upper - lower;
    const points = report.trend.map((r, i) => ({
        x: ((i + 0.5) / report.trend.length) * 568,
        y: ((upper - r.revenue) / span) * 240,
    }));
    const zeroY = (upper / span) * 240;
    const zero = (upper / span) * 100;
    const compact = (v) => Math.abs(v) >= 1000000 ? `${number(v / 1000000)}tr` : number(v);
    return (<section className="report-chart-card">
      <div className="report-result-title">
        <h2>
          {profit
            ? "Doanh thu thuần và giá vốn theo ngày"
            : "Biểu đồ xu hướng doanh thu thuần"}
        </h2>
        {profit && (<div className="report-legend">
            <span>Doanh thu thuần</span>
            <span>Giá vốn</span>
          </div>)}
      </div>
      <div className="report-chart">
        <div className="report-chart-axis">
          {[upper, upper - span / 3, upper - (span * 2) / 3, lower].map((v, i) => (<span key={i} style={{ top: `${(i * 100) / 3}%` }}>
                {compact(v)}
              </span>))}
        </div>
        <div className="report-plot">
          <div className="report-grid-lines">
            {[0, 1, 2, 3].map((i) => (<i key={i} style={{ top: `${(i * 100) / 3}%` }}/>))}
          </div>
          <div className="report-zero" style={{ top: zero + "%" }}/>
          {!profit && (<svg className="report-revenue-line" viewBox="0 0 568 240" preserveAspectRatio="none" aria-label="Biểu đồ xu hướng doanh thu thuần" role="img">
              <path fill="#103a9b" fillOpacity=".08" d={`M ${points[0]?.x || 0},${zeroY} ${points.map((p) => `L ${p.x},${p.y}`).join(" ")} L ${points.at(-1)?.x || 0},${zeroY} Z`}/>
              <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#103a9b" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
              {points.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#103a9b" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                  <title>
                    {date(report.trend[i].day)}:{" "}
                    {money(report.trend[i].revenue)}
                  </title>
                </circle>))}
            </svg>)}
          <div className="report-chart-columns">
            {report.trend.map((r) => (<div className="report-chart-day" key={r.day}>
                {(profit ? [r.revenue, r.cost] : []).map((v, i) => (<div key={i} className={`report-chart-bar ${i ? "cost" : ""}`} style={{
                    height: `${(Math.abs(v) / span) * 100}%`,
                    top: `${v >= 0 ? ((upper - v) / span) * 100 : zero}%`,
                }} title={`${date(r.day)} · ${i ? "Giá vốn" : "Doanh thu thuần"}: ${money(v)}`}/>))}
                <span>{date(r.day).slice(0, 5)}</span>
              </div>))}
          </div>
        </div>
      </div>
    </section>);
}
export default function ReportResults({ report, stock }) {
    const ranking = report.type === "Sản phẩm bán chạy/chậm", profit = report.type === "Lợi nhuận";
    const range = `${date(report.filters.from)} – ${date(report.filters.to)}`;
    const total = report.sections[0]?.total;
    const show = (v, c) => typeof v === "number"
        ? /Doanh thu|Giá trị|giá vốn|Lợi nhuận/.test(c)
            ? money(v)
            : number(v)
        : typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)
            ? date(v)
            : v;
    return (<>
      {!ranking && (<div className={`report-stats ${stock ? "stock-stats" : profit ? "profit-stats" : "revenue-stats"}`}>
          {stock ? (<>
              <Stat label="Tồn đầu kỳ" value={number(total[1])}/>
              <Stat label="Tổng nhập" value={number(total[2])}/>
              <Stat label="Tổng xuất" value={number(total[3])}/>
              <Stat label="Tồn cuối kỳ" value={number(total[6])}/>
              <Stat label="Giá trị tồn" value={money(total[7])}/>
            </>) : (<>
              <Stat label={profit ? "Doanh thu thuần" : "Tổng doanh thu thuần"} value={money(report.summary.revenue)} note={range} testid="report-revenue"/>
              {profit ? (<>
                  <Stat label="Tổng giá vốn" value={money(report.summary.cost)} note="Số lượng bán thuần × giá nhập bình quân"/>
                  <Stat label="Lợi nhuận gộp" value={money(report.summary.profit)} note="Doanh thu thuần − Tổng giá vốn"/>
                </>) : (<Stat label="Số hóa đơn" value={number(report.summary.invoices)} note="Hóa đơn đã thanh toán, không tính hóa đơn đã hủy"/>)}
            </>)}
        </div>)}
      <div className={`report-details ${!stock && !ranking && !profit ? "report-revenue-details" : ""}`}>
        {!stock && !ranking && <Chart report={report} profit={profit}/>}
        <div className={ranking ? "report-rankings" : "report-tables"}>
          {(!profit ? report.sections : []).map((s, i) => (<section className={`report-table-card ${ranking ? "report-ranking-card" : ""}`} key={s.title}>
              <div className="report-result-title">
                <div>
                  <h2>
                    {stock
                ? `${s.title}, ${range}`
                : ranking
                    ? s.title
                    : "Bảng số liệu theo ngày"}
                  </h2>
                  {ranking && (<p>
                      {i === 0
                    ? `Xếp hạng theo ${report.filters.rank === "Doanh thu thuần" ? "doanh thu thuần" : "số lượng bán thuần"}, giảm dần`
                    : "Số lượng bán thuần thấp nhất, chỉ xét sản phẩm còn tồn kho > 0"}
                    </p>)}
                </div>
                {stock && (<small>
                    Tồn cuối kỳ = Tồn đầu kỳ + Nhập − Xuất + Điều chỉnh tăng −
                    Điều chỉnh giảm
                  </small>)}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {s.columns.map((c, j) => (<th key={c} className={`${j >= (ranking ? 2 : 1) ? "num" : ""} ${c.includes("↓") || c.includes("↑") ? "sort-column" : ""}`}>
                          {c}
                        </th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((row, ri) => (<tr key={ri}>
                        {row.map((v, j) => (<td key={j} className={`${typeof v === "number" ? "num" : ""} ${(stock && j === 6) || (ranking && j === (i === 0 && report.filters.rank === "Doanh thu thuần" ? 3 : 2)) ? "report-emphasis" : ""}`}>
                            {show(v, s.columns[j])}
                          </td>))}
                      </tr>))}
                  </tbody>
                  {!ranking && (<tfoot>
                      <tr>
                        {s.total.map((v, j) => (<td key={j} className={typeof v === "number" ? "num" : ""} data-testid={`report-total-${i}-${j}`}>
                            {show(v, s.columns[j])}
                          </td>))}
                      </tr>
                    </tfoot>)}
                </table>
              </div>
              {!s.rows.length && (<p className="report-no-rows">Không có dữ liệu phù hợp</p>)}
            </section>))}
        </div>
      </div>
    </>);
}
