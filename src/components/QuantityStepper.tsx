"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";

/**
 * Optimistic by design: the number moves on tap and reconciles with the server
 * afterwards. On a demo this is the difference between "snappy" and "laggy".
 */
export function QuantityStepper({
  productId,
  stock,
  size = "md",
}: {
  productId: string;
  stock: number;
  size?: "md" | "lg";
}) {
  const [value, setValue] = useState(stock);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function change(delta: number) {
    const next = Math.max(0, value + delta);
    if (next === value) return;
    setValue(next);

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, delta }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { item } = await res.json();
      setValue(item.stock);
      startTransition(() => router.refresh());
    } catch {
      setValue(value); // roll back; never leave a wrong number on screen
    }
  }

  const btn =
    size === "lg"
      ? "h-11 w-11 text-ink"
      : "h-9 w-9 text-ink-soft";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => change(-1)}
        disabled={value === 0}
        aria-label="Use one"
        className={`tap grid place-items-center rounded-full border border-line ${btn} active:bg-canvas disabled:opacity-30`}
      >
        <Minus size={16} />
      </button>
      <span
        className={`text-center font-semibold tabular-nums ${size === "lg" ? "w-10 text-xl" : "w-7"}`}
        aria-label={`${value} in stock`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => change(1)}
        aria-label="Add one"
        className={`tap grid place-items-center rounded-full border border-line ${btn} active:bg-canvas`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
