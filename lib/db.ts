import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { HttpsProxyAgent } from "https-proxy-agent";
import { AsyncLocalStorage } from "node:async_hooks";
const globalDb = globalThis as unknown as { quynhPrisma?: PrismaClient };
let adapter: PrismaNeon | undefined;
if (process.env.DATABASE_URL?.includes(".neon.tech")) {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  neonConfig.webSocketConstructor = proxy
    ? class extends ws {
        constructor(address: string, protocols?: any) {
          super(address, protocols, { agent: new HttpsProxyAgent(proxy!) });
        }
      }
    : ws;
  adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
}
export const db =
  globalDb.quynhPrisma ??
  new PrismaClient((adapter ? { adapter } : {}) as Prisma.PrismaClientOptions);
globalDb.quynhPrisma = db;
const transactions = new AsyncLocalStorage<Prisma.TransactionClient>();
export const requestContext = new AsyncLocalStorage<{ token: string }>();
export async function transaction<T>(
  fn: () => T | Promise<T>,
  reset = false,
): Promise<T> {
  if (transactions.getStore()) return fn();
  return db.$transaction(
    async (tx) => {
      await tx.$queryRawUnsafe(
        "SELECT " +
          (reset ? "pg_advisory_xact_lock" : "pg_advisory_xact_lock_shared") +
          "(774411)::text",
      );
      return transactions.run(tx, fn);
    },
    { timeout: 120000, maxWait: 10000 },
  );
}
function sql(statement: string) {
  let index = 0;
  return statement.replace(/\?/g, () => "$" + ++index);
}
function normalize(value: any): any {
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalize(v)]),
    );
  return value;
}
export async function all(statement: string, ...params: any[]): Promise<any[]> {
  return normalize(
    await (transactions.getStore() || db).$queryRawUnsafe(
      sql(statement),
      ...params,
    ),
  );
}
export async function one(statement: string, ...params: any[]): Promise<any> {
  return (await all(statement, ...params))[0];
}
export async function run(statement: string, ...params: any[]) {
  const client = transactions.getStore() || db;
  const m =
    /^INSERT INTO\s+(category|unit|price_history|receipt_line|adjustment_line|invoice_line|return_line|allocation|return_allocation|movement)\b/i.exec(
      statement,
    );
  if (m) {
    const rows = await all(statement + " RETURNING id", ...params);
    return { lastInsertRowid: rows[0]?.id, changes: rows.length };
  }
  return {
    changes: await client.$executeRawUnsafe(sql(statement), ...params),
    lastInsertRowid: 0,
  };
}
export async function code(prefix: string) {
  const row = await one(
    "INSERT INTO sequence(prefix,value) VALUES (?,1) ON CONFLICT(prefix) DO UPDATE SET value=sequence.value+1 RETURNING value",
    prefix,
  );
  return prefix + String(row.value).padStart(prefix === "NCC" ? 3 : 4, "0");
}
// Lock products and their source rows in a stable order before reading or changing stock.
export async function lockProducts(ids: string[]) {
  const sorted = [...new Set(ids)].sort();
  if (!sorted.length) return;
  await all(
    `SELECT id FROM product WHERE id IN (${sorted.map(() => "?").join(",")}) ORDER BY id FOR UPDATE`,
    ...sorted,
  );
  await all(
    `SELECT id FROM receipt_line WHERE product_id IN (${sorted.map(() => "?").join(",")}) ORDER BY id FOR UPDATE`,
    ...sorted,
  );
}
export const now = () => new Date().toISOString();
export const day = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export function datePlus(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return day(d);
}
