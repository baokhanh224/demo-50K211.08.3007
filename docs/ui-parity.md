# Đối chiếu giao diện Figma

Đã đọc 7 trang; danh mục 199 frame (không tính frame bán hàng tham khảo đặt thêm trên trang UC7). Node 367:2 bỏ qua theo yêu cầu.

## UC7 đã đối chiếu

Bốn frame đã có context, ảnh chuẩn 1440×900 và ảnh thật từ production build. Kích thước khung 500×478 tại (470,211), trường 412×47, nút 412×48; màu theo context Figma. Đã kiểm tra chữ, placeholder, viền lỗi và vùng lỗi cố định. Còn sai lệch raster chữ; không gọi là trùng pixel tuyệt đối. Pixelmatch threshold 0,1, bỏ qua vùng giá trị mật khẩu động.

| Frame | Cách tạo trạng thái | Sai lệch pixel trước bản chốt | Kết quả |
|---|---|---|---|
| 1:8 | Mở trang chưa đăng nhập | 0,131% | Đã so, còn lệch raster chữ |
| 1:21 | Để trống tên, nhập mật khẩu, bấm Đăng nhập | 0,174% | Đã so, còn lệch raster chữ |
| 1:35 | Nhập sai tài khoản rồi Đăng nhập | 0,158% | Đã so, còn lệch raster chữ |
| 1:49 | ?demo=authError, nhập đủ rồi Đăng nhập | 0,149% | Đã so, còn lệch raster chữ |

## UC6 đã sửa, chưa chốt khớp hình

Đã đọc context 336:4, 336:170, 336:3071, 336:3261, 336:7267. Sửa chữ tra cứu khách, thêm nhanh khách, tách bộ lọc mã/điện thoại, nút Xem, bảng chi tiết 4 cột, tên sản phẩm kèm đơn vị; menu gập/mở. Chưa so pixel toàn màn hình UC6 và chưa kiểm tra đủ 40 trạng thái. Chưa đánh dấu khớp.

## Danh mục từng frame

