"use client";

import type { Batch, Db, Product } from "./types";

/**
 * Everything lives in the visitor's own browser. The site is served as static
 * files from GitHub Pages — there is no server to write to, and each phone gets
 * its own private copy of the data to play with.
 */
const DB_NAME = "itemo";
const DB_VERSION = 1;

/** Bump when the bundled demo set changes, so returning visitors pick it up. */
const SEED_VERSION = 2;

type StoreName = "products" | "batches" | "photos" | "meta";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("products")) db.createObjectStore("products", { keyPath: "id" });
      if (!db.objectStoreNames.contains("batches")) db.createObjectStore("batches", { keyPath: "id" });
      if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(stores: StoreName[], mode: IDBTransactionMode, fn: (t: IDBTransaction) => Promise<T> | T): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(stores, mode);
        let result: T;
        Promise.resolve(fn(t)).then((r) => (result = r), reject);
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

const asPromise = <T,>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

/** GitHub Pages serves the app from a subpath, so asset URLs need the prefix. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const urlCache = new Map<string, string>();

// --- Seeding -------------------------------------------------------------

async function loadSeed(): Promise<{ db: Db; photos: Map<string, Blob> }> {
  const res = await fetch(`${BASE_PATH}/seed/seed.json`);
  const db = (await res.json()) as Db;

  const ids = [...new Set(db.products.map((p) => p.heroPhotoId).filter(Boolean) as string[])];
  const photos = new Map<string, Blob>();
  await Promise.all(
    ids.map(async (pid) => {
      const r = await fetch(`${BASE_PATH}/seed/photos/${pid}.svg`);
      if (r.ok) photos.set(pid, await r.blob());
    }),
  );
  return { db, photos };
}

/** Replaces everything with the shipped demo set. Also the in-app reset. */
export async function seed(): Promise<void> {
  const { db, photos } = await loadSeed();
  await tx(["products", "batches", "photos", "meta"], "readwrite", (t) => {
    t.objectStore("products").clear();
    t.objectStore("batches").clear();
    t.objectStore("photos").clear();
    for (const p of db.products) t.objectStore("products").put(p);
    for (const b of db.batches) t.objectStore("batches").put(b);
    for (const [pid, blob] of photos) t.objectStore("photos").put({ id: pid, blob });
    t.objectStore("meta").put({ key: "seeded", value: true });
    t.objectStore("meta").put({ key: "seedVersion", value: SEED_VERSION });
  });
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}

/**
 * Refreshes the shipped demo rows in place without clearing the store, so a
 * returning visitor gets the new artwork while anything they added survives.
 * Seed ids are stable (p_seed01…), so putting them again simply overwrites.
 */
async function refreshSeed(): Promise<void> {
  const { db, photos } = await loadSeed();
  await tx(["products", "batches", "photos", "meta"], "readwrite", (t) => {
    for (const p of db.products) t.objectStore("products").put(p);
    for (const b of db.batches) t.objectStore("batches").put(b);
    for (const [pid, blob] of photos) t.objectStore("photos").put({ id: pid, blob });
    t.objectStore("meta").put({ key: "seedVersion", value: SEED_VERSION });
  });
  // Cached object URLs point at the old blobs.
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}

async function ensureSeed(): Promise<void> {
  const [seeded, version] = await tx(["meta"], "readonly", async (t) => [
    await asPromise(t.objectStore("meta").get("seeded")),
    await asPromise(t.objectStore("meta").get("seedVersion")),
  ]);

  if (!seeded) return seed();
  if ((version as { value?: number } | undefined)?.value !== SEED_VERSION) return refreshSeed();
}

// --- Reads ---------------------------------------------------------------

export async function readDb(): Promise<Db> {
  await ensureSeed();
  return tx(["products", "batches"], "readonly", async (t) => ({
    products: await asPromise(t.objectStore("products").getAll() as IDBRequest<Product[]>),
    batches: await asPromise(t.objectStore("batches").getAll() as IDBRequest<Batch[]>),
  }));
}

/** Object URLs are cached for the page's lifetime — revoking per render flickers. */
export async function photoUrl(photoId: string | null): Promise<string | null> {
  if (!photoId) return null;
  const cached = urlCache.get(photoId);
  if (cached) return cached;

  const row = await tx(["photos"], "readonly", (t) =>
    asPromise(t.objectStore("photos").get(photoId) as IDBRequest<{ id: string; blob: Blob } | undefined>),
  );
  if (!row?.blob) return null;

  const url = URL.createObjectURL(row.blob);
  urlCache.set(photoId, url);
  return url;
}

// --- Writes --------------------------------------------------------------

export async function savePhoto(blob: Blob): Promise<string> {
  const photoId = `ph_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  await tx(["photos"], "readwrite", (t) => t.objectStore("photos").put({ id: photoId, blob }));
  return photoId;
}

export async function putProduct(product: Product): Promise<void> {
  await tx(["products"], "readwrite", (t) => t.objectStore("products").put(product));
}

export async function putBatches(batches: Batch[]): Promise<void> {
  await tx(["batches"], "readwrite", (t) => {
    for (const b of batches) t.objectStore("batches").put(b);
  });
}

export async function deleteProduct(productId: string, batchIds: string[]): Promise<void> {
  await tx(["products", "batches"], "readwrite", (t) => {
    t.objectStore("products").delete(productId);
    for (const bid of batchIds) t.objectStore("batches").delete(bid);
  });
}
