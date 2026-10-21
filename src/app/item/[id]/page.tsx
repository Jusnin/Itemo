import { notFound } from "next/navigation";
import { readDb, toStockItem } from "@/lib/db";
import { expiryStatus, formatDate } from "@/lib/format";
import { Header } from "@/components/Header";
import { Photo } from "@/components/Photo";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import { QuantityStepper } from "@/components/QuantityStepper";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const product = db.products.find((p) => p.id === id);
  if (!product) notFound();

  const item = toStockItem(product, db.batches);
  const status = expiryStatus(item);

  return (
    <>
      <Header title={item.name} back="/stock" action={<DeleteButton productId={item.id} />} />
      <main className="pb-16">
        <Photo photoId={item.heroPhotoId} alt={item.name} className="h-72 w-full" iconSize={44} />

        <div className="px-5">
          <div className="mt-4 flex items-center gap-4 rounded-card border border-line bg-surface p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                {item.category}
              </p>
              <h2 className="mt-0.5 truncate font-semibold">{item.name}</h2>
              {item.brand && <p className="truncate text-sm text-ink-soft">{item.brand}</p>}
            </div>
            <QuantityStepper productId={item.id} stock={item.stock} size="lg" />
          </div>

          {status && status.tone !== "ok" && (
            <div className="mt-4">
              <ExpiryBadge status={status} />
            </div>
          )}

          <h3 className="mb-2 mt-7 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Purchase records
          </h3>
          <ul className="divide-y divide-line rounded-card border border-line">
            {item.batches.map((batch) => (
              <li key={batch.id} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Bought {formatDate(batch.purchaseDate)}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {batch.expiryDate ? `Expires ${formatDate(batch.expiryDate)}` : "No expiry date"}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    batch.quantity === 0 ? "text-ink-faint" : ""
                  }`}
                >
                  {batch.quantity} left
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-faint">
            Using an item takes from the batch expiring soonest.
          </p>
        </div>
      </main>
    </>
  );
}
