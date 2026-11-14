## UC6.1: placeholder và bố cục theo Figma 336:329

- Bản c8c8315 đã triển khai thành công trên repository mới. Test UI trực tiếp Vercel đạt 1/1 (5,8 giây): placeholder có màu đúng, nhập/chọn hàng hoạt động, thêm/xóa dòng giỏ, icon và toast đúng vị trí/kích thước, nút đóng hoạt động. Không thực hiện checkout. Ảnh `docs/evidence/uc6-sale/public-not-found.png`.

- Đã đọc context đầy đủ và ảnh frame Không tìm thấy sản phẩm từ page 336:2. Dùng lại các icon header/menu đã có; xuất đúng SVG cảnh báo 18×18 (336:488) và chevron 16×16 (336:418).
- Sửa tên sản phẩm từ giá trị readOnly giả thành placeholder thật, nhập tên/mã để chọn; placeholder cùng màu #94a3b8 với Nhập số lượng. Khi sửa từ khóa, bỏ product/unit cũ; giá và tồn trống cho tới khi chọn sản phẩm. Ghi nhận đúng dữ liệu chọn khi quote, không dùng tên gõ tay thay product ID.
- `npm run build` đạt. Test `tests/sale-ui.spec.ts` trên production build local đạt: gõ tên, chọn SP0001, điền lượng, thêm/xóa dòng giỏ, Enter từ khóa không tồn tại, thông báo đúng nội dung/đóng được và icon tải được. Không thanh toán/tạo hóa đơn, không reset/seed CSDL.
- Ở 1440×927: thông tin sản phẩm (274,252), 798×224; giỏ (274,495), 798×386; thanh toán (1096,118), 320×760; thông báo (1097,106), 320×56. Đã đo từ DOM thật theo frame. Native select và raster chữ có thể khác giữa trình duyệt, không chứng nhận 100% pixel mọi trạng thái UC6.
- User đã chuyển Vercel sang repository demo-50K211.08.3007 (commit thử 3c7efe0 được Vercel báo success). Đợt sửa này chỉ đẩy repository mới, giữ commit README của người dùng; không sửa repository cũ.

## Đính chính: khôi phục hộp xuất có Nội dung sẽ xuất

- Đã lên Vercel thành công ở commit `7f0c696`. Kiểm tra public đạt 1/1 trong 12,5 giây; xuất Excel/PDF và dòng tổng đạt. Kiểm tra riêng Báo cáo doanh thu kỳ 07/11/2026–13/11/2026: khối Nội dung sẽ xuất, loại báo cáo và tiêu chí đúng snapshot; nhãn Định dạng được hỗ trợ hiển thị, chọn PDF được. Ảnh `export-preview-restored-public.png`.

- Yêu cầu cuối của người dùng là trở lại giao diện có khối Nội dung sẽ xuất, loại báo cáo/tiêu chí lọc và nhãn Định dạng được hỗ trợ. Bản gọn trước đó do hiểu ngược yêu cầu đã được thay thế. Giữ đúng câu hướng dẫn trong ảnh, hai lựa chọn Excel/PDF và các nút Hủy/Xuất báo cáo.
- Mở hộp hiển thị ngay loại báo cáo và tiêu chí từ snapshot đang xem; đổi định dạng giữ nội dung này. Không đổi hàm tính, số liệu hay API xuất.
- `npm run build`: đạt. `BASE_URL=http://localhost:3024 npx playwright test tests/uc3.spec.ts --grep 'bộ lọc'`: 1/1 đạt trong 6,4 giây; kiểm tra đầy đủ phần khôi phục, tải hai định dạng, hủy/quay lại và tổng Excel khớp snapshot.
- Ảnh hiện tại: `docs/evidence/uc3/export-preview-restored-local.png`. Các ghi nhận bản gọn phía dưới là lịch sử đã được thay thế.

## Sửa hộp Xuất báo cáo theo ảnh bên trái người dùng

- Bản `a3de1a2` đã triển khai Vercel thành công. Kiểm tra trực tiếp website bằng cùng test: 1/1 đạt trong 13,2 giây; không còn hai phần thừa, đúng hướng dẫn, Excel mặc định, xuất Excel/PDF thành công và tổng Excel khớp màn hình. Ảnh `export-compact-public.png`, `export-compact-pdf-public.png`.

- Bỏ khối Nội dung sẽ xuất, tiêu chí lọc trong hộp và nhãn Định dạng được hỗ trợ. Hiển thị đúng câu hướng dẫn của ảnh; Excel chọn mặc định, nút xuất dùng được ngay. Hộp rộng 440px; giữ hai định dạng và hai nút Hủy/Xuất báo cáo.
- `npm run build` đạt; `BASE_URL=http://localhost:3023 npx playwright test tests/uc3.spec.ts --grep 'bộ lọc'` đạt 1/1 (6,6 giây), gồm kiểm tra không còn phần thừa, câu hướng dẫn, Excel mặc định, đổi PDF, hủy/quay lại và tải cả hai tệp. Dòng tổng Excel vẫn khớp snapshot. Không đổi hàm tính báo cáo/CSDL.
- Ảnh kiểm tra: `docs/evidence/uc3/export-compact-local.png` và `export-compact-pdf-local.png`.

## UC3 — xác minh bản công khai

