export type DemoItem = { name: string; unit: string; cost: number; price: number; quantity: number; expiryDays?: number; wholesale?: number };
export type DemoGroup = { category: string; suppliers: [string, string]; items: DemoItem[] };

const items = (rows: [string, string, number, number][], days = 180, wholesale?: number): DemoItem[] => rows.map(([name, unit, cost, price], i) => ({
  name, unit, cost, price, quantity: [24, 36, 48, 5, 30, 60, 18][i],
  expiryDays: days ? (i === 3 ? Math.min(days, 14) : days + i * 7) : undefined,
  wholesale: unit === "Chai" || unit === "Lon" || unit === "Hộp" || unit === "Gói" ? wholesale : undefined,
}));

export const demoCatalog: DemoGroup[] = [
  { category: "Sữa", suppliers: ["Nhà phân phối sữa An Phúc", "Đại lý sữa Hòa Bình"], items: items([
    ["Sữa tươi Vinamilk 180ml", "Hộp", 6500, 8500],
    ["Sữa TH true MILK 180ml", "Hộp", 7500, 10000],
    ["Sữa Dutch Lady 180ml", "Hộp", 6000, 8000],
    ["Sữa chua Vinamilk có đường", "Hũ", 5000, 7000],
    ["Sữa đặc Ông Thọ 380g", "Lon", 22000, 28000],
    ["Sữa đậu nành Fami 200ml", "Hộp", 4500, 6500],
    ["Sữa bột Dielac Alpha 400g", "Lon", 105000, 125000],
  ], 90, 24) },
  { category: "Mì ăn liền", suppliers: ["Nhà phân phối mì Đại Phát", "Đại lý thực phẩm Tân Lộc"], items: items([
    ["Mì Omachi bò hầm", "Gói", 6500, 8500],
    ["Mì Kokomi tôm chua cay", "Gói", 2500, 3500],
    ["Mì Gấu Đỏ tôm gà", "Gói", 2800, 4000],
    ["Mì 3 Miền tôm chua cay", "Gói", 2500, 3500],
    ["Phở Vifon bò", "Gói", 5500, 7500],
    ["Miến Phú Hương sườn heo", "Gói", 7000, 9500],
    ["Hủ tiếu Nam Vang Như Ý", "Gói", 6000, 8000],
  ], 180, 30) },
  { category: "Nước uống", suppliers: ["Nhà phân phối nước uống Thành Công", "Đại lý nước giải khát Minh Châu"], items: items([
    ["Nước suối Aquafina 500ml", "Chai", 3500, 6000],
    ["Nước ngọt Coca-Cola 330ml", "Lon", 7500, 10000],
    ["Nước ngọt Pepsi 330ml", "Lon", 7000, 10000],
    ["Trà xanh Không Độ 455ml", "Chai", 6500, 10000],
    ["Trà Ô Long Tea+ 455ml", "Chai", 7000, 11000],
    ["Nước tăng lực Sting 330ml", "Chai", 6500, 10000],
    ["Nước cam Twister 350ml", "Chai", 7000, 11000],
  ], 180, 24) },
  { category: "Bánh mì", suppliers: ["Cơ sở bánh mì Sao Mai", "Cơ sở bánh tươi Hương Việt"], items: items([
    ["Bánh mì sandwich Kinh Đô", "Gói", 18000, 25000],
    ["Bánh mì tươi chà bông", "Cái", 7000, 10000],
    ["Bánh mì bơ sữa", "Cái", 5000, 8000],
    ["Bánh mì nhân custard", "Cái", 6000, 9000],
    ["Bánh mì nguyên cám", "Gói", 20000, 28000],
    ["Bánh mì ngọt nhân dừa", "Cái", 5000, 8000],
    ["Bánh mì cuộn ruốc", "Cái", 8000, 12000],
  ], 7) },
  { category: "Bánh kẹo", suppliers: ["Nhà phân phối bánh kẹo Bảo An", "Đại lý bánh kẹo Phú Quý"], items: items([
    ["Bánh Oreo 133g", "Gói", 16000, 22000],
    ["Bánh Chocopie 6 cái", "Hộp", 28000, 38000],
    ["Bánh quy AFC 172g", "Hộp", 22000, 30000],
    ["Bánh gạo One One 150g", "Gói", 13000, 18000],
    ["Kẹo Alpenliebe 100g", "Gói", 11000, 16000],
    ["Kẹo Mentos bạc hà", "Gói", 5000, 8000],
    ["Bánh Pocky chocolate 47g", "Hộp", 14000, 20000],
  ], 180) },
  { category: "Gia vị", suppliers: ["Nhà phân phối gia vị Gia Hưng", "Đại lý thực phẩm Nam Việt"], items: items([
    ["Nước mắm Nam Ngư 500ml", "Chai", 20000, 28000],
    ["Dầu ăn Tường An 1 lít", "Chai", 38000, 48000],
    ["Đường Biên Hòa 1kg", "Gói", 19000, 25000],
    ["Hạt nêm Knorr 400g", "Gói", 24000, 32000],
    ["Bột ngọt Ajinomoto 400g", "Gói", 26000, 35000],
    ["Tương ớt Cholimex 250g", "Chai", 9000, 14000],
    ["Nước tương Maggi 300ml", "Chai", 16000, 23000],
  ], 365) },
  { category: "Khác", suppliers: ["Nhà phân phối gia dụng Vạn Phúc", "Đại lý tiêu dùng Thanh Bình"], items: items([
    ["Nước rửa chén Sunlight 750g", "Chai", 24000, 32000],
    ["Bột giặt OMO 800g", "Gói", 29000, 39000],
    ["Nước giặt Ariel 1.2kg", "Chai", 52000, 68000],
    ["Giấy vệ sinh Bless You 6 cuộn", "Gói", 22000, 30000],
    ["Khăn giấy Pulppy 100 tờ", "Hộp", 12000, 18000],
    ["Kem đánh răng P/S 180g", "Hộp", 23000, 32000],
    ["Bàn chải Colgate", "Cái", 11000, 17000],
  ], 0) },
];

