"use client";

import type { Batch, Category, Product, StockItem } from "./types";
import { decrement, id, increment, normaliseName, toStockItem } from "./stock";
import { deleteProduct, putBatches, putProduct, readDb } from "./store";

export interface NewItem {
  name: string;
  brand: string | null;
  category: Category;
  quantity: number;
  purchaseDate: string;
  expiryDate: string | null;
  photoId: string | null;
}

/**
 * Creates a purchase record. An existing product with the same name gains
 * another batch rather than a duplicate product — the spec's "one main product
 * record, separate purchase records" rule.
 */
export async function addItem(input: NewItem): Promise<{ item: StockItem; merged: boolean }> {
  const db = await readDb();

  let product = db.products.find((p) => normaliseName(p.name) === normaliseName(input.name));
  const merged = Boolean(product);

  if (!product) {
    product = {
      id: id("p"),
      name: input.name.trim(),
      brand: input.brand?.trim() || null,
      category: input.category,
      heroPhotoId: input.photoId,
      createdAt: new Date().toISOString(),
    } satisfies Product;
  } else if (!product.heroPhotoId && input.photoId) {
    product = { ...product, heroPhotoId: input.photoId };
  }
  await putProduct(product);

  const batch: Batch = {
    id: id("b"),
    productId: product.id,
    quantity: input.quantity,
    purchaseDate: input.purchaseDate,
    expiryDate: input.expiryDate,
    photoId: input.photoId,
    createdAt: new Date().toISOString(),
  };
  await putBatches([batch]);

  return { item: toStockItem(product, [...db.batches, batch]), merged };
}

export async function changeStock(productId: string, delta: number): Promise<StockItem | null> {
  const db = await readDb();
  const product = db.products.find((p) => p.id === productId);
  if (!product) return null;

  const touched =
    delta > 0 ? increment(db.batches, productId, delta) : decrement(db.batches, productId, -delta);
  await putBatches(touched);

  return toStockItem(product, db.batches);
}

export async function removeProduct(productId: string): Promise<void> {
  const db = await readDb();
  const batchIds = db.batches.filter((b) => b.productId === productId).map((b) => b.id);
  await deleteProduct(productId, batchIds);
}
