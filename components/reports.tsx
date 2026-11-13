"use client";
import { useRef, useState } from "react";
import ReportDate from "./report-date";
import ReportPicker, { ReportIcon } from "./report-picker";
import ReportExport from "./report-export";
import ReportResults, { ReportPlaceholder } from "./report-results";
import { api, Button } from "./ui";
import { date, today, iso } from "@/lib/format";
import "./reports.css";
export default function Reports({ stock = false }: { stock?: boolean }) {
  const [type, setType] = useState(stock ? "Xuất – nhập – tồn" : "");
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [picker, setPicker] = useState<
    "from" | "to" | "type" | "products" | null
  >(null);
  const [selection, setSelection] = useState<string[]>([]),
    [rank, setRank] = useState("Số lượng bán thuần");
  const [report, setReport] = useState<any>(null),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [exporting, setExporting] = useState(false);
  const lock = useRef(false);
  function clear() {
    setReport(null);
    setError("");
  }
  async function load(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setReport(null);
    setPicker(null);
    try {
      setReport(
        await api("report", {
          type,
          from: iso(from),
          to: iso(to),
          products: selection
            .filter((x) => x.startsWith("p:"))
            .map((x) => x.slice(2)),
          categories: selection
            .filter((x) => x.startsWith("c:"))
            .map((x) => x.slice(2)),
          rank,
        }),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function quick(label: string) {
    let a = new Date(today() + "T12:00:00Z"),
      b = new Date(a);
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
    clear();
    setFrom(date(a.toISOString()));
    setTo(date(b.toISOString()));
    setPicker(null);
  }
  const invalid = error === "Khoảng thời gian hoặc tiêu chí lọc không hợp lệ";
  const fromError =
    invalid && iso(from) > today() ? "Không vượt quá ngày hiện tại" : "";
  const toError =
    invalid && iso(to) < iso(from)
      ? "Không nhỏ hơn Từ ngày"
      : invalid && iso(to) > today()
        ? "Không vượt quá ngày hiện tại"
        : "";
  return (
    <div
      className={`reports-page ${stock ? "stock-report-page" : "business-report-page"}`}
    >
      <div className="report-page-heading">
        <h1>{stock ? "Báo cáo xuất – nhập – tồn" : "Báo cáo kinh doanh"}</h1>
        {report?.hasData && (
          <Button onClick={() => setExporting(true)}>
            <ReportIcon name="d5302" />
            Xuất báo cáo
          </Button>
        )}
      </div>
      <form className="report-filter-card" onSubmit={load} noValidate>
        <fieldset disabled={busy}>
          <div className="report-filter-fields">
            {!stock && (
              <ReportPicker
                kind="type"
                value={type}
                onChange={(v: string) => {
                  clear();
                  setType(v);
                }}
                open={picker === "type"}
                onOpen={() => setPicker("type")}
                onClose={() => setPicker(null)}
              />
            )}
            <div className={fromError ? "report-date-error" : ""}>
              <ReportDate
                label="Từ ngày"
                value={from}
                onChange={(v: string) => {
                  clear();
                  setFrom(v);
                }}
                from={from}
                to={to}
                open={picker === "from"}
                onOpen={() => setPicker("from")}
                onClose={() => setPicker(null)}
              />
              {fromError && <p className="field-error">{fromError}</p>}
            </div>
            <div className={toError ? "report-date-error" : ""}>
              <ReportDate
                label="Đến ngày"
                value={to}
                onChange={(v: string) => {
                  clear();
                  setTo(v);
                }}
                from={from}
                to={to}
                open={picker === "to"}
                onOpen={() => setPicker("to")}
                onClose={() => setPicker(null)}
              />
              {toError && <p className="field-error">{toError}</p>}
            </div>
            <ReportPicker
              kind="products"
              value={selection}
              onChange={(v: string[]) => {
                clear();
                setSelection(v);
              }}
              open={picker === "products"}
              onOpen={() => setPicker("products")}
              onClose={() => setPicker(null)}
            />
          </div>
          <div className="report-quick">
            <span>Lọc nhanh:</span>
            {[
              "Hôm nay",
              "Hôm qua",
              "7 ngày qua",
              "Tháng này",
              "Tháng trước",
            ].map((x) => (
              <button type="button" key={x} onClick={() => quick(x)}>
                {x}
              </button>
            ))}
          </div>
          {type === "Sản phẩm bán chạy/chậm" && (
            <div
              className="report-ranking-criteria"
              role="radiogroup"
              aria-label="Xếp hạng theo"
            >
              <span>Xếp hạng theo:</span>
              {["Số lượng bán thuần", "Doanh thu thuần"].map((x) => (
                <label key={x}>
                  <input
                    type="radio"
                    name="rank"
                    value={x}
                    checked={rank === x}
                    onChange={() => {
                      clear();
                      setRank(x);
                    }}
                  />
                  {x}
                </label>
              ))}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={busy}>
            <ReportIcon
              name={busy ? "report-busy-button" : "bb29d"}
              className={busy ? "report-spinning" : ""}
            />
            {busy ? "Đang xử lý..." : "Xem báo cáo"}
          </Button>
        </fieldset>
      </form>
      {report?.hasData ? (
        <ReportResults report={report} stock={stock} />
      ) : (
        <ReportPlaceholder
          stock={stock}
          busy={busy}
          error={error}
          empty={report && !report.hasData}
        />
      )}
      {exporting && report?.hasData && (
        <ReportExport report={report} onClose={() => setExporting(false)} />
      )}
    </div>
  );
}
