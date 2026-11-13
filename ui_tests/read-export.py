import json, sys
from openpyxl import load_workbook

sheet = load_workbook(sys.argv[1], data_only=False).active
row = next(row for row in sheet if row[0].value == "Tổng")
print(
    json.dumps(
        {"total": [c.value for c in row], "currency_format": row[7].number_format},
        ensure_ascii=False,
    )
)
