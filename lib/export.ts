import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "node:path";
import { Report } from "./reports";
import { date, number, money } from "./format";
const currencyColumn = (column: string) =>
  /Doanh thu|Giá trị|giá vốn|Lợi nhuận/.test(column);
function value(v: any) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? date(v) : v;
}
export async function excel(report: Report) {
  const book = new ExcelJS.Workbook();
  book.creator = "Tạp hóa Quỳnh Như";
  const sheet = book.addWorksheet("Báo cáo");
  sheet.addRow(["HỆ THỐNG QUẢN LÝ BÁN HÀNG TẠP HÓA QUỲNH NHƯ"]);
  sheet.addRow(["Loại báo cáo: " + report.type]);
  sheet.addRow([report.filterText]);
  sheet.getRow(1).font = { bold: true, size: 16 };
  sheet.getRow(2).font = { bold: true };
  sheet.addRow([]);
  for (const s of report.sections) {
    sheet.addRow([s.title]).font = { bold: true, size: 13 };
    const head = sheet.addRow(s.columns);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF103A9B" },
    };
    function dataRow(cells: any[], total = false) {
      const row = sheet.addRow(cells.map(value));
      if (total) row.font = { bold: true };
      row.eachCell((cell, i) => {
        if (typeof cell.value === "number")
          cell.numFmt = currencyColumn(s.columns[i - 1])
            ? '#,##0"đ"'
            : "#,##0.##";
      });
    }
    for (const row of s.rows) dataRow(row);
    dataRow(s.total, true);
    sheet.addRow([]);
  }
  sheet.columns.forEach((column, i) => {
    const ranking = report.type === "Sản phẩm bán chạy/chậm";
    column.width = ranking
      ? i === 0
        ? 8
        : i === 1
          ? 40
          : 24
      : i === 0
        ? 40
        : 24;
  });
  sheet.views = [{ state: "frozen", ySplit: 4 }];
  return Buffer.from(await book.xlsx.writeBuffer());
}
export async function pdf(report: Report): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 32,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.font(path.join(process.cwd(), "public/fonts/DejaVuSans.ttf"));
    const left = 32,
      right = 810,
      width = right - left;
    doc.fillColor("#103a9b").fontSize(15).text("TẠP HÓA QUỲNH NHƯ");
    doc
      .fillColor("#0f172a")
      .fontSize(12)
      .text("Loại báo cáo: " + report.type);
    doc.moveDown(0.6).fontSize(8).text(report.filterText, { width });
    doc.moveDown();
    for (const s of report.sections) {
      if (doc.y > 480) doc.addPage();
      doc.fontSize(11).text(s.title);
      doc.moveDown(0.6);
      const widths = s.columns.map((_, i) =>
        s.columns[0] === "#"
          ? width * [0.06, 0.42, 0.26, 0.26][i]
          : i === 0
            ? width * 0.26
            : (width * 0.74) / (s.columns.length - 1),
      );
      function row(cells: any[], header = false, total = false) {
        const texts = cells.map((x, i) =>
          typeof x === "number"
            ? currencyColumn(s.columns[i])
              ? money(x)
              : number(x)
            : String(value(x) ?? ""),
        );
        const height = Math.max(
          30,
          ...texts.map(
            (text, i) =>
              doc
                .fontSize(header ? 8 : 8)
                .heightOfString(text, { width: widths[i] - 10 }) + 14,
          ),
        );
        if (doc.y + height > 550) doc.addPage();
        const y = doc.y;
        let x = left;
        if (header) doc.rect(left, y, width, height).fill("#eef3fd");
        if (total) doc.rect(left, y, width, height).fill("#f1f5f9");
        for (let i = 0; i < texts.length; i++) {
          doc
            .fillColor("#0f172a")
            .fontSize(8)
            .text(texts[i], x + 5, y + 7, {
              width: widths[i] - 10,
              height: height - 8,
              align: typeof cells[i] === "number" ? "right" : "left",
            });
          x += widths[i];
        }
        doc
          .moveTo(left, y + height)
          .lineTo(right, y + height)
          .strokeColor("#dae3f0")
          .stroke();
        doc.y = y + height;
      }
      row(s.columns, true);
      for (const r of s.rows) row(r);
      row(s.total, false, true);
      doc.moveDown(1.4);
    }
    doc.end();
  });
}
