# QR chuyển khoản TPBank

Tài khoản mặc định do chủ cửa hàng cung cấp trong `lib/payment-qr.ts`:
TPBank (BIN 970423), 56789222279, HKD NGUYEN DANG HOE.
Ba biến `VIETQR_BANK_BIN`, `VIETQR_ACCOUNT_NUMBER`, `VIETQR_ACCOUNT_NAME` chỉ ghi đè khi được cấu hình đầy đủ.
Đây là thông tin nhận tiền công khai, không phải thông tin đăng nhập ngân hàng.

Khi chọn Chuyển khoản, API tính lại tổng tiền từ giá/đơn vị trong database,
kiểm tra tồn có thể bán và tạo QR với số tiền đó. Nội dung chuyển khoản chính là mã hóa đơn.
Bảng `payment_intent` giữ mã hóa đơn theo khóa giỏ hàng và phiên người dùng;
đổi số lượng hoặc tải lại QR vẫn giữ cùng mã. Nhiều người bán cùng lúc được cấp mã riêng.
Việc tạo QR chưa tạo hóa đơn đã thanh toán và chưa trừ tồn kho.

Nhân viên kiểm tra giao dịch tiền vào ngân hàng rồi đánh dấu “Đã nhận đủ tiền chuyển khoản”.
Hệ thống chưa kết nối dịch vụ xác nhận tiền vào tự động.
Sửa giỏ sẽ bỏ dấu xác nhận và cập nhật QR. Nếu giá phía server thay đổi,
checkout bị chặn để tạo lại QR và yêu cầu xác nhận lại; không tự lưu số tiền khác QR.
Khi thanh toán thành công, hóa đơn dùng đúng mã đã cấp, trừ kho một lần và xóa bản giữ mã.
Gửi lại yêu cầu thanh toán trả cùng hóa đơn, không bán/trừ tồn lần hai.
Giỏ bỏ dở có thể để lại khoảng trống trong dãy mã; không tái sử dụng mã đã cấp cho QR.

Kiểm chứng:
- `npx tsx --test tests/payment-qr.test.ts`: nội dung URL, tổng VND và tài khoản.
- `RUN_PAYMENT_DB_TESTS=1 npx tsx --test tests/payment-intent.test.ts`: giao dịch được rollback, kiểm tra mã/giá/idempotency.
- `RUN_PAYMENT_CONCURRENCY_TESTS=1 ...`: chỉ cho phép database review định danh trong test; không chạy trên production.
- `tests/qr.spec.ts`: QR thật, số tiền đổi theo giỏ và bỏ dấu xác nhận; không hoàn tất giao dịch thật.

Migration bổ sung `202611150001_payment_intent`, không thay đổi dữ liệu hóa đơn hay tồn kho có sẵn.
