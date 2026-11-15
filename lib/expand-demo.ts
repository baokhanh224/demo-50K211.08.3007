import { all, one, run, transaction, datePlus, requestContext } from "./db";
import { saveProduct, saveCustomer, saveSupplier, saveReceipt } from "./service";
import { demoCatalog, demoCustomers, demoBarcode } from "./demo-catalog";

const dataset = "demo-expanded-v1";
type Added = { products: number; customers: number; suppliers: number; receipts: number; categories: number };
const empty = (): Added => ({ products: 0, customers: 0, suppliers: 0, receipts: 0, categories: 0 });
const supplierPhone = (index: number) => "038920" + String(index + 1).padStart(4, "0");
const receiptKey = (category: number, supplier: number) => `${dataset}:receipt:${category}:${supplier}`;

export async function demoDataPlan() {
  const [products, customers, suppliers, receipts] = await Promise.all([
    all("SELECT barcode FROM product"), all("SELECT phone FROM customer"),
    all("SELECT phone FROM supplier"), all("SELECT request_key FROM receipt"),
  ]);
  return {
    current: { products: products.length, customers: customers.length, suppliers: suppliers.length, receipts: receipts.length },
    missing: {
      products: demoCatalog.flatMap(g => g.items).filter((_, i) => !products.some(p => p.barcode === demoBarcode(i))).length,
      customers: demoCustomers.filter(c => !customers.some(x => x.phone === c.phone)).length,
      suppliers: demoCatalog.flatMap(g => g.suppliers).filter((_, i) => !suppliers.some(s => s.phone === supplierPhone(i))).length,
      receiptGroups: demoCatalog.flatMap((_, i) => [receiptKey(i, 0), receiptKey(i, 1)]).filter(key => !receipts.some(r => r.request_key === key)).length,
    },
  };
}

// Each category commits atomically. Retrying skips existing identities and never
// replaces records, repeats a receipt, or replenishes stock that has been sold.
export async function expandDemoData(progress?: (category: string, added: Added) => void) {
  return requestContext.run({ token: dataset }, async () => {
    const total = empty();
    for (const [groupIndex, group] of demoCatalog.entries()) {
      const added = await transaction(async () => {
        await one("SELECT pg_advisory_xact_lock(hashtextextended(?::text,0))::text", dataset);
        const result = empty();
        let category = await one("SELECT id FROM category WHERE name=?", group.category);
        if (!category) {
          category = { id: (await run("INSERT INTO category(name) VALUES (?)", group.category)).lastInsertRowid };
          result.categories++;
        }
        const suppliers: string[] = [];
        for (const [slot, name] of group.suppliers.entries()) {
          const index = groupIndex * 2 + slot, phone = supplierPhone(index);
          let supplier = await one("SELECT id FROM supplier WHERE phone=?", phone);
          if (!supplier) {
            supplier = await saveSupplier({ name, phone, email: `nhacungcap${index + 1}.demo@example.com`,
              address: `${20 + index * 4} ${slot ? "Điện Biên Phủ, Thanh Khê" : "Nguyễn Hữu Thọ, Hải Châu"}, Đà Nẵng`,
              description: `Cung cấp sản phẩm thuộc danh mục ${group.category}.`, category_ids: [category.id] });
            result.suppliers++;
          }
          suppliers.push(supplier.id);
        }
        const receiptLines: any[][] = [[], []];
        for (const [itemIndex, item] of group.items.entries()) {
          const barcode = demoBarcode(groupIndex * 7 + itemIndex);
          if (await one("SELECT id FROM product WHERE barcode=?", barcode)) continue;
          const expiry = item.expiryDays ? datePlus(item.expiryDays) : "";
          const product = await saveProduct({
            name: item.name, category_id: category.id, barcode, base_unit: item.unit,
            reference_cost: item.cost, price: item.price, min_stock: itemIndex === 3 ? 8 : 5,
            expiry_managed: !!item.expiryDays, expiry,
            description: `${item.name}. Sản phẩm phục vụ nhu cầu tiêu dùng hằng ngày.`,
            units: item.wholesale ? [{ name: "Thùng", factor: item.wholesale, price: Math.round(item.price * item.wholesale * .95) }] : [],
          });
          const unit = await one("SELECT id FROM unit WHERE product_id=? AND factor=1", product.id);
          receiptLines[itemIndex % 2].push({ product_id: product.id, unit_id: unit.id, quantity: item.quantity, price: item.cost, expiry });
          result.products++;
        }
        for (const [slot, lines] of receiptLines.entries()) {
          if (!lines.length) continue;
          const key = receiptKey(groupIndex, slot);
          if (await one("SELECT id FROM receipt WHERE request_key=?", key))
            throw new Error("Phiếu nhập mẫu đã tồn tại nhưng có sản phẩm mới chưa được liên kết. Cần kiểm tra dữ liệu trước khi bổ sung.");
          await saveReceipt({ supplier_id: suppliers[slot], request_key: key, lines });
          result.receipts++;
        }
        return result;
      });
      for (const key of Object.keys(total) as (keyof Added)[]) total[key] += added[key];
      progress?.(group.category, added);
    }
    const customers = await transaction(async () => {
      await one("SELECT pg_advisory_xact_lock(hashtextextended(?::text,0))::text", dataset);
      let added = 0;
      for (const customer of demoCustomers) {
        if (await one("SELECT id FROM customer WHERE phone=?", customer.phone)) continue;
        await saveCustomer(customer); added++;
      }
      return added;
    });
    total.customers = customers;
    progress?.("Khách hàng", { ...empty(), customers });
    return { added: total, ...(await demoDataPlan()) };
  });
}
