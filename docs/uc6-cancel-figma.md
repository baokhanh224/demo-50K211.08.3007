# UC6.3 — Hóa đơn đã được hủy trước đó

Figma file TnfBS7uXXanYxF96FaAmJC, node336:2359, khung1440×927. Thay đổi giới hạn ở trang Hủy hóa đơn; sidebar/header dùng chung giữ nguyên.

- Tiêu đề (277,128), 25px/600.
- Khung danh sách (274,215), 1110×644 tối thiểu; tiêu đề Chọn hóa đơn cần hủy; một ô nhập mã (291,280), 300×40; nút Tìm kiếm (603,280), 110×40.
- Bảng (291,360), rộng1070, header48px, bốn cột Mã hóa đơn / Ngày giờ bán / Tổng tiền / Trạng thái và cột thao tác. Không có cột Khách hàng. Mã đen thường, trạng thái không có badge màu.
- Nút Hủy102×40, xanh#103a9b/chữ trắng. Hiển thị mặc định ở dòng đầu; các dòng còn lại hiện khi hover hoặc focus bàn phím, vẫn thao tác được với hóa đơn đã hủy để hiển thị thông báo đúng.
- Toast (997,107), 390×56, nền#fef2f2, viền#ffa4a4, chữ#d8272b, icon alert18×18 và nút×. Tái sử dụng print-alert.svg, cùng asset4e731.svg với frame Figma. Không sửa hay vẽ lại asset.
- Lỗi check-cancel hiển thị trên góc phải mà không xóa danh sách. Lỗi tìm kiếm cũng giữ kết quả đã tải. Nút đóng chỉ đóng thông báo.
- Giữ dữ liệu, API và nghiệp vụ hủy thật; không sửa service.ts hoặc route.ts. Ô tìm mã hoạt động bằng Enter và nút Tìm kiếm. Hộp nhập lý do hủy hiện có được giữ nguyên.

Production build/TypeScript đạt. Playwright5/5 đạt (cancel-invoice, hai test invoice-print, sales-history-ui, sale-ui). Test mới dùng hóa đơn đã hủy thật trên CSDL thử để xác minh thông báo, kiểm tra tìm đúng/rỗng, mở/đóng form lý do cho hóa đơn hợp lệ, giữ dòng khi lỗi tải và dữ liệu hóa đơn không đổi. Không xác nhận hủy giao dịch trong kiểm tra giao diện. Lỗi tải chỉ mô phỏng ở trình duyệt.
