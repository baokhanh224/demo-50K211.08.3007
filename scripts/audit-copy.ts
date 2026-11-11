import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const docs='docs/';
const word=JSON.parse(fs.readFileSync(docs+'nguon-chu-word.json','utf8'));
const figma=JSON.parse(fs.readFileSync(docs+'nguon-chu-figma.json','utf8'));
const rows:any[]=[];
function scan(dir:string) {
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);
  if(e.isDirectory())scan(file);
  else if(/\.tsx?$/.test(file)){
   const content=fs.readFileSync(file,'utf8');
   const ast=ts.createSourceFile(file,content,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
   function walk(n:ts.Node){
    if(ts.isStringLiteral(n)||ts.isJsxText(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n)||ts.isNoSubstitutionTemplateLiteral(n)){
     const text=n.text.trim();
     if(/[À-ỹĐđ]/u.test(text)){
      const {line}=ast.getLineAndCharacterOfPosition(n.getStart());
      rows.push({file,line:line+1,chu:text,loai:ts.SyntaxKind[n.kind],can_kiem_tra_hien_thi:true});
     }
    }
    ts.forEachChild(n,walk);
   }
   walk(ast);
  }
 }
}
for(const dir of ['app','components','lib'])scan(dir);
fs.writeFileSync(docs+'chu-trong-ung-dung.json',JSON.stringify(rows,null,2));
const escape=(s:string)=>s.replaceAll('|','\\|').replaceAll('\n','<br>');
let report='# Kiểm tra chữ\n\nQuét AST chuỗi và JSX trong app/components/lib, gồm API, PDF/Excel. Template là đoạn chữ động, cần kiểm tra thủ công. Chuỗi dữ liệu mẫu được giữ riêng với nhãn/thông báo. Không coi tất cả chuỗi mã là nội dung chắc chắn hiển thị.\n\n| Chữ trong ứng dụng | Nguồn | Trạng thái | Hành động |\n|---|---|---|---|\n';
for(const text of [...new Set(rows.map(r=>r.chu))]){
 const w=word.filter((r:any)=>r.chu===text);const f=figma.filter((r:any)=>r.chu===text);
 const source=w.length?w.slice(0,3).map((r:any)=>`${r.UC} ${r.buoc_ngoai_le} dòng ${r.dong_nguon}`).join('; '):f.length?`Figma ${f.slice(0,3).map((r:any)=>r.frame).join(', ')}`:'Chưa có nguồn đối chiếu';
 report+=`| ${escape(text)} | ${escape(source)} | ${w.length||f.length?'Trùng nguyên văn':'Cần rà soát'} | ${w.length||f.length?'Giữ':'Chưa kết luận; xem vị trí trong JSON'} |\n`;
}
report+='\n## Chữ Word và Figma khác nhau\n\nKhông tự thay các thông báo chỉ khác dấu câu. Word được ưu tiên. Danh sách trên chỉ xác nhận trùng nguyên văn; chưa xác nhận mọi câu đã được dùng đúng UC.\n\n## Chữ bổ sung\n\n- Thông tin cấu hình VietQR và lỗi tải QR: phục vụ thay QR động đã được yêu cầu ở lượt trước.\n- Xác nhận khôi phục dữ liệu mẫu và kết quả: cần cho thao tác demo; đang rà soát rút gọn.\n- “Vui lòng đăng nhập”: phản hồi API phiên hết hạn; chưa có trong Word/Figma, cần rút gọn thay bằng luồng về đăng nhập.\n- “Vui lòng xác nhận đã nhận đủ tiền chuyển khoản”: chặn thanh toán chưa xác nhận; đang rà soát vị trí/thông báo theo UC6.\n\n## Phạm vi chưa hoàn tất\n\nBảng đánh dấu các câu chưa có nguồn, không coi đây là bảng đã sửa xong. Kiểm tra runtime và đối chiếu theo từng UC tiếp tục trong tests/chu.spec.ts và ui-parity.md.\n';
fs.writeFileSync(docs+'kiem-tra-chu.md',report);
console.log({literals:rows.length,unique:new Set(rows.map(r=>r.chu)).size});
