# Dữ liệu mẫu bổ sung

Bộ mẫu gồm 49 sản phẩm thuộc đủ 7 danh mục, 30 khách hàng và 14 nhà cung cấp.
Các bản ghi có sẵn được giữ nguyên. Email dùng miền `example.com`; thông tin liên hệ chỉ phục vụ minh họa.

Kiểm tra số bản ghi sẽ bổ sung trên database đang cấu hình trong `.env`:

```sh
npm run db:demo:expand -- --dry-run
```

Bổ sung vào cùng database của website:

```sh
npm run db:demo:expand
```

Lệnh này không xóa dữ liệu, không sửa bản ghi đã có và có thể chạy lại.
Sản phẩm được nhận diện bằng mã vạch nội bộ ổn định; khách hàng và nhà cung cấp được nhận diện bằng số điện thoại của bộ mẫu.
Mỗi nhóm danh mục được lưu trong một giao dịch riêng; nếu gián đoạn, chạy lại để tiếp tục các nhóm còn thiếu.

Tồn kho được ghi bằng 14 phiếu nhập có khóa chống trùng. Đơn vị, giá vốn, tồn kho và báo cáo nhập hàng dùng cùng dữ liệu nghiệp vụ.
Chạy lại không tạo phiếu nhập trùng và không bổ sung lại số hàng đã bán.
Chỉ các sản phẩm vừa được tạo mới nhận tồn kho mẫu; dữ liệu sản phẩm có sẵn không bị thay đổi.

Mã nguồn bộ mẫu: `lib/demo-catalog.ts`. Lệnh thực thi: `scripts/expand-demo.ts`.
`npm run db:seed` vẫn là lệnh khôi phục bộ cơ bản và có xóa dữ liệu; không dùng lệnh đó để bổ sung vào website đang hoạt động.
Sau khi chủ động khôi phục bộ cơ bản, có thể chạy lệnh bổ sung ở trên để nạp lại bộ mở rộng.

Website và máy tính chỉ dùng chung dữ liệu khi `DATABASE_URL` của chúng trỏ đến cùng database.
Sau khi bổ sung từ công cụ quản trị, tải lại trang để các màn hình nhận dữ liệu mới từ API chung.

## Kiểm chứng trên database thử nghiệm

```sh
npx tsx scripts/verify-demo-expansion.ts --twice
```

Lệnh kiểm chứng cũng bổ sung dữ liệu: chỉ chạy trên bản sao dành cho kiểm thử.
Nó đối chiếu từng bản ghi nghiệp vụ cũ, kiểm tra tồn kho/giá vốn của 49 sản phẩm mới,
thử tính giỏ hàng và xác thực dòng nhập hàng, rồi chạy lần hai để xác nhận không tạo trùng.
Có thể đặt `DEMO_BACKUP_PATH` để lưu ảnh chụp dữ liệu nghiệp vụ trước khi chạy;
không đưa file sao lưu hay thông tin kết nối vào Git.