- Bản triển khai cuối `c7eb2bc` tại repository đang nối Vercel; Vercel báo success: https://vercel.com/baokhanh224/quynh-nhu-demo/CW2GPe9DpUjcb11YLP7mnW4MFVvq . Mã nguồn bàn giao tương ứng `735ae96` (cộng bản cập nhật test/tài liệu xác minh này).
- `BASE_URL=https://quynh-nhu-demo.vercel.app PUBLIC_QA=1 NODE_USE_ENV_PROXY=1 npx playwright test tests/uc3.spec.ts`: **2/2 đạt, 27,3 giây**. Dùng trình duyệt thật và phản hồi thật qua Node có xác minh TLS. Không mock báo cáo hay số liệu.
- Đã kiểm tra các bộ lọc/lịch/5 chip, 4 kết quả, thứ tự bảng bán chậm không đổi khi đổi radio doanh thu, nhấn đôi chỉ 1 yêu cầu, lỗi khoảng, kết quả trống, lỗi tải, Excel và PDF, hủy/quay lại/xác nhận, lỗi xuất và thử lại; không có pageerror hay icon bị thiếu sau nạp xong.
- Báo cáo toàn kỳ dùng để kiểm tra: doanh thu thuần 506.000đ, giá vốn 366.191,53137340944, lợi nhuận 139.808,46862659056, 6 hóa đơn ròng. Tồn cuối 170 đơn vị; giá trị tồn gốc 1.276.500,4387889428. Màn hình và PDF hiển thị **1.276.500đ**; Excel giữ đúng giá trị số gốc và định dạng tiền nguyên VNĐ. Dòng tổng 8 ô Excel khớp snapshot; `pdftotext -layout` xác nhận tổng PDF khớp màn hình.
- Fingerprint dữ liệu nghiệp vụ trước/sau giữ nguyên: `5f8703155604af33b94e7f9fe3c5b42fa38ad80503f5e279bac3a36cae812f52` (7 sản phẩm, 11 chi tiết nhập, 9 hóa đơn). Không reset, không seed, không tạo/sửa phiếu nhập/bán/đổi trả. Không tính session/report snapshot/công tắc theo phiên vào fingerprint.
- Lần kiểm tra public đầu chụp một SVG trước khi trình duyệt giải mã xong; response là 200, file 813 byte, không phải thiếu asset. Đã sửa test chờ icon nạp xong rồi xác minh; chạy lại đạt. Đây là sửa kiểm tra, không đổi ứng dụng sau deployment nêu trên.
- Ảnh và tệp thật: `docs/evidence/uc3/uc3-public-*`, `uc3-public.xlsx`, `uc3-public.pdf`, `uc3-public-pdf.txt` và fingerprint JSON. Typecheck cuối đạt. Chưa chứng nhận trùng 100% pixel; sai lệch ảnh nguồn ghi riêng phía dưới.

# UC3 theo Figma — 13/11/2026

- Đọc đủ 51 context/ảnh từ trang UC_3 Báo cáo (1:2). Sửa vị trí Xuất báo cáo cạnh tiêu đề, nhãn Lọc nhanh:, chip bo tròn, menu lọc kết hợp, radio xếp hạng, lịch cho cả hai trang, biểu đồ/bảng/thẻ tổng đúng từng loại, các hộp xuất và trạng thái lỗi.
- `npm run build`: đạt; TypeScript kiểm tra trong production build. `BASE_URL=http://localhost:3019 npx playwright test tests/uc3.spec.ts`: 2/2 đạt, 12,6 giây. Tài khoản và DATABASE_URL lấy từ môi trường riêng; không ghi vào repository.
- Kiểm tra UI: khởi đầu trống; chọn loại; tìm/tích nhiều tiêu chí và Áp dụng; năm chip nhanh; lịch 42 ngày, đầu/cuối/khoảng; bấm đôi chỉ 1 yêu cầu; doanh thu/lợi nhuận/xếp hạng số lượng và doanh thu/tồn kho; khoảng sai, kết quả trống, lỗi tải một lần; Excel/PDF; hủy/quay lại/xác nhận; lỗi đọc xuất, lỗi tạo tệp và thử lại; tải lại không đổi tồn.
- Sửa lỗi đã phát hiện: bảng bán chậm từng dùng nhầm tiêu chí doanh thu khi đổi radio; nay luôn theo lượng tăng dần (BR-UC3-10). Reset padding checkbox/radio để đủ 16×16; dùng đúng SVG Figma. Bộ test ban đầu chờ nhầm `/api/settings`, đã sửa thành `/api/action` theo route thật và chạy lại đạt.
- Kiểm tra bổ sung: tiền trong Excel/PDF dùng định dạng VNĐ không phần thập phân như màn hình; ô Excel vẫn giữ giá trị số gốc của snapshot. `pdftotext -layout` xác nhận dòng Tổng PDF local là 1.439.745đ, khớp hiển thị. Test xuất đã chạy lại đạt sau thay đổi định dạng.
- Tổng Excel xuất tồn kho local khớp đủ 8 ô của snapshot màn hình; PDF thực có header `%PDF`. Không seed/reset, không tạo nhập/bán/đổi trả trong đợt UC3. Không đổi schema/CSDL.
- So toàn màn hình 304:2349 ở 1440×900, threshold 0,1: 4.775/1.296.000 pixel khác (0,3684%). Không có vùng bị bỏ qua. Còn sai raster chữ/nét/viền; chưa chứng nhận trùng 100% cả 51 frame, chưa so pixel toàn ảnh các kết quả dùng dữ liệu động.
- Chi tiết nguồn, trạng thái và quyết định khi frame mâu thuẫn ở `docs/uc3-figma.md`, README và `docs/ui-parity.json`. Ảnh nguồn và ảnh UI được bàn giao kèm mã nguồn.

## Cập nhật nguyên nhân build và redeploy

