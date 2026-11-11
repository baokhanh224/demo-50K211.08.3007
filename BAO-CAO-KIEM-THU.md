# Báo cáo bàn giao — 10/11/2026

Đã chuyển theo yêu cầu mới: Next.js + TypeScript + PostgreSQL/Prisma, đủ các màn hình cho UC1.1–UC6.5, dữ liệu lưu trên Neon. Mã nguồn có migration, seed, nút khôi phục mẫu, cấu hình Vercel, xuất Excel/PDF, tài liệu và kịch bản demo.

**Tài khoản kiểm tra:** `chucuahang` / `QuynhNhu@123`.

**Go-live:** CSDL Neon đã có migration và dữ liệu tại dự án `quynh-nhu-demo` (`curly-pine-28788367`). Mã nguồn GitHub: https://github.com/baokhanh224/50K211.08.3007/tree/codex/quynh-nhu-demo/demo-quynh-nhu . Kết nối GitHub không có quyền tạo repository mới, nên ứng dụng được đưa vào một thư mục mới trên nhánh riêng của repository dự án có cùng link Figma. Chưa có URL Vercel công khai: kết nối Vercel chưa được cấp quyền. Không coi http://localhost:3000 là đường dẫn công khai. Các bước Vercel đã có trong README.


## Các lệnh và kiểm tra đã chạy

- `npm install`, `npx prisma generate`, `npx prisma migrate deploy` trên PostgreSQL kiểm thử.
- Hai migration được áp dụng lên CSDL Neon mới qua kết nối Neon; ghi đúng metadata migration/checksum. Mạng Cloud không mở được PostgreSQL 5432; runtime Prisma Neon adapter qua WebSocket kết nối thành công. `npm run db:seed` thực tế đã chạy thành công trên Neon qua Prisma.
- `npm run typecheck` và `npm run build`: đạt.
- `npm test`: 3 kiểm tra PostgreSQL đạt, gồm rollback đủ bảng cho nhập/bán/hủy/đổi trả/điều chỉnh, gửi trùng, cạnh tranh tồn, cô lập lỗi theo phiên và đối chiếu sổ biến động; có kiểm tra thứ tự xác thực khoảng ngày trước lỗi tải.
- `npm run test:ui`: chạy Chromium 1440×1000 trên bản production, CSDL thực là Neon. Kết quả từng luồng bên dưới; không gọi đây là kiểm tra bản Vercel khi chưa deploy.
- Đối chiếu tĩnh 65 chuỗi thông báo lấy từ Word: tìm thấy nguyên văn trong mã giao diện/nghiệp vụ.
- Đã kiểm tra tài sản Figma: 13 biểu tượng SVG và ảnh QR PNG nguyên bản, đủ 14 tệp không rỗng. Đã xem ảnh giao diện thực và chỉnh bảng đổi/trả để không cắt mất lựa chọn nhập kho trên desktop.

## Kết quả qua giao diện

| Luồng | Kết quả |
| --- | --- |
| Đăng nhập, mở bán hàng, tải lại giữ phiên, Đăng xuất | Đạt trên môi trường kiểm thử |
| Hai dòng Sữa Milo khác hạn, tra cứu PN0004 | Đạt: 2 và 3 Hộp, hai nguồn riêng, tổng 65.000đ |
| Bán 2 Lốc Milo, tiền thiếu rồi sửa; lỗi lưu; bấm hai lần | Đạt: chỉ HD0004, xuất đúng 8 hộp từ hai nguồn; lỗi lưu giữ kho và giỏ; không tạo trùng |
| Hủy HD0004 | Đạt: hoàn lại đúng 5 và 3 hộp về hai nguồn, đối chiếu toàn bộ số lượng trước/sau |
| HD0005 trả 2/6 Hộp, Không nhập lại kho | Đạt: hoàn 36.000đ, tồn không tăng, còn được trả 4; chặn hủy trực tiếp |
| Báo cáo Hôm nay, Excel và PDF | Đạt: doanh thu thuần 72.000đ; tổng Excel bằng màn hình; trích văn bản PDF thấy tổng 72.000 và đúng bộ lọc; XNT khớp số tồn |
| Hai phiên trình duyệt cùng bán Muối I-ốt gần hết | Đạt trên Neon: chỉ một thành công, phiên kia báo không đủ nguồn; tồn không âm; hủy thử hoàn lại lượng |
| Sản phẩm, khách hàng, nhà cung cấp, cảnh báo và in | Đạt: thêm/xóa sản phẩm, giá dưới vốn và lịch sử giá; khách trùng số/chưa mua; danh mục NCC khác/trùng; cảnh báo hết hạn; mô phỏng lỗi máy in |
| Tải lại trang | Đạt: số lượng lưu trên PostgreSQL/Neon giữ nguyên |
| Khởi động lại ứng dụng | Đạt: khách thêm qua GUI vẫn còn; hash toàn bộ nguồn nhập, hóa đơn và khách trước/sau giống nhau. Đã dọn khách kiểm tra |
| Khôi phục dữ liệu mẫu qua GUI | Đạt: xác nhận, khôi phục 7 sản phẩm/3 hóa đơn mẫu trên Neon, giữ phiên đăng nhập |

