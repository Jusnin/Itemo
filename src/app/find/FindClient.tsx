"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SearchX, X } from "lucide-react";
import type { StockItem } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { expiryStatus } from "@/lib/format";
import { Photo } from "@/components/Photo";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import { EmptyState } from "@/components/EmptyState";

export function FindClient({ items }: { items: StockItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((item) => {
      if (category && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.brand?.toLowerCase().includes(q) ?? false) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, query, category]);

  const used = CATEGORIES.filter((c) => items.some((i) => i.category === c));

  return (
    <main className="pb-16">
      <div className="sticky top-[57px] z-10 bg-surface px-5 pb-3 pt-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or category"
            autoComplete="off"
            className="w-full rounded-full border border-line bg-canvas py-2.5 pl-10 pr-10 text-[16px] outline-none placeholder:text-ink-faint focus:border-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-faint active:bg-line"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="-mx-5 mt-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 px-5">
            <Chip label="All" active={category === null} onClick={() => setCategory(null)} />
            {used.map((c) => (
              <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-2">
        {results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matches"
            body={
              query
                ? `Nothing matching “${query}”. Try a shorter word, or a category.`
                : "Nothing in this category yet."
            }
          />
        ) : (
          <>
            <p className="pb-3 text-xs text-ink-faint">
              {results.length} {results.length === 1 ? "item" : "items"}
            </p>
            <ul className="grid grid-cols-2 gap-3">
              {results.map((item) => {
                const status = expiryStatus(item);
                return (
                  <li key={item.id}>
                    <Link href={`/item/${item.id}`} className="tap block">
                      <Photo
                        photoId={item.heroPhotoId}
                        alt={item.name}
                        className="aspect-square w-full rounded-card border border-line"
                        iconSize={30}
                      />
                      <p className="mt-2 truncate text-sm font-medium">{item.name}</p>
                      <p className="flex items-center gap-2 text-xs text-ink-soft">
                        <span>{item.stock} left</span>
                        {status && status.tone !== "ok" && <ExpiryBadge status={status} />}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
        active ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink-soft"
      }`}
    >
      {label}
    </button>
  );
}
