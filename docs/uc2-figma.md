# UC2 — đối chiếu Figma ngày 14/11/2026

Nguồn: file `TnfBS7uXXanYxF96FaAmJC`, trang `1:3` (UC_2 Quản lý nhà cung cấp). Đã đọc high-fidelity design context và ảnh của 27 frame sau; không sửa file Figma.

- `293:5`: UC_2.1-08 Thêm thành công
- `293:180`: UC_2.1-06 Thêm - Dữ liệu không hợp lệ
- `293:502`: UC_2.1-04 Form thêm - ghi nhận tạm thời Danh mục mới
- `293:817`: UC_2.1-03 Form thêm - nhập tên Danh mục mới
- `293:1135`: UC_2.1-02 Form thêm - chọn Danh mục
- `293:1472`: UC_2.1-01 Form thêm nhà cung cấp
- `293:1784`: UC_2.4-07 Không tìm thấy nhà cung cấp
- `293:1923`: UC_2.4-05 Kết quả tìm kiếm (Từ khóa)
- `293:2125`: UC_2.4-06 Kết quả (Từ khóa + Danh mục + Trạng thái)
- `293:2292`: UC_2.4-04 Bộ lọc Trạng thái (Đang mở)
- `293:2552`: UC_2.4-03 Bộ lọc Danh mục (Đang mở)
- `293:2818`: UC_2.4-01 Danh sách (mặc định)
- `293:3069`: UC_2.4-08 Chi tiết nhà cung cấp
- `293:3365`: UC_2.4-02 Danh sách - đã chọn 1 nhà cung cấp 
- `293:3617`: UC_2.2-06 Sửa - xác nhận hủy
- `293:3869`: UC_2.3-03 Xóa thành công
- `293:4111`: UC_2.3-02 Xóa - không thể xóa
- `293:4372`: UC_2.3-01 Xóa - hộp thoại xác nhận
- `293:4637`: UC_2.2-05 Sửa - hộp thoại xác nhận hủy
- `293:4973`: UC_2.2-04 Sửa - dữ liệu không hợp lệ
- `293:5305`: UC_2.2-03 Sửa - mở danh sách Trạng thái
- `293:5633`: UC_2.2-02 Sửa mở danh sách Danh mục
- `293:5979`: UC_2.2-01 Form sửa thông tin nhà cung cấp
- `293:6300`: UC_2.2-07 Sửa thành công (dữ liệu mới trong danh sách)
- `293:6565`: UC_2.1-05 Thêm - lỗi bỏ trống
- `293:6889`: UC_2.1-08 Thêm - Hộp thoại xác nhận hủy
- `293:7140`: UC_2.1-07 Thêm - Hộp thoại xác nhận

## Phạm vi thực hiện

- Danh sách: trạng thái chữ xanh `#16a34a` hoặc đỏ `#dc2626`, không có nền; “Ngừng hợp tác” xuống hai dòng. Mã NCC đen, nét thường; tên NCC nét đậm. Dòng được chọn có nền `#dbeafe`.
- Bộ lọc dạng dropdown nằm trong khung, có dấu tick lựa chọn, kính lúp trắng trên nút Tìm kiếm, nút xóa từ khóa và phân trang 6 dòng/trang. Nhà cung cấp vừa thêm được mở ở trang chứa bản ghi đó.
- Không có kết quả: icon kính lúp nguyên bản, thông báo in đậm. Chi tiết là drawer rộng 460px sát phải, cao bằng viewport; dữ liệu thật, trạng thái có màu chữ.
- Form thêm/sửa rộng 600px, kích thước cơ sở 528,86px / 599,09px theo frame. Không có thanh cuộn trong form; dropdown danh mục có vùng cuộn riêng. Khi có lỗi hoặc nhập danh mục mới, form giãn theo nội dung.
- Mã tự tạo chỉ đọc có icon khóa 15px. Giữ nguyên placeholder, tiêu đề xanh, danh mục chọn nhiều và các lỗi danh mục mới nguyên văn. Sửa có trạng thái ở cuối và dấu tick trong danh sách trạng thái.
- Xác nhận hủy 340×201,84px với icon xanh; xác nhận xóa 420×231px với icon thùng rác đỏ và nút đỏ, chữ trắng.
- Toast thành công nền xanh, tick và nút ×; lỗi xóa nền đỏ nhạt, chữ đỏ, icon chấm than và nút × ở góc trên phải.

## Icon và kiểm chứng

Các URL asset Figma trả HTTP 403 tại proxy môi trường. Đã xuất trực tiếp các node icon nguyên bản qua Figma Plugin API, không vẽ lại, không dùng ảnh chụp màn hình làm UI. Node ID và kích thước gốc ở `supplier-assets.json`; các SVG được giữ nguyên tại `public/figma/`. Đã xác minh icon tải được ở từng trạng thái kiểm thử.

`tests/suppliers.spec.ts`: kịch bản hình học và trạng thái dùng fixture 7 NCC chỉ ở tầng browser; kịch bản ghi thật chạy với PostgreSQL cục bộ, chỉ tạo/sửa/xóa NCC kiểm thử rồi dọn bản ghi. Không seed hoặc sửa dữ liệu nghiệp vụ website chính.

Các số đo được kiểm tra ở 1440×900; kiểm tra không tràn trang ở 1280×900 và 1920×900. Không khẳng định mọi pixel của mọi trạng thái trùng tuyệt đối khi dữ liệu thật khác dữ liệu minh họa Figma.

Yêu cầu “Mã khách hàng” trong danh sách các chỉnh sửa UC2 được hiểu là mã nhà cung cấp theo ngữ cảnh và cột trong Figma. Không thay đổi màu mã khách hàng ở UC5.

## Bổ sung theo phản hồi — danh mục mới và lỗi đồng thời

Ô nhập tên danh mục mới không có tiêu đề riêng, nằm ngay dưới ô Danh mục. Enter với tên hợp lệ chuyển thành chip danh mục tạm và ẩn ô nhập; thao tác này không gửi lưu nhà cung cấp hoặc tạo danh mục trong CSDL. Dữ liệu mới chỉ được ghi cùng transaction khi bấm Lưu. Bộ lọc danh mục trang chính có vùng cuộn 140px.

Form và API dùng chung `lib/supplier-validation.ts`, thu thập lỗi tất cả trường trước khi trả kết quả. Kiểm tra bỏ trống tên/SĐT/danh mục mới và nhập sai SĐT/email/trùng danh mục đều hiển thị đủ ba lỗi trong một lần, giữ nguyên câu chữ.