Bốn nhóm UI đã chạy đạt sau sửa lỗi; kết quả từng nhóm được chạy lại độc lập khi cần. Bảng đổi/trả kiểm tra lại có chiều rộng 754px và không tràn ngang; audit các ảnh tải được đúng slot giao diện. Bộ mẫu cuối xác nhận trực tiếp trên Neon: 7 sản phẩm, 3 khách hàng, 3 nhà cung cấp, 3 phiếu nhập, 3 hóa đơn (1 đã hủy), 1 NCC ngừng hợp tác, 2 migration.

Các ảnh và tệp báo cáo mẫu trong gói chứng cứ lấy từ những lượt chạy thật, không phải ảnh Figma. Script kiểm tra bắt đầu từ dữ liệu mẫu sạch, dùng hai browser context độc lập cho trường hợp cạnh tranh. Xem `tests/` để chạy lại.

## Lỗi đã sửa

- Chuyển toàn bộ lớp dữ liệu đồng bộ SQLite sang Prisma bất đồng bộ; chờ đầy đủ thao tác trước commit/rollback.
- Chống tạo trùng bằng mã yêu cầu, UNIQUE và khóa theo mã yêu cầu; khóa dòng nguồn theo thứ tự cố định để chống xuất âm khi bán đồng thời.
- Khôi phục đúng nguồn khi hủy/trả; ghi nhận lượng đã trả kể cả dòng không nhập kho.
- Tách công tắc lỗi theo token phiên. Sửa công tắc hiển thị đã bật trước lúc lưu xong khi dùng mạng Neon chậm; khóa công tắc trong lúc lưu.
- Sửa lỗi hiển thị thông báo lý do hủy lặp ở hai hộp thoại; bổ sung nhãn truy cập rõ cho trường bắt buộc. UC1.2 cho phép sửa tên đơn vị cơ sở và vẫn giữ nguyên snapshot giao dịch cũ.
- Bổ sung font tiếng Việt trong PDF và đưa font vào cấu hình đóng gói serverless; đối chiếu dữ liệu xuất từ cùng snapshot màn hình.

## Phần chưa xác minh

- Deploy thực tế lên Vercel, URL công khai không yêu cầu đăng nhập Vercel, và kiểm tra dữ liệu sau **redeploy Vercel**. Cần kết nối Vercel để thực hiện. Mã nguồn GitHub đã được bàn giao trên nhánh riêng.
- Truy cập URL production từ thiết bị/người ngoài internet. Hai browser context đã thử đăng nhập độc lập vào bản chạy trong Cloud, không thay thế kiểm tra URL công khai.
- In vật lý ra giấy. Hệ thống dùng hộp thoại in trình duyệt và công tắc mô phỏng lỗi; trình duyệt không cung cấp trạng thái máy in thật.
- Chưa kiểm tra từng luồng phụ/ngoại lệ của cả 25 UC bằng thao tác tay độc lập; các nhánh có mã triển khai, đã kiểm tra các luồng trọng yếu và đối chiếu thông báo. Không khẳng định toàn bộ nhánh đã được kiểm thử thực tế.
- Không đọc được node chú thích Figma `367:2`; UC4, UC5, UC6 qua frame con đã đọc được. Chưa nhận tệp đặc tả giao diện UC6 riêng.

CSDL SQLite của lượt thử ban đầu được giữ nguyên trong thư mục data như bản dự phòng và đã bị loại khỏi Git/gói bàn giao. Ứng dụng và cấu hình bàn giao chỉ dùng PostgreSQL.

### Bổ sung QR động

- `npm run build`, `npm run typecheck`: đạt. Hai kiểm tra trong `tests/payment-qr.test.ts`: đạt.
- Playwright `tests/qr.spec.ts` trên production build cổng 3001, dùng CSDL Neon: đạt. Thêm Milo 1 hộp, chuyển khoản: URL QR amount=18000; thêm 1 hộp: amount=36000, checkbox nhận tiền bỏ chọn; chuyển tiền mặt: ẩn QR. Không hoàn tất thanh toán, không tạo hóa đơn hoặc trừ kho.
- Ảnh QR thực từ VietQR được tải bằng curl qua CA tin cậy rồi chuyển vào trình duyệt tự động; Chromium trong Cloud chưa tin CA proxy (`ERR_CERT_AUTHORITY_INVALID`). Không tắt xác minh TLS.
- Chưa kiểm tra quét bằng ứng dụng ngân hàng và chưa xác minh trên URL Vercel sau triển khai; cần tài khoản nhận thật, ba biến cấu hình VietQR và URL website.
