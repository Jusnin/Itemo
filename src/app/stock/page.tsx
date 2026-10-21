import Link from "next/link";
import { Camera } from "lucide-react";
import { allStock, readDb } from "@/lib/db";
import { expiryStatus } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import { Header } from "@/components/Header";
import { Photo } from "@/components/Photo";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import { QuantityStepper } from "@/components/QuantityStepper";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const db = await readDb();
  const items = allStock(db);

  const grouped = CATEGORIES.map((category) => ({
    category,
    items: items
      .filter((i) => i.category === category)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <Header title="My Stock" />
      <main className="px-5 pb-16 pt-4">
        {grouped.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Nothing here yet"
            body="Add your first item and it will show up here with its photo."
            action={{ href: "/add", label: "Add an item" }}
          />
        ) : (
          grouped.map(({ category, items: group }) => (
            <section key={category} className="mb-7">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {category}
              </h2>
              <ul className="divide-y divide-line rounded-card border border-line">
                {group.map((item) => {
                  const status = expiryStatus(item);
                  return (
                    <li key={item.id} className="flex items-center gap-3 p-3">
                      <Link href={`/item/${item.id}`} className="tap flex min-w-0 flex-1 items-center gap-3">
                        <Photo
                          photoId={item.heroPhotoId}
                          alt={item.name}
                          className="h-12 w-12 shrink-0 rounded-lg"
                          iconSize={20}
                        />
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate font-medium ${item.stock === 0 ? "text-ink-faint" : ""}`}>
                            {item.name}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2">
                            {item.stock === 0 ? (
                              <span className="text-xs text-ink-faint">Out of stock</span>
                            ) : (
                              status?.tone !== "ok" && <ExpiryBadge status={status} />
                            )}
                          </span>
                        </span>
                      </Link>
                      <QuantityStepper productId={item.id} stock={item.stock} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </main>
    </>
  );
}