- Người dùng cung cấp build log: Prisma P1002 hết 10 giây chờ `pg_advisory_lock(72707369)` trên kết nối pooled. Read-only inspect locks sau đó không còn phiên giữ khóa; không ngắt phiên hoặc thay đổi dữ liệu.
- Lần deploy tiếp theo `69a26a9` thành công; giao diện mới và khóa nút nhập đã lên website. Dữ liệu nghiệp vụ trước/sau redeploy có SHA-256 giống nhau: `001a02966b9b1d49c6542cb4b05e0a737a7194d5ed7fcd353f99102f6172827f`. Snapshot gồm stock/average_cost sản phẩm, tồn từng nguồn và id/tổng/trạng thái hóa đơn, không tính phiên đăng nhập/report snapshot.
- Đã sửa nguồn build để migration dùng direct endpoint Neon, runtime giữ pooled; không tắt khóa migration. Typecheck, build, db:init local và 2 test migration đạt. Bản đổi kết nối đã triển khai thành công: commit `dfdb768` tại repository đang kết nối Vercel, deployment `3SxDgsf6KhPHRRSw6L9k5PhTfuFz`. Đăng nhập và dữ liệu nghiệp vụ đã kiểm tra lại sau deploy; fingerprint giữ nguyên.
- Bốn trạng thái UC7 đã kiểm tra lại trên Vercel công khai, chữ và ngưỡng ảnh đều đạt test; vẫn còn sai lệch raster 0,13–0,18%.

# Kiểm tra Vercel thực tế ngày 11/11/2026

Website: https://quynh-nhu-demo.vercel.app/ . Đã mở bằng phiên trình duyệt mới, đăng nhập, kiểm tra điều hướng và tải lại giữ màn hình.

- Commit giao diện `a94beb5` ở repository triển khai đã được Vercel báo success và xác minh bằng UI công khai: đăng nhập mới, hai ô mã hóa đơn/điện thoại, nút Xem. Bản bàn giao tương ứng ở repository mới.
- Năm kịch bản công khai đạt: PN0005 hai dòng Milo 5/5 hộp hạn khác nhau; HD0006 bán 8 đơn vị lấy 5+3 từ hai nguồn, thiếu tiền rồi sửa, lỗi lưu một lần rollback, bấm đôi chỉ một hóa đơn; hủy HD0006 hoàn đúng nguồn; HD0007 bán 6, trả 2 không nhập kho/hoàn 36.000đ, tồn không tăng, còn trả 4 và cấm hủy trực tiếp; báo cáo/Excel/PDF và tải lại.
- Báo cáo hôm nay: màn hình và Excel tổng 108.000đ; PDF đã trích bằng pdftotext, dòng Tổng 108.000. Trong đó có dữ liệu demo người dùng trước kiểm tra, không reset để ép số liệu.
- Hai trình duyệt đồng thời bán hết Muối I-ốt: chỉ một thành công, bên kia thiếu nguồn, tồn không âm; HD0008 đã hủy để hoàn hàng sau kiểm tra.
- Dữ liệu test được giữ để xem lại. Lần đầu lưu PN0004 chỉ có một dòng do test bấm lưu khi kiểm tra dòng thứ hai chưa trả về; không xóa PN0004. Đã sửa khóa Thêm sản phẩm/Lưu phiếu nhập trong lúc đang thêm dòng, typecheck/build local đạt. Lần triển khai commit `a759e17` chứa sửa này thất bại; sau đó deploy `69a26a9` thành công, đã chạy bản sửa này; xem cập nhật đầu báo cáo.
- Đã lấy snapshot dữ liệu nghiệp vụ trước redeploy để đối chiếu; đã đối chiếu thành công sau deploy `69a26a9`, xem fingerprint đầu báo cáo.
- Các test public chạy Chromium với phản hồi thật từ server, chuyển tiếp qua Node fetch do CA proxy Cloud không nằm trong store của Chromium; xác minh TLS vẫn bật.
- Kết quả: tests/public.spec.ts phần nhập/bán/hủy/trả + báo cáo 2/2 đạt; test đồng thời chạy riêng 1/1 đạt; báo cáo chạy lại 1/1 đạt. Không coi các lần chạy riêng là toàn bộ UI/Figma đã hoàn tất.

Chứng cứ tại docs/evidence/public; không đưa .env hoặc trace có cookie vào GitHub.

---

# Báo cáo đợt rà soát ngày 11/11/2026

Trạng thái: đã triển khai bản sửa giao diện và kiểm tra nghiệp vụ trên website công khai; CHƯA hoàn tất parity toàn bộ Figma. Xem tình trạng bản sửa nhập hàng bên dưới.

## Đã sửa

- Khôi phục đầy đủ mã ứng dụng tại thư mục gốc repository công khai `baokhanh224/demo-50K211.08.3007`, nhánh main; không có thư mục demo-quynh-nhu lồng bên trong.
- Trích 394 mục chữ Word (gồm bảng), hơn 12.000 lượt chữ Figma từ 199 frame trên 7 trang; quét chuỗi bằng AST trong JSX/API/PDF/Excel, lập bảng nguồn và danh mục frame. Trang UC1 thực có 27 frame, UC3 có 51 frame, nhiều hơn số dự kiến trong yêu cầu mỗi trang một frame.
- UC7: đúng bốn thông báo/trạng thái, khung 500×478, vị trí trường, vùng lỗi cố định, font Inter; đã so ảnh Figma 1440×900. Sai lệch pixel thực tế 0,13–0,18%, chưa gọi là khớp tuyệt đối.
- UC6: tách ô mã hóa đơn/điện thoại, nút Xem, bảng chi tiết 4 cột, tên sản phẩm kèm đơn vị; thêm nhanh khách bằng form UC5 và gắn vào giỏ; chỉnh chữ/menu và giữ route khi tải lại.
- Không hiển thị mật khẩu demo; README/báo cáo không chứa tài khoản hoặc ID dự án Neon. Tài khoản nằm trong tệp riêng ngoài kho. Seed giữ nguyên tài khoản trên CSDL đã có.

