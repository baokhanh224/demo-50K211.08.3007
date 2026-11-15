# Quy chuẩn kích thước ba màn hình quản lý

Quản lý sản phẩm, khách hàng và nhà cung cấp cùng dùng `components/management-layout.css`.
Các quy tắc chỉ áp dụng cho danh sách; giữ nguyên biểu mẫu, hộp thoại, màu sắc và hành vi nghiệp vụ.

| Thành phần | Quy chuẩn |
|---|---|
| Header / menu trái | 90px / 250px, dùng chung từ App |
| Lề nội dung / đệm khung | 24px / 20px |
| Tiêu đề trang | 27px chiều cao dòng; cách khung 16px |
| Khung danh sách | Rộng theo vùng nội dung; cao tối thiểu 600px, tự tăng theo dữ liệu |
| Ô tìm kiếm | 320 × 40px |
| Nút tìm kiếm | 112 × 40px |
| Thêm / Sửa / Xóa / Cập nhật giá | Rộng 180 / 80 / 80 / 180px, cao 40px |
| Bộ lọc | Rộng 156px, cao 40px |
| Khoảng cách hàng / giữa điều khiển | 16px / 10px |
| Hàng tiêu đề bảng | Cao 44px; đệm ngang 12px |
| Hàng dữ liệu | Cao tối thiểu 48px; tự tăng nếu nội dung dài |

Thông tin dạng chữ căn trái, số tiền và tồn kho trong bảng sản phẩm giữ căn phải.
Giữ dòng “Danh sách khách hàng” ở khoảng trống bên trái hàng nút.
Số cột, số dòng, bộ lọc riêng và cách phân trang của từng chức năng giữ nguyên.

Kiểm tra ở viewport 1440×927: tiêu đề (274,114), khung (274,157), ô tìm kiếm (295,178),
hàng tiêu đề bảng (296,291). `tests/management-layout.spec.ts` kiểm tra số đo, điều hướng
qua lại và kích thước nút sau khi chọn bản ghi; không tạo hoặc sửa dữ liệu.
