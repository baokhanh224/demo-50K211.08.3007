# UC6.4 — lịch sử bán hàng, 14/11/2026

Đối chiếu Figma `TnfBS7uXXanYxF96FaAmJC`, trang `336:2`: `336:3261` (danh sách), `336:3566` (lỗi tải), `336:3409` (không tìm thấy), `336:4159` (ngày không hợp lệ). Dùng design context và screenshot; không sửa thiết kế.

- Native 1440×927: sidebar 245px; tiêu đề 25px; bộ lọc tại (273,211), kích thước 1112×195. Bốn trường trên một hàng, nút Tìm kiếm 170×44 ở hàng dưới bên phải.
- Danh sách bắt đầu y=425, cao tối thiểu 443px; nền tiêu đề bảng xanh nhạt, mã/tiền/trạng thái chữ thường, không badge màu. Khi số bản ghi nhiều, khung giãn để không giấu hóa đơn. Xem ở dòng đầu và dòng hover/focus, hàng vẫn nhấn được để mở chi tiết.
- Toast lỗi tải tại (1104,109), 283×56; nền `#fef2f2`, viền `#ffa4a4`, chữ `#d8272b`, icon và nút × theo Figma. Giữ kết quả truy vấn thành công gần nhất khi tải lại lỗi; không tạo dòng dữ liệu mẫu để hiển thị lỗi.
- Kết quả rỗng và khoảng ngày không hợp lệ dùng câu thông báo nguyên văn, có nút đóng. Khung bộ lọc/danh sách luôn tách riêng.
- Icon nguyên bản được xuất bằng Figma Plugin API: `history-search.svg` (`336:3683`,18×18), `history-alert.svg` (`336:3716`,18×18), `history-chevron.svg` (`336:3655`,16×16). Không vẽ lại, không dùng screenshot làm UI.
- Viền xanh chọn layer trong ảnh trình biên tập không được đưa vào website. Dữ liệu bảng lấy từ CSDL, không thay bằng ba hóa đơn minh họa Figma.

CSS chỉ áp dụng khi có `.sales-history-page`; các màn Hủy/Đổi trả giữ bố cục cũ. Đã build và kiểm thử UC6.4 cùng hồi quy bán hàng, 2/2 đạt. Lỗi tải một lần được kích hoạt qua công tắc riêng phiên trên PostgreSQL cục bộ. Bằng chứng: `docs/evidence/history-ui-20261114/`.
