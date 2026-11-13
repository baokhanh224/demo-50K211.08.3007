# Hệ thống quản lý bán hàng tạp hóa Quỳnh Như — Python

Bản chuyển từ phiên bản đã hoàn thiện tại commit `61a4402` sang **Python 3.12 + FastAPI + PostgreSQL**, nhánh **`migration/python`**. Giữ nguyên giao diện, CSS, icon Figma, nội dung thông báo và API của bản tham chiếu. Máy chủ, đăng nhập, nghiệp vụ, transaction, CSDL, QR và xuất Excel/PDF đều chạy bằng Python.

Trình duyệt vẫn sử dụng HTML/CSS/JavaScript (React). Đây là phần giao diện đã giữ lại để không thay đổi website; source đã chuyển từ TypeScript sang JavaScript/JSX. **Không cần Next.js hoặc Node.js để chạy website**. Node chỉ cần nếu sửa và đóng gói lại giao diện. Các tài nguyên đã đóng gói sẵn trong `static/build/`.

- Mã nguồn: https://github.com/baokhanh224/demo-50K211.08.3007/tree/migration/python
- Nhánh `main` và website https://quynh-nhu-demo.vercel.app/ vẫn là bản đang dùng trước khi chuyển. Nhánh Python chưa thay website chính.
- PostgreSQL giữ nguyên cấu trúc bảng và dữ liệu; không chuyển sang SQL Server hoặc SQLite. Mật khẩu scrypt của tài khoản cũ tương thích với Python.
- Kết quả kiểm tra thực tế: [BAO-CAO-KIEM-THU.md](BAO-CAO-KIEM-THU.md).

## Chạy trong VS Code trên Windows

Cài **Python 3.12** (chọn Add Python to PATH). Mở Terminal → New Terminal trong VS Code, chọn **Command Prompt** nếu PowerShell chặn kích hoạt môi trường.

Lấy riêng nhánh Python, không ghi đè thư mục đang làm việc:

```bat
cd /d "D:\Tài liệu năm 3\Kì 1\PTTK"
git clone --branch migration/python https://github.com/baokhanh224/demo-50K211.08.3007.git quynh-nhu-python
cd quynh-nhu-python
code .
```

Trong terminal ở thư mục có `app.py` và `requirements.txt`, chạy:

```bat
py -3.12 -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"
```

Mở tệp `.env` ở Explorer của VS Code và điền:

```dotenv
PYTHON_DATABASE_URL="postgresql://USER:PASSWORD@HOST/quynh_nhu_python?sslmode=require"
SESSION_SECRET="dán kết quả lệnh secrets ở trên"
DEMO_USERNAME="tên tài khoản bạn muốn tạo trên CSDL mới"
DEMO_PASSWORD="mật khẩu của tài khoản đó"
```

`PYTHON_DATABASE_URL` phải là chuỗi kết nối thật tới **CSDL thử riêng hoặc bản sao CSDL hiện tại**. Biến có tên riêng để bản thử không tự dùng nhầm `DATABASE_URL` của website chính. Với Neon, tạo một branch sao chép từ branch hiện tại rồi lấy chuỗi ở **Connect**. Không chia sẻ `.env` hoặc đưa lên GitHub.

**Nếu là CSDL mới, chưa có bảng và chưa có dữ liệu:**