## Lệnh và kiểm tra đã chạy

- `npm run typecheck`, `npm run build`: đạt. Clone sạch commit `25d3083` từ repository công khai sang thư mục riêng, không sao chép `.env`/node_modules; chạy `npm ci --cache /workspace/work/npm-cache && npm run build`: đạt.
- `npm test`: 3 kiểm tra PostgreSQL đạt trên CSDL local riêng, gồm transaction rollback, chống trùng/đồng thời và dữ liệu lịch sử.
- `npx tsx --test tests/payment-qr.test.ts`: 2 kiểm tra đạt.
- `npm run test:ui`: 8/8 đạt trên production build local cổng 3002 với PostgreSQL local riêng. Bao gồm 3 test trong `tests/chu.spec.ts`; 4 trạng thái đăng nhập được so pixel, lỗi bắt buộc UC1 đúng Word, thêm nhanh khách, nhãn UC6, tải lại giữ màn hình; nhập hai hạn, bán thiếu tiền rồi sửa, chống bấm đôi, hủy hoàn nguồn, trả không nhập kho, báo cáo và Excel/PDF, master data, hai trình duyệt bán gần hết.
- Hai lỗi test tên menu cũ và dữ liệu báo cáo phụ thuộc kịch bản bán đã được sửa; lần chạy cuối toàn bộ 8 test đạt.
- Ảnh chuẩn tại `tests/figma-baseline`; ảnh thực/diff UC7 và số đo tại `docs/evidence/uc7`. Không đưa trace có cookie phiên lên GitHub.

## Chưa hoàn tất/chưa xác minh

- Chưa đối chiếu đủ 195 frame còn lại. UC6 đã sửa một phần, chưa chốt 40 trạng thái; UC4/5/1/2/3 chưa chỉnh toàn bộ bố cục.
- Bảng chữ còn các câu chưa có nguồn hoặc chưa xác nhận đúng UC, được ghi rõ trong docs/kiem-tra-chu.md. Test chữ chưa bao phủ mọi nhãn và mọi ngoại lệ.
- Chưa khôi phục trường hạn mặc định sản phẩm/tự điền phiếu nhập; chưa đổi toàn bộ dữ liệu mẫu và bố cục báo cáo theo Figma mới.
- URL đã được cung cấp và đã kiểm tra công khai như mục đầu báo cáo; đã xác minh fingerprint bảo toàn qua redeploy như phần đầu báo cáo. Không có quyền đọc build logs Vercel qua kết nối hiện tại.
- Máy in vật lý, quét bằng app ngân hàng chưa kiểm chứng.

## Kết quả lịch sử trước đợt rà soát

Các nội dung dưới đây là kiểm tra cũ, không thay thế kết quả đợt mới hoặc chứng minh parity Figma.

# Báo cáo bàn giao — 10/11/2026

Đã chuyển theo yêu cầu mới: Next.js + TypeScript + PostgreSQL/Prisma, đủ các màn hình cho UC1.1–UC6.5, dữ liệu lưu trên Neon. Mã nguồn có migration, seed, nút khôi phục mẫu, cấu hình Vercel, xuất Excel/PDF, tài liệu và kịch bản demo.




## Các lệnh và kiểm tra đã chạy

- `npm install`, `npx prisma generate`, `npx prisma migrate deploy` trên PostgreSQL kiểm thử.
- Hai migration được áp dụng lên CSDL Neon mới qua kết nối Neon; ghi đúng metadata migration/checksum. Mạng Cloud không mở được PostgreSQL 5432; runtime Prisma Neon adapter qua WebSocket kết nối thành công. `npm run db:seed` thực tế đã chạy thành công trên Neon qua Prisma.
- `npm run typecheck` và `npm run build`: đạt.
- `npm test`: 3 kiểm tra PostgreSQL đạt, gồm rollback đủ bảng cho nhập/bán/hủy/đổi trả/điều chỉnh, gửi trùng, cạnh tranh tồn, cô lập lỗi theo phiên và đối chiếu sổ biến động; có kiểm tra thứ tự xác thực khoảng ngày trước lỗi tải.
- `npm run test:ui`: chạy Chromium 1440×1000 trên bản production, CSDL thực là Neon. Kết quả từng luồng bên dưới; không gọi đây là kiểm tra bản Vercel khi chưa deploy.
- Đối chiếu tĩnh 65 chuỗi thông báo lấy từ Word: tìm thấy nguyên văn trong mã giao diện/nghiệp vụ.
- Đã kiểm tra tài sản Figma: 13 biểu tượng SVG và ảnh QR PNG nguyên bản, đủ 14 tệp không rỗng. Đã xem ảnh giao diện thực và chỉnh bảng đổi/trả để không cắt mất lựa chọn nhập kho trên desktop.

## Kết quả qua giao diện

