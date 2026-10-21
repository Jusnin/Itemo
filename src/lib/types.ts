export const CATEGORIES = [
  "Personal Care",
  "Cleaning",
  "Food & Drink",
  "Medicine",
  "Electronics",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: Category;
  heroPhotoId: string | null;
  createdAt: string;
}

/** One purchase of a product. The spec's "separate purchase record". */
export interface Batch {
  id: string;
  productId: string;
  quantity: number;
  purchaseDate: string; // YYYY-MM-DD
  expiryDate: string | null; // YYYY-MM-DD, null when not applicable
  photoId: string | null;
  createdAt: string;
}

export interface Db {
  products: Product[];
  batches: Batch[];
}

/** A product with its batches rolled up — what the UI actually renders. */
export interface StockItem extends Product {
  stock: number;
  batches: Batch[];
  /** Earliest expiry across batches that still hold stock. */
  nextExpiry: string | null;
  lastPurchase: string | null;
}
