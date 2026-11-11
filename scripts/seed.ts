import { seedData } from "../lib/seed";
import { db } from "../lib/db";
seedData()
  .then(() =>
    console.log("Đã nạp dữ liệu mẫu."),
  )
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