| Luồng | Kết quả |
| --- | --- |
| Đăng nhập, mở bán hàng, tải lại giữ phiên, Đăng xuất | Đạt trên môi trường kiểm thử |
| Hai dòng Sữa Milo khác hạn, tra cứu PN0004 | Đạt: 2 và 3 Hộp, hai nguồn riêng, tổng 65.000đ |
| Bán 2 Lốc Milo, tiền thiếu rồi sửa; lỗi lưu; bấm hai lần | Đạt: chỉ HD0004, xuất đúng 8 hộp từ hai nguồn; lỗi lưu giữ kho và giỏ; không tạo trùng |
| Hủy HD0004 | Đạt: hoàn lại đúng 5 và 3 hộp về hai nguồn, đối chiếu toàn bộ số lượng trước/sau |
| HD0005 trả 2/6 Hộp, Không nhập lại kho | Đạt: hoàn 36.000đ, tồn không tăng, còn được trả 4; chặn hủy trực tiếp |
| Báo cáo Hôm nay, Excel và PDF | Đạt: doanh thu thuần 72.000đ; tổng Excel bằng màn hình; trích văn bản PDF thấy tổng 72.000 và đúng bộ lọc; XNT khớp số tồn |
| Hai phiên trình duyệt cùng bán Muối I-ốt gần hết | Đạt trên Neon: chỉ một thành công, phiên kia báo không đủ nguồn; tồn không âm; hủy thử hoàn lại lượng |
| Sản phẩm, khách hàng, nhà cung cấp, cảnh báo và in | Đạt: thêm/xóa sản phẩm, giá dưới vốn và lịch sử giá; khách trùng số/chưa mua; danh mục NCC khác/trùng; cảnh báo hết hạn; mô phỏng lỗi máy in |
| Tải lại trang | Đạt: số lượng lưu trên PostgreSQL/Neon giữ nguyên |
| Khởi động lại ứng dụng | Đạt: khách thêm qua GUI vẫn còn; hash toàn bộ nguồn nhập, hóa đơn và khách trước/sau giống nhau. Đã dọn khách kiểm tra |
| Khôi phục dữ liệu mẫu qua GUI | Đạt: xác nhận, khôi phục 7 sản phẩm/3 hóa đơn mẫu trên Neon, giữ phiên đăng nhập |

Bốn nhóm UI đã chạy đạt sau sửa lỗi; kết quả từng nhóm được chạy lại độc lập khi cần. Bảng đổi/trả kiểm tra lại có chiều rộng 754px và không tràn ngang; audit các ảnh tải được đúng slot giao diện. Bộ mẫu cuối xác nhận trực tiếp trên Neon: 7 sản phẩm, 3 khách hàng, 3 nhà cung cấp, 3 phiếu nhập, 3 hóa đơn (1 đã hủy), 1 NCC ngừng hợp tác, 2 migration.

Các ảnh và tệp báo cáo mẫu trong gói chứng cứ lấy từ những lượt chạy thật, không phải ảnh Figma. Script kiểm tra bắt đầu từ dữ liệu mẫu sạch, dùng hai browser context độc lập cho trường hợp cạnh tranh. Xem `tests/` để chạy lại.

## Lỗi đã sửa

- Chuyển toàn bộ lớp dữ liệu đồng bộ SQLite sang Prisma bất đồng bộ; chờ đầy đủ thao tác trước commit/rollback.
- Chống tạo trùng bằng mã yêu cầu, UNIQUE và khóa theo mã yêu cầu; khóa dòng nguồn theo thứ tự cố định để chống xuất âm khi bán đồng thời.
- Khôi phục đúng nguồn khi hủy/trả; ghi nhận lượng đã trả kể cả dòng không nhập kho.
- Tách công tắc lỗi theo token phiên. Sửa công tắc hiển thị đã bật trước lúc lưu xong khi dùng mạng Neon chậm; khóa công tắc trong lúc lưu.
- Sửa lỗi hiển thị thông báo lý do hủy lặp ở hai hộp thoại; bổ sung nhãn truy cập rõ cho trường bắt buộc. UC1.2 cho phép sửa tên đơn vị cơ sở và vẫn giữ nguyên snapshot giao dịch cũ.
- Bổ sung font tiếng Việt trong PDF và đưa font vào cấu hình đóng gói serverless; đối chiếu dữ liệu xuất từ cùng snapshot màn hình.

## Phần chưa xác minh

- Deploy thực tế lên Vercel, URL công khai không yêu cầu đăng nhập Vercel, và kiểm tra dữ liệu sau **redeploy Vercel**. Cần kết nối Vercel để thực hiện. Mã nguồn GitHub đã được bàn giao trên nhánh riêng.
- Truy cập URL production từ thiết bị/người ngoài internet. Hai browser context đã thử đăng nhập độc lập vào bản chạy trong Cloud, không thay thế kiểm tra URL công khai.
- In vật lý ra giấy. Hệ thống dùng hộp thoại in trình duyệt và công tắc mô phỏng lỗi; trình duyệt không cung cấp trạng thái máy in thật.
- Chưa kiểm tra từng luồng phụ/ngoại lệ của cả 25 UC bằng thao tác tay độc lập; các nhánh có mã triển khai, đã kiểm tra các luồng trọng yếu và đối chiếu thông báo. Không khẳng định toàn bộ nhánh đã được kiểm thử thực tế.
- Không đọc được node chú thích Figma `367:2`; UC4, UC5, UC6 qua frame con đã đọc được. Chưa nhận tệp đặc tả giao diện UC6 riêng.

CSDL SQLite của lượt thử ban đầu được giữ nguyên trong thư mục data như bản dự phòng và đã bị loại khỏi Git/gói bàn giao. Ứng dụng và cấu hình bàn giao chỉ dùng PostgreSQL.

### Bổ sung QR động

- `npm run build`, `npm run typecheck`: đạt. Hai kiểm tra trong `tests/payment-qr.test.ts`: đạt.
- Playwright `tests/qr.spec.ts` trên production build cổng 3001, dùng CSDL Neon: đạt. Thêm Milo 1 hộp, chuyển khoản: URL QR amount=18000; thêm 1 hộp: amount=36000, checkbox nhận tiền bỏ chọn; chuyển tiền mặt: ẩn QR. Không hoàn tất thanh toán, không tạo hóa đơn hoặc trừ kho.
- Ảnh QR thực từ VietQR được tải bằng curl qua CA tin cậy rồi chuyển vào trình duyệt tự động; Chromium trong Cloud chưa tin CA proxy (`ERR_CERT_AUTHORITY_INVALID`). Không tắt xác minh TLS.
- Chưa kiểm tra quét bằng ứng dụng ngân hàng và chưa xác minh trên URL Vercel sau triển khai; cần tài khoản nhận thật, ba biến cấu hình VietQR và URL website.

