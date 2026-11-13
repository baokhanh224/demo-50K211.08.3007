import re
from io import BytesIO
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
from xml.sax.saxutils import escape
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from .reports import date_text

ROOT = Path(__file__).resolve().parent.parent


def currency(column):
    return bool(re.search("Doanh thu|Giá trị|giá vốn|Lợi nhuận", column))


def value(v):
    return (
        date_text(v)
        if isinstance(v, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", v)
        else v
    )


def formatted(n, money=False):
    d = Decimal(str(n or 0)).quantize(
        Decimal("1") if money else Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    s = f"{d:,.0f}" if money else f"{d:,.2f}".rstrip("0").rstrip(".")
    s = s.replace(",", "_").replace(".", ",").replace("_", ".")
    return s + ("đ" if money else "")


def excel(report):
    book = Workbook()
    book.properties.creator = "Tạp hóa Quỳnh Như"
    sheet = book.active
    sheet.title = "Báo cáo"
    sheet.append(["HỆ THỐNG QUẢN LÝ BÁN HÀNG TẠP HÓA QUỲNH NHƯ"])
    sheet.append(["Loại báo cáo: " + report["type"]])
    sheet.append([report["filterText"]])
    sheet.append([])
    sheet.cell(1, 1).font = Font(bold=True, size=16)
    sheet.cell(2, 1).font = Font(bold=True)
    for section in report["sections"]:
        sheet.append([section["title"]])
        sheet.cell(sheet.max_row, 1).font = Font(bold=True, size=13)
        sheet.append(section["columns"])
        for c in sheet[sheet.max_row]:
            c.font = Font(bold=True, color="FFFFFF")
            c.fill = PatternFill("solid", fgColor="103A9B")
        for cells in section["rows"] + [section["total"]]:
            sheet.append([value(v) for v in cells])
            for i, v in enumerate(cells, 1):
                c = sheet.cell(sheet.max_row, i)
                if isinstance(v, (int, float)):
                    c.number_format = (
                        '#,##0"đ"'
                        if currency(section["columns"][i - 1])
                        else "#,##0.##"
                    )
                if cells is section["total"]:
                    c.font = Font(bold=True)
        sheet.append([])
    ranking = report["type"] == "Sản phẩm bán chạy/chậm"
    for i in range(1, sheet.max_column + 1):
        sheet.column_dimensions[get_column_letter(i)].width = (
            (8 if i == 1 else 40 if i == 2 else 24)
            if ranking
            else (40 if i == 1 else 24)
        )
    # Product/customer names are text even when beginning with '='.
    for row in sheet:
        for cell in row:
            if isinstance(cell.value, str):
                cell.data_type = "s"
    sheet.freeze_panes = "A5"
    out = BytesIO()
    book.save(out)
    return out.getvalue()


def pdf(report):
    if "QuynhNhu" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(
            TTFont("QuynhNhu", str(ROOT / "static/fonts/DejaVuSans.ttf"))
        )
    styles = getSampleStyleSheet()
    for key in ["Normal", "Heading1", "Heading2"]:
        styles[key].fontName = "QuynhNhu"
    styles["Normal"].fontSize = 8
    styles["Normal"].leading = 12
    styles["Heading1"].fontSize = 15
    styles["Heading2"].fontSize = 11

    def p(text, style="Normal"):
        return Paragraph(escape(str(text)), styles[style])

    story = [
        p("TẠP HÓA QUỲNH NHƯ", "Heading1"),
        p("Loại báo cáo: " + report["type"], "Heading2"),
        p(report["filterText"]),
        Spacer(1, 12),
    ]
    width = landscape(A4)[0] - 64
    for section in report["sections"]:
        story.extend([p(section["title"], "Heading2"), Spacer(1, 6)])
        data = [[p(c) for c in section["columns"]]]
        for row in section["rows"] + [section["total"]]:
            data.append(
                [
                    p(
                        formatted(v, currency(section["columns"][i]))
                        if isinstance(v, (int, float))
                        else value(v)
                    )
                    for i, v in enumerate(row)
                ]
            )
        weights = (
            [0.06, 0.42, 0.26, 0.26]
            if section["columns"][0] == "#"
            else [0.26]
            + [0.74 / (len(section["columns"]) - 1)] * (len(section["columns"]) - 1)
        )
        table = Table(
            data, colWidths=[width * w for w in weights], repeatRows=1, hAlign="LEFT"
        )
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef3fd")),
                    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f1f5f9")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#dae3f0")),
                ]
            )
        )
        story.extend([table, Spacer(1, 16)])
    out = BytesIO()
    SimpleDocTemplate(
        out,
        pagesize=landscape(A4),
        leftMargin=32,
        rightMargin=32,
        topMargin=32,
        bottomMargin=32,
    ).build(story)
    return out.getvalue()
