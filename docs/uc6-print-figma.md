# UC6.2 — In hóa đơn

Đối chiếu file `TnfBS7uXXanYxF96FaAmJC`, node `336:4315` (xem trước), `336:1615` (xác nhận hủy), `336:1769` (hóa đơn đã hủy), `336:2071` (thành công). Khung 1440×927.

- Trang riêng có tiêu đề tại (277,128), khung hóa đơn (476,212), 733×557 tối thiểu. Khung tăng chiều cao khi hóa đơn có nhiều dòng, không cắt dữ liệu.
- Dữ liệu lấy từ API thật, gồm mã/ngày giờ, sản phẩm và đơn vị bán, số lượng, đơn giá, thành tiền, tổng tiền, phương thức thanh toán. Không chèn hóa đơn mẫu.
- Nút Hủy (699,800), 110×40; In hóa đơn (841,800), 145×40 ở hóa đơn thông thường.
- Xác nhận hủy (500,350), 440×250, lớp phủ rgba(15,31,59,.42), dấu ! trên nền tròn, Quay lại và Xác nhận đỏ. Escape đóng hộp xác nhận, giữ bản xem trước. Xác nhận trở về danh sách, không hủy giao dịch bán hàng.
- Toast lỗi đã hủy (1097,107), 290×56; toast thành công (1171,107), 245×56, đều có nút đóng. Đóng lỗi không mở khóa nút In cho hóa đơn đã hủy. Lỗi máy in khác cho phép thử lại.
- Server kiểm tra lại trạng thái khi mở xem trước và khi bấm In. Giữ nguyên service.ts / route.ts. Khóa bấm lặp khi đang gửi yêu cầu.
- CSS giới hạn bằng invoice-print-*, không thay header/sidebar hoặc giao diện Bán hàng/Đổi trả. Print media hiển thị main chứa bản in, ẩn header, sidebar, tiêu đề trang, nút và thông báo. Xuất PDF thử có đầy đủ nội dung hóa đơn.

## Tài nguyên Figma

`public/figma/print-warning-circle.svg`: xuất nguyên node336:1767, 56×56; dấu ! là lớp chữ riêng như Figma. `public/figma/print-alert.svg`: xuất nguyên node336:1914, 18×18. Đường dẫn asset Figma trả403 trong môi trường, nên dùng exportAsync SVG_STRING đọc trực tiếp hai node, không thay vector hoặc màu. Dấu ✓ và × là lớp chữ như thiết kế. Dùng các icon header/sidebar sẵn có.

## Kiểm tra

Production build và TypeScript đạt. Hai test mới kiểm tra kích thước trang/modal/toast, hủy/quay lại/Escape, thành công, lỗi máy in/thử lại, hóa đơn bị hủy sau xem trước, hóa đơn đã hủy khi mở, khóa in sau đóng lỗi, PDF/print media. Hai test hồi quy Bán hàng/Lịch sử bán hàng đạt. Lỗi máy in/hủy đồng thời được mô phỏng trong browser, không sửa dữ liệu nghiệp vụ. Bài test mở trang đã được chỉnh để tuân theo luồng đăng nhập thực tế: đăng nhập đưa về Bán hàng, sau đó vào Lịch sử bán hàng.

Thông báo “In hóa đơn thành công” giữ ý nghĩa đã gửi yêu cầu in và gọi hộp in của trình duyệt. Web không xác nhận được giấy đã in thực tế hoặc người dùng chọn In/Hủy trong hộp in hệ điều hành. Trong kiểm thử, window.print được thay bằng bộ đếm; PDF được tạo bằng Chromium, không gửi tới máy in thật.