### Kiểm tra riêng lỗi thao tác khi mạng chậm

Trên Vercel thực, làm chậm phản hồi validate-receipt-line 1.500ms bằng transport của trình duyệt kiểm thử; nút Thêm sản phẩm và Lưu phiếu nhập đều bị khóa, sau phản hồi có đúng 1 dòng và nút lưu bật lại. Không lưu thêm phiếu trong kiểm tra này. Đã kiểm tra typecheck/build trên nguồn mới; migration helper có 2 test đạt và db:init local chạy được.

### Vị trí tìm kiếm và danh mục sản phẩm

Đã sửa theo Figma 60:2 và triển khai commit 65df1a6. Typecheck/build đạt. Kiểm tra thực qua UI cục bộ và https://quynh-nhu-demo.vercel.app/?view=products đạt: kích thước/đồng hàng các bộ lọc, thứ tự bộ lọc → nhóm thao tác → bảng; tìm theo tên kết hợp danh mục và bỏ lọc đều hoạt động; 7 tài sản Figma tải đủ. Không ghi dữ liệu nghiệp vụ trong kiểm tra này.

### Quản lý nhà cung cấp

Đã sửa vị trí bộ lọc/nhóm thao tác và thứ tự cột theo Figma 293:2818, thêm hiển thị Email đã có sẵn trong CSDL. Typecheck/build đạt. Kiểm tra bộ lọc kết hợp, bỏ lọc, hình/vị trí và đủ ảnh trên https://quynh-nhu-demo.vercel.app/?view=suppliers đạt sau deploy 9a7e9d8. Không ghi dữ liệu nghiệp vụ khi kiểm tra.

### Danh sách khách hàng — 13/11/2026

Đã sửa bố cục danh sách theo Figma 90:286/90:2240 và triển khai 475b53f. Tìm kiếm bên trái, nhóm thêm/sửa/xóa bên phải cùng hàng dưới tiêu đề; khung/bảng/khoảng cách cột và icon đã chỉnh. Typecheck/build đạt. Kiểm tra read-only trên local/Vercel đạt: hình và geometry 1440×900, tìm bằng điện thoại/bỏ lọc, chọn dòng bật nút sửa. Không tạo/sửa/xóa dữ liệu khách hàng trong đợt này.

### Xác nhận hủy khách hàng và thông báo

Đã sửa hộp hủy thêm/hủy sửa/xóa: title riêng, dấu ! đỏ và vòng tròn, nút và overlay theo Figma. Thêm/sửa form có kích thước riêng. Toast khách hàng dùng SVG Figma check/close và có nút đóng thật. Sửa lỗi hai modal cùng nhận Escape và lỗi callback cũ làm mất dữ liệu khi nhấn Escape. Local/public QA các hành vi đều đạt, typecheck/build đạt, deploy d326fea thành công. Tạo/xóa khách để kiểm tra toast chỉ thực hiện ở local; không ghi dữ liệu trên public trong đợt này. Pixel crop hủy thêm còn lệch 1,48%, không đánh dấu khớp tuyệt đối. Xem ui-parity.md và chứng cứ customer-dialogs.

### Lịch chọn ngày báo cáo kinh doanh

Đã triển khai custom calendar theo Figma 304:2866/304:2632: input170×40, popup276×312 dưới input6px, tuầnT2–CN, tô hai đầu/khoảng, chuyểntháng và chọnngày ngoài tháng. Typecheck/build và các bước QA UI local/public (range, năm mới, năm nhuận, Escape, không mở hai popup, API nhận đúng ngày, range lỗi) đạt; deploy c77ff0e success. Không sửa hàm tính báo cáo hoặc dữ liệu nghiệp vụ. Thay đổi được ghi trong nguồn component report-date.tsx, có ảnh/chứng cứ JSON.

## UC2 — giao diện nhà cung cấp, 14/11/2026

Tiếp tục bản TypeScript/Next.js tại `main`, không dùng nhánh Python. Đọc 27 frame UC2 và đối chiếu screenshot/design context. Đã sửa danh sách, trạng thái không nền và đúng màu, chọn dòng, dropdown lọc trong khung, phân trang 6 dòng, kính lúp trắng, xóa từ khóa, kết quả rỗng, drawer phải, form thêm/sửa, thông báo và xác nhận theo yêu cầu. Các câu lỗi/thành công tiếp tục lấy nguyên văn từ API/nghiệp vụ.

Đã chạy `npm run build` (gồm kiểm tra TypeScript) và Playwright trên production server cục bộ: `tests/suppliers.spec.ts`, `tests/sale-ui.spec.ts`, `tests/uc3.spec.ts`: **5 đạt, 0 lỗi**. Kiểm tra form 600×528,86 / 600×599,09; drawer rộng 460, cao viewport; hủy 340×201,84; xóa 420×231. Kiểm tra 1440×900 và không tràn trang ở 1280×900, 1920×900. Tất cả icon ở các trạng thái chụp đều tải được.

Kịch bản UC2 thao tác thật trên PostgreSQL cục bộ: thêm NCC, kiểm tra bỏ trống/sai số điện thoại, sửa trạng thái/địa chỉ, xóa NCC vừa tạo và chặn xóa NCC đã có phiếu nhập. Bản ghi thử được dọn; không reset dữ liệu. Kịch bản giao diện riêng có fixture 7 NCC trong browser để kiểm tra trang 2; không đưa fixture vào dữ liệu ứng dụng.

