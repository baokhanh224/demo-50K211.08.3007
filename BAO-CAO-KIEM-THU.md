# Báo cáo chuyển sang Python — 13/11/2026

## Kết quả và phạm vi

Bản Python ở nhánh `migration/python`, lấy giao diện và nghiệp vụ từ commit `61a4402`. Backend được chuyển sang Python/FastAPI/psycopg; frontend là React JavaScript/JSX giữ nguyên markup và CSS, đã build sẵn. Website chạy bằng Python, không cần máy chủ Next.js/Node. Không dùng SQLite/SQL Server và không chuyển dữ liệu chính sang hệ CSDL khác.

Trong lần thực hiện này chỉ sử dụng PostgreSQL cục bộ dành riêng cho kiểm thử, tạo bảng mới rồi sao chép dữ liệu tham chiếu cục bộ trong transaction đọc nhất quán. Không seed hoặc sửa CSDL Neon của website chính. Cấu trúc CSDL mới và chế độ nhận cấu trúc có sẵn đều đã chạy. Đăng nhập thành công bằng mật khẩu scrypt được tạo bởi bản Node cũ. Website/nhánh `main` giữ nguyên.

## Lệnh đã chạy thực tế

- Tạo worktree riêng từ `origin/main`, nhánh `migration/python`.
- `python -m venv` và `pip install -r requirements.txt` trong một virtualenv sạch, không dùng các thư viện có sẵn của máy.
- `npm ci/install --prefix frontend`, `npm run build --prefix frontend` — đóng gói JSX/CSS và tài nguyên.
- `python -m compileall -q app.py quynh_nhu python_tests`.
- `python -m quynh_nhu.manage init`; `seed --replace-demo-data` **chỉ trên CSDL thử**.
- `python -m uvicorn app:app --host 0.0.0.0 --port 8101` bằng virtualenv sạch.
- `python -m unittest discover -s python_tests -v` với biến môi trường CSDL thử và `PYTHON_HTTP_BASE_URL` — **11/11 đạt**.
- `node frontend/node_modules/@playwright/test/cli.js test --config ui_tests/playwright.config.js` với CSDL demo sạch, `BASE_URL`, `REFERENCE_URL` — **5/5 đạt**.
- Đối chiếu JSON API Python với API Next.js tham chiếu: bootstrap, 7 phạm vi query và 4 loại báo cáo. Nội dung khớp; số thực nội bộ cho giá vốn được so với dung sai 0,000001 đồng do phép cộng float giữa hai ngôn ngữ. Tiền hiển thị VNĐ không khác.
- Kiểm tra định dạng `vercel.json` theo schema của Vercel; không coi đây là xác minh đã chạy công khai.

## Các luồng đã kiểm tra

| Nhóm | Kết quả đã quan sát |
|---|---|
| Đăng nhập | Cookie HTTP-only, từ chối truy cập khi chưa đăng nhập, sai mật khẩu, đăng xuất, tài khoản cũ vẫn dùng được |
| Sản phẩm/NCC/khách hàng | Thêm, sửa, xóa, kiểm tra dữ liệu, số điện thoại trùng; lịch sử dòng hóa đơn không đổi khi sửa đơn vị cơ sở |
| Nhập hàng | Hai dòng cùng sản phẩm khác hạn trong cùng phiếu; chi tiết từng nguồn; lỗi lưu hoàn tác toàn bộ |
| Thanh toán | Thiếu tiền không tạo hóa đơn; sửa tiền và bấm hai lần chỉ tạo một; khóa đồng thời không âm tồn |
| Hạn sử dụng | FEFO qua hai nguồn; không bán nguồn đã hết hạn; tổng lượng sản phẩm lặp trong giỏ được kiểm tra |
| Hủy | Hoàn từng nguồn đúng lượng đã xuất; gửi lại cùng khóa không hoàn hai lần; lỗi ghi hoàn tác |
| Trả hàng | Trả một phần không nhập kho: doanh thu giảm, tồn không tăng, số còn được trả giảm; hóa đơn bị chặn hủy trực tiếp |
| Đổi hàng | Trả vào nguồn theo thứ tự ngược, xuất hàng đổi, giữ trạng thái hóa đơn; xác nhận tiền chênh lệch |
| Điều chỉnh | Không vượt lượng nhập ban đầu, không đổi giá bình quân; lỗi ghi hoàn tác; ledger và tồn khớp |
| Mô phỏng | Lỗi lưu/tải dùng một lần; lỗi tải tách theo phiên; lỗi máy in giữ nguyên câu chữ |
| Báo cáo | Bốn loại báo cáo, nhiều tiêu chí, lịch khoảng ngày, chip Lọc nhanh, ngày sai/không có dữ liệu, nhấn xử lý hai lần |
| Xuất | Excel/PDF tải từ giao diện; dòng tổng Excel khớp kết quả màn hình; có bộ lọc/cột/tổng; kiểm tra quyền snapshot và lỗi tải/tạo file |
| QR | Tổng server bỏ qua số tiền giả do client gửi, URL QR có đúng số tiền và cấu hình; không tự xác nhận đã nhận tiền |

