# Danh mục dùng chung

`bootstrap.categories` là danh sách chung cho Sản phẩm, Nhà cung cấp và Báo cáo.
`product_categories` được giữ để tương thích và trả về chính danh sách đó.
`lib/categories.ts` sắp xếp các nhóm cơ bản theo thứ tự quen thuộc, nhóm bổ sung theo tên và “Khác” cuối cùng.
Không xóa, đổi tên hay chuyển các liên kết danh mục đang có trong database.

Chỉ form Thêm/Sửa nhà cung cấp có thao tác “Khác” để nhập tên danh mục mới.
Sau khi lưu nhà cung cấp, danh mục mới được trả về qua bootstrap và có thể chọn
ở form Thêm/Sửa sản phẩm, bộ lọc danh sách và bộ chọn nhóm sản phẩm trong báo cáo.
Các nơi còn lại chỉ chọn danh mục có sẵn. API lưu sản phẩm kiểm tra ID danh mục
có tồn tại, không tạo danh mục từ nội dung do sản phẩm gửi lên.

Mục “Khác” trong sản phẩm/bộ lọc/báo cáo là danh mục bình thường, không mở ô nhập.
Trong form nhà cung cấp chỉ có một mục “Khác”; nếu nhà cung cấp cũ đã chọn danh mục
Khác thì trạng thái đó được giữ và có thể bỏ chọn khi sửa.

Kiểm chứng: `tests/category-sync.test.ts` (tạo dữ liệu trong transaction local rồi rollback),
`tests/category-sync-ui.spec.ts` (bộ chọn dùng chung và hành vi của Khác, không lưu dữ liệu).