| Frame Figma | Route/trạng thái/cách tới | Kết quả |
|---|---|---|
| 336:4 — UC 6.1 – Bán hàng với nhiều sản phẩm | `/` → UC 6.1 – Bán hàng với nhiều sản phẩm | Chưa so ảnh |
| 336:170 — UC 6.1 – Tạo giao dịch bán hàng – Mở menu Bán hàng | `/` → UC 6.1 – Tạo giao dịch bán hàng – Mở menu Bán hàng | Chưa so ảnh |
| 336:329 — UC 6.1 – Không tìm thấy sản phẩm | `/` → UC 6.1 – Không tìm thấy sản phẩm | Chưa so ảnh |
| 336:496 — UC 6.1 – Số lượng bán không hợp lệ | `/` → UC 6.1 – Số lượng bán không hợp lệ | Chưa so ảnh |
| 336:665 — UC 6.1 – Tiền khách đưa chưa đủ để thanh toán | `/` → UC 6.1 – Tiền khách đưa chưa đủ để thanh toán | Chưa so ảnh |
| 336:848 — UC 6.1 –Không thể lưu giao dịch | `/` → UC 6.1 –Không thể lưu giao dịch | Chưa so ảnh |
| 336:1031 — UC 6.1 –  Bán hàng thành công | `/` → UC 6.1 –  Bán hàng thành công | Chưa so ảnh |
| 336:1200 — UC 6.1 – Bán hàng thành công và cảnh báo tồn kho | `/` → UC 6.1 – Bán hàng thành công và cảnh báo tồn kho | Chưa so ảnh |
| 336:1435 — UC 6.1 – Thanh toán bằng chuyển khoản | `/` → UC 6.1 – Thanh toán bằng chuyển khoản | Chưa so ảnh |
| 336:1615 — UC 6.2 – Xác nhận hủy in hóa đơn | `/?view=sales-history` → UC 6.2 – Xác nhận hủy in hóa đơn | Chưa so ảnh |
| 336:1769 — UC 6.2 – Không thể in hóa đơn đã hủy | `/?view=sales-history` → UC 6.2 – Không thể in hóa đơn đã hủy | Chưa so ảnh |
| 336:1920 — UC 6.2 – Không thể kết nối hoặc gửi yêu cầu đến máy in | `/?view=sales-history` → UC 6.2 – Không thể kết nối hoặc gửi yêu cầu đến máy in | Chưa so ảnh |
| 336:2071 — UC 6.2 – In hóa đơn thành công | `/?view=sales-history` → UC 6.2 – In hóa đơn thành công | Chưa so ảnh |
| 336:2218 — UC 6.3 – Nhập lý do hủy hóa đơn | `/?view=cancel-invoice` → UC 6.3 – Nhập lý do hủy hóa đơn | Chưa so ảnh |
| 336:2359 — UC 6.3 – Hóa đơn đã được hủy trước đó | `/?view=cancel-invoice` → UC 6.3 – Hóa đơn đã được hủy trước đó | Chưa so ảnh |
| 336:2499 — UC 6.3 – Không thể hủy hóa đơn có giao dịch đổi/trả | `/?view=cancel-invoice` → UC 6.3 – Không thể hủy hóa đơn có giao dịch đổi/trả | Chưa so ảnh |
| 336:2637 — UC 6.3 –Thiếu lý do hủy hóa đơn | `/?view=cancel-invoice` → UC 6.3 –Thiếu lý do hủy hóa đơn | Chưa so ảnh |
| 336:2787 — UC 6.3 – Không thể hủy hóa đơn | `/?view=cancel-invoice` → UC 6.3 – Không thể hủy hóa đơn | Chưa so ảnh |
| 336:2937 — UC 6.3 – Hủy hóa đơn thành công | `/?view=cancel-invoice` → UC 6.3 – Hủy hóa đơn thành công | Chưa so ảnh |
| 336:3071 — UC 6.4 – Chi tiết hóa đơn | `/?view=sales-history` → UC 6.4 – Chi tiết hóa đơn | Chưa so ảnh |
| 336:3261 — UC 6.4 – Tra cứu tất cả lịch sử bán hàng | `/?view=sales-history` → UC 6.4 – Tra cứu tất cả lịch sử bán hàng | Chưa so ảnh |
| 336:3409 — UC 6.4 – Không tìm thấy hóa đơn | `/?view=sales-history` → UC 6.4 – Không tìm thấy hóa đơn | Chưa so ảnh |
| 336:3566 — UC 6.4 – Không thể tải lịch sử bán hàng | `/?view=sales-history` → UC 6.4 – Không thể tải lịch sử bán hàng | Chưa so ảnh |
| 336:3722 — UC 6.1 – Không đủ số lượng hàng có thể bán | `/` → UC 6.1 – Không đủ số lượng hàng có thể bán | Chưa so ảnh |
| 336:3891 — UC 6.5 -  Xử lý đổi/trả hàng | `/?view=returns` → UC 6.5 -  Xử lý đổi/trả hàng | Chưa so ảnh |
| 336:4159 — UC 6.4 – Khoảng thời gian không hợp lệ | `/?view=sales-history` → UC 6.4 – Khoảng thời gian không hợp lệ | Chưa so ảnh |
| 336:4315 — UC 6.2 – Xem trước hóa đơn | `/?view=sales-history` → UC 6.2 – Xem trước hóa đơn | Chưa so ảnh |
| 336:4462 — UC 6.5 – Hàng trả không nhập lại kho | `/?view=returns` → UC 6.5 – Hàng trả không nhập lại kho | Chưa so ảnh |
| 336:4730 — UC 6.5 – Chỉ trả hàng | `/?view=returns` → UC 6.5 – Chỉ trả hàng | Chưa so ảnh |
| 336:5000 — UC 6.5 – Không có tiền chênh lệch | `/?view=returns` → UC 6.5 – Không có tiền chênh lệch | Chưa so ảnh |
| 336:5265 — UC 6.5 – Cần hoàn tiền | `/?view=returns` → UC 6.5 – Cần hoàn tiền | Chưa so ảnh |
| 336:5533 — UC 6.5 – Hóa đơn không hợp lệ | `/?view=returns` → UC 6.5 – Hóa đơn không hợp lệ | Chưa so ảnh |
| 336:5803 — UC 6.5 – Số lượng trả không hợp lệ | `/?view=returns` → UC 6.5 – Số lượng trả không hợp lệ | Chưa so ảnh |
| 336:6075 — UC 6.5 – Không đủ hàng để đổi | `/?view=returns` → UC 6.5 – Không đủ hàng để đổi | Chưa so ảnh |
| 336:6347 — UC 6.5 – Chưa xác nhận xử lý tiền | `/?view=returns` → UC 6.5 – Chưa xác nhận xử lý tiền | Chưa so ảnh |
| 336:6622 — UC 6.5 –  Không thể lưu phiếu đổi/trả | `/?view=returns` → UC 6.5 –  Không thể lưu phiếu đổi/trả | Chưa so ảnh |
| 336:6899 — UC 6.5 - Xử lý đổi/trả hàng thành công | `/?view=returns` → UC 6.5 - Xử lý đổi/trả hàng thành công | Chưa so ảnh |
| 336:7095 — UC 6.1 – Tìm sản phẩm bằng tên | `/` → UC 6.1 – Tìm sản phẩm bằng tên | Chưa so ảnh |
| 336:7267 — UC 6.1 – 8d Gắn khách hàng | `/` → UC 6.1 – 8d Gắn khách hàng | Chưa so ảnh |
| 336:7433 — UC 6.1 – 8d.2a Không tìm thấy khách hàng | `/` → UC 6.1 – 8d.2a Không tìm thấy khách hàng | Chưa so ảnh |
| 304:2 — UC_3.2– Main Flow – Mở Báo cáo xuất – nhập – tồn | `/?view=reports` → UC_3.2– Main Flow – Mở Báo cáo xuất – nhập – tồn | Chưa so ảnh |
| 304:135 — UC_3.2 – Main Flow – Chọn Từ ngày | `/?view=reports` → UC_3.2 – Main Flow – Chọn Từ ngày | Chưa so ảnh |
| 304:365 — UC_3.2– Main Flow – Chọn Đến ngày | `/?view=reports` → UC_3.2– Main Flow – Chọn Đến ngày | Chưa so ảnh |
| 304:610 — UC_3.2 – Main Flow – Chọn sản phẩm / nhóm sản phẩm | `/?view=reports` → UC_3.2 – Main Flow – Chọn sản phẩm / nhóm sản phẩm | Chưa so ảnh |
| 304:787 — UC_3.2 – 3a Chọn bộ lọc thời gian nhanh | `/?view=reports` → UC_3.2 – 3a Chọn bộ lọc thời gian nhanh | Chưa so ảnh |
| 304:920 — UC_3.2– 3a Tự động xác định khoảng thời gian | `/?view=reports` → UC_3.2– 3a Tự động xác định khoảng thời gian | Chưa so ảnh |
| 304:1054 — UC_3.2 – Main Flow – Đang xử lý | `/?view=reports` → UC_3.2 – Main Flow – Đang xử lý | Chưa so ảnh |
| 304:1199 — UC_3.2 – 5a Tiêu chí lọc không hợp lệ | `/?view=reports` → UC_3.2 – 5a Tiêu chí lọc không hợp lệ | Chưa so ảnh |
| 304:1337 — UC_3.2 – 6a Không thể truy xuất dữ liệu | `/?view=reports` → UC_3.2 – 6a Không thể truy xuất dữ liệu | Chưa so ảnh |
| 304:1471 — UC_3.2 – 6b Không có dữ liệu phù hợp | `/?view=reports` → UC_3.2 – 6b Không có dữ liệu phù hợp | Chưa so ảnh |
| 304:1605 — UC_3.2– Main Flow – Kết quả báo cáo xuất – nhập – tồn | `/?view=reports` → UC_3.2– Main Flow – Kết quả báo cáo xuất – nhập – tồn | Chưa so ảnh |
| 304:1964 — UC_3.2 – 9a Xuất báo cáo đang xem | `/?view=reports` → UC_3.2 – 9a Xuất báo cáo đang xem | Chưa so ảnh |
| 304:2349 — UC_3.1 – 01 - Main Flow – Mở Báo cáo kinh doanh | `/?view=reports` → UC_3.1 – 01 - Main Flow – Mở Báo cáo kinh doanh | Chưa so ảnh |
| 304:2486 — UC_3.1 – 03 - Main Flow – Chọn loại báo cáo | `/?view=reports` → UC_3.1 – 03 - Main Flow – Chọn loại báo cáo | Chưa so ảnh |
| 304:2632 — UC_3.1 – Main Flow – Chọn Từ ngày | `/?view=reports` → UC_3.1 – Main Flow – Chọn Từ ngày | Chưa so ảnh |
| 304:2866 — UC_3.1 – 02 - Main Flow – Chọn Đến ngày  | `/?view=reports` → UC_3.1 – 02 - Main Flow – Chọn Đến ngày  | Chưa so ảnh |
| 304:3115 — UC_3.1 – 04– Main Flow – Chọn sản phẩm / nhóm sản phẩm | `/?view=reports` → UC_3.1 – 04– Main Flow – Chọn sản phẩm / nhóm sản phẩm | Chưa so ảnh |
| 304:3296 — UC_3.1 – 05 – Main Flow – Nhấn Xem báo cáo | `/?view=reports` → UC_3.1 – 05 – Main Flow – Nhấn Xem báo cáo | Chưa so ảnh |
| 304:3433 — UC_3.1 – 4a Chọn bộ lọc thời gian nhanh | `/?view=reports` → UC_3.1 – 4a Chọn bộ lọc thời gian nhanh | Chưa so ảnh |
| 304:3570 — UC_3.1 – 4a Tự động xác định khoảng thời gian | `/?view=reports` → UC_3.1 – 4a Tự động xác định khoảng thời gian | Chưa so ảnh |
| 304:3708 — UC_3.1 – Main Flow – Đang xử lý | `/?view=reports` → UC_3.1 – Main Flow – Đang xử lý | Chưa so ảnh |
| 304:3852 — UC_3.1 – 6a Tiêu chí lọc không hợp lệ | `/?view=reports` → UC_3.1 – 6a Tiêu chí lọc không hợp lệ | Chưa so ảnh |
| 304:3992 — UC_3.1 – 7a Không thể truy xuất dữ liệu | `/?view=reports` → UC_3.1 – 7a Không thể truy xuất dữ liệu | Chưa so ảnh |
| 304:4129 — UC_3.1 – 7b Không có dữ liệu phù hợp | `/?view=reports` → UC_3.1 – 7b Không có dữ liệu phù hợp | Chưa so ảnh |
| 304:4266 — UC_3.1 – Main Flow – Kết quả báo cáo Doanh thu | `/?view=reports` → UC_3.1 – Main Flow – Kết quả báo cáo Doanh thu | Chưa so ảnh |
| 304:4506 — UC_3.1 – 10a Xuất báo cáo đang xem | `/?view=reports` → UC_3.1 – 10a Xuất báo cáo đang xem | Chưa so ảnh |
| 304:4772 — UC_3.1 – Main Flow – Chọn loại báo cáo Lợi nhuận | `/?view=reports` → UC_3.1 – Main Flow – Chọn loại báo cáo Lợi nhuận | Chưa so ảnh |
| 304:4917 — UC_3.1  – 4a Tự động xác định khoảng thời gian (Lợi nhuận) | `/?view=reports` → UC_3.1  – 4a Tự động xác định khoảng thời gian (Lợi nhuận) | Chưa so ảnh |
| 304:5054 — UC_3.1  – Main Flow – Đang xử lý (Lợi nhuận | `/?view=reports` → UC_3.1  – Main Flow – Đang xử lý (Lợi nhuận | Chưa so ảnh |
| 304:5198 — UC_3.1 – Main Flow – Kết quả báo cáo Lợi nhuận | `/?view=reports` → UC_3.1 – Main Flow – Kết quả báo cáo Lợi nhuận | Chưa so ảnh |
| 304:5388 — UC_3.1 – 10a Xuất báo cáo đang xem (Lợi nhuận) | `/?view=reports` → UC_3.1 – 10a Xuất báo cáo đang xem (Lợi nhuận) | Chưa so ảnh |
| 304:5604 — UC_3.1 - Main Flow – Chọn loại báo cáo Sản phẩm bán chạy/chậm | `/?view=reports` → UC_3.1 - Main Flow – Chọn loại báo cáo Sản phẩm bán chạy/chậm | Chưa so ảnh |
| 304:5749 — UC_3.1 – Main Flow – Đang xử lý (Sản phẩm bán chạy/chậm) | `/?view=reports` → UC_3.1 – Main Flow – Đang xử lý (Sản phẩm bán chạy/chậm) | Chưa so ảnh |
| 304:5901 — UC_3.1 –Main Flow – Kết quả xếp hạng theo Số lượng bán thuần | `/?view=reports` → UC_3.1 –Main Flow – Kết quả xếp hạng theo Số lượng bán thuần | Chưa so ảnh |
| 304:6255 — UC_3.1 – Main Flow – Kết quả xếp hạng theo Doanh thu thuần | `/?view=reports` → UC_3.1 – Main Flow – Kết quả xếp hạng theo Doanh thu thuần | Chưa so ảnh |
| 304:6609 — UC_3.1 – 10a Xuất báo cáo đang xem (Sản phẩm bán chạy/chậm) | `/?view=reports` → UC_3.1 – 10a Xuất báo cáo đang xem (Sản phẩm bán chạy/chậm) | Chưa so ảnh |
| 304:6989 — UC_3.1 –6a Tiêu chí lọc không hợp lệ (Lợi nhuận) | `/?view=reports` → UC_3.1 –6a Tiêu chí lọc không hợp lệ (Lợi nhuận) | Chưa so ảnh |
| 304:7129 — UC_3.1 – 7a Không thể truy xuất dữ liệu (Lợi nhuận) | `/?view=reports` → UC_3.1 – 7a Không thể truy xuất dữ liệu (Lợi nhuận) | Chưa so ảnh |
| 304:7266 — UC_3.1 – 7a Không thể truy xuất dữ liệu (Sản phẩm bán chạy/chậm) | `/?view=reports` → UC_3.1 – 7a Không thể truy xuất dữ liệu (Sản phẩm bán chạy/chậm) | Chưa so ảnh |
| 304:7403 — UC_3.1 – 7b Không có dữ liệu phù hợp (Lợi nhuận) | `/?view=reports` → UC_3.1 – 7b Không có dữ liệu phù hợp (Lợi nhuận) | Chưa so ảnh |
| 304:7540 — UC_3.1 – 6a Tiêu chí lọc không hợp lệ (Sản phẩm bán chạy/chậm) | `/?view=reports` → UC_3.1 – 6a Tiêu chí lọc không hợp lệ (Sản phẩm bán chạy/chậm) | Chưa so ảnh |
| 304:7680 — UC_3.1 – 7b Không có dữ liệu phù hợp (Sản phẩm bán chạy/chậm) | `/?view=reports` → UC_3.1 – 7b Không có dữ liệu phù hợp (Sản phẩm bán chạy/chậm) | Chưa so ảnh |
| 304:7817 — UC_3.3– Main Flow – Nhấn "Xuất báo cáo" | `/?view=reports` → UC_3.3– Main Flow – Nhấn "Xuất báo cáo" | Chưa so ảnh |
| 304:8176 — UC_3.3 – Main Flow – Hiển thị định dạng hỗ trợ | `/?view=reports` → UC_3.3 – Main Flow – Hiển thị định dạng hỗ trợ | Chưa so ảnh |
| 304:8561 — UC_3.3 – Main Flow – Chọn định dạng (có nội dung sẽ xuất) | `/?view=reports` → UC_3.3 – Main Flow – Chọn định dạng (có nội dung sẽ xuất) | Chưa so ảnh |
| 304:8952 — UC_3.3 – Main Flow – Đang xuất báo cáo | `/?view=reports` → UC_3.3 – Main Flow – Đang xuất báo cáo | Chưa so ảnh |
| 304:9325 — UC_3.3 - Main Flow – Xuất báo cáo thành công | `/?view=reports` → UC_3.3 - Main Flow – Xuất báo cáo thành công | Chưa so ảnh |
| 304:10082 — UC_3.3– 3a Xác nhận hủy xuất báo cáo | `/?view=reports` → UC_3.3– 3a Xác nhận hủy xuất báo cáo | Chưa so ảnh |
| 304:10499 — UC_3.3 - 3a.4 Quay lại giao diện xuất báo cáo | `/?view=reports` → UC_3.3 - 3a.4 Quay lại giao diện xuất báo cáo | Chưa so ảnh |
| 304:11243 — UC_3.3 – 4a Không thể truy xuất dữ liệu báo cáo | `/?view=reports` → UC_3.3 – 4a Không thể truy xuất dữ liệu báo cáo | Chưa so ảnh |
| 304:11614 — UC_3.3– 5a Không thể tạo tệp báo cáo | `/?view=reports` → UC_3.3– 5a Không thể tạo tệp báo cáo | Chưa so ảnh |
| 90:148 — UC 5.1 – Main Flow – Thêm khách hàng | `/?view=customers` → UC 5.1 – Main Flow – Thêm khách hàng | Chưa so ảnh |
| 90:286 — UC 5.1 –  Thêm khách hàng thành công | `/?view=customers` → UC 5.1 –  Thêm khách hàng thành công | Chưa so ảnh |
| 90:419 — UC 5.1 – Hủy khi đã nhập thông tin | `/?view=customers` → UC 5.1 – Hủy khi đã nhập thông tin | Chưa so ảnh |
| 90:567 — UC 5.1 –  Thiếu thông tin bắt buộc | `/?view=customers` → UC 5.1 –  Thiếu thông tin bắt buộc | Chưa so ảnh |
| 90:709 — UC 5.1 – Sai định dạng thông tin | `/?view=customers` → UC 5.1 – Sai định dạng thông tin | Chưa so ảnh |
| 90:851 — UC 5.1 – Trùng số điện thoại | `/?view=customers` → UC 5.1 – Trùng số điện thoại | Chưa so ảnh |
| 90:993 — UC 5.2 –  Sửa thông tin khách hàng | `/?view=customers` → UC 5.2 –  Sửa thông tin khách hàng | Chưa so ảnh |
| 90:1136 — UC 5.2 – Cập nhật khách hàng thành công | `/?view=customers` → UC 5.2 – Cập nhật khách hàng thành công | Chưa so ảnh |
| 90:1262 — UC 5.2 –  Hủy sửa khi đã thay đổi | `/?view=customers` → UC 5.2 –  Hủy sửa khi đã thay đổi | Chưa so ảnh |
| 90:1415 — UC 5.2 – Thiếu thông tin bắt buộc | `/?view=customers` → UC 5.2 – Thiếu thông tin bắt buộc | Chưa so ảnh |
| 90:1562 — UC 5.2 –Sai định dạng thông tin | `/?view=customers` → UC 5.2 –Sai định dạng thông tin | Chưa so ảnh |
| 90:1709 — UC 5.2 – Trùng số điện thoại | `/?view=customers` → UC 5.2 – Trùng số điện thoại | Chưa so ảnh |
| 90:1856 — UC 5.3 – Xác nhận xóa khách hàng | `/?view=customers` → UC 5.3 – Xác nhận xóa khách hàng | Chưa so ảnh |
| 90:1989 — UC 5.3 – Xóa khách hàng thành công | `/?view=customers` → UC 5.3 – Xóa khách hàng thành công | Chưa so ảnh |
| 90:2113 — UC 5.3 – Không thể xóa khách đã mua hàng | `/?view=customers` → UC 5.3 – Không thể xóa khách đã mua hàng | Chưa so ảnh |
| 90:2240 — UC 5.4 –  Tra cứu khách hàng | `/?view=customers` → UC 5.4 –  Tra cứu khách hàng | Chưa so ảnh |
| 90:2355 — UC 5.4 –Thông tin và lịch sử mua hàng | `/?view=customers` → UC 5.4 –Thông tin và lịch sử mua hàng | Chưa so ảnh |
| 90:2499 — UC 5.4 – Chưa có lịch sử mua hàng | `/?view=customers` → UC 5.4 – Chưa có lịch sử mua hàng | Chưa so ảnh |
| 90:2640 — UC 5.4 – Không tìm thấy khách hàng | `/?view=customers` → UC 5.4 – Không tìm thấy khách hàng | Chưa so ảnh |
| 90:2751 — UC 5.1 – Hủy thêm khi chưa nhập thông tin | `/?view=customers` → UC 5.1 – Hủy thêm khi chưa nhập thông tin | Chưa so ảnh |
| 90:2873 — UC 5.2 – Hủy sửa khi chưa thay đổi | `/?view=customers` → UC 5.2 – Hủy sửa khi chưa thay đổi | Chưa so ảnh |
| 90:2997 — UC 5.3 – Hủy thao tác xóa | `/?view=customers` → UC 5.3 – Hủy thao tác xóa | Chưa so ảnh |
| 293:5 — UC_2.1-08 Thêm thành công | `/?view=suppliers` → UC_2.1-08 Thêm thành công | Chưa so ảnh |
| 293:180 — UC_2.1-06 Thêm - Dữ liệu không hợp lệ | `/?view=suppliers` → UC_2.1-06 Thêm - Dữ liệu không hợp lệ | Chưa so ảnh |
| 293:502 — UC_2.1-04 Form thêm - ghi nhận tạm thời Danh mục mới | `/?view=suppliers` → UC_2.1-04 Form thêm - ghi nhận tạm thời Danh mục mới | Chưa so ảnh |
| 293:817 — UC_2.1-03 Form thêm - nhập tên Danh mục mới | `/?view=suppliers` → UC_2.1-03 Form thêm - nhập tên Danh mục mới | Chưa so ảnh |
| 293:1135 — UC_2.1-02 Form thêm - chọn Danh mục | `/?view=suppliers` → UC_2.1-02 Form thêm - chọn Danh mục | Chưa so ảnh |
| 293:1472 — UC_2.1-01 Form thêm nhà cung cấp | `/?view=suppliers` → UC_2.1-01 Form thêm nhà cung cấp | Chưa so ảnh |
| 293:1784 — UC_2.4-07 Không tìm thấy nhà cung cấp | `/?view=suppliers` → UC_2.4-07 Không tìm thấy nhà cung cấp | Chưa so ảnh |
| 293:1923 — UC_2.4-05 Kết quả tìm kiếm (Từ khóa) | `/?view=suppliers` → UC_2.4-05 Kết quả tìm kiếm (Từ khóa) | Chưa so ảnh |
| 293:2125 — UC_2.4-06 Kết quả (Từ khóa + Danh mục + Trạng thái) | `/?view=suppliers` → UC_2.4-06 Kết quả (Từ khóa + Danh mục + Trạng thái) | Chưa so ảnh |
| 293:2292 — UC_2.4-04 Bộ lọc Trạng thái (Đang mở) | `/?view=suppliers` → UC_2.4-04 Bộ lọc Trạng thái (Đang mở) | Chưa so ảnh |
| 293:2552 — UC_2.4-03 Bộ lọc Danh mục (Đang mở) | `/?view=suppliers` → UC_2.4-03 Bộ lọc Danh mục (Đang mở) | Chưa so ảnh |
| 293:2818 — UC_2.4-01 Danh sách (mặc định) | `/?view=suppliers` → UC_2.4-01 Danh sách (mặc định) | Chưa so ảnh |
| 293:3069 — UC_2.4-08 Chi tiết nhà cung cấp | `/?view=suppliers` → UC_2.4-08 Chi tiết nhà cung cấp | Chưa so ảnh |
| 293:3365 — UC_2.4-02 Danh sách - đã chọn 1 nhà cung cấp  | `/?view=suppliers` → UC_2.4-02 Danh sách - đã chọn 1 nhà cung cấp  | Chưa so ảnh |
| 293:3617 — UC_2.2-06 Sửa - xác nhận hủy | `/?view=suppliers` → UC_2.2-06 Sửa - xác nhận hủy | Chưa so ảnh |
| 293:3869 — UC_2.3-03 Xóa thành công | `/?view=suppliers` → UC_2.3-03 Xóa thành công | Chưa so ảnh |
| 293:4111 — UC_2.3-02 Xóa - không thể xóa | `/?view=suppliers` → UC_2.3-02 Xóa - không thể xóa | Chưa so ảnh |
| 293:4372 — UC_2.3-01 Xóa - hộp thoại xác nhận | `/?view=suppliers` → UC_2.3-01 Xóa - hộp thoại xác nhận | Chưa so ảnh |
| 293:4637 — UC_2.2-05 Sửa - hộp thoại xác nhận hủy | `/?view=suppliers` → UC_2.2-05 Sửa - hộp thoại xác nhận hủy | Chưa so ảnh |
| 293:4973 — UC_2.2-04 Sửa - dữ liệu không hợp lệ | `/?view=suppliers` → UC_2.2-04 Sửa - dữ liệu không hợp lệ | Chưa so ảnh |
| 293:5305 — UC_2.2-03 Sửa - mở danh sách Trạng thái | `/?view=suppliers` → UC_2.2-03 Sửa - mở danh sách Trạng thái | Chưa so ảnh |
| 293:5633 — UC_2.2-02 Sửa mở danh sách Danh mục | `/?view=suppliers` → UC_2.2-02 Sửa mở danh sách Danh mục | Chưa so ảnh |
| 293:5979 — UC_2.2-01 Form sửa thông tin nhà cung cấp | `/?view=suppliers` → UC_2.2-01 Form sửa thông tin nhà cung cấp | Chưa so ảnh |
| 293:6300 — UC_2.2-07 Sửa thành công (dữ liệu mới trong danh sách) | `/?view=suppliers` → UC_2.2-07 Sửa thành công (dữ liệu mới trong danh sách) | Chưa so ảnh |
| 293:6565 — UC_2.1-05 Thêm - lỗi bỏ trống | `/?view=suppliers` → UC_2.1-05 Thêm - lỗi bỏ trống | Chưa so ảnh |
| 293:6889 — UC_2.1-08 Thêm - Hộp thoại xác nhận hủy | `/?view=suppliers` → UC_2.1-08 Thêm - Hộp thoại xác nhận hủy | Chưa so ảnh |
| 293:7140 — UC_2.1-07 Thêm - Hộp thoại xác nhận | `/?view=suppliers` → UC_2.1-07 Thêm - Hộp thoại xác nhận | Chưa so ảnh |
| 1:8 — UC 7 – Main Flow – Đăng nhập | `/` → UC 7 – Main Flow – Đăng nhập | Đã so ảnh: còn lệch raster chữ, xem bảng UC7 |
| 1:21 — UC 7 – 5a Thiếu thông tin đăng nhập | `/` → UC 7 – 5a Thiếu thông tin đăng nhập | Đã so ảnh: còn lệch raster chữ, xem bảng UC7 |
| 1:35 — UC 7 – 6a Sai tên đăng nhập hoặc mật khẩu | `/` → UC 7 – 6a Sai tên đăng nhập hoặc mật khẩu | Đã so ảnh: còn lệch raster chữ, xem bảng UC7 |
| 1:49 — UC 7 – 6b Lỗi xác thực hệ thống | `/` → UC 7 – 6b Lỗi xác thực hệ thống | Đã so ảnh: còn lệch raster chữ, xem bảng UC7 |
| 60:2 — UC 1.4 – 3a Hiển thị toàn bộ danh sách sản phẩm | `/?view=products` → UC 1.4 – 3a Hiển thị toàn bộ danh sách sản phẩm | Chưa so ảnh |
| 60:510 — UC 1.4 – Main Flow – Chọn bộ lọc Danh mục | `/?view=products` → UC 1.4 – Main Flow – Chọn bộ lọc Danh mục | Chưa so ảnh |
| 60:780 — UC 1.4 – Main Flow – Tìm theo từ khóa | `/?view=products` → UC 1.4 – Main Flow – Tìm theo từ khóa | Chưa so ảnh |
| 60:941 — UC 1.4 – Main Flow – Tìm theo từ khóa và Danh mục | `/?view=products` → UC 1.4 – Main Flow – Tìm theo từ khóa và Danh mục | Chưa so ảnh |
| 60:1102 — UC 1.4 – 4a Không tìm thấy sản phẩm | `/?view=products` → UC 1.4 – 4a Không tìm thấy sản phẩm | Chưa so ảnh |
| 60:1231 — UC 1.4 – 5a Chi tiết sản phẩm | `/?view=products` → UC 1.4 – 5a Chi tiết sản phẩm | Chưa so ảnh |
| 60:1533 — UC 1.1 – Main Flow – Thêm sản phẩm | `/?view=products` → UC 1.1 – Main Flow – Thêm sản phẩm | Chưa so ảnh |
| 60:1860 — UC 1.1 – Main Flow – Chọn Danh mục trong form thêm | `/?view=products` → UC 1.1 – Main Flow – Chọn Danh mục trong form thêm | Chưa so ảnh |
| 60:2202 — UC 1.1 – 5a Bỏ trống trường bắt buộc | `/?view=products` → UC 1.1 – 5a Bỏ trống trường bắt buộc | Chưa so ảnh |
| 60:2534 — UC 1.1 – 5b Dữ liệu không hợp lệ | `/?view=products` → UC 1.1 – 5b Dữ liệu không hợp lệ | Chưa so ảnh |
| 60:2864 — UC 1.1 – Main Flow – Thêm sản phẩm thành công | `/?view=products` → UC 1.1 – Main Flow – Thêm sản phẩm thành công | Chưa so ảnh |
| 60:3144 — UC 1.2 – Main Flow – Sửa sản phẩm | `/?view=products` → UC 1.2 – Main Flow – Sửa sản phẩm | Chưa so ảnh |
| 60:3480 — UC 1.2 – 5a Bỏ trống trường bắt buộc | `/?view=products` → UC 1.2 – 5a Bỏ trống trường bắt buộc | Chưa so ảnh |
| 60:3819 — UC 1.2 – 5b Dữ liệu không hợp lệ | `/?view=products` → UC 1.2 – 5b Dữ liệu không hợp lệ | Chưa so ảnh |
| 60:4157 — UC 1.2 – 4a Hủy khi dữ liệu đã thay đổi | `/?view=products` → UC 1.2 – 4a Hủy khi dữ liệu đã thay đổi | Chưa so ảnh |
| 60:4507 — UC 1.2 – 5c Sản phẩm không tồn tại | `/?view=products` → UC 1.2 – 5c Sản phẩm không tồn tại | Chưa so ảnh |
| 60:4750 — UC 1.2 – Main Flow – Cập nhật sản phẩm thành công | `/?view=products` → UC 1.2 – Main Flow – Cập nhật sản phẩm thành công | Chưa so ảnh |
| 60:5011 — UC 1.3 – Main Flow – Xác nhận xóa sản phẩm | `/?view=products` → UC 1.3 – Main Flow – Xác nhận xóa sản phẩm | Chưa so ảnh |
| 60:5299 — UC 1.3 – 4a Sản phẩm còn tồn kho hoặc đã có giao dịch | `/?view=products` → UC 1.3 – 4a Sản phẩm còn tồn kho hoặc đã có giao dịch | Chưa so ảnh |
| 60:5563 — UC 1.3 – Main Flow – Xóa sản phẩm thành công | `/?view=products` → UC 1.3 – Main Flow – Xóa sản phẩm thành công | Chưa so ảnh |
| 60:5824 — UC 1.5 – Main Flow – Cập nhật giá bán | `/?view=products` → UC 1.5 – Main Flow – Cập nhật giá bán | Chưa so ảnh |
| 60:6122 — UC 1.5 – 5a Bỏ trống Giá bán mới | `/?view=products` → UC 1.5 – 5a Bỏ trống Giá bán mới | Chưa so ảnh |
| 60:6421 — UC 1.5 – 5b Giá bán không hợp lệ | `/?view=products` → UC 1.5 – 5b Giá bán không hợp lệ | Chưa so ảnh |
| 60:6720 — UC 1.5 – 5c Giá bán thấp hơn giá nhập | `/?view=products` → UC 1.5 – 5c Giá bán thấp hơn giá nhập | Chưa so ảnh |
| 60:7032 — UC 1.5 – 4a Hủy khi đã nhập giá bán mới | `/?view=products` → UC 1.5 – 4a Hủy khi đã nhập giá bán mới | Chưa so ảnh |
| 60:7344 — UC 1.5 – Main Flow – Cập nhật giá bán thành công | `/?view=products` → UC 1.5 – Main Flow – Cập nhật giá bán thành công | Chưa so ảnh |
| 334:2 — Frame | `/?view=products` → Frame | Chưa so ảnh |
| 231:3 — UC 4.1 – Nhập hàng | `/?view=receipts` → UC 4.1 – Nhập hàng | Chưa so ảnh |
| 231:142 — UC 4.2 –Điều chỉnh tồn kho | `/?view=adjustments` → UC 4.2 –Điều chỉnh tồn kho | Chưa so ảnh |
| 231:290 — UC 4.3 – Tra cứu tồn kho và cảnh báo | `/?view=inventory` → UC 4.3 – Tra cứu tồn kho và cảnh báo | Chưa so ảnh |
| 231:427 — UC 4.4 –  Tra cứu lịch sử nhập hàng | `/?view=receipt-history` → UC 4.4 –  Tra cứu lịch sử nhập hàng | Chưa so ảnh |
| 231:567 — UC 4.1 – Thêm sản phẩm khác | `/?view=receipts` → UC 4.1 – Thêm sản phẩm khác | Chưa so ảnh |
| 231:713 — UC 4.1 – Hủy nhập hàng – xác nhận | `/?view=receipts` → UC 4.1 – Hủy nhập hàng – xác nhận | Chưa so ảnh |
| 231:865 — UC 4.1 – Thiếu thông tin bắt buộc | `/?view=receipts` → UC 4.1 – Thiếu thông tin bắt buộc | Chưa so ảnh |
| 231:1006 — UC 4.1 – Số lượng hoặc giá nhập không hợp lệ | `/?view=receipts` → UC 4.1 – Số lượng hoặc giá nhập không hợp lệ | Chưa so ảnh |
| 231:1149 — UC 4.1 –  Cùng sản phẩm, nhiều hạn sử dụng | `/?view=receipts` → UC 4.1 –  Cùng sản phẩm, nhiều hạn sử dụng | Chưa so ảnh |
| 231:1295 — UC 4.1 –  Hạn sử dụng không hợp lệ | `/?view=receipts` → UC 4.1 –  Hạn sử dụng không hợp lệ | Chưa so ảnh |
| 231:1438 — UC 4.1 – Không thể lưu phiếu nhập | `/?view=receipts` → UC 4.1 – Không thể lưu phiếu nhập | Chưa so ảnh |
| 231:1581 — UC 4.1 – Nhập hàng thành công | `/?view=receipts` → UC 4.1 – Nhập hàng thành công | Chưa so ảnh |
| 231:1724 — UC 4.2 –  Nhiều chi tiết phiếu nhập | `/?view=adjustments` → UC 4.2 –  Nhiều chi tiết phiếu nhập | Chưa so ảnh |
| 231:1873 — UC 4.2 – Hủy điều chỉnh tồn kho | `/?view=adjustments` → UC 4.2 – Hủy điều chỉnh tồn kho | Chưa so ảnh |
| 231:2034 — UC 4.2 –  Thiếu thông tin điều chỉnh | `/?view=adjustments` → UC 4.2 –  Thiếu thông tin điều chỉnh | Chưa so ảnh |
| 231:2190 — UC 4.2 –  Số lượng điều chỉnh không hợp lệ | `/?view=adjustments` → UC 4.2 –  Số lượng điều chỉnh không hợp lệ | Chưa so ảnh |
| 231:2342 — UC 4.2 – Không thể lưu phiếu điều chỉnh | `/?view=adjustments` → UC 4.2 – Không thể lưu phiếu điều chỉnh | Chưa so ảnh |
| 231:2494 — UC 4.2 –  Điều chỉnh tồn kho thành công | `/?view=adjustments` → UC 4.2 –  Điều chỉnh tồn kho thành công | Chưa so ảnh |
| 231:2646 — UC 4.3 – Tra cứu tất cả sản phẩm | `/?view=inventory` → UC 4.3 – Tra cứu tất cả sản phẩm | Chưa so ảnh |
| 231:2781 — UC 4.3 – Dưới mức cảnh báo tồn kho | `/?view=inventory` → UC 4.3 – Dưới mức cảnh báo tồn kho | Chưa so ảnh |
| 231:2920 — UC 4.3 – Sắp hết hạn | `/?view=inventory` → UC 4.3 – Sắp hết hạn | Chưa so ảnh |
| 231:3068 — UC 4.3 – Đã hết hạn | `/?view=inventory` → UC 4.3 – Đã hết hạn | Chưa so ảnh |
| 231:3216 — UC 4.3 – Không tìm thấy sản phẩm phù hợp | `/?view=inventory` → UC 4.3 – Không tìm thấy sản phẩm phù hợp | Chưa so ảnh |
| 231:3355 — UC 4.3 – 5b Không thể tải dữ liệu tồn kho | `/?view=inventory` → UC 4.3 – 5b Không thể tải dữ liệu tồn kho | Chưa so ảnh |
| 231:3494 — UC 4.4 – 3a Xem tất cả lịch sử nhập hàng | `/?view=receipt-history` → UC 4.4 – 3a Xem tất cả lịch sử nhập hàng | Chưa so ảnh |
| 231:3639 — UC 4.4 – 5a Không tìm thấy phiếu nhập | `/?view=receipt-history` → UC 4.4 – 5a Không tìm thấy phiếu nhập | Chưa so ảnh |
| 231:3782 — UC 4.4 – 5b Không thể tải lịch sử nhập hàng | `/?view=receipt-history` → UC 4.4 – 5b Không thể tải lịch sử nhập hàng | Chưa so ảnh |
| 231:3925 — UC 4.4 – 6 Danh sách phiếu nhập – chưa chọn phiếu | `/?view=receipt-history` → UC 4.4 – 6 Danh sách phiếu nhập – chưa chọn phiếu | Chưa so ảnh |

## Phần còn lại

Chưa hoàn thành parity 195 frame UC6/4/5/1/2/3, gồm bố cục/đủ trạng thái, khôi phục hạn mặc định sản phẩm và tự điền nhập hàng, dữ liệu mẫu giống Figma, bố cục báo cáo. Kiểm thử nghiệp vụ hiện có không thay cho kiểm tra từng frame. Đã kiểm tra Vercel, redeploy giữ dữ liệu và hai trình duyệt trên domain công khai; xem BAO-CAO-KIEM-THU.md. Những kiểm tra nghiệp vụ này không xác nhận khớp ảnh cho các frame chưa so.

## Sửa vị trí bộ lọc sản phẩm — 11/11/2026

Frame nguồn 60:2, phần 60:70–60:109: đã đọc design context và ảnh, xuất trực tiếp 7 icon SVG từ Figma. Sửa thứ tự bộ lọc trước nhóm nút, tìm kiếm 320×40, danh mục 157×40, nút tìm 111×40, gap 10; nhóm thao tác ở hàng sau cách 16, căn phải. Nhãn Danh mục: nằm trong bộ lọc, bỏ tiêu đề phụ Danh sách sản phẩm không có trong frame này.

Đã kiểm tra hình và đo geometry trên localhost và Vercel 1440×900; tìm kết hợp Milo/danh mục cho 1 dòng, xóa bộ lọc về 7 dòng; cả 7 icon tải thành công đúng kích thước 16px/14px. Chứng cứ docs/evidence/product-filters. Commit triển khai 65df1a6 đạt Vercel success. Đối chiếu này chỉ áp dụng bộ lọc/nhóm nút; không đánh dấu khớp toàn bộ frame hoặc bảng sản phẩm/sidebar.

## Bộ lọc nhà cung cấp — Figma 293:2818

Đã đọc context và ảnh, xuất trực tiếp 6 SVG Figma (icon down dùng hai vị trí). Chuyển tìm kiếm/danh mục/trạng thái/nút tìm lên hàng đầu, nhãn inline trong dropdown; nút thêm/sửa/xóa ở hàng sau, căn phải, cách 16px. Theo nguồn: tìm kiếm 290×37,84; danh mục 138,72×35,39; trạng thái 137,61×35,39; nút tìm 107,36×36,84; gap 10. Bảng có thứ tự Mã nhà cung cấp, Tên nhà cung cấp, Danh mục, Số điện thoại, Email, Địa chỉ, Trạng thái.

Typecheck/build đạt; đã đo và kiểm tra thực ở localhost và Vercel 1440×900: tìm Thuận Phát + danh mục + trạng thái cho một kết quả; xóa bộ lọc về 3 nhà cung cấp; 7 ảnh icon tải đủ đúng 16px/14px. Deploy 9a7e9d8 thành công; chứng cứ docs/evidence/supplier-filters. Chỉ xác nhận phần bộ lọc/toolbar/cột trong phạm vi sửa, không nhận toàn frame khớp tuyệt đối.

## Danh sách khách hàng — 13/11/2026

Đã đối chiếu design context/ảnh 90:286 và 90:2240 cho phần danh sách: tiêu đề riêng, tìm kiếm và nhóm nút cùng hàng, placeholder nguyên văn, 5 icon Figma xuất trực tiếp, bốn cột dữ liệu. Tại 1440×900: khung (278,192) 1136×562; ô tìm (299,263) 464×42; nút tìm (781,264) 122×40; nút thêm (976,264) 205×40 (lệch 1px x so với frame). Giữ mã KH0001 và dữ liệu hiện có theo quyết định bổ sung.

Typecheck/build đạt, kiểm tra UI local và public đạt: tìm theo điện thoại, bỏ lọc, chọn/bỏ chọn để bật/tắt Sửa, 5 icon tải đủ. Đã kiểm tra lại bố cục/tìm kiếm sản phẩm và nhà cung cấp local sau khi sửa thành phần chung, đạt. Deploy 475b53f success. Chứng cứ docs/evidence/customer-list. Không nhận toàn bộ sidebar hoặc các form/ngoại lệ UC5 đã so pixel xong.

## Hộp hủy khách hàng và biểu tượng thông báo — 13/11/2026

Đã lấy context/ảnh frame 90:419, 90:1262, 90:1856, 90:148 và dùng lại context toast 90:286. Hủy thêm: form tại (439,271) 562×365; xác nhận tại (505,343) 430×250; vòng tròn tại (693,367) 54×54. Hai lớp overlay rgba(15,23,42,.38) và .20. Loại nút đóng X thừa, giữ hai nút Quay lại/Xác nhận. Điều chỉnh hộp hủy sửa và xóa theo nguồn, xuất SVG check 18px/close 14px cho toast. Menu khách hàng thu gọn nhóm không chọn và kích thước theo frame.

Đã kiểm tra trên local và public Vercel: đúng câu chữ/tên nút/geometry hủy thêm; Quay lại giữ dữ liệu, Xác nhận đóng form; Escape ở form mở xác nhận bằng dữ liệu mới nhất và ở xác nhận chỉ đóng lớp trên; hủy sửa/xác nhận xóa đúng câu/tên nút. Toast thêm/xóa và icon đóng kiểm tra thật trên CSDL local riêng, tạo rồi xóa khách kiểm thử; public không ghi dữ liệu. Deploy d326fea success. Typecheck/build đạt.

Đã so crop hộp hủy thêm bằng pixelmatch threshold .1: 1594/107500 pixel khác (1,48%) sau chỉnh vị trí chữ; geometry khớp nhưng chữ raster vẫn chưa trùng pixel tuyệt đối. Không tuyên bố toàn website hoặc toàn bộ 22 trạng thái UC5 đạt 100%. Chứng cứ ảnh nguồn/thực/diff ở docs/evidence/customer-dialogs.
