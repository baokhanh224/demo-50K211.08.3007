# Tiêu đề màn hình

`app/page-headings.css` dùng chung cho tiêu đề H1 trong vùng `.main.app-main`.

- Inter kế thừa từ ứng dụng, 22px, đậm 700, chiều cao dòng 27px.
- Bắt đầu cách mép trái vùng nội dung 24px và dưới header 24px.
- Khoảng cách sau tiêu đề 16px; màn báo cáo giữ hàng nút xuất riêng để không chồng nội dung.
- Tiêu đề nằm trong luồng trang, không sticky/fixed: cuộn trang sẽ đưa tiêu đề ra khỏi màn hình.
- Header và menu trái vẫn cố định theo quy chuẩn hiện có.
- Chỉ áp dụng trên màn hình; không thay đổi bố cục giấy in.

Viewport 1440×927: tiêu đề bắt đầu tại (274,114).
Khi header/menu chuyển sang kích thước nhỏ ở viewport 800px: (244,98).
`tests/page-headings.spec.ts` kiểm tra toàn bộ màn hình và hành vi cuộn.
Các số đo Y của khối nội dung trong kiểm thử cũ được cập nhật theo hàng tiêu đề mới.
