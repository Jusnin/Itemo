import { NextResponse } from "next/server";
import { mutate } from "@/lib/db";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { name?: string; brand?: string | null; category?: string };

  const ok = await mutate((db) => {
    const product = db.products.find((p) => p.id === id);
    if (!product) return false;

    if (typeof body.name === "string" && body.name.trim()) product.name = body.name.trim();
    if (body.brand !== undefined) product.brand = body.brand?.trim() || null;
    if (body.category && (CATEGORIES as readonly string[]).includes(body.category)) {
      product.category = body.category as Category;
    }
    return true;
  });

  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ok = await mutate((db) => {
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    db.products.splice(index, 1);
    db.batches = db.batches.filter((b) => b.productId !== id);
    return true;
  });

  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