Lỗi đã sửa khi kiểm tra: chọn “Khác” cần đóng dropdown để ô nhập mới không bị che; cố định kích thước xác nhận theo Figma; tránh CSS form chung ghi đè; xử lý dropdown có nội dung dài bằng khung co giãn; sau thêm mở đúng trang có NCC mới. CSDL thử từng dừng và đã được khởi động lại; không liên quan CSDL Neon chính.

Bằng chứng: `docs/evidence/suppliers-20261114/`; đối chiếu frame/icon: `docs/uc2-figma.md`, `docs/supplier-assets.json`. Không khẳng định trùng tuyệt đối mọi pixel khi số lượng/nội dung bản ghi khác dữ liệu mẫu Figma. Không kiểm tra ghi/xóa dữ liệu nghiệp vụ trên production.

Kiểm tra công khai sau triển khai commit `3b85a58`: Vercel `Deployment has completed`, deployment `WTcZvVrM38FJvRAgjRLLxYxqXaqE`. Đăng nhập và mở https://tap-hoa-quynh-nhu.vercel.app/?view=suppliers thành công; chọn dòng, drawer 460px, form thêm tại (420;185,578) kích thước 600×528,844, xác nhận hủy, tìm rỗng và xóa từ khóa đều hoạt động. Không có lỗi JavaScript hoặc icon thiếu. Không lưu/xóa dữ liệu nghiệp vụ trên public. Bằng chứng số đo: `docs/evidence/suppliers-20261114/public-verification.json`; ảnh public có dữ liệu thực được giữ ngoài GitHub.

### Phản hồi UC2: danh mục mới, Enter, lỗi đồng thời

Đã bỏ tiêu đề riêng của ô tên danh mục mới, đặt input ngay dưới bộ chọn Danh mục; Enter ghi nhận chip tạm, ẩn input và không submit form. Danh mục chỉ lưu vào CSDL khi Lưu nhà cung cấp. Bộ lọc danh mục chính có vùng cuộn.

Đã thay kiểm tra dừng ở lỗi đầu tiên bằng kiểm tra tổng hợp dùng chung giữa form/API. `npm run build`, `npm run typecheck` và `tests/suppliers.spec.ts`: **3/3 đạt** trên production build cục bộ. Đã thử cả form thêm và sửa: đủ 3 lỗi bỏ trống, đủ 3 lỗi sai/trùng, vị trí input cách bộ chọn 4px, không có tiêu đề riêng; Enter không tạo request ghi hay bản ghi. API trực tiếp cũng trả đủ 3 lỗi với HTTP 400. Kiểm tra thêm/sửa/xóa/chặn xóa cũ vẫn đạt. Bằng chứng: `docs/evidence/supplier-category-20261114/`. Không ghi dữ liệu nghiệp vụ trên production.

## UC6.4 — lịch sử bán hàng theo ảnh/Figma, 14/11/2026

Đã tách bộ lọc và danh sách thành hai khung, sửa kích thước/vị trí, sidebar, nút Tìm kiếm có icon, bảng không badge màu và toast lỗi góc trên phải có icon/×. Giữ kết quả đã tải khi truy vấn lại bị lỗi; tìm kiếm thành công tiếp theo cập nhật lại bình thường. Dữ liệu thật, không chèn hóa đơn mẫu. Đã đối chiếu bốn frame và dùng icon gốc.

`npm run build` thành công; Playwright `tests/sales-history-ui.spec.ts` và `tests/sale-ui.spec.ts`: **2 đạt, 0 lỗi** trên production build cục bộ. Kiểm tra bộ lọc (273,211) 1112×195, danh sách y=425, toast tải lỗi (1104,109) 283×56, tìm mã, ngày sai, rỗng, lỗi tải một lần, giữ dòng, đóng lỗi/thử lại, mở chi tiết. Không viết dữ liệu nghiệp vụ production. Số đo và ảnh ở `docs/evidence/history-ui-20261114/`; chi tiết nguồn ở `docs/uc6-history-figma.md`.

## Đồng nhất thanh bên — 14/11/2026

Theo yêu cầu mới, thay các kích thước sidebar riêng của từng trang bằng `app/sidebar.css` dùng chung: rộng 250px, icon 20px, hàng 48px, khoảng cách và trạng thái chọn thống nhất. Giữ nhóm menu đang mở khi chuyển trang; menu cuộn riêng và Đăng xuất ở cuối. Cài đặt demo vẫn mở qua biểu tượng tài khoản trên header. Các số đo sidebar ở báo cáo cũ được thay bằng quy tắc chung này.

Production build thành công. Playwright: **8/8 đạt**, gồm kiểm tra sidebar trên 14 view, icon/nhãn/kích thước/vị trí nhất quán, menu đang mở khi chuyển trang, footer khi chiều cao màn hình 600px; hồi quy bán hàng, lịch sử, nhà cung cấp, báo cáo và lịch. Kiểm thử nghiệp vụ dùng CSDL cục bộ.

### Điều chỉnh theo phản hồi: bỏ cuộn thanh bên

Đã bỏ vùng cuộn và phần chừa chỗ scrollbar của menu bằng `overflow: clip`. Menu không cuộn bằng chuột hoặc thay đổi scrollTop; giữ căn chỉnh chung và vị trí Đăng xuất. Production build đạt; kiểm thử sidebar trên 14 view đạt, có xác nhận không cuộn ở viewport cao 600px.

## UC6.2 — In hóa đơn theo Figma, 14/11/2026

Đã chuyển xem trước từ modal chi tiết thành màn hình riêng, khung 733×557 tại (476,212), bảng kẻ ô và nút phía dưới. Hộp xác nhận hủy440×250 tại (500,350), icon gốc Figma và nút đỏ; Quay lại/Escape giữ bản xem trước, Xác nhận trở về danh sách. Toast lỗi hóa đơn đã hủy290×56, toast thành công245×56, có nút đóng; hóa đơn bị hủy không được in, lỗi máy in có thể thử lại. Dữ liệu thật và kiểm tra server giữ nguyên; không sửa service.ts/route.ts.

