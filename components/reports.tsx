"use client";
import ReportDate from "./report-date";
import { useState, useEffect } from "react";
import { api, Button, Field, Notice, Empty, Modal, useApp } from "./ui";
import { money, number, date, today, iso } from "@/lib/format";
export default function Reports({ stock = false }: any) {
  const { data, notify, confirm } = useApp();
  const [type, setType] = useState(stock ? "Xuất – nhập – tồn" : "Doanh thu");
  const [from, setFrom] = useState(date(today().slice(0, 8) + "01"));
  const [to, setTo] = useState(date(today()));
  const [calendar, setCalendar] = useState<"from" | "to" | null>(null);
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState("");
  const [rank, setRank] = useState("Số lượng bán thuần");
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState("Excel");
  const [exportError, setExportError] = useState("");
  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api("report", {
        type,
        from: iso(from),
        to: iso(to),
        product,
        category,
        rank,
      });
      setReport(r);
    } catch (e: any) {
      setError(e.message);
      setReport(null);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  function quick(label: string) {
    const d = new Date(today() + "T12:00:00Z");
    let a = new Date(d),
      b = new Date(d);
    if (label === "Hôm qua") {
      a.setUTCDate(a.getUTCDate() - 1);
      b = new Date(a);
    } else if (label === "7 ngày qua") a.setUTCDate(a.getUTCDate() - 6);
    else if (label === "Tháng này") a.setUTCDate(1);
    else if (label === "Tháng trước") {
      a.setUTCDate(1);
      a.setUTCMonth(a.getUTCMonth() - 1);
      b = new Date(a);
      b.setUTCMonth(b.getUTCMonth() + 1);
      b.setUTCDate(0);
    }
    setFrom(date(a.toISOString()));
    setTo(date(b.toISOString()));
  }
  async function download() {
    setBusy(true);
    setExportError("");
    try {
      const r = await fetch(
        `/api/export?id=${report.id}&format=${format === "Excel" ? "xlsx" : "pdf"}`,
      );
      if (!r.ok) {
        const d = await r.json();
        throw Error(d.error);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bao-cao-Quynh-Nhu.${format === "Excel" ? "xlsx" : "pdf"}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Xuất báo cáo thành công");
      setExporting(false);
    } catch (e: any) {
      setExportError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const show = (v: any) =>
    typeof v === "number"
      ? number(v)
      : typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)
        ? date(v)
        : v;
  return (
    <>
      <h1>{stock ? "Báo cáo xuất – nhập – tồn" : "Báo cáo kinh doanh"}</h1>
      <section className="card">
        <h2>Bộ lọc báo cáo</h2>
        <form onSubmit={load}>
          <div className="filters">
            {!stock && (
              <Field label="Loại báo cáo">
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>Doanh thu</option>
                  <option>Lợi nhuận</option>
                  <option>Sản phẩm bán chạy/chậm</option>
                </select>
              </Field>
            )}
            {stock ? <>
            <Field
              label="Từ ngày"
              value={from}
              placeholder="dd/mm/yyyy"
              onChange={(e: any) => setFrom(e.target.value)}
            />
            <Field
              label="Đến ngày"
              value={to}
              placeholder="dd/mm/yyyy"
              onChange={(e: any) => setTo(e.target.value)}
            />
            </> : <>
              <ReportDate label="Từ ngày" value={from} onChange={setFrom} from={from} to={to}
                open={calendar === "from"} onOpen={() => setCalendar("from")} onClose={() => setCalendar(null)} />
              <ReportDate label="Đến ngày" value={to} onChange={setTo} from={from} to={to}
                open={calendar === "to"} onOpen={() => setCalendar("to")} onClose={() => setCalendar(null)} />
            </>}
            <Field label="Sản phẩm">
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="">Tất cả</option>
                {data.products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nhóm sản phẩm">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Tất cả</option>
                {data.categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {type === "Sản phẩm bán chạy/chậm" && (
              <Field label="Tiêu chí xếp hạng">
                <select value={rank} onChange={(e) => setRank(e.target.value)}>
                  <option>Số lượng bán thuần</option>
                  <option>Doanh thu thuần</option>
                </select>
              </Field>
            )}
            <Button variant="primary" type="submit" disabled={busy}>
              Xem báo cáo
            </Button>
          </div>
          <div className="row">
            {[
              "Hôm nay",
              ...(!stock ? ["Hôm qua"] : []),
              "7 ngày qua",
              "Tháng này",
              "Tháng trước",
            ].map((x) => (
              <Button key={x} variant="tiny" onClick={() => quick(x)}>
                {x}
              </Button>
            ))}
          </div>
        </form>
        <Notice text={error} />
      </section>
      {report && (
        <>
          <div className="row between" style={{ margin: "24px 0" }}>
            <span className="muted small">{report.filterText}</span>
            <Button
              variant="primary"
              disabled={!report.hasData}
              onClick={() => {
                setExporting(true);
                setExportError("");
              }}
            >
              Xuất báo cáo
            </Button>
          </div>
          {!stock && (
            <div className="stat-grid">
              <div className="stat">
                <p>Tổng doanh thu thuần</p>
                <strong data-testid="report-revenue">
                  {money(report.summary.revenue)}
                </strong>
              </div>
              <div className="stat">
                <p>
                  {report.type === "Lợi nhuận" ? "Tổng giá vốn" : "Số hóa đơn"}
                </p>
                <strong>
                  {report.type === "Lợi nhuận"
                    ? money(report.summary.cost)
                    : report.summary.invoices}
                </strong>
              </div>
              <div className="stat">
                <p>Lợi nhuận gộp</p>
                <strong>{money(report.summary.profit)}</strong>
              </div>
            </div>
          )}
          {!report.hasData && (
            <Notice kind="info" text="Không có dữ liệu phù hợp" />
          )}
          {report.hasData &&
            !stock &&
            report.type !== "Sản phẩm bán chạy/chậm" && (
              <section className="card">
                <h2>Biểu đồ xu hướng</h2>
                <div className="chart">
                  {report.trend.map((r: any) => {
                    const value =
                      report.type === "Lợi nhuận"
                        ? r.revenue - r.cost
                        : r.revenue;
                    const max = Math.max(
                      1,
                      ...report.trend.map((x: any) =>
                        Math.abs(
                          report.type === "Lợi nhuận"
                            ? x.revenue - x.cost
                            : x.revenue,
                        ),
                      ),
                    );
                    return (
                      <div className="chart-item" key={r.day}>
                        <span>{money(value)}</span>
                        <div
                          className="chart-bar"
                          style={{
                            height: Math.max(2, (Math.abs(value) / max) * 140),
                            background: value < 0 ? "#d92d20" : undefined,
                          }}
                        />
                        <small>{date(r.day)}</small>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          {report.sections.map((s: any, i: number) => (
            <section className="card" key={i}>
              <h2>{s.title}</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {s.columns.map((c: string, j: number) => (
                        <th key={c} className={j > 0 ? "num" : ""}>
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
                            className={typeof v === "number" ? "num" : ""}
                          >
                            {show(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {s.rows.length > 0 && (
                      <tr style={{ fontWeight: 600, background: "#f8faff" }}>
                        {s.total.map((v: any, j: number) => (
                          <td
                            key={j}
                            className={typeof v === "number" ? "num" : ""}
                            data-testid={"report-total-" + i + "-" + j}
                          >
                            {show(v)}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!s.rows.length && <Empty text="Không có dữ liệu phù hợp" />}
            </section>
          ))}
        </>
      )}
      {exporting && (
        <Modal
          title="Xuất báo cáo"
          onClose={() =>
            confirm("Bạn có chắc chắn muốn hủy thao tác không?", () =>
              setExporting(false),
            )
          }
        >
          <Field label="Định dạng">
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option>Excel</option>
              <option>PDF</option>
            </select>
          </Field>
          <Notice text={exportError} />
          <div className="actions">
            <Button
              onClick={() =>
                confirm("Bạn có chắc chắn muốn hủy thao tác không?", () =>
                  setExporting(false),
                )
              }
            >
              Hủy
            </Button>
            <Button variant="primary" disabled={busy} onClick={download}>
              Xuất báo cáo
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