Kịch bản qua giao diện tạo PN0004 với hai dòng; HD0004 bán từ hai nguồn, thử thiếu tiền/lỗi lưu, bấm hoàn tất hai lần rồi hủy; HD0005 trả 2 hộp Milo, không nhập kho, hoàn 36.000đ, còn được trả 4 hộp. Dữ liệu sau tải lại trang vẫn còn; đã dừng/khởi động lại tiến trình Python và đối chiếu số bản ghi sản phẩm, khách hàng, phiếu nhập, hóa đơn, phiếu đổi/trả và movement: giữ nguyên. Bằng chứng ở `docs/evidence/python/verification-stage3.json`.

## Giữ giao diện

Đã đối chiếu 14 màn hình desktop 1440×927, cùng Chromium, cùng dữ liệu, đợi font/icon tải hoàn tất: bán hàng, sản phẩm, NCC, khách hàng, nhập hàng, tồn kho, điều chỉnh, lịch sử nhập, lịch sử bán, đổi/trả, hủy, báo cáo kinh doanh, xuất–nhập–tồn và cài đặt.

- Nội dung, placeholder, icon, tọa độ, kích thước, font, màu và bo góc của các phần tử được so tự động.
- **14/14 cặp ảnh ở trạng thái ban đầu trùng pixel**, lưu cùng mã SHA-256 trong `docs/evidence/python/ui-parity.json` và thư mục `parity/`.
- Kiểm tra riêng bán hàng: toast 320×56 tại y=106, thẻ sản phẩm cao 224 tại y=252, giỏ tại y=495; placeholder Tên sản phẩm đúng màu.
- Báo cáo: Lọc nhanh bo tròn 16px, nút xuất phía trên, giữ hộp xuất có “Nội dung sẽ xuất”, lịch và thông báo hiện theo tình huống thật.

Bằng chứng chỉ khẳng định các trạng thái/viewport đã chạy; không suy ra đã chụp mọi trạng thái của toàn bộ 25 UC trên mọi trình duyệt.

## Lỗi gặp và đã xử lý

- psycopg không hiểu tham số URL `schema` của Prisma: loại tham số riêng của Prisma khi kết nối, giữ tham số TLS PostgreSQL.
- esbuild coi URL `/figma/...` trong CSS là import: đánh dấu là đường dẫn tĩnh, giữ nguyên icon và URL.
- Python import hàm SQL `all` che hàm built-in: kiểm tra tên Unicode dùng `builtins.all`.
- Build Next tham chiếu cũ và hover con trỏ gây sai ảnh so sánh: build lại đúng source tham chiếu, chờ decode ảnh/font và đưa con trỏ ra ngoài vùng tương tác. Không sửa CSS để che sai lệch.
- Excel nạp lại có sai số float rất nhỏ: kiểm tra số thực theo dung sai; nội dung/định dạng tiền vẫn khớp. Chuỗi bắt đầu bằng `=` được ghi dạng văn bản để không trở thành công thức Excel.
- Selector kiểm thử cũ dùng role `columnheader` không khớp cây accessibility của bảng đang hiển thị: tìm đúng th có cùng nội dung, giữ nguyên giao diện.

## Chưa xác minh và triển khai

- Chưa chuyển domain chính sang Python; chưa xác minh Python + CSDL qua Vercel công khai. Không có công cụ/quyền cấu hình biến môi trường Vercel trong phiên này. Cần project thử riêng với `PYTHON_DATABASE_URL` của bản sao CSDL, làm theo README.
- Dockerfile cung cấp sẵn nhưng chưa chạy kiểm thử container. Đã chạy thật bằng virtualenv sạch.
- Chưa xác minh chạy trên Windows thật của người dùng; đã cung cấp lệnh Windows và `chay-web.bat`.
- Chưa quét bằng ứng dụng ngân hàng, đối chiếu tiền thật hoặc máy in vật lý. Không tạo giao dịch ngân hàng tự động.
- Tệp báo cáo được đối chiếu dữ liệu và tải thật; cách dàn trang PDF dùng thư viện Python, không khẳng định file PDF trùng byte với thư viện xuất cũ.

Bằng chứng lịch sử của bản Next.js nằm trong `docs/BAO-CAO-nextjs-reference.md` và các thư mục evidence trước đây, không gộp thành kết quả kiểm thử Python.
