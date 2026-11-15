import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {all,db,requestContext} from '../lib/db';
import {quoteCart,validateReceiptLine,query} from '../lib/service';
import {expandDemoData,demoDataPlan} from '../lib/expand-demo';
const tables=['product','unit','customer','supplier','supplier_category','category','receipt','receipt_line','movement','invoice','invoice_line','adjustment','adjustment_line','allocation','return_ticket','return_line','return_allocation','price_history'];
async function snapshot(){return Object.fromEntries(await Promise.all(tables.map(async t=>[t,await all(`SELECT row_to_json(t)::text AS row FROM ${t} t`)])));}
async function main(){
 const before=await snapshot();
 if(process.env.DEMO_BACKUP_PATH)writeFileSync(process.env.DEMO_BACKUP_PATH,JSON.stringify(before),{mode:0o600});
 if(process.argv.includes('--snapshot-only')){console.log('Snapshot saved',Object.fromEntries(Object.entries(before).map(([t,rows])=>[t,(rows as any[]).length])));return;}
 const plan=await demoDataPlan();console.log('Before',JSON.stringify(plan));
 const result=await expandDemoData((category,added)=>console.log(category,JSON.stringify(added)));
 const after=await snapshot();
 for(const t of tables){const rows=new Set(after[t].map((r:any)=>r.row));for(const r of before[t])assert(rows.has(r.row),`Existing ${t} row changed`);}
 assert.equal(result.missing.products,0);assert.equal(result.missing.customers,0);assert.equal(result.missing.suppliers,0);
 const stock=await all("SELECT p.id, p.reference_cost, p.average_cost, COALESCE(SUM(r.remaining),0) AS stock FROM product p LEFT JOIN receipt_line r ON r.product_id=p.id WHERE p.barcode LIKE '2900001%' GROUP BY p.id");
 assert.equal(stock.length,49);for(const p of stock){assert(p.stock>0);assert.equal(Number(p.reference_cost),Number(p.average_cost));}
 const sample=await all("SELECT p.id,u.id AS unit_id,p.expiry,p.reference_cost FROM product p JOIN unit u ON u.product_id=p.id AND u.factor=1 WHERE p.barcode LIKE '2900001%' ORDER BY p.id LIMIT 2");
 const quote=await quoteCart({lines:sample.map(p=>({product_id:p.id,unit_id:p.unit_id,quantity:1}))});assert.equal(quote.lines.length,2);assert(quote.total>0);
 await validateReceiptLine({product_id:sample[0].id,unit_id:sample[0].unit_id,quantity:1,price:sample[0].reference_cost,expiry:sample[0].expiry});
 const inventory=await requestContext.run({token:'demo-expanded-verification'},()=>query({scope:'inventory',q:sample[0].id}));assert(inventory.some((p:any)=>p.id===sample[0].id));
 console.log('Existing rows preserved; all 49 new products have stock and consistent costs. Sale quote, receipt validation and inventory query passed.');
 if(process.argv.includes('--twice')){const second=await expandDemoData();assert(Object.values(second.added).every(n=>n===0));const again=await snapshot();for(const t of tables)assert.deepEqual(again[t].map((r:any)=>r.row).sort(),after[t].map((r:any)=>r.row).sort());console.log('Second run made no changes.');}
 console.log('Verified',JSON.stringify(result));
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.$disconnect());
