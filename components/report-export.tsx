"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Modal } from "./ui";
import { date, number } from "@/lib/format";
import { ReportIcon } from "./report-picker";
export default function ReportExport({ report, onClose }: any) {
  const [format, setFormat] = useState("xlsx");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false),
    [file, setFile] = useState<any>(null);
  const lock = useRef(false),
    urlRef = useRef("");
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );
  const requestClose = () => {
    if (!lock.current) setConfirm(true);
  };
  async function download() {
    if (lock.current || !format) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        `/api/export?id=${encodeURIComponent(report.id)}&format=${format}`,
      );
      if (!r.ok) {
        const d = await r.json();
        throw Error(d.error);
      }
      const blob = await r.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const kind =
        report.type === "Xuất – nhập – tồn"
          ? "XuatNhapTon"
          : report.type === "Doanh thu"
            ? "DoanhThu"
            : report.type === "Lợi nhuận"
              ? "LoiNhuan"
              : "SanPhamBanChayCham";
      const filename = `BaoCao_${kind}_${date(report.filters.from).replaceAll("/", "")}_${date(report.filters.to).replaceAll("/", "")}.${format}`;
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setFile({ url, filename, size: blob.size });
    } catch (e: any) {
      setError(e.message || "Xuất báo cáo không thành công, vui lòng thử lại");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (file)
    return (
      <Modal
        title="Xuất báo cáo thành công"
        showClose={false}
        onClose={onClose}
        dismissOnBackdrop
        className="report-dialog report-status-dialog report-export-success"
        overlayClassName="report-dialog-overlay"
      >
        <div className="report-status-icon success">
          <ReportIcon name="report-check" size={28} />
        </div>
        <a className="report-file" href={file.url} download={file.filename}>
          <span className="report-file-badge">{format.toUpperCase()}</span>
          <span>
            <strong>{file.filename}</strong>
            <small>Dung lượng {number(Math.ceil(file.size / 1024))} KB</small>
          </span>
        </a>
      </Modal>
    );
  if (error)
    return (
      <Modal
        title={error}
        showClose={false}
        onClose={onClose}
        className="report-dialog report-status-dialog report-export-error"
        overlayClassName="report-dialog-overlay"
      >
        <div className="report-status-icon warning">
          <ReportIcon name="report-warning" size={28} />
        </div>
        <div className="actions">
          {error === "Không thể xuất báo cáo, vui lòng thử lại" ? (
            <Button variant="primary" onClick={onClose}>
              Đóng
            </Button>
          ) : (
            <>
              <Button onClick={onClose}>Kết thúc</Button>
              <Button variant="primary" onClick={download}>
                <ReportIcon name="report-retry" />
                Thực hiện lại
              </Button>
            </>
          )}
        </div>
      </Modal>
    );
  return (
    <>
      <Modal
        title="Xuất báo cáo"
        showClose={false}
        onClose={requestClose}
        className={`report-dialog report-export-dialog ${busy ? "report-export-busy" : ""}`}
        overlayClassName="report-dialog-overlay"
      >
        {!busy && (
          <button
            type="button"
            className="report-dialog-close"
            aria-label="Đóng"
            onClick={requestClose}
          >
            <ReportIcon name="report-close" size={18} />
          </button>
        )}
        {!busy && (
          <>
            <p className="report-export-instruction">
              Chọn định dạng tệp. Nội dung xuất gồm loại báo cáo, tiêu chí lọc
              và số liệu đang hiển thị.
            </p>
            <div
              className="report-formats"
              role="radiogroup"
              aria-label="Định dạng tệp"
            >
              {[
                { value: "xlsx", label: "Excel (.xlsx)" },
                { value: "pdf", label: "PDF (.pdf)" },
              ].map((x) => (
                <label
                  key={x.value}
                  className={format === x.value ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="report-format"
                    value={x.value}
                    checked={format === x.value}
                    onChange={() => setFormat(x.value)}
                  />
                  {x.label}
                </label>
              ))}
            </div>
          </>
        )}
        <div className="actions">
          <Button disabled={busy} onClick={requestClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            disabled={!format || busy}
            onClick={download}
          >
            <ReportIcon
              name={busy ? "report-busy-button" : "report-download-white"}
              className={busy ? "report-spinning" : ""}
            />
            {busy ? "Đang xử lý..." : "Xuất báo cáo"}
          </Button>
        </div>
      </Modal>
      {confirm && (
        <Modal
          title="Xác nhận"
          showClose={false}
          onClose={() => setConfirm(false)}
          className="report-dialog report-status-dialog report-export-confirm"
          overlayClassName="report-confirm-overlay"
        >
          <div className="report-status-icon info">
            <ReportIcon name="report-alert" size={26} />
          </div>
          <p>Bạn có chắc chắn muốn hủy thao tác không?</p>
          <div className="actions">
            <Button onClick={() => setConfirm(false)}>Quay lại</Button>
            <Button variant="primary" onClick={onClose}>
              Xác nhận
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