export const demoCustomers = [
  "Nguyễn Minh Anh", "Trần Hoàng Nam", "Lê Thu Hà", "Phạm Đức Huy", "Hoàng Ngọc Lan", "Võ Quốc Bảo",
  "Đặng Thanh Tâm", "Bùi Hải Yến", "Đỗ Minh Khang", "Hồ Phương Linh", "Ngô Tuấn Kiệt", "Dương Thảo Vy",
  "Lý Gia Hân", "Mai Anh Tuấn", "Đinh Ngọc Mai", "Huỳnh Nhật Minh", "Nguyễn Thanh Trúc", "Trần Bảo Ngọc",
  "Lê Quốc Việt", "Phạm Khánh Linh", "Hoàng Đức Anh", "Võ Thùy Dung", "Đặng Minh Quân", "Bùi Ngọc Ánh",
  "Đỗ Hoài An", "Hồ Gia Bảo", "Ngô Kim Ngân", "Dương Minh Châu", "Lý Thanh Phong", "Mai Thu Hương",
].map((name, i) => ({
  name, phone: "039910" + String(i + 1).padStart(4, "0"),
  address: `${12 + i * 3} ${["Nguyễn Văn Linh, Hải Châu", "Điện Biên Phủ, Thanh Khê", "Ngô Quyền, Sơn Trà", "Lê Văn Hiến, Ngũ Hành Sơn", "Tôn Đức Thắng, Liên Chiểu"][i % 5]}, Đà Nẵng`,
}));

export function demoBarcode(index: number) {
  const prefix = "2900001" + String(index + 1).padStart(5, "0");
  const sum = [...prefix].reduce((total, digit, i) => total + Number(digit) * (i % 2 ? 3 : 1), 0);
  return prefix + ((10 - sum % 10) % 10);
}
