import { test, expect } from "@playwright/test";
import fs from "node:fs";

async function login(page: any) {
  await page.goto("/?view=suppliers");
  if (await page.getByLabel("Tên đăng nhập", {exact:true}).isVisible()) {
    await page.getByLabel("Tên đăng nhập", {exact:true}).fill(process.env.DEMO_USERNAME!);
    await page.getByLabel("Mật khẩu", {exact:true}).fill(process.env.DEMO_PASSWORD!);
    await page.getByRole("button", {name:"Đăng nhập",exact:true}).click();
    await expect(page.locator(".sidebar")).toBeVisible();
    await page.goto("/?view=suppliers");
  }
  await expect(page.getByRole("heading", {name:"Quản lý nhà cung cấp",exact:true})).toBeVisible();
}
async function capture(page: any, name: string) {
  fs.mkdirSync("test-results/suppliers",{recursive:true});
  await page.evaluate(()=>document.fonts.ready);
  await page.locator("img").evaluateAll((images: any)=>Promise.all(images.map((i: any)=>i.decode().catch(()=>{}))));
  expect(await page.locator(".supplier-page img,.supplier-form img,.supplier-confirm img,.supplier-drawer img,.supplier-toast img").evaluateAll((images: any) => images.filter((i: any) => !i.complete || !i.naturalWidth).map((i: any) => i.getAttribute("src")))).toEqual([]);
  await page.mouse.move(0,0);
  await page.screenshot({path:`test-results/suppliers/${name}.png`,fullPage:true});
}
test("UC2: list, selection, pagination, empty result, drawer and form geometry",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  // UI-only fixture makes the six Figma example rows reproducible without changing any database.
  const suppliers=Array.from({length:7},(_,i)=>({id:`NCC00${i+1}`,name:["Tạp hóa sỉ Minh Phát","Đại lý nước giải khát Hồng Phúc","Nhà phân phối bánh kẹo Thành Đạt","Đại lý sữa Thuận Phát","Đại lý mì ăn liền Hoàng Nam","Nhà phân phối Unilever Đà Nẵng","Tạp hóa sỉ Ngọc Lan"][i],phone:"0901234567",email:"minhphat.sy@gmail.com",address:"25 Ông Ích Khiêm, Hải Châu, Đà Nẵng",status:i===4?"Ngừng hợp tác":"Đang hợp tác",description:"Nước suối, nước ngọt, trà đóng chai",category_ids:[1],categories:["Gia vị"]}));
  await page.route("**/api/bootstrap",async route=>{const r=await route.fetch();if(!r.ok())return route.fulfill({response:r});const data=await r.json();await route.fulfill({response:r,json:{...data,suppliers}});});
  await login(page);
  await expect(page.locator(".supplier-table-wrap tbody tr")).toHaveCount(6);
  await expect(page.locator(".supplier-status.cooperating").first()).toHaveCSS("color","rgb(22, 163, 74)");
  await expect(page.locator(".supplier-status.stopped")).toHaveCSS("color","rgb(220, 38, 38)");
  await expect(page.locator(".supplier-status").first()).toHaveCSS("background-color","rgba(0, 0, 0, 0)");
  await expect(page.locator(".supplier-code-link").first()).toHaveCSS("font-weight","400");
  await expect(page.locator(".supplier-name-link").first()).toHaveCSS("font-weight","600");
  await capture(page,"list");
  await page.locator(".supplier-filters").getByRole("button",{name:"Trạng thái",exact:true}).click();
  await page.getByRole("option",{name:"Ngừng hợp tác",exact:true}).click();
  const filterBounds=await page.locator(".supplier-filters").boundingBox();
  for(const box of await page.locator(".supplier-filters>div,.supplier-filters>button").evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()))){expect(box.x).toBeGreaterThanOrEqual(filterBounds!.x);expect(box.right).toBeLessThanOrEqual(filterBounds!.x+filterBounds!.width);}
  await capture(page,"filters");
  await page.locator(".supplier-filters").getByRole("button",{name:"Trạng thái",exact:true}).click();await page.getByRole("option",{name:"Tất cả",exact:true}).click();
  await page.getByRole("checkbox",{name:"Chọn NCC002",exact:true}).check();
  await expect(page.locator(".supplier-selected td").first()).toHaveCSS("background-color","rgb(219, 234, 254)");
  await capture(page,"selected");
  await page.getByRole("button",{name:"NCC002",exact:true}).click();
  const drawer=page.getByRole("dialog",{name:"Chi tiết nhà cung cấp",exact:true});
  const rect=await drawer.boundingBox();expect(rect?.x).toBe(980);expect(rect?.width).toBe(460);expect(rect?.height).toBe(900);
  await capture(page,"detail");await drawer.getByRole("button",{name:"Đóng",exact:true}).last().click();
  await page.getByRole("button",{name:"Sửa",exact:true}).click();
  const edit=page.getByRole("dialog",{name:"Sửa thông tin nhà cung cấp",exact:true});
  expect((await edit.boundingBox())?.width).toBe(600);expect((await edit.boundingBox())?.height).toBeCloseTo(599.09,1);
  await capture(page,"edit");await edit.getByRole("button",{name:"Trạng thái",exact:true}).click();
  await expect(edit.getByRole("option",{name:"Đang hợp tác",exact:true})).toHaveAttribute("aria-selected","true");await capture(page,"edit-status");
  await edit.getByRole("option",{name:"Ngừng hợp tác",exact:true}).click();await edit.getByRole("button",{name:"Hủy",exact:true}).click();
  const confirm=page.getByRole("dialog",{name:"Xác nhận",exact:true});expect((await confirm.boundingBox())?.width).toBe(340);expect((await confirm.boundingBox())?.height).toBeCloseTo(201.84,0);await capture(page,"cancel");await confirm.getByRole("button",{name:"Xác nhận",exact:true}).click();
  await page.getByRole("button",{name:"Trang sau",exact:true}).click();await expect(page.locator(".supplier-table-wrap tbody tr")).toHaveCount(1);await expect(page.getByRole("button",{name:"NCC007",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Thêm nhà cung cấp",exact:true}).click();const add=page.getByRole("dialog",{name:"Thêm nhà cung cấp",exact:true});
  expect((await add.boundingBox())?.width).toBe(600);expect((await add.boundingBox())?.height).toBeCloseTo(528.86,1);expect(await add.evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
  await expect(add.getByLabel("Tên nhà cung cấp",{exact:true})).toHaveAttribute("placeholder","Nhập tên nhà cung cấp");await expect(add.getByLabel("Mã nhà cung cấp",{exact:true})).toHaveAttribute("readonly","");await capture(page,"add");
  await add.getByRole("button",{name:"Danh mục",exact:true}).click();await expect(add.getByRole("dialog",{name:"Chọn danh mục",exact:true})).toBeVisible();await capture(page,"categories");await add.getByRole("checkbox",{name:"Khác",exact:true}).click();await add.getByLabel("Tên danh mục mới",{exact:true}).click();await add.getByLabel("Tên nhà cung cấp",{exact:true}).click();
  await expect(add.getByText("Vui lòng nhập tên danh mục mới!",{exact:true})).toBeVisible();await add.getByLabel("Tên danh mục mới",{exact:true}).fill("Sữa & đồ uống");await add.getByRole("button",{name:"Lưu",exact:true}).click();await expect(add.getByText("Danh mục đã tồn tại, vui lòng chọn danh mục có sẵn!",{exact:true})).toBeVisible();await capture(page,"category-error");
  await add.getByRole("button",{name:"Hủy",exact:true}).click();await page.getByRole("dialog",{name:"Xác nhận",exact:true}).getByRole("button",{name:"Xác nhận",exact:true}).click();
  await page.route("**/api/query",route=>route.fulfill({json:[]}));await page.getByLabel("Từ khóa",{exact:true}).fill("zz_no_supplier");await expect(page.getByRole("button",{name:"Xóa từ khóa",exact:true})).toBeVisible();await page.getByRole("button",{name:"Tìm kiếm",exact:true}).click();await expect(page.getByText("Không tìm thấy nhà cung cấp!",{exact:true})).toBeVisible();await capture(page,"empty");
  for(const width of [1280,1920]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test("UC2 real API: create, update, category validation, protected deletion and successful deletion",async({page})=>{
  test.skip(!!process.env.BASE_URL?.startsWith("https:"),"Business writes run only against the isolated local test database");
  await page.setViewportSize({width:1440,height:900});await login(page);
  const original=await page.request.get("/api/bootstrap");const data=await original.json();const existing=data.suppliers[0];
  if(existing){await page.getByRole("checkbox",{name:`Chọn ${existing.id}`,exact:true}).check();await page.getByRole("button",{name:"Xóa",exact:true}).click();expect((await page.getByRole("dialog",{name:"Xóa nhà cung cấp",exact:true}).boundingBox())?.height).toBe(231);await capture(page,"delete-confirm");await page.getByRole("dialog",{name:"Xóa nhà cung cấp",exact:true}).getByRole("button",{name:"Xác nhận",exact:true}).click();await expect(page.locator(".supplier-toast-error>span")).toHaveText("Không thể xóa nhà cung cấp đã phát sinh giao dịch nhập hàng!");await capture(page,"delete-blocked");await page.getByRole("button",{name:"Đóng thông báo",exact:true}).click();}
  const name="NCC kiểm thử giao diện "+Date.now();let createdId="";
  try{
    await page.getByRole("button",{name:"Thêm nhà cung cấp",exact:true}).click();const form=page.getByRole("dialog",{name:"Thêm nhà cung cấp",exact:true});await form.getByRole("button",{name:"Lưu",exact:true}).click();await expect(form.getByText("Không được để trống!",{exact:true})).toHaveCount(2);
    await form.getByLabel("Tên nhà cung cấp",{exact:true}).fill(name);await form.getByLabel("Số điện thoại",{exact:true}).fill("123");await form.getByRole("button",{name:"Lưu",exact:true}).click();await expect(form.getByText("Dữ liệu không hợp lệ!",{exact:true})).toBeVisible();await form.getByLabel("Số điện thoại",{exact:true}).fill("0901122334");await form.getByRole("button",{name:"Lưu",exact:true}).click();await expect(page.locator(".supplier-toast:not(.supplier-toast-error)>span")).toHaveText("Thêm nhà cung cấp thành công!");await capture(page,"added");
    const added=(await(await page.request.get("/api/bootstrap")).json()).suppliers.find((s:any)=>s.name===name);createdId=added.id;
    await page.getByLabel("Từ khóa",{exact:true}).fill(name);await page.getByRole("button",{name:"Tìm kiếm",exact:true}).click();await page.getByRole("checkbox",{name:`Chọn ${createdId}`,exact:true}).check();await page.getByRole("button",{name:"Sửa",exact:true}).click();const edit=page.getByRole("dialog",{name:"Sửa thông tin nhà cung cấp",exact:true});await edit.getByLabel("Địa chỉ",{exact:true}).fill("Đà Nẵng");await edit.getByRole("button",{name:"Trạng thái",exact:true}).click();await edit.getByRole("option",{name:"Ngừng hợp tác",exact:true}).click();await edit.getByRole("button",{name:"Lưu",exact:true}).click();await expect(page.locator(".supplier-toast:not(.supplier-toast-error)>span")).toHaveText("Cập nhật thông tin nhà cung cấp thành công!");await capture(page,"updated");
    await page.getByRole("button",{name:"Tìm kiếm",exact:true}).click();await page.getByRole("checkbox",{name:`Chọn ${createdId}`,exact:true}).check();await page.getByRole("button",{name:"Xóa",exact:true}).click();const dialog=page.getByRole("dialog",{name:"Xóa nhà cung cấp",exact:true});await expect(dialog.getByRole("button",{name:"Xác nhận",exact:true})).toHaveCSS("color","rgb(255, 255, 255)");await dialog.getByRole("button",{name:"Xác nhận",exact:true}).click();await expect(page.locator(".supplier-toast:not(.supplier-toast-error)>span")).toHaveText("Xóa nhà cung cấp thành công!");await capture(page,"deleted");
  }finally{if(createdId)await page.request.post('/api/action',{data:{action:'delete-suppliers',id:createdId}});}
});
