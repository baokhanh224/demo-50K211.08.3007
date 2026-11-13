## Sửa hộp Xuất báo cáo theo ảnh bên trái người dùng

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
