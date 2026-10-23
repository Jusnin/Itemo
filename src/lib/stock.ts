import type { Batch, Db, Product, StockItem } from "./types";

export function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
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
 * Batches with no expiry date are used last. Mutates in place.
 */
export function decrement(batches: Batch[], productId: string, by = 1): Batch[] {
  let remaining = by;
  const candidates = batches
    .filter((b) => b.productId === productId && b.quantity > 0)
    .sort((a, b) => {
      if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate);
      if (a.expiryDate) return -1;
      if (b.expiryDate) return 1;
      return a.purchaseDate.localeCompare(b.purchaseDate);
    });

  const touched: Batch[] = [];
  for (const batch of candidates) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    batch.quantity -= take;
    remaining -= take;
    touched.push(batch);
  }
  return touched;
}

/** Increment adds to the most recent batch — "bought another one of these". */
export function increment(batches: Batch[], productId: string, by = 1): Batch[] {
  const sorted = batches
    .filter((b) => b.productId === productId)
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
  if (!sorted[0]) return [];
  sorted[0].quantity += by;
  return [sorted[0]];
}
