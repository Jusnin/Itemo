"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PackageX } from "lucide-react";
import type { StockItem } from "@/lib/types";
import { toStockItem } from "@/lib/stock";
import { readDb } from "@/lib/store";
import { removeProduct } from "@/lib/actions";
import { expiryStatus, formatDate } from "@/lib/format";
import { Header } from "@/components/Header";
import { Photo } from "@/components/Photo";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import { QuantityStepper } from "@/components/QuantityStepper";
import { EmptyState } from "@/components/EmptyState";
import { DeleteButton } from "@/components/DeleteButton";

export function ItemClient() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const [item, setItem] = useState<StockItem | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!id) return setItem(null);
    const db = await readDb();
    const product = db.products.find((p) => p.id === id);
    setItem(product ? toStockItem(product, db.batches) : null);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove() {
    if (!id) return;
    await removeProduct(id);
    router.push("/stock");
  }

  if (item === undefined) return <Header title="" back="/stock" />;

  if (item === null) {
    return (
      <>
        <Header title="Not found" back="/stock" />
        <EmptyState
          icon={PackageX}
          title="This item is gone"
          body="It may have been deleted. Everything else is still in My Stock."
          action={{ href: "/stock", label: "Back to My Stock" }}
        />
      </>
    );
  }

  const status = expiryStatus(item);

  return (
    <>
      <Header title={item.name} back="/stock" action={<DeleteButton onConfirm={remove} />} />
      <main className="pb-16">
        <Photo photoId={item.heroPhotoId} alt={item.name} className="h-72 w-full" iconSize={44} />

        <div className="px-5">
          <div className="mt-4 flex items-center gap-4 rounded-card border border-line bg-surface p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{item.category}</p>
              <h2 className="mt-0.5 truncate font-semibold">{item.name}</h2>
              {item.brand && <p className="truncate text-sm text-ink-soft">{item.brand}</p>}
            </div>
            <QuantityStepper productId={item.id} stock={item.stock} size="lg" onChange={load} />
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
                <span className={`shrink-0 text-sm font-semibold tabular-nums ${batch.quantity === 0 ? "text-ink-faint" : ""}`}>
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
