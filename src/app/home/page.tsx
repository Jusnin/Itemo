"use client";

import Link from "next/link";
import { asset } from "@/lib/asset";
import { Camera, Search, Boxes, ChevronRight } from "lucide-react";
import { useStock } from "@/lib/useStock";
import { expiryStatus } from "@/lib/format";
import { Photo } from "@/components/Photo";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import { ResetDemo } from "@/components/ResetDemo";

const ACTIONS = [
  { href: "/add", icon: Camera, title: "Add Item", blurb: "Photograph what you bought" },
  { href: "/find", icon: Search, title: "Find Item", blurb: "Search your saved photos" },
  { href: "/stock", icon: Boxes, title: "My Stock", blurb: "Check what's left" },
] as const;

export default function HomePage() {
  const { items, reload } = useStock();

  const totalUnits = items?.reduce((sum, i) => sum + i.stock, 0) ?? 0;
  const recent = (items ?? [])
    .filter((i) => i.lastPurchase)
    .sort((a, b) => (b.lastPurchase ?? "").localeCompare(a.lastPurchase ?? ""))
    .slice(0, 8);

  return (
    <main className="px-5 pb-12 pt-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/brand/logo.png")} alt="ITEMO!" className="h-9 w-auto" />
      <h1 className="mt-5 text-[1.75rem] font-semibold leading-tight tracking-tight">
        Scan it. Find it.
        <br />
        Check your stock.
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        {items === null ? "Loading…" : `${items.length} products · ${totalUnits} items at home`}
      </p>

      <nav className="mt-7 space-y-3">
        {ACTIONS.map(({ href, icon: Icon, title, blurb }) => (
          <Link
            key={href}
            href={href}
            className="tap flex items-center gap-4 rounded-card border border-line bg-surface p-4 active:bg-canvas"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep">
              <Icon size={22} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-ink-soft">{blurb}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-ink-faint" />
          </Link>
        ))}
      </nav>

      {recent.length > 0 && (
        <section className="mt-9">
          <h2 className="text-sm font-semibold text-ink-soft">Recently added</h2>
          <div className="-mx-5 mt-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex w-max snap-x gap-3 px-5 pb-2">
              {recent.map((item) => {
                const status = expiryStatus(item);
                return (
                  <li key={item.id} className="w-28 shrink-0 snap-start">
                    <Link href={`/item?id=${item.id}`} className="tap block">
                      <Photo
                        photoId={item.heroPhotoId}
                        alt={item.name}
                        className="h-28 w-28 rounded-xl border border-line"
                        iconSize={26}
                      />
                      <p className="mt-2 truncate text-xs font-medium">{item.name}</p>
                      <p className="text-xs text-ink-faint">{item.stock} left</p>
                      {status && status.tone !== "ok" && (
                        <div className="mt-1">
                          <ExpiryBadge status={status} />
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <ResetDemo onDone={reload} />
    </main>
  );
}
