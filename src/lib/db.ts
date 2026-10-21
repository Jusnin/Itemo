import { promises as fs } from "node:fs";
import path from "node:path";
import type { Batch, Db, Product, StockItem } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const SEED_PATH = path.join(DATA_DIR, "seed.json");
export const PHOTO_DIR = path.join(DATA_DIR, "photos");
export const SEED_PHOTO_DIR = path.join(DATA_DIR, "seed-photos");

const EMPTY: Db = { products: [], batches: [] };

export async function readDb(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Db;
  } catch {
    // First run: fall back to the seed so the app is never empty.
    try {
      const seed = JSON.parse(await fs.readFile(SEED_PATH, "utf8")) as Db;
      await writeFile(seed);
      return seed;
    } catch {
      return structuredClone(EMPTY);
    }
  }
}

async function writeFile(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // Write to a temp file then rename, so a crash mid-write can't truncate the db.
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

/**
 * Every mutation goes through here. Serialising on a single promise chain is
 * what keeps the JSON store safe at demo scale — see docs/ISSUES.md ISSUE-2.
 */
let queue: Promise<unknown> = Promise.resolve();

export function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeFile(db);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Roll batches up into the product-level view the UI renders. */
export function toStockItem(product: Product, allBatches: Batch[]): StockItem {
  const batches = allBatches
    .filter((b) => b.productId === product.id)
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));

  const withStock = batches.filter((b) => b.quantity > 0 && b.expiryDate);
  const nextExpiry = withStock.length
    ? withStock.map((b) => b.expiryDate!).sort()[0]
    : null;

  return {
    ...product,
    batches,
    stock: batches.reduce((sum, b) => sum + b.quantity, 0),
    nextExpiry,
    lastPurchase: batches[0]?.purchaseDate ?? null,
  };
}

export function allStock(db: Db): StockItem[] {
  return db.products.map((p) => toStockItem(p, db.batches));
}

/**
 * FEFO: consume from the batch expiring soonest that still has stock.
 * Batches with no expiry date are used last.
 */
export function decrement(db: Db, productId: string, by = 1): void {
  let remaining = by;
  const candidates = db.batches
    .filter((b) => b.productId === productId && b.quantity > 0)
    .sort((a, b) => {
      if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate);
      if (a.expiryDate) return -1;
      if (b.expiryDate) return 1;
      return a.purchaseDate.localeCompare(b.purchaseDate);
    });

  for (const batch of candidates) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    batch.quantity -= take;
    remaining -= take;
  }
}

/** Increment adds to the most recent batch — "bought another one of these". */
export function increment(db: Db, productId: string, by = 1): void {
  const batches = db.batches
    .filter((b) => b.productId === productId)
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
  if (batches[0]) batches[0].quantity += by;
}

export function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}
