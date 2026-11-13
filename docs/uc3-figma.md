# UC3 — đối chiếu Figma ngày 13/11/2026

Nguồn: [UC_3 Báo cáo, page 1:2](https://www.figma.com/design/TnfBS7uXXanYxF96FaAmJC/50K211.08.3007?node-id=1-2). Đã đọc context đầy đủ kèm ảnh của **51 frame**. Không thay đổi file Figma hay đặc tả Word.

## Phần đã sửa

| Nhóm | Frame nguồn | Cách tạo trạng thái trong ứng dụng |
|---|---|---|
| Mở báo cáo, chọn loại | 304:2349, 304:2486 | Báo cáo kinh doanh → Loại báo cáo; chưa tự chạy truy vấn |
| Lịch Từ ngày/Đến ngày | 304:135, 304:365, 304:2632, 304:2866 | Bấm ô ngày hoặc icon; lịch tuần T2–CN, chọn khoảng, chuyển tháng |
| Menu sản phẩm/nhóm | 304:610, 304:3115 | Bấm ô lọc kết hợp → tìm và tích checkbox → Áp dụng |
| Lọc nhanh | 304:787, 304:920, 304:3433, 304:3570, 304:4917 | Nhãn Lọc nhanh:; năm chip bo tròn; chỉ cập nhật ngày, chưa chạy báo cáo |
| Đang xử lý | 304:1054, 304:3708, 304:5054, 304:5749 | Nhấn Xem báo cáo; khóa gửi lặp, hiện spinner và câu xử lý theo từng UC |
| Tiêu chí sai | 304:1199, 304:3852, 304:6989, 304:7540 | Từ ngày tương lai hoặc lớn hơn Đến ngày → Xem báo cáo |
| Lỗi tải | 304:1337, 304:3992, 304:7129, 304:7266 | Bật công tắc Buộc lỗi tải dữ liệu một lần trong cùng phiên rồi Xem báo cáo |
| Không có dữ liệu | 304:1471, 304:4129, 304:7403, 304:7680 | Chọn kỳ không có giao dịch; với xếp hạng chọn sản phẩm không có bán và không còn tồn |
| Doanh thu | 304:4266 | Loại Doanh thu; hai thẻ tổng; biểu đồ đường và bảng số liệu cạnh nhau |
| Lợi nhuận | 304:4772, 304:5198 | Loại Lợi nhuận; ba thẻ tổng; cột doanh thu/giá vốn màu xanh/đen |
| Bán chạy/chậm | 304:5604, 304:5901, 304:6255 | Loại Sản phẩm bán chạy/chậm; hai radio; hai bảng cạnh nhau, đúng cột và mũi tên |
| Xuất–nhập–tồn | 304:2, 304:1605 | Báo cáo xuất–nhập–tồn; năm thẻ tổng, bảng tám cột, công thức tồn |
| Mở xuất và chọn định dạng | 304:1964, 304:4506, 304:5388, 304:6609, 304:7817, 304:8176, 304:8561 | Nút Xuất báo cáo cạnh tiêu đề; radio Excel/PDF; nội dung sẽ xuất |
| Đang xuất / thành công | 304:8952, 304:9325 | Xuất từ snapshot; spinner rồi icon check, thẻ tệp có tên/dung lượng thật |
| Hủy / quay lại | 304:10082, 304:10499 | Hủy → xác nhận; Quay lại giữ định dạng; Xác nhận đóng hộp xuất, giữ kết quả báo cáo |
| Lỗi truy xuất / tạo tệp | 304:11243, 304:11614 | Hai công tắc lỗi xuất riêng phiên; Đóng hoặc Kết thúc/Thực hiện lại |

Các trạng thái cùng loại dùng một thành phần React, không tạo các trang có thông báo cố định. Kết quả và biểu đồ lấy số liệu CSDL thật. Phạm vi nguồn, quy tắc Word và các điểm không thống nhất giữa frame được ghi ở README.

## Kiểm tra

- `npm run build`: production build và TypeScript đạt.
- `tests/uc3.spec.ts`: kiểm tra bộ lọc nhiều lựa chọn, lịch khoảng, năm nút nhanh, bốn loại kết quả, chỉ một yêu cầu khi bấm đôi, thông báo sai khoảng, không có dữ liệu, lỗi tải, xuất Excel/PDF, lỗi xuất đọc/tạo tệp, thử lại, hủy và quay lại. Tổng Excel so đúng mảng tổng của snapshot đang hiển thị; tiền Excel/PDF hiển thị VNĐ nguyên như màn hình, số Excel vẫn giữ giá trị gốc; `pdftotext` kiểm tra dòng tổng PDF; tải lại không đổi tồn kho.
- Sáu ảnh Figma gốc ở `tests/figma-baseline/304-*.png`, kích thước 1400×900 hoặc 1440×900 theo từng frame; dùng làm ảnh đối chiếu, không dùng làm UI.
- SVG gốc xuất từ node Figma, gồm root menu, submenu, tải xuống, tìm kiếm, lịch, radio, check, đóng, cảnh báo và trạng thái; danh mục `docs/uc3-assets.json`. Kiểm tra file không rỗng, icon nạp được, radio hiển thị 16×16.
- Ảnh chạy thật và tệp kết quả ở `docs/evidence/uc3/`. Dữ liệu khác số minh họa Figma; không chỉnh số liệu để khớp ảnh.
- So ảnh toàn màn hình mở báo cáo kinh doanh (304:2349), 1440×900, Pixelmatch threshold 0,1: còn khoảng **0,37% pixel khác**; không bỏ qua vùng nào. Khung, khoảng cách và màu nền đã đối chiếu. Còn khác raster chữ và một số vị trí nét/viền; các màn hình có dữ liệu động chưa có phép so pixel tuyệt đối toàn ảnh.

Không tuyên bố đã đạt trùng 100% pixel của cả 51 frame. Bảng danh mục `ui-parity.json` ghi riêng trạng thái đọc context, kiểm tra UI và đối chiếu ảnh cho từng frame.

## Xác minh trên Vercel

Bản `c7eb2bc` triển khai thành công. Hai test UC3 trên https://quynh-nhu-demo.vercel.app/ đạt 2/2 trong 27,3 giây, gồm các kết quả, bộ lọc, lịch, lỗi và xuất. Tổng tiền tồn màn hình/PDF 1.276.500đ; tổng Excel giữ giá trị gốc của cùng snapshot. Dữ liệu nghiệp vụ trước/sau có cùng SHA-256 (xem BAO-CAO-KIEM-THU.md). Ảnh public ở `docs/evidence/uc3/uc3-public-*.png`.

## Điều chỉnh theo ảnh người dùng chốt

Hộp Xuất báo cáo được thay bằng bản gọn ở ảnh bên trái người dùng gửi: giữ tiêu đề, nút đóng, câu “Chọn định dạng tệp. Nội dung xuất gồm loại báo cáo, tiêu chí lọc và số liệu đang hiển thị.”, hai lựa chọn Excel/PDF và hai nút Hủy/Xuất báo cáo. Excel được chọn mặc định. Bỏ khối Nội dung sẽ xuất, tiêu chí lọc trong hộp và nhãn Định dạng được hỗ trợ; phần này thay thế mô tả hộp xuất có preview ở các ghi nhận trước. Chức năng tạo tệp từ snapshot giữ nguyên.
