"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteButton({ productId }: { productId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/stock");
      router.refresh();
    } else {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2 pr-1">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="tap text-sm font-medium text-ink-soft"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="tap rounded-full bg-danger px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Delete this item"
      className="tap mr-1 grid h-9 w-9 place-items-center rounded-full text-ink-soft active:bg-canvas"
    >
      <Trash2 size={18} />
    </button>
  );
}
