# Hệ thống quản lý bán hàng tạp hóa Quỳnh Như

Bản demo tiếng Việt cho Chủ cửa hàng. Next.js 16 + TypeScript + PostgreSQL 17 + Prisma 6. Dùng yêu cầu mới về go-live; không dùng SQLite. Dữ liệu nằm trong PostgreSQL, tồn tại độc lập với quá trình chạy và redeploy ứng dụng.

- Sau đăng nhập mở **Tạo giao dịch bán hàng**. Có **Đăng xuất**.
- Mã nguồn GitHub: https://github.com/baokhanh224/demo-50K211.08.3007 (repository công khai, mã nguồn tại thư mục gốc, nhánh `main`).
- Website công khai: https://quynh-nhu-demo.vercel.app/ . Kết quả kiểm tra và giới hạn phiên bản xem `BAO-CAO-KIEM-THU.md`.

## Chạy từ đầu

Cần Node.js 22.12 trở lên hoặc Node.js 24, npm và một PostgreSQL riêng cho demo.

1. Giải nén mã nguồn, mở terminal tại thư mục có `package.json`.
2. Tạo CSDL trên Neon, chọn **Connect**, chép chuỗi PostgreSQL vào `DATABASE_URL` trong `.env`. Giữ nguyên CSDL hiện có nếu đang cập nhật website. Tạo `.env` từ mẫu:

   ```bash
   cp .env.example .env
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Dùng kết quả lệnh Node cho `SESSION_SECRET` trong `.env`. Với CSDL mới, tự đặt `DEMO_USERNAME` và `DEMO_PASSWORD` trước khi seed. Với CSDL đã có tài khoản, seed giữ nguyên tài khoản và mật khẩu. Không đưa `.env` lên GitHub. Thay mẫu `DATABASE_URL` bằng chuỗi thật của bạn, có `sslmode=require`.
3. Chạy:

   ```bash
   npm ci
   npm run db:init
   npm run db:seed
   npm run dev
   ```

4. Mở http://localhost:3000 và dùng tài khoản đã tự cấu hình hoặc tệp bàn giao riêng. Khởi động bản production:

   ```bash
   npm run build
   npm run start
   ```

`npm run db:seed` thay thế toàn bộ dữ liệu nghiệp vụ demo. Không chạy trên CSDL chứa dữ liệu cần giữ. Trong ứng dụng, vào **Cài đặt demo → Khôi phục dữ liệu mẫu → Xác nhận** để thực hiện cùng thao tác. Phiên đăng nhập hiện tại được giữ. Các mã demo được khởi tạo lại trong lần khôi phục toàn bộ; ngoài thao tác khôi phục, mã không được tái sử dụng sau xóa.

Để chạy PostgreSQL cục bộ thay Neon, có sẵn `docker-compose.yml`:

```bash
docker compose up -d
```

Khi đó đặt `DATABASE_URL="postgresql://quynh_nhu:demo-local-only@localhost:5432/quynh_nhu?schema=public"` trong `.env`, rồi thực hiện migration và seed như trên. Volume Docker giữ dữ liệu sau khi dừng/chạy lại.

## Go-live trên Vercel và GitHub

Các bước tài khoản chỉ cần làm nếu chưa kết nối các dịch vụ để trợ lý thực hiện:

1. Mã nguồn đầy đủ ở repository công khai, nhánh `main`, thư mục gốc:

   ```bash
   git clone https://github.com/baokhanh224/demo-50K211.08.3007.git
   cd demo-50K211.08.3007
   ```

   Không có thư mục `demo-quynh-nhu` lồng bên trong. `.env`, khóa kết nối và `node_modules` không được đưa lên GitHub.
2. Đăng nhập https://vercel.com, chọn **Add New → Project → Import** repository `demo-50K211.08.3007`, chọn framework **Next.js**, **Root Directory = .** và nhánh production `main`. Cấu hình `vercel.json` dùng build `npm run vercel-build`, khu vực `sin1`.
3. Trong **Environment Variables**, đặt `DATABASE_URL` và `SESSION_SECRET` cho Production và Preview. Dùng chuỗi Neon thật và khóa ngẫu nhiên ít nhất 32 ký tự. Không đặt các biến này dưới tiền tố `NEXT_PUBLIC_`.
4. Chọn **Deploy**. Migration chạy trong build; build không chạy seed, nên redeploy giữ dữ liệu. Nếu dùng một CSDL mới chưa có mẫu, chạy `npm run db:seed` một lần từ máy đã đặt đúng `.env`, hoặc thực hiện nút khôi phục sau khi đã có tài khoản mẫu.
5. Trong **Settings → Deployment Protection**, cấu hình Production cho phép giảng viên/người ngoài truy cập, sau đó mở domain production bằng cửa sổ ẩn danh và đăng nhập. Không bàn giao đường dẫn yêu cầu đăng nhập Vercel.
6. Khi cập nhật: push lên nhánh production đã chọn để Vercel redeploy. Giữ nguyên `DATABASE_URL` và `SESSION_SECRET`. Chạy lại kịch bản demo và kiểm tra dữ liệu có sẵn sau redeploy.

Nếu CLI Prisma trên một mạng không mở được cổng PostgreSQL 5432, chạy migration từ Vercel hoặc mạng hỗ trợ PostgreSQL. Runtime Neon của ứng dụng dùng Prisma Neon adapter qua WebSocket, hỗ trợ proxy HTTPS của môi trường Cloud. CSDL Neon hiện tại đã được áp dụng hai migration đúng nội dung và checksum trong `prisma/migrations`, rồi seed qua Prisma. Không cần tạo lại các bảng.

## Chức năng

| Use case | Màn hình/chức năng |
| --- | --- |
| UC1.1–1.5 | Quản lý sản phẩm: thêm, sửa, xóa có điều kiện, tìm theo từ khóa/danh mục, cập nhật giá và lịch sử giá theo đơn vị |
| UC2.1–2.4 | Quản lý nhà cung cấp: thêm/sửa, nhiều danh mục, Khác tạo danh mục, trạng thái hợp tác, xóa có điều kiện, tìm kiếm kết hợp |
| UC3.1–3.3 | Báo cáo kinh doanh: doanh thu, lợi nhuận, bán chạy/chậm; báo cáo xuất–nhập–tồn; bộ lọc, biểu đồ; xuất `.xlsx` và PDF |
| UC4.1–4.4 | Nhập hàng với nhiều hạn; điều chỉnh theo từng nguồn; tra cứu tồn và cảnh báo; lịch sử và chi tiết phiếu nhập |
| UC5.1–5.4 | Thêm/sửa/xóa khách hàng; số điện thoại duy nhất; tìm kiếm và xem lịch sử mua |
| UC6.1–6.5 | Tạo giao dịch; tiền mặt/chuyển khoản; in; hủy và hoàn đúng nguồn; lịch sử; trả một phần, đổi hàng, hoàn/thu chênh lệch |

Lỗi bắt buộc và lỗi định dạng được hiển thị tại trường. Thông báo nghiệp vụ giữ câu chữ trong đặc tả. Form thay đổi dữ liệu có xác nhận hủy theo từng UC. Các trạng thái lỗi không hiển thị sẵn khi mới vào màn hình.

## Dữ liệu, transaction và chống gửi trùng

- Schema và khóa ngoại được quản lý bằng migration PostgreSQL; có CHECK tồn kho không âm, số lượng dương, trạng thái hợp lệ, khóa UNIQUE cho mã yêu cầu/số điện thoại. Prisma schema đã introspect đầy đủ các quan hệ. Các CHECK và expression index được giữ trong SQL migration vì Prisma không biểu diễn đầy đủ các ràng buộc này.
- Ghi nhiều bảng nằm trong cùng `prisma.$transaction`. AsyncLocalStorage truyền transaction client vào các hàm nghiệp vụ. Lỗi demo được ném sau các lệnh ghi, trước commit để thật sự kiểm tra rollback.
- Khóa sản phẩm và tất cả dòng nguồn tồn theo thứ tự mã/ID bằng `SELECT ... FOR UPDATE` trước nhập, bán, hủy, đổi/trả, điều chỉnh. Hóa đơn cũng được khóa khi hủy và đổi/trả. Khóa theo mã yêu cầu cùng UNIQUE chống gửi trùng khi hai request chạy đồng thời.
- Nguồn xuất được lưu vào `allocation`; lượng trả tiêu thụ từ nguồn nào được lưu vào `return_allocation`, kể cả khi không nhập lại kho. `movement` lưu sổ biến động để đối chiếu xuất–nhập–tồn.
- Cookie httpOnly, SameSite=Strict, Secure khi HTTPS; token ngẫu nhiên và chữ ký HMAC từ `SESSION_SECRET`. Mật khẩu băm scrypt với salt riêng. Tất cả API nghiệp vụ yêu cầu phiên hợp lệ.
- Công tắc lỗi lưu/tải/xuất được lưu theo token phiên; lỗi một lần tự tiêu thụ. Một trình duyệt khác không bị ảnh hưởng. Lỗi máy in giữ bật đến khi tắt. Không dùng setting lỗi chung cho toàn cửa hàng.
- Excel và PDF dùng cùng snapshot báo cáo đã tính cho màn hình; snapshot gắn với phiên. Màn hình và tệp dùng cùng cột, bộ lọc, dòng tổng, không tự ước lượng số liệu.

## Quyết định bổ sung của nhóm


Sản phẩm và đơn vị:
- Hồ sơ sản phẩm thêm: mã vạch, mức tồn tối thiểu, cờ "Có quản lý hạn sử dụng", danh sách đơn vị bán (đơn vị, tỷ lệ quy đổi về đơn vị cơ sở, giá bán). Lý do: BR-UC4-03, 4-09, 6-03, 6-08 cần các dữ liệu này.
- Trường "Hạn sử dụng" ở form sản phẩm UC1 thay bằng cờ "Có quản lý hạn sử dụng"; hạn thực tế chỉ nhập ở phiếu nhập (UC4). Lý do: BR-UC4-03 ghi hạn theo chi tiết phiếu nhập.
- "Giá nhập" ở UC1 là giá tham chiếu ban đầu; từ khi có phiếu nhập, giá nhập bình quân (BR-UC4-04) dùng cho giá vốn, so sánh ở UC1.5 và giá trị tồn.

Xuất kho:
- Bán hàng lấy theo thứ tự: chi tiết phiếu nhập có hạn gần nhất trước; hàng không có hạn lấy sau, theo ngày nhập cũ trước.
- Chi tiết phiếu nhập đã hết hạn không tính vào lượng có thể bán.
- Cùng sản phẩm thêm nhiều lần vào giỏ thì kiểm tra theo tổng số lượng trong giỏ.
- Trả hàng: hoàn kho ngược thứ tự đã xuất, mỗi nguồn không vượt lượng đã xuất của nguồn đó trừ phần đã hoàn ở các lần trước. Tiền trả khách theo đơn giá trên hóa đơn gốc.
- Hàng đổi xuất theo cùng thứ tự như bán, đơn giá là giá bán hiện tại của đơn vị đã chọn.
- Điều chỉnh tồn (UC4.2): số lượng thực tế không vượt số lượng đã nhập của chi tiết đó; không đổi giá nhập bình quân.

Giá vốn và báo cáo:
- Lưu giá vốn (đơn vị cơ sở) tại thời điểm bán trên từng dòng hóa đơn. Hàng trả hoàn giá vốn của dòng hóa đơn gốc; hàng đổi dùng giá vốn tại thời điểm đổi.
- Hóa đơn hủy tính theo ngày hủy: loại khỏi doanh thu của kỳ chứa ngày hủy; hoàn kho tính là nhập ở báo cáo xuất–nhập–tồn của kỳ đó.
- Hàng trả chọn "Không nhập lại kho": không tính nhập ở xuất–nhập–tồn, vẫn trừ doanh thu.
- File xuất gồm tiêu đề, loại báo cáo, bộ lọc đã chọn, các cột đang hiển thị và dòng tổng; số liệu lấy từ cùng hàm tính với màn hình.

Mã và trạng thái:
- Mã tự sinh, duy nhất, không tái sử dụng: SP0001, NCC001, KH0001, HD0001 (hóa đơn), PN0001 (phiếu nhập), DC0001 (phiếu điều chỉnh), DT0001 (phiếu đổi/trả).
- Trạng thái hóa đơn: "Đã thanh toán", "Đã hủy". Hóa đơn có phiếu đổi/trả vẫn "Đã thanh toán" nhưng không hủy trực tiếp được.
- NFR-02 không có nội dung: bỏ qua.

Khách hàng trong bán hàng:
- Đặc tả giao diện có màn hình "Gắn khách hàng" và "Không tìm thấy khách hàng". Thực hiện như bước tùy chọn trước "Hoàn tất thanh toán": nhập số điện thoại, chọn "Tìm", hiện tên khách; không thấy thì báo "Không tìm thấy khách hàng". Hóa đơn không gắn khách vẫn lưu bình thường. Lý do: BR-UC5-06 và UC6.4 dựa vào liên kết hóa đơn–khách hàng.

Mô phỏng:
- Máy in: dùng hộp thoại in của trình duyệt.
- Mã QR chuyển khoản: dùng ảnh QR mẫu trong Figma.
- Công tắc lỗi demo để trình diễn các ngoại lệ: máy in (UC6.2 5a), lỗi lưu (UC4.1 8a, UC4.2 8a, UC6.1 10a, UC6.3 7a, UC6.5 10a), lỗi tải dữ liệu (UC3, UC4, UC6.4). Công tắc chỉ áp dụng cho phiên của người đang thao tác (cookie hoặc tham số URL), không đổi toàn hệ thống; khi tắt thì không ảnh hưởng nghiệp vụ.


## Điểm đặc tả chưa quy định

1. Không có tài liệu “đặc tả giao diện UC6” riêng trong các tệp đã nhận. Đã dùng đặc tả nghiệp vụ Word và các frame Figma đọc được. Đã đọc bảng Word bằng XML, giữ thứ tự đoạn/bảng; bản trích xuất nằm tại `docs/dac-ta-nghiep-vu-trich-xuat.txt`. File “Thiết kế CSDL.docx” được tham khảo cấu trúc; khi khác nghiệp vụ, áp dụng nghiệp vụ.
2. Các trang Figma UC4 `231:2`, UC5 `1:5`, UC6 `336:2` đọc được qua frame con. Node chú thích UC6 `367:2` báo không tồn tại. Truy vấn trực tiếp cấp trang không trả design context; đã truy vấn từng frame con. Không lấy các lớp số chú thích vào giao diện. Biểu tượng và QR là tài sản nguyên bản xuất từ Figma; không dùng ảnh chụp toàn màn hình làm giao diện.
3. UC4.1 “7c.1” là lỗi đánh số thuộc nhánh hạn sử dụng 5c. UC6.5 bước 5 “nhập lại kh” được hiểu là “nhập lại kho”, mặc định bật. BR-UC2-05/06 bị dẫn mã không nhất quán; áp dụng nội dung điều kiện xóa và tìm kiếm rõ ràng trong từng đoạn.
4. UC5.3 mô tả nút “Quay lại” ở luồng chính và “Hủy” ở luồng thay thế. Hộp thoại có “Đồng ý”, “Quay lại”, “Hủy”; hai nút sau đều đóng, giữ dữ liệu.
5. Tên khách hàng hợp lệ gồm chữ Unicode/dấu, khoảng trắng, dấu chấm, dấu nháy đơn, gạch nối; phải có ít nhất một chữ. Số điện thoại giữ nguyên đầu vào để phát hiện cả khoảng trắng. Số lượng nhập/bán/đổi dùng số nguyên theo mô hình CSDL và đơn vị hàng đóng gói; tỷ lệ quy đổi nguyên dương. Mức tồn tối thiểu nguyên không âm. Tên đơn vị trong cùng sản phẩm không trùng.
6. Đơn vị cơ sở có hệ số 1, luôn được tạo cùng sản phẩm. Các đơn vị bán bổ sung tạo khi thêm sản phẩm. Hệ số quy đổi đã dùng được giữ để không thay đổi lượng lịch sử; Đơn vị tính vẫn sửa được theo UC1.2, tên đơn vị trên phiếu cũ giữ bằng snapshot. Chỉnh giá bằng UC1.5. Tên sản phẩm, danh mục, mã vạch, mô tả, cờ hạn và mức cảnh báo vẫn sửa được theo form.
7. Không tự bổ sung thời hạn đổi/trả. Chỉ trả các dòng mua từ hóa đơn gốc; hàng đổi được ghi trên phiếu đổi/trả, không tạo hóa đơn mới để trả vòng lặp. Không có chiết khấu, VAT hay điểm thành viên vì đặc tả không quy định.
8. Hủy được ghi bằng sự kiện âm doanh thu/giá vốn ở ngày hủy. Doanh thu kỳ bán trước đó không bị sửa ngược. Cùng kỳ bán và hủy thì tổng ròng bằng 0. Số hóa đơn báo cáo cũng cộng ở ngày bán, trừ ở ngày hủy. Giá trị tồn dùng giá nhập bình quân hiện tại vì không có quy định lưu chuỗi bình quân theo kỳ.
9. Trình duyệt không trả kết quả in vật lý. Demo coi việc gửi và hoàn tất hộp thoại in là kết quả gửi in thành công; không xác minh giấy thực tế đã in. Công tắc demo cho nhánh lỗi máy in hoạt động trước khi gọi `window.print()`.
10. Khôi phục dữ liệu mẫu thay toàn bộ dữ liệu nghiệp vụ trong một transaction và tạo lại mã mẫu; đây là thao tác khởi tạo lại bộ demo. Các thao tác thông thường không tái sử dụng mã đã xóa. Nút khôi phục có xác nhận rõ việc thay thế dữ liệu; phiên đăng nhập được giữ. Có khóa chung để khôi phục không chạy chen vào transaction ghi nghiệp vụ.
11. Các danh sách không yêu cầu phân trang trong đặc tả nên hiển thị toàn bộ dữ liệu demo; tìm kiếm kết hợp các điều kiện bằng AND, từ khóa khớp một phần, không phân biệt hoa thường. Ngày nhập là ngày hiện tại ở Việt Nam, không cho đổi tùy ý trên form. Ngày lọc chấp nhận dd/mm/yyyy; lỗi ngày không hợp lệ dùng thông báo của UC tương ứng.
12. Vị trí nguồn xuất và lịch sử đổi/trả có thể mở trong chi tiết hóa đơn để đối chiếu khi trình diễn. Đây là dữ liệu đã lưu phục vụ kiểm tra, không tạo thêm nghiệp vụ.

13. Chuyển khoản chưa đánh dấu đã nhận tiền dùng thông báo bổ sung “Vui lòng xác nhận đã nhận đủ tiền”; đăng nhập sai dùng “Tên đăng nhập hoặc mật khẩu không đúng”, phiên hết hạn dùng “Vui lòng đăng nhập”. Nút khôi phục dùng xác nhận nêu rõ thay thế toàn bộ dữ liệu demo và thông báo “Khôi phục dữ liệu mẫu thành công”. Những câu này thuộc phần nền tảng/mô phỏng mà đặc tả chưa chốt câu chữ.

## Kịch bản demo ngắn

Bắt đầu bằng **Cài đặt demo → Khôi phục dữ liệu mẫu**.

1. **Nhập hàng**: NCC001 – Đại lý sữa Thuận Phát, Sữa Milo, Hộp, 2 hộp giá 13.000, hạn cách hôm nay 120 ngày; thêm tiếp 3 hộp giá 13.000, hạn cách 150 ngày. Lưu PN0004, tổng **65.000đ**. Lịch sử nhập có hai dòng nguồn riêng.
2. **Bán hàng**: Sữa Milo, **Lốc**, số lượng **2** (8 hộp), tổng **144.000đ**. Nhập tiền 100000 để thấy “Tiền khách đưa chưa đủ để thanh toán”, sửa 200000, bấm hoàn tất hai lần. Chỉ có **HD0004**, tiền thừa 56.000đ. Xuất 5 hộp nguồn gần hạn và 3 hộp nguồn hạn xa, bỏ nguồn đã hết hạn.
3. Xem HD0004, chọn **Hủy**, nhập lý do, **Xác nhận**. Từng nguồn được hoàn chính xác 5 và 3 hộp. Hóa đơn đổi “Đã hủy”.
4. Bán tiếp **6 Hộp Sữa Milo**, gắn số 0901234567 – Nguyễn Bảo Khanh, thanh toán 108.000đ để tạo **HD0005**. Đổi/trả **2 hộp**, **Chỉ trả hàng**, **Không nhập lại kho**, xác nhận **Đã hoàn tiền**. Hoàn **36.000đ**, tồn không tăng, còn được trả **4 hộp**, không hủy trực tiếp hóa đơn được.
5. Báo cáo kinh doanh **Loại báo cáo: Doanh thu → Hôm nay → Xem báo cáo**: doanh thu ròng từ các giao dịch trên là **72.000đ**. Xuất Excel và PDF; tổng khớp màn hình. Báo cáo xuất–nhập–tồn ghi hàng trả không nhập kho với lượng nhập bằng 0 cho lần trả đó.
6. Hai cửa sổ ẩn danh đăng nhập độc lập, cùng thêm **Muối I-ốt, Gói, 3** vào giỏ trước khi thanh toán. Thanh toán đồng thời: một thành công, một báo không đủ nguồn; tồn không âm. Hủy hóa đơn thử để hoàn kho.
7. **Quản lý khách hàng → KH0002**: “Chưa có lịch sử mua hàng”. Tra cứu tồn **Đã hết hạn** thấy nguồn PN0003; **Dưới mức cảnh báo tồn kho** thấy Muối I-ốt. Có thể thử máy in/lỗi tải/lưu bằng công tắc riêng phiên.

## Kiểm tra tự động

Các kiểm tra ghi dữ liệu chỉ dùng với CSDL demo riêng. Không tự seed trong build/deploy.

```bash
npm run typecheck
npm run build
npm test
npm run db:seed
npm run start
# Mở terminal khác trong cùng thư mục:
npm run test:ui
```

Nếu máy chưa có Chromium: `npx playwright install chromium`. Có thể đặt `CHROMIUM_PATH` để dùng Chrome/Chromium đã cài. Bộ UI dùng `BASE_URL` (mặc định localhost:3000); đặt bằng URL production để kiểm tra bản đã triển khai. Phải trỏ `.env` tới đúng CSDL của bản đang kiểm tra. Kịch bản UI bắt đầu từ bộ mẫu sạch và chạy lần lượt với một worker. `test-results` và báo cáo HTML là kết quả chạy, không phải dữ liệu nghiệp vụ.

Xem `BAO-CAO-KIEM-THU.md` để biết phần đã chạy thật và phần chưa xác minh.

### Cập nhật VietQR theo yêu cầu mới

Thay ảnh QR mẫu bằng VietQR theo số tiền giỏ hàng (yêu cầu mới ưu tiên hơn quyết định QR mẫu ban đầu). Trên Vercel → Settings → Environment Variables, thêm `VIETQR_BANK_BIN` (BIN ngân hàng 6 chữ số), `VIETQR_ACCOUNT_NUMBER` (số tài khoản nhận), `VIETQR_ACCOUNT_NAME` (tên chủ tài khoản không dấu), áp dụng Production rồi Redeploy. Không có cấu hình thì hiển thị hướng dẫn, không dùng tài khoản giả.

API đã đăng nhập tính lại giá và tổng từ sản phẩm trên server; tổng không khớp giỏ thì không hiển thị QR. Đổi giỏ hoặc phương thức sẽ bỏ xác nhận đã nhận tiền. QR có số tiền VND nguyên, tài khoản nhận và nội dung tham chiếu giỏ; mã tham chiếu chưa phải mã hóa đơn. Ảnh do `img.vietqr.io` cung cấp: trình duyệt gửi ngân hàng, số tài khoản, tên chủ tài khoản, số tiền và nội dung chuyển khoản đến dịch vụ này. Mất mạng/dịch vụ lỗi có nút Thử lại.

Ứng dụng không nhận webhook ngân hàng, không tự xác nhận tiền về. Nhân viên kiểm tra số tiền thực nhận trước khi đánh dấu “Đã nhận đủ tiền chuyển khoản”. Cần quét bằng ứng dụng ngân hàng để kiểm tra người nhận và số tiền thực tế trước buổi demo.

## Đợt rà soát chữ và giao diện ngày 11/11/2026

Nguồn chữ: `docs/nguon-chu-word.json`, `docs/nguon-chu-figma.json`; danh mục 199 frame: `docs/figma-frames.json`. Chạy `python scripts/extract-word-copy.py` để trích lại Word đã lưu nguyên văn và `npx tsx scripts/audit-copy.ts` để quét chữ mã nguồn/lập bảng đối chiếu. Không coi bảng các câu chưa có nguồn là đã hoàn tất rà soát.

`tests/chu.spec.ts` kiểm tra 4 trạng thái đăng nhập, lỗi trường bắt buộc UC1 và nhãn tra cứu hóa đơn/thêm nhanh khách hàng UC6. Ảnh nguồn Figma UC7 lưu 1440×900 trong `tests/figma-baseline`. Pixelmatch bỏ qua vùng giá trị mật khẩu động, ngưỡng hồi quy 0,2% toàn ảnh; sai lệch còn lại ghi trong `docs/ui-parity.md`, không tuyên bố giống tuyệt đối từng pixel. Các frame chưa đối chiếu được ghi riêng.

### Quyết định bổ sung của nhóm — đợt rà soát

- UC7 lấy nguyên văn chữ và màu/kích thước từ 4 frame Figma. Lỗi xác thực hệ thống mô phỏng bằng `?demo=authError`, chỉ tác động một lần trong tab trình duyệt; không ảnh hưởng tab/người dùng khác.
- Tài khoản kiểm thử và ID dự án CSDL không được ghi trong tài liệu công khai. Tệp tài khoản bàn giao riêng ngoài repository. Các test lấy `DEMO_USERNAME`/`DEMO_PASSWORD` từ môi trường.
- Mã KH0001, HD0001 giữ nhất quán; Figma UC5 có KH001/HD001 được coi là dữ liệu minh họa.
- VietQR động theo yêu cầu trước tiếp tục dùng cấu hình tài khoản nhận, không quay về ảnh mẫu nhận tiền sai số tiền.

### Điểm đặc tả chưa quy định — đợt rà soát

- Nhãn lỗi API hết phiên vẫn được ghi trong bảng chữ bổ sung; chưa có tuyên bố đã rà soát xong tất cả câu ngoài nguồn.
- Bản công khai được người dùng cung cấp: https://quynh-nhu-demo.vercel.app/; các đợt kiểm tra sau không reset CSDL đang dùng.

### Kiểm tra bản công khai

`tests/public.spec.ts` mặc định bỏ qua, chỉ chạy khi đặt `PUBLIC_QA=1`, `BASE_URL` và tài khoản kiểm thử từ môi trường riêng. Test ghi dữ liệu demo, không reset hoặc xóa dữ liệu đã có. Chạy với Node 24; trong Cloud đặt thêm `NODE_USE_ENV_PROXY=1` để giữ proxy và CA. Chromium của môi trường chưa tin CA proxy, nên `tests/public-transport.ts` chuyển tiếp phản hồi thật bằng Node fetch có xác minh TLS; không dùng dữ liệu giả hoặc tắt xác minh chứng chỉ.

```bash
BASE_URL=https://quynh-nhu-demo.vercel.app PUBLIC_QA=1 NODE_USE_ENV_PROXY=1 npx playwright test tests/public.spec.ts
```

Repository mới là nguồn bàn giao chính. Vercel hiện vẫn kết nối repository cũ `50K211.08.3007`, Root Directory `demo-quynh-nhu`; bản được kiểm thử đã được đồng bộ vào đó để cập nhật website mà không yêu cầu đổi kết nối tài khoản. Nếu chuyển kết nối Vercel sang repository mới thì Root Directory dùng `.`.

### Migration Neon và lỗi P1002

`npm run db:init` và build Vercel chạy `scripts/migrate.mjs`: chỉ tiến trình Prisma Migrate dùng kết nối trực tiếp. Với host Neon, tự bỏ hậu tố `-pooler` của endpoint; tài khoản/mật khẩu, tên database và sslmode được giữ. Có thể cấu hình `DIRECT_URL` riêng nếu cần; không bắt buộc thêm biến khi dùng host Neon chuẩn. Runtime website giữ nguyên `DATABASE_URL` pooled.

Không tắt advisory lock, không seed khi deploy và không reset CSDL. Hai test trong `tests/migrate.test.ts` kiểm tra đổi endpoint, bảo toàn tham số, không đổi cấu hình runtime và xử lý URL không hợp lệ. Lỗi build đã gặp: Prisma P1002 chờ khóa 72707369 qua pooler. Tham khảo [Neon connection pooling](https://neon.com/docs/connect/connection-pooling).

### Đối chiếu hộp thoại khách hàng — 13/11/2026

Theo yêu cầu mới ưu tiên hiển thị đúng Figma, hộp hủy sửa dùng câu “Bạn có chắc chắn muốn hủy thao tác không?” và tiêu đề “Xác nhận hủy thao tác” (frame 90:1262). Word UC5.2 trước đó ghi “Bạn có chắc chắn muốn hủy sửa khách hàng không?”; khác biệt được ghi nhận, không sửa tài liệu Word. Hủy thêm giữ đúng câu Word/Figma và nút Xác nhận/Quay lại. Xác nhận xóa hiển thị hai nút Quay lại/Đồng ý theo frame 90:1856.

Dấu ! cảnh báo được dựng bằng chữ và vòng tròn CSS theo nguồn Figma, không dùng emoji. Check và đóng toast là SVG xuất từ Figma. Escape dùng callback mới nhất của form, chỉ lớp modal trên cùng nhận phím; tránh đóng mất form khi đang xác nhận.

### Chọn ngày Báo cáo kinh doanh

Bấm ô Từ ngày/Đến ngày hoặc icon lịch để mở popup theo Figma. Có thể nhập dd/mm/yyyy hoặc chọn ngày; dùng mũi tên để chuyển tháng; Escape/click ra ngoài đóng lịch. Hai đầu khoảng tô đậm, khoảng giữa tô nhạt. Ngày được gửi dạng ISO cùng hàm tính báo cáo cũ; khoảng sai vẫn báo lỗi khi Xem báo cáo, không tự đảo ngày. Nhãn aria “Mở lịch từ ngày/đến ngày”, “Tháng trước/sau” bổ sung để sử dụng được bằng bàn phím và trình đọc màn hình, không thay chữ hiển thị của Figma.


### Quyết định bổ sung của nhóm — giao diện UC3 (13/11/2026)

- Đọc đầy đủ context và ảnh của 51 frame trên trang Figma `1:2`. Nút Xuất báo cáo ở cạnh tiêu đề, bộ lọc gồm loại báo cáo, hai lịch và một menu sản phẩm/nhóm sản phẩm; có “Lọc nhanh:” và năm chip bo tròn. Xếp hạng dùng radio và hai bảng đặt cạnh nhau. Doanh thu dùng hai thẻ tổng, biểu đồ đường và bảng cạnh nhau; lợi nhuận dùng ba thẻ tổng và biểu đồ cột doanh thu/giá vốn; tồn kho dùng năm thẻ tổng và bảng tám cột.
- Menu checkbox theo Figma cho phép chọn nhiều sản phẩm/nhóm. Các lựa chọn kết hợp theo hợp; một sản phẩm chỉ tính một lần dù chọn cả nó và nhóm chứa nó. “Tất cả”/“Bỏ chọn tất cả” bỏ giới hạn; “Áp dụng” mới áp dụng lựa chọn. Ô tìm kiếm menu chỉ lọc danh sách lựa chọn, không tự chạy báo cáo. API vẫn tiếp nhận bộ lọc đơn cũ.
- Mở màn hình ở trạng thái chưa chọn, không tự tải báo cáo. Đổi tiêu chí bỏ kết quả cũ; chỉ nhấn “Xem báo cáo” mới tính và lưu snapshot. Xuất Excel/PDF dùng chính snapshot đã hiển thị, cùng cột và dòng tổng. Số liệu và tên sản phẩm lấy từ CSDL thật, không thay bằng số minh họa Figma.
- Bảng bán chậm luôn xếp số lượng bán thuần tăng dần và chỉ lấy hàng còn tồn (BR-UC3-10), kể cả khi bảng bán chạy đổi sang doanh thu thuần (BR-UC3-09). Bản cũ dùng chung khóa xếp hạng cho hai bảng đã được sửa.
- Icon lấy SVG từ đúng node Figma; file lưu cục bộ trong `public/figma`. Biểu đồ được vẽ từ dữ liệu thật. Các label aria mô tả lịch/menu là hỗ trợ truy cập, không thay chữ hiển thị.

### Điểm đặc tả chưa quy định — giao diện UC3

- Frame 304:10082 chứa hai lớp xác nhận và một ảnh chụp lồng nhau. Chỉ dựng lớp xác nhận trên cùng (vòng xanh, tiêu đề “Xác nhận”, nút Quay lại/Xác nhận), giữ nguyên thông báo Word “Bạn có chắc chắn muốn hủy thao tác không?”. Không nhúng ảnh giao diện làm chức năng.
- Các frame xuất cũ của UC3.1/3.2 và nhóm UC3.3 có cách trình bày khác nhau. Theo ảnh bên trái người dùng chốt ở lượt sửa sau: hộp xuất gọn, Excel mặc định, câu hướng dẫn “Chọn định dạng tệp. Nội dung xuất gồm loại báo cáo, tiêu chí lọc và số liệu đang hiển thị.”; không có khối Nội dung sẽ xuất hoặc nhãn Định dạng được hỗ trợ; xử lý, thành công, lỗi đọc dữ liệu, lỗi tạo tệp và hủy là các trạng thái thực.
- Khóa nút trong lúc gửi yêu cầu để tránh lặp. Trong lúc tạo tệp chưa cho hủy yêu cầu đang xử lý; không đổi snapshot. Hộp thành công có thể đóng bằng Escape hoặc bấm vùng ngoài; thẻ tệp cho tải lại đúng tệp đã tạo. Tên tệp, dung lượng và khoảng ngày dùng giá trị thật.
- Trên màn hình dưới 1100 px, các bảng chuyển thành một cột; desktop từ 1100 px giữ bố cục cạnh nhau. Các danh sách dài cuộn trong menu, không tràn khung nhìn.

Kiểm tra riêng UC3 (chỉ tạo snapshot báo cáo và công tắc lỗi theo phiên, không ghi phiếu nhập/bán/đổi trả):

```bash
# Đặt BASE_URL và DEMO_USERNAME/DEMO_PASSWORD trong môi trường riêng
npx playwright test tests/uc3.spec.ts
# Bản công khai cần thêm PUBLIC_QA=1; Cloud thêm NODE_USE_ENV_PROXY=1
```

Ảnh chuẩn, ảnh chạy thật và phạm vi đối chiếu: `docs/uc3-figma.md`. Không coi kết quả này là chứng nhận trùng 100% pixel ở mọi trình duyệt.
