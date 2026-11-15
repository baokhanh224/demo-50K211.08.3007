import { db } from "../lib/db";
import { demoDataPlan, expandDemoData } from "../lib/expand-demo";

async function main() {
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify({ mode: "dry-run", ...(await demoDataPlan()) }));
    return;
  }
  const result = await expandDemoData((category, added) => console.log(JSON.stringify({ category, added })));
  console.log(JSON.stringify({ mode: "complete", ...result }));
}
main().catch(error => {
  console.error("Không thể bổ sung dữ liệu mẫu:", error.message);
  if (error.fields) console.error(JSON.stringify(error.fields));
  process.exitCode = 1;
}).finally(() => db.$disconnect());