Production build thành công; Playwright **4/4 đạt**: hai test in mới và hồi quy Bán hàng/Lịch sử bán hàng. Đã kiểm tra trạng thái hủy sau khi xem trước, PDF/print media và nội dung PDF (không lẫn header/sidebar/nút). Lỗi được mô phỏng trong trình duyệt, window.print thay bằng bộ đếm; không gửi tới máy in thật hoặc ghi dữ liệu nghiệp vụ production. Chi tiết kích thước, nguồn asset và giới hạn xác nhận in vật lý: `docs/uc6-print-figma.md`.

## UC6.3 — trang Hủy hóa đơn, 14/11/2026

Đối chiếu frame336:2359: khung1110×644 tại (274,215), chỉ tìm mã, bốn cột dữ liệu, nút Hủy xanh, mã và trạng thái không badge màu; toast lỗi390×56 tại (997,107) có icon gốc và×. Kết quả được giữ khi thao tác/tải bị lỗi. Giữ nguyên API và nghiệp vụ, form lý do hiện có.

Production build thành công, Playwright **5/5 đạt** gồm kiểm tra hủy đã tồn tại trên CSDL thử, tìm mã/rỗng, form lý do/quay lại, dữ liệu không đổi, giữ dòng khi tải lỗi; hồi quy Bán hàng/In hóa đơn/Lịch sử bán hàng. Không xác nhận hủy dữ liệu thật trên production. Chi tiết: `docs/uc6-cancel-figma.md`.

## Đồng nhất màu thông báo theo Nhà cung cấp

Theo yêu cầu mới, dùng chung sáu biến `--notification-success-*` / `--notification-error-*` tại đầu `app/globals.css`. Thành công: nền#f0fdf4, viền#86efac, chữ#15803d. Lỗi: nền#fef2f2, viền#fca5a5, chữ#b91c1c. Áp dụng toast chung, Khách hàng, Nhà cung cấp, Bán hàng, Lịch sử, Hủy hóa đơn, In hóa đơn và Notice thành công/lỗi. Giữ nguyên kích thước, vị trí, nội dung và nghiệp vụ. Thông báo thông tin màu xanh dương và màu trạng thái/ô nhập/nút xác nhận giữ nguyên. Các màu thông báo riêng ở ghi chú Figma cũ được thay bởi yêu cầu đồng nhất mới này.

Production build/TypeScript đạt. Kiểm tra computed styles11 biến thể thông báo: đúng màu nền/viền/chữ và nút đóng. Playwright8/8 đạt: Hủy hóa đơn, hai test In hóa đơn, Bán hàng, Lịch sử, ba test Nhà cung cấp (có thêm/sửa/xóa thật chỉ trên CSDL cục bộ). Các SVG thông báo sẵn có đã dùng đúng màu#15803d/#b91c1c, không sửa asset. Không ghi dữ liệu nghiệp vụ production.

## Quản lý sản phẩm — 22 mục theo đặc tả

Đã chuyển sản phẩm sang component riêng `products.tsx/products.css`, thêm hạn sử dụng tùy chọn, drawer chi tiết, phân trang10/trang, lựa chọn danh mục/đơn vị, khóa và hậu tố giá, placeholder, hộp xác nhận/cảnh báo và các toast đúng tình huống. Bộ lọc/trang được giữ sau thao tác; sản phẩm ra khỏi bộ lọc sau sửa được bỏ chọn. Xóa bị chặn giữ lựa chọn; sửa bản ghi đã bị xóa đóng form/làm mới/toast đỏ.

Giá nhập ở các màn hình và ngưỡng cảnh báo dùng reference_cost; average_cost tiếp tục phục vụ tồn kho/lợi nhuận và được giữ nguyên khi sửa sản phẩm có phiếu nhập. Ẩn trường ngoài đặc tả, bảo toàn metadata/đơn vị/lịch sử để các nghiệp vụ khác vẫn chạy. Danh mục sản phẩm chuẩn hóa7 tên; mục cũ ngoài chuẩn chuyển sang Khác, giữ danh mục/liên kết nhà cung cấp. Thêm nhãn Khác (có sẵn) để phân biệt với thao tác nhập danh mục mới ở Nhà cung cấp.

Production build và TypeScript đạt. **15 test UI/hồi quy** đã đạt trên các lượt kiểm tra phù hợp: Products3, Supplier3, Invoice Print2, Cancel1, Sale1, Sales History1, Sidebar1 (14view), UC3/report/calendar2, luồng masters tích hợp1. **2 test validation** đạt. Các lỗi selector trong kịch bản cũ được cập nhật theo bộ chọn mới và trang in riêng; xung đột hai mục Khác được sửa ở UI trước khi kiểm tra lại Supplier3. Lượt cuối kiểm tra lại Products3 và masters1 đạt sau khi bổ sung bỏ lựa chọn ngoài bộ lọc.

Migration đã chạy trên CSDL cục bộ và nhánh Neon sao chép production `review/products-spec-20261114`. Đối chiếu dữ liệu trước/sau và test API xác nhận tồn kho, giá vốn, đơn vị, liên kết nhà cung cấp, số giao dịch không đổi; ngày không hợp lệ bị từ chối, metadata ẩn được giữ, cảnh báo giá theo đúng giá tham chiếu và bản ghi thiếu trả đúng lỗi. Fixture trên nhánh thử đã dọn. Không reset/seed CSDL đang dùng. Chi tiết22 mục và cách cập nhật máy local: `docs/products-spec.md`.
