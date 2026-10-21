import { NextResponse } from "next/server";
import { id, mutate, normaliseName, toStockItem } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";
import type { Batch, Category, Product } from "@/lib/types";

interface NewItemBody {
  name?: string;
  brand?: string | null;
  category?: string;
  quantity?: number;
  purchaseDate?: string;
  expiryDate?: string | null;
  photoId?: string | null;
}

/**
 * Creates a purchase record. If a product with the same name already exists it
 * gains another batch rather than a duplicate product — this is the spec's
 * "one main product record, separate purchase records" rule (plan §3).
 */
export async function POST(req: Request) {
  const body = (await req.json()) as NewItemBody;

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const category = (CATEGORIES as readonly string[]).includes(body.category ?? "")
    ? (body.category as Category)
    : "Other";

  const quantity = Number.isInteger(body.quantity) && body.quantity! > 0 ? body.quantity! : 1;
  const purchaseDate = body.purchaseDate?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const expiryDate = body.expiryDate?.slice(0, 10) || null;
  const photoId = body.photoId ?? null;

  const result = await mutate((db) => {
    let product = db.products.find((p) => normaliseName(p.name) === normaliseName(name));
    let merged = true;

    if (!product) {
      merged = false;
      product = {
        id: id("p"),
        name,
        brand: body.brand?.trim() || null,
        category,
        heroPhotoId: photoId,
        createdAt: new Date().toISOString(),
      } satisfies Product;
      db.products.push(product);
    } else if (!product.heroPhotoId && photoId) {
      // Keep the first good photo as the product's hero image.
      product.heroPhotoId = photoId;
    }

    const batch: Batch = {
      id: id("b"),
      productId: product.id,
      quantity,
      purchaseDate,
      expiryDate,
      photoId,
      createdAt: new Date().toISOString(),
    };
    db.batches.push(batch);

    return { item: toStockItem(product, db.batches), merged };
  });

  return NextResponse.json(result, { status: 201 });
}
