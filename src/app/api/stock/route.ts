import { NextResponse } from "next/server";
import { decrement, increment, mutate, toStockItem } from "@/lib/db";

export async function POST(req: Request) {
  const { productId, delta } = (await req.json()) as { productId?: string; delta?: number };

  if (!productId || typeof delta !== "number" || !Number.isInteger(delta) || delta === 0) {
    return NextResponse.json({ error: "productId and a non-zero integer delta are required" }, { status: 400 });
  }

  const item = await mutate((db) => {
    const product = db.products.find((p) => p.id === productId);
    if (!product) return null;

    if (delta > 0) increment(db, productId, delta);
    else decrement(db, productId, -delta);

    return toStockItem(product, db.batches);
  });

  if (!item) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ item });
}
