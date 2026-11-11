import { db, run, one, transaction, datePlus, requestContext } from "./db";
import { passwordHash } from "./auth";
import {
  saveProduct,
  saveSupplier,
  saveReceipt,
  saveCustomer,
  checkout,
  cancelInvoice,
} from "./service";
export async function seedData() {
  return requestContext.run({ token: "seed" }, () =>
    transaction(async () => {
      for (const t of [
        "report_snapshot",
        "movement",
        "return_allocation",
        "allocation",
        "return_line",
        "return_ticket",
        "invoice_line",
        "invoice",
        "customer",
        "adjustment_line",
        "adjustment",
        "receipt_line",
        "receipt",
        "price_history",
        "unit",
        "product",
        "supplier_category",
        "supplier",
        "category",
        "sequence",
      ])
        await run(`DELETE FROM ${t}`);
      for (const table of [
        "category",
        "unit",
        "price_history",
        "receipt_line",
        "adjustment_line",
        "invoice_line",
        "return_line",
        "allocation",
        "return_allocation",
        "movement",
      ])
        await one(
          "SELECT setval(pg_get_serial_sequence(?, 'id'), 1, false)",
          table,
        );
      const account = await one("SELECT id FROM account WHERE id=?", "TK0001");
      if (!account) {
        const username = process.env.DEMO_USERNAME;
        const password = process.env.DEMO_PASSWORD;
        if (!username || !password) throw new Error("Cần cấu hình DEMO_USERNAME và DEMO_PASSWORD để tạo tài khoản ban đầu");
        await run("INSERT INTO account VALUES (?,?,?)", "TK0001", username, passwordHash(password));
      }
      for (const name of [
        "Sữa & đồ uống",
        "Mì & thực phẩm",
        "Bánh kẹo",
        "Gia dụng",
      ])
        await run("INSERT INTO category(name) VALUES (?)", name);
      const sup = await saveSupplier({
        name: "Đại lý sữa Thuận Phát",
        phone: "0905123456",
        email: "thuanphat@example.com",
        address: "Hải Châu, Đà Nẵng",
        category_ids: [1],
      });
      await saveSupplier({
        name: "Nhà phân phối An Khang",
        phone: "0912345678",
        address: "Thanh Khê, Đà Nẵng",
        category_ids: [2, 3, 4],
      });
      await saveSupplier({
        name: "Công ty Minh Tâm",
        phone: "0987654321",
        category_ids: [3],
      });
      const fixtures: any[] = [
        [
          "Sữa Milo",
          1,
          "Hộp",
          12500,
          18000,
          8,
          true,
          "8934588012345",
          [
            { name: "Lốc", factor: 4, price: 72000 },
            { name: "Thùng", factor: 24, price: 396000 },
          ],
        ],
        [
          "Mì Hảo Hảo",
          2,
          "Gói",
          3000,
          4000,
          10,
          true,
          "8934563012345",
          [
            { name: "Lốc", factor: 5, price: 19000 },
            { name: "Thùng", factor: 30, price: 110000 },
          ],
        ],
        ["Bánh quy Cosy", 3, "Gói", 12000, 18000, 5, true, "8934684012345", []],
        [
          "Nước suối Lavie",
          1,
          "Chai",
          3500,
          6000,
          10,
          false,
          "8934588123456",
          [{ name: "Thùng", factor: 24, price: 130000 }],
        ],
        ["Muối I-ốt", 2, "Gói", 4000, 6000, 5, false, "8934588234567", []],
        [
          "Nước rửa chén Sunlight",
          4,
          "Chai",
          20000,
          28000,
          4,
          false,
          "8934588345678",
          [],
        ],
        ["Kẹo bạc hà", 3, "Gói", 5000, 8000, 2, false, "8934588456789", []],
      ];
      for (const [
        name,
        category_id,
        base_unit,
        reference_cost,
        price,
        min_stock,
        expiry_managed,
        barcode,
        units,
      ] of fixtures)
        await saveProduct({
          name,
          category_id,
          base_unit,
          reference_cost,
          price,
          min_stock,
          expiry_managed,
          barcode,
          units,
        });
      const unit = async (id: string) =>
        (
          await one(
            "SELECT id FROM unit WHERE product_id=? AND factor=1 ORDER BY id LIMIT 1",
            id,
          )
        ).id;
      await saveReceipt({
        supplier_id: sup.id,
        request_key: "seed-pn1",
        lines: [
          {
            product_id: "SP0001",
            unit_id: await unit("SP0001"),
            quantity: 8,
            price: 12500,
            expiry: datePlus(7),
          },
          {
            product_id: "SP0001",
            unit_id: await unit("SP0001"),
            quantity: 40,
            price: 13500,
            expiry: datePlus(90),
          },
          {
            product_id: "SP0003",
            unit_id: await unit("SP0003"),
            quantity: 20,
            price: 12000,
            expiry: datePlus(15),
          },
        ],
      });
      await saveReceipt({
        supplier_id: "NCC002",
        request_key: "seed-pn2",
        lines: [
          {
            product_id: "SP0002",
            unit_id: await unit("SP0002"),
            quantity: 60,
            price: 3000,
            expiry: datePlus(180),
          },
          {
            product_id: "SP0004",
            unit_id: await unit("SP0004"),
            quantity: 48,
            price: 3500,
            expiry: "",
          },
          {
            product_id: "SP0005",
            unit_id: await unit("SP0005"),
            quantity: 3,
            price: 4000,
            expiry: "",
          },
          {
            product_id: "SP0006",
            unit_id: await unit("SP0006"),
            quantity: 12,
            price: 20000,
            expiry: "",
          },
        ],
      });
      await saveReceipt({
        supplier_id: sup.id,
        request_key: "seed-pn3",
        lines: [
          {
            product_id: "SP0001",
            unit_id: await unit("SP0001"),
            quantity: 5,
            price: 12000,
            expiry: datePlus(60),
          },
        ],
      });
      const historical = new Date();
      historical.setUTCDate(historical.getUTCDate() - 20);
      await run("UPDATE receipt SET created_at=?", historical.toISOString());
      await run(
        "UPDATE movement SET created_at=? WHERE kind='receipt'",
        historical.toISOString(),
      );
      await run(
        "UPDATE receipt_line SET expiry=? WHERE receipt_id='PN0003'",
        datePlus(-2),
      );
      await saveCustomer({
        name: "Nguyễn Bảo Khanh",
        phone: "0901234567",
        address: "Hải Châu, Đà Nẵng",
      });
      await saveCustomer({
        name: "Trần Công Bằng",
        phone: "0934567890",
        address: "Sơn Trà, Đà Nẵng",
      });
      await saveCustomer({
        name: "Trần Quang Hoàng",
        phone: "0911223344",
        address: "Thanh Khê, Đà Nẵng",
      });
      await checkout({
        request_key: "seed-hd1",
        customer_id: "KH0001",
        method: "Tiền mặt",
        cash: 200000,
        lines: [
          { product_id: "SP0001", unit_id: await unit("SP0001"), quantity: 3 },
          { product_id: "SP0002", unit_id: await unit("SP0002"), quantity: 4 },
        ],
      });
      await checkout({
        request_key: "seed-hd2",
        customer_id: "KH0003",
        method: "Chuyển khoản",
        confirmed: true,
        lines: [
          { product_id: "SP0003", unit_id: await unit("SP0003"), quantity: 2 },
          { product_id: "SP0004", unit_id: await unit("SP0004"), quantity: 3 },
        ],
      });
      await checkout({
        request_key: "seed-hd3",
        method: "Tiền mặt",
        cash: 100000,
        lines: [
          { product_id: "SP0002", unit_id: await unit("SP0002"), quantity: 5 },
        ],
      });
      await cancelInvoice({ id: "HD0003", reason: "Nhập nhầm số lượng" });
      for (const [id, days] of [
        ["HD0001", 3],
        ["HD0002", 1],
        ["HD0003", 1],
      ] as const) {
        const t = new Date();
        t.setUTCDate(t.getUTCDate() - days);
        await run(
          "UPDATE invoice SET created_at=?,cancelled_at=CASE WHEN cancelled_at IS NOT NULL THEN ? ELSE NULL END WHERE id=?",
          t.toISOString(),
          t.toISOString(),
          id,
        );
        await run(
          "UPDATE movement SET created_at=? WHERE reference=? AND kind IN ('sale','cancel')",
          t.toISOString(),
          id,
        );
      }

      await run("UPDATE supplier SET status='Ngừng hợp tác' WHERE id='NCC003'");
      return { message: "Khôi phục dữ liệu mẫu thành công" };
    }, true),
  );
}
