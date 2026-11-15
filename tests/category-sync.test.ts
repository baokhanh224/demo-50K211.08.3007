import test from "node:test";
import assert from "node:assert/strict";
import { sortCategories } from "../lib/categories";
import { db, one, transaction } from "../lib/db";
import { bootstrap, saveSupplier, saveProduct } from "../lib/service";

test("shared category order includes custom entries and leaves Other last", () => {
  const categories = [{ id: 3, name: "Khác" }, { id: 2, name: "Đồ đông lạnh" }, { id: 1, name: "Sữa" }];
  assert.deepEqual(sortCategories(categories).map(c => c.name), ["Sữa", "Đồ đông lạnh", "Khác"]);
  assert.equal(categories[0].name, "Khác");
});

test("supplier-created category is shared and accepted for products (local, rolled back)", {
  skip: !process.env.DATABASE_URL || process.env.DATABASE_URL.includes(".neon.tech"),
}, async () => {
  const name = "Danh mục đồng bộ " + Date.now();
  try {
    await assert.rejects(transaction(async () => {
      const supplier = await saveSupplier({ name: "Nhà cung cấp đồng bộ", phone: "0999988776", other: true, new_category: name, category_ids: [] });
      const category = await one("SELECT * FROM category WHERE name=?", name);
      assert(category);
      assert(await one("SELECT * FROM supplier_category WHERE supplier_id=? AND category_id=?", supplier.id, category.id));
      const product = await saveProduct({ name: "Sản phẩm đồng bộ", category_id: category.id, base_unit: "Hộp", reference_cost: 10000, price: 15000 });
      assert.equal((await one("SELECT category_id FROM product WHERE id=?", product.id)).category_id, category.id);
      const data = await bootstrap();
      assert.deepEqual(data.product_categories, data.categories);
      assert(data.categories.some(c => c.id === category.id));
      await assert.rejects(saveProduct({ name: "Danh mục không hợp lệ", category_id: -1, base_unit: "Hộp", reference_cost: 10000, price: 15000 }));
      throw new Error("ROLLBACK_CATEGORY_SYNC_TEST");
    }), { message: "ROLLBACK_CATEGORY_SYNC_TEST" });
    assert.equal(await one("SELECT id FROM category WHERE name=?", name), undefined);
  } finally { await db.$disconnect(); }
});
