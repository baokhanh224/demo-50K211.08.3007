# Quản lý sản phẩm — đối chiếu 22 yêu cầu

## Màn hình và dữ liệu

Giao diện dùng `components/products.tsx` / `products.css`, được điều hướng từ `components/masters.tsx`. `ProductForm` cũng được xuất qua `MasterForm` để giữ các nơi gọi cũ. Dùng chung Modal, Field, Button, SupplierToast và bảng màu thông báo hiện có.

| Mục | Kết quả |
|---|---|
| 1 | Thêm `product.expiry` tùy chọn. Form nhập dd/mm/yyyy, lưu ISO yyyy-mm-dd; có cột danh sách và dòng chi tiết. Kiểm tra ngày lịch thật và không trước ngày hiện tại ở cả FE/BE. Câu lỗi: “Dữ liệu không hợp lệ!”. |
| 2 | Danh sách, chi tiết, form sửa và cập nhật giá dùng `reference_cost`. Cảnh báo giá bán so với cùng giá nhập này, có xét hệ số đơn vị khi API được gọi từ nơi khác. Giá vốn bình quân dùng cho tồn kho/lợi nhuận giữ riêng, không ghi đè với sản phẩm có phiếu nhập. |
| 3 | Ẩn mã vạch, mức tồn tối thiểu, checkbox quản lý hạn dùng, nhiều đơn vị bán, bảng đơn vị và lịch sử giá khỏi màn hình sản phẩm. Giữ các trường/dòng dữ liệu này cho Bán hàng/Nhập hàng và không xóa khi sửa sản phẩm. |
| 4 | Phân trang10 sản phẩm/trang, nút trước/số trang/sau; chân trang dùng dấu `-`, số đầu/cuối theo trang. |
| 5 | Giữ từ khóa đã áp dụng, danh mục, trang hợp lệ sau thêm/sửa/xóa/cập nhật giá; dữ liệu lọc được tính lại từ dữ liệu mới. |
| 6 | Server xác định sản phẩm không tồn tại; FE đóng form, gọi làm mới dữ liệu và hiện toast đỏ “Sản phẩm không tồn tại!”. |
| 7 | Xóa bị chặn hiện toast đỏ góc phải đúng câu “Không thể xóa sản phẩm đã có tồn kho hoặc giao dịch!”; lựa chọn và dòng vẫn giữ. |
| 8 | Chi tiết thành drawer460px bên phải, nền mờ, tiêu đề “Chi tiết sản phẩm”; đóng bằng ×, Đóng, Escape hoặc nền. |
| 9 | Chi tiết gồm mô tả, đơn vị tính, giá bán, hạn sử dụng; các giá có `đ`. |
| 10 | Đơn vị tính là bộ chọn có placeholder “Chọn đơn vị tính”; giữ cả giá trị đơn vị cũ nếu ngoài danh sách gợi ý. |
| 11 | Danh mục sản phẩm chỉ gồm Sữa, Mì ăn liền, Nước uống, Bánh mì, Bánh kẹo, Gia vị, Khác. |
| 12 | Cột “Đơn vị”, “Tồn kho”. |
| 13 | Khi rỗng ẩn bảng, hiện kính lúp, dòng gợi ý đúng câu và “Hiển thị 0 / 0 sản phẩm”. |
| 14 | Có × xóa từ khóa, áp dụng lại lọc, giữ danh mục. |
| 15 | Dòng checkbox đang chọn có nền xanh nhạt. |
| 16 | Đổi danh mục lọc ngay; mục chọn có nền xanh và dấu tích. Bộ chọn hỗ trợ bàn phím, Escape, click ngoài. |
| 17 | Đủ placeholder tên, danh mục, đơn vị, các giá0, dd/mm/yyyy, mô tả, giá bán mới. |
| 18 | Ô nhập giá có hậu tốđ. |
| 19 | Mã sản phẩm và giá bán khi sửa có khóa; giá bán readonly và có câu gợi ý theo yêu cầu. |
| 20 | Cập nhật giá: các ô giá nhập/hiện tại xám, có khóa/đ; dòng “Mã - Tên” trên nền xanh nhạt. |
| 21 | Xóa có tiêu đề và thùng rác đỏ; hủy có tiêu đề Xác nhận/chấm than xanh; cảnh báo giá có biểu tượng vàng, Quay lại/Tiếp tục. Xác nhận xóa/hủy sửa đỏ, hủy cập nhật giá xanh. |
| 22 | Lỗi bắt buộc thống nhất “Không được để trống!”. |

## Migration và tương thích

Migration `202611140001_product_spec` thêm cột nullable, không giả định hạn dùng cho sản phẩm cũ. Các ngày theo lô trong `receipt_line.expiry` giữ nguyên; trường sản phẩm là thông tin tùy chọn riêng, không thay thế dữ liệu lô.

Thêm bảy danh mục chuẩn bằng tên, không xóa/đổi tên các danh mục dùng chung. Sản phẩm đang thuộc danh mục ngoài danh sách chuẩn được chuyển sang “Khác”; không tự đoán phân loại từ tên sản phẩm. Giữ nguyên liên kết nhà cung cấp và mã sản phẩm. Bản đồ phân loại trước triển khai được lưu riêng ngoài repository. Nhánh Neon `review/products-spec-20261114` được tạo từ production để kiểm tra; kiểm tra trước/sau xác nhận các thuộc tính sản phẩm khác, đơn vị bán, liên kết nhà cung cấp, số bản ghi giao dịch và tồn kho không đổi. Môi trường chặn Prisma CLI truy cập trực tiếp Neon, nên cùng file migration được chạy nguyên các câu trong một transaction qua driver hiện có trên nhánh thử, sau đó ghi checksum/trạng thái migration tương ứng. Production vẫn dùng quy trình Prisma Migrate chuẩn trong Vercel build.

Vì danh mục chuẩn có “Khác”, form Nhà cung cấp phân biệt mục đã có bằng “Khác (có sẵn)” với mục “Khác” để nhập tên mới; không bỏ lựa chọn nào.

Cập nhật bản local:

```sh
git pull origin main
npm install
npm run db:init
npm run dev
```

Không chạy seed trên CSDL đang dùng: seed là chức năng reset dữ liệu demo. Seed cho CSDL mới đã được cập nhật danh mục chuẩn.

## Kiểm tra

- Production build/TypeScript đạt.
- Hai kiểm tra thuần cho ngày lịch, năm nhuận, ngày quá khứ/tùy chọn, giá không hợp lệ, câu lỗi bắt buộc.
- Ba test Products: tạo/sửa/xóa, giữ bộ lọc,11 sản phẩm để kiểm tra phân trang, trạng thái chọn, drawer, ngày sai/đúng, hộp hủy/cảnh báo, cập nhật giá, xóa bị chặn, giá tham chiếu khác giá vốn, mất sản phẩm khi đang sửa.
- Kiểm tra trên nhánh sao chép production: lưu và xác thực hạn dùng, giữ metadata ẩn, kiểm tra ngưỡng giá theo reference_cost khi average_cost khác, thiếu sản phẩm, dọn fixture và đối chiếu dữ liệu trước/sau.
- Hồi quy Bán hàng, Hủy, In, Lịch sử, Sidebar14 view, Nhà cung cấp, Báo cáo/Lịch và luồng master cũ đã được cập nhật selector phù hợp.
- Ảnh kiểm thử được tạo trong `test-results/products/`; dữ liệu thử không phải bản ghi Figma giả đưa lên production.