```bat
python -m quynh_nhu.manage init
python -m quynh_nhu.manage seed --replace-demo-data
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Mở **http://localhost:8000**. Đăng nhập bằng tài khoản đã điền trong `.env`. Sau khi cài đặt xong, có thể nhấp đúp `chay-web.bat` để mở lại website. Giữ cửa sổ terminal chạy; Ctrl+C để dừng. Dữ liệu nằm trong PostgreSQL, vẫn còn khi khởi động lại.

**Nếu dùng bản sao CSDL đã có dữ liệu:** chỉ chạy `python -m quynh_nhu.manage init`, sau đó chạy Uvicorn. Lệnh `init` nhận cấu trúc tương thích và không xóa dữ liệu; đăng nhập bằng tài khoản cũ. **Không chạy seed nếu muốn giữ dữ liệu đang có.** Seed và nút Khôi phục dữ liệu mẫu đều thay thế toàn bộ dữ liệu nghiệp vụ demo trong một transaction.

Không có tài khoản dùng chung ghi công khai: tài khoản hiện tại giữ nguyên, tài khoản CSDL mới do `DEMO_USERNAME`/`DEMO_PASSWORD` thiết lập. Có nút Đăng xuất.

## Linux/macOS

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
# Điền PYTHON_DATABASE_URL và SESSION_SECRET trong .env trước.
python -m quynh_nhu.manage init
# Chỉ CSDL demo mới: python -m quynh_nhu.manage seed --replace-demo-data
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

## CSDL cục bộ tùy chọn

Nếu có Docker Desktop, `docker compose up -d` tạo PostgreSQL riêng tại cổng **5433** với volume `quynh_nhu_python_data`. Dùng:

```dotenv
PYTHON_DATABASE_URL="postgresql://quynh_nhu:demo-local-only@localhost:5433/quynh_nhu_python"
```

Thực hiện `init` và seed chỉ khi CSDL mới. Cấu hình này dành cho máy cá nhân. Không dùng tài khoản mẫu này trên máy chủ công khai. Dockerfile kèm theo chạy ứng dụng bằng Python, dùng các tài nguyên giao diện đã build sẵn.

## Chỉ chỗ FE, BE và CSDL để trình bày

| Phần | Vị trí | Vai trò |
|---|---|---|
| Máy chủ Python | `app.py`, `quynh_nhu/app.py` | FastAPI, định tuyến `/api/*`, cookie, phục vụ giao diện |
| Backend nghiệp vụ | `quynh_nhu/service.py` | Sản phẩm, NCC, nhập/bán, khách hàng, hủy, đổi/trả, điều chỉnh |
| Kết nối CSDL | `quynh_nhu/db.py` | psycopg, truy vấn có tham số, transaction, khóa, mã tự sinh |
| Đăng nhập | `quynh_nhu/auth.py` | scrypt, phiên, chữ ký cookie |
| Báo cáo/QR | `quynh_nhu/reports.py`, `export.py`, `payment_qr.py` | Tính báo cáo, snapshot, Excel/PDF, VietQR |
| Frontend | `frontend/components/*.jsx`, `frontend/globals.css` | Giao diện React/JavaScript giữ nguyên |
| Tài nguyên chạy thật | `static/build`, `static/figma`, `static/fonts`, `templates/index.html` | JS/CSS, icon, font và HTML do Python phục vụ |
| Cấu trúc CSDL | `migrations/*.sql` | PostgreSQL tương thích dữ liệu cũ |
| Dữ liệu mẫu | `quynh_nhu/seed.py` | Khởi tạo lại khi gọi rõ ràng, hạn tính theo ngày chạy |

Có đủ các nhóm UC1–UC6 của phiên bản tham chiếu: 25 use case, công tắc ngoại lệ, in bằng trình duyệt và xuất báo cáo. Python giữ logic mã hóa đơn duy nhất, chống gửi trùng, khóa tồn khi bán đồng thời, FEFO, nguồn xuất/hoàn, snapshot giá vốn và phạm vi lỗi theo phiên.

## Khi sửa giao diện

Chỉ thực hiện bước này nếu sửa JSX/CSS. Cần Node.js và npm:

```bash
npm ci --prefix frontend
npm run build --prefix frontend
```

Commit cả `frontend/` và kết quả mới trong `static/build/`. Sau đó khởi động lại Python và tải lại trình duyệt. Thay đổi backend Python không cần build frontend. Với môi trường phát triển có thể dùng `python -m uvicorn app:app --reload --port 8000`.

## Triển khai Python và giữ bản chính

Không đổi Root Directory của bản chính, không xóa nhánh `main`, không seed CSDL chính. Có `vercel.json` dùng Python Function tại `app.py`, phục vụ cả API lẫn tài nguyên tĩnh; không chạy Prisma, Next.js hoặc seed trong build/deploy.

Để thử trên internet, tạo **Vercel project riêng** nối cùng repository, nhánh production `migration/python`, **Root Directory = .**, Framework Preset **Other**, bỏ các override lệnh build/install từ Next.js. Thêm `PYTHON_DATABASE_URL` của bản sao CSDL, `SESSION_SECRET` và cấu hình VietQR vào Environment Variables của project thử. Đặt tài khoản demo nếu cần dùng khôi phục dữ liệu mẫu. Deploy và kiểm tra `/health` trả `runtime: "python"`, `database_configured: true`, rồi kiểm tra đăng nhập/thao tác nghiệp vụ.

Chỉ chuyển domain chính sau khi đã kiểm tra bản Python công khai và sao lưu CSDL. Không thể coi một lần build thành công là đã xác minh truy cập CSDL hoặc toàn bộ nghiệp vụ. Ở lần bàn giao này chưa có quyền cấu hình biến môi trường Vercel, nên chưa thay domain chính sang Python. Có thể triển khai Dockerfile trên máy chủ có HTTPS và PostgreSQL bằng cùng bộ mã.

## Kiểm thử

Bộ nghiệp vụ ghi dữ liệu. Chỉ dùng CSDL thử riêng có tên kết thúc **`_test`**, đã `init` và seed. `manage` đọc `.env`, còn bộ unittest đọc biến môi trường của terminal; có thể nạp `.env` trước lệnh bằng Python:

```bash
python -c "from dotenv import load_dotenv; load_dotenv(); import unittest; suite=unittest.defaultTestLoader.discover('python_tests'); result=unittest.TextTestRunner(verbosity=2).run(suite); raise SystemExit(not result.wasSuccessful())"
```

Bộ kiểm thử giao diện cần Node chỉ để chạy Playwright và Python để đối chiếu CSDL/Excel:

```bash
npm ci --prefix frontend
node frontend/node_modules/@playwright/test/cli.js install chromium
# Khởi động Python tại localhost:8100 với cùng CSDL thử, cấu hình tài khoản cho terminal kiểm thử.
node frontend/node_modules/@playwright/test/cli.js test --config ui_tests/playwright.config.js
```

`demo.spec.js` cần bộ mẫu sạch trước khi chạy và tạo PN0004/HD0004/HD0005. Chạy riêng `sale-ui`/`uc3` không cần seed lại. Đặt `TEST_PYTHON` tới Python trong `.venv` (Windows: `.venv\Scripts\python.exe`), `DEMO_USERNAME`, `DEMO_PASSWORD`, `PYTHON_DATABASE_URL` và `BASE_URL` trong terminal. Test `parity` chỉ chạy khi có `REFERENCE_URL` trỏ bản Next.js tham chiếu cùng dữ liệu. Không chạy các test ghi dữ liệu trên website/CSDL chính.

## QR và in

Giữ nguyên VietQR theo số tiền giỏ hàng đã được server tính lại. Điền `VIETQR_BANK_BIN`, `VIETQR_ACCOUNT_NUMBER`, `VIETQR_ACCOUNT_NAME`. Chưa cấu hình thì báo lỗi như bản hiện tại, không dùng tài khoản giả. Nhân viên vẫn phải xác nhận tiền đã nhận; không có webhook ngân hàng. In dùng hộp thoại trình duyệt và giữ công tắc mô phỏng lỗi máy in.

## Quyết định bổ sung của nhóm


Sản phẩm và đơn vị:
- Hồ sơ sản phẩm thêm: mã vạch, mức tồn tối thiểu, cờ "Có quản lý hạn sử dụng", danh sách đơn vị bán (đơn vị, tỷ lệ quy đổi về đơn vị cơ sở, giá bán). Lý do: BR-UC4-03, 4-09, 6-03, 6-08 cần các dữ liệu này.
- Trường "Hạn sử dụng" ở form sản phẩm UC1 thay bằng cờ "Có quản lý hạn sử dụng"; hạn thực tế chỉ nhập ở phiếu nhập (UC4). Lý do: BR-UC4-03 ghi hạn theo chi tiết phiếu nhập.
- "Giá nhập" ở UC1 là giá tham chiếu ban đầu; từ khi có phiếu nhập, giá nhập bình quân (BR-UC4-04) dùng cho giá vốn, so sánh ở UC1.5 và giá trị tồn.

Xuất kho:
- Bán hàng lấy theo thứ tự: chi tiết phiếu nhập có hạn gần nhất trước; hàng không có hạn lấy sau, theo ngày nhập cũ trước.
- Chi tiết phiếu nhập đã hết hạn không tính vào lượng có thể bán.
- Cùng sản phẩm thêm nhiều lần vào giỏ thì kiểm tra theo tổng số lượng trong giỏ.
- Trả hàng: hoàn kho ngược thứ tự đã xuất, mỗi nguồn không vượt lượng đã xuất của nguồn đó trừ phần đã hoàn ở các lần trước. Tiền trả khách theo đơn giá trên hóa đơn gốc.
- Hàng đổi xuất theo cùng thứ tự như bán, đơn giá là giá bán hiện tại của đơn vị đã chọn.
- Điều chỉnh tồn (UC4.2): số lượng thực tế không vượt số lượng đã nhập của chi tiết đó; không đổi giá nhập bình quân.

Giá vốn và báo cáo:
- Lưu giá vốn (đơn vị cơ sở) tại thời điểm bán trên từng dòng hóa đơn. Hàng trả hoàn giá vốn của dòng hóa đơn gốc; hàng đổi dùng giá vốn tại thời điểm đổi.
- Hóa đơn hủy tính theo ngày hủy: loại khỏi doanh thu của kỳ chứa ngày hủy; hoàn kho tính là nhập ở báo cáo xuất–nhập–tồn của kỳ đó.
- Hàng trả chọn "Không nhập lại kho": không tính nhập ở xuất–nhập–tồn, vẫn trừ doanh thu.
- File xuất gồm tiêu đề, loại báo cáo, bộ lọc đã chọn, các cột đang hiển thị và dòng tổng; số liệu lấy từ cùng hàm tính với màn hình.

Mã và trạng thái:
- Mã tự sinh, duy nhất, không tái sử dụng: SP0001, NCC001, KH0001, HD0001 (hóa đơn), PN0001 (phiếu nhập), DC0001 (phiếu điều chỉnh), DT0001 (phiếu đổi/trả).
- Trạng thái hóa đơn: "Đã thanh toán", "Đã hủy". Hóa đơn có phiếu đổi/trả vẫn "Đã thanh toán" nhưng không hủy trực tiếp được.
- NFR-02 không có nội dung: bỏ qua.

Khách hàng trong bán hàng:
- Đặc tả giao diện có màn hình "Gắn khách hàng" và "Không tìm thấy khách hàng". Thực hiện như bước tùy chọn trước "Hoàn tất thanh toán": nhập số điện thoại, chọn "Tìm", hiện tên khách; không thấy thì báo "Không tìm thấy khách hàng". Hóa đơn không gắn khách vẫn lưu bình thường. Lý do: BR-UC5-06 và UC6.4 dựa vào liên kết hóa đơn–khách hàng.

Mô phỏng:
- Máy in: dùng hộp thoại in của trình duyệt.
- Mã QR chuyển khoản: dùng ảnh QR mẫu trong Figma.
- Công tắc lỗi demo để trình diễn các ngoại lệ: máy in (UC6.2 5a), lỗi lưu (UC4.1 8a, UC4.2 8a, UC6.1 10a, UC6.3 7a, UC6.5 10a), lỗi tải dữ liệu (UC3, UC4, UC6.4). Công tắc chỉ áp dụng cho phiên của người đang thao tác (cookie hoặc tham số URL), không đổi toàn hệ thống; khi tắt thì không ảnh hưởng nghiệp vụ.


## Điểm đặc tả chưa quy định

1. Không có tài liệu “đặc tả giao diện UC6” riêng trong các tệp đã nhận. Đã dùng đặc tả nghiệp vụ Word và các frame Figma đọc được. Đã đọc bảng Word bằng XML, giữ thứ tự đoạn/bảng; bản trích xuất nằm tại `docs/dac-ta-nghiep-vu-trich-xuat.txt`. File “Thiết kế CSDL.docx” được tham khảo cấu trúc; khi khác nghiệp vụ, áp dụng nghiệp vụ.
2. Các trang Figma UC4 `231:2`, UC5 `1:5`, UC6 `336:2` đọc được qua frame con. Node chú thích UC6 `367:2` báo không tồn tại. Truy vấn trực tiếp cấp trang không trả design context; đã truy vấn từng frame con. Không lấy các lớp số chú thích vào giao diện. Biểu tượng và QR là tài sản nguyên bản xuất từ Figma; không dùng ảnh chụp toàn màn hình làm giao diện.
3. UC4.1 “7c.1” là lỗi đánh số thuộc nhánh hạn sử dụng 5c. UC6.5 bước 5 “nhập lại kh” được hiểu là “nhập lại kho”, mặc định bật. BR-UC2-05/06 bị dẫn mã không nhất quán; áp dụng nội dung điều kiện xóa và tìm kiếm rõ ràng trong từng đoạn.
4. UC5.3 mô tả nút “Quay lại” ở luồng chính và “Hủy” ở luồng thay thế. Hộp thoại có “Đồng ý”, “Quay lại”, “Hủy”; hai nút sau đều đóng, giữ dữ liệu.
5. Tên khách hàng hợp lệ gồm chữ Unicode/dấu, khoảng trắng, dấu chấm, dấu nháy đơn, gạch nối; phải có ít nhất một chữ. Số điện thoại giữ nguyên đầu vào để phát hiện cả khoảng trắng. Số lượng nhập/bán/đổi dùng số nguyên theo mô hình CSDL và đơn vị hàng đóng gói; tỷ lệ quy đổi nguyên dương. Mức tồn tối thiểu nguyên không âm. Tên đơn vị trong cùng sản phẩm không trùng.
6. Đơn vị cơ sở có hệ số 1, luôn được tạo cùng sản phẩm. Các đơn vị bán bổ sung tạo khi thêm sản phẩm. Hệ số quy đổi đã dùng được giữ để không thay đổi lượng lịch sử; Đơn vị tính vẫn sửa được theo UC1.2, tên đơn vị trên phiếu cũ giữ bằng snapshot. Chỉnh giá bằng UC1.5. Tên sản phẩm, danh mục, mã vạch, mô tả, cờ hạn và mức cảnh báo vẫn sửa được theo form.
7. Không tự bổ sung thời hạn đổi/trả. Chỉ trả các dòng mua từ hóa đơn gốc; hàng đổi được ghi trên phiếu đổi/trả, không tạo hóa đơn mới để trả vòng lặp. Không có chiết khấu, VAT hay điểm thành viên vì đặc tả không quy định.
8. Hủy được ghi bằng sự kiện âm doanh thu/giá vốn ở ngày hủy. Doanh thu kỳ bán trước đó không bị sửa ngược. Cùng kỳ bán và hủy thì tổng ròng bằng 0. Số hóa đơn báo cáo cũng cộng ở ngày bán, trừ ở ngày hủy. Giá trị tồn dùng giá nhập bình quân hiện tại vì không có quy định lưu chuỗi bình quân theo kỳ.
9. Trình duyệt không trả kết quả in vật lý. Demo coi việc gửi và hoàn tất hộp thoại in là kết quả gửi in thành công; không xác minh giấy thực tế đã in. Công tắc demo cho nhánh lỗi máy in hoạt động trước khi gọi `window.print()`.
10. Khôi phục dữ liệu mẫu thay toàn bộ dữ liệu nghiệp vụ trong một transaction và tạo lại mã mẫu; đây là thao tác khởi tạo lại bộ demo. Các thao tác thông thường không tái sử dụng mã đã xóa. Nút khôi phục có xác nhận rõ việc thay thế dữ liệu; phiên đăng nhập được giữ. Có khóa chung để khôi phục không chạy chen vào transaction ghi nghiệp vụ.
11. Các danh sách không yêu cầu phân trang trong đặc tả nên hiển thị toàn bộ dữ liệu demo; tìm kiếm kết hợp các điều kiện bằng AND, từ khóa khớp một phần, không phân biệt hoa thường. Ngày nhập là ngày hiện tại ở Việt Nam, không cho đổi tùy ý trên form. Ngày lọc chấp nhận dd/mm/yyyy; lỗi ngày không hợp lệ dùng thông báo của UC tương ứng.
12. Vị trí nguồn xuất và lịch sử đổi/trả có thể mở trong chi tiết hóa đơn để đối chiếu khi trình diễn. Đây là dữ liệu đã lưu phục vụ kiểm tra, không tạo thêm nghiệp vụ.

13. Chuyển khoản chưa đánh dấu đã nhận tiền dùng thông báo bổ sung “Vui lòng xác nhận đã nhận đủ tiền”; đăng nhập sai dùng “Tên đăng nhập hoặc mật khẩu không đúng”, phiên hết hạn dùng “Vui lòng đăng nhập”. Nút khôi phục dùng xác nhận nêu rõ thay thế toàn bộ dữ liệu demo và thông báo “Khôi phục dữ liệu mẫu thành công”. Những câu này thuộc phần nền tảng/mô phỏng mà đặc tả chưa chốt câu chữ.

## Kịch bản demo ngắn

Bắt đầu bằng **Cài đặt demo → Khôi phục dữ liệu mẫu**.

1. **Nhập hàng**: NCC001 – Đại lý sữa Thuận Phát, Sữa Milo, Hộp, 2 hộp giá 13.000, hạn cách hôm nay 120 ngày; thêm tiếp 3 hộp giá 13.000, hạn cách 150 ngày. Lưu PN0004, tổng **65.000đ**. Lịch sử nhập có hai dòng nguồn riêng.
2. **Bán hàng**: Sữa Milo, **Lốc**, số lượng **2** (8 hộp), tổng **144.000đ**. Nhập tiền 100000 để thấy “Tiền khách đưa chưa đủ để thanh toán”, sửa 200000, bấm hoàn tất hai lần. Chỉ có **HD0004**, tiền thừa 56.000đ. Xuất 5 hộp nguồn gần hạn và 3 hộp nguồn hạn xa, bỏ nguồn đã hết hạn.
3. Xem HD0004, chọn **Hủy**, nhập lý do, **Xác nhận**. Từng nguồn được hoàn chính xác 5 và 3 hộp. Hóa đơn đổi “Đã hủy”.
4. Bán tiếp **6 Hộp Sữa Milo**, gắn số 0901234567 – Nguyễn Bảo Khanh, thanh toán 108.000đ để tạo **HD0005**. Đổi/trả **2 hộp**, **Chỉ trả hàng**, **Không nhập lại kho**, xác nhận **Đã hoàn tiền**. Hoàn **36.000đ**, tồn không tăng, còn được trả **4 hộp**, không hủy trực tiếp hóa đơn được.
5. Báo cáo kinh doanh **Loại báo cáo: Doanh thu → Hôm nay → Xem báo cáo**: doanh thu ròng từ các giao dịch trên là **72.000đ**. Xuất Excel và PDF; tổng khớp màn hình. Báo cáo xuất–nhập–tồn ghi hàng trả không nhập kho với lượng nhập bằng 0 cho lần trả đó.
6. Hai cửa sổ ẩn danh đăng nhập độc lập, cùng thêm **Muối I-ốt, Gói, 3** vào giỏ trước khi thanh toán. Thanh toán đồng thời: một thành công, một báo không đủ nguồn; tồn không âm. Hủy hóa đơn thử để hoàn kho.
7. **Quản lý khách hàng → KH0002**: “Chưa có lịch sử mua hàng”. Tra cứu tồn **Đã hết hạn** thấy nguồn PN0003; **Dưới mức cảnh báo tồn kho** thấy Muối I-ốt. Có thể thử máy in/lỗi tải/lưu bằng công tắc riêng phiên.


## Ghi chú khi chuyển sang Python

Các quyết định nghiệp vụ ở trên được giữ từ bản đã chốt. Yêu cầu VietQR thật sau đó thay quyết định QR mẫu ban đầu. Tài liệu và bằng chứng cũ trong `docs/` là lịch sử của bản Next.js; tài liệu lịch sử đã ghi rõ, không dùng lệnh npm/Prisma trong đó cho bản Python. Source Next.js được giữ trong Git tại commit `61a4402` và nhánh `main` để đối chiếu/quay lại.
