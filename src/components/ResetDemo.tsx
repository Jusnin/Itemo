"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { seed } from "@/lib/store";

/** Replaces the in-app data with the shipped demo set — the old `npm run reset`,
 *  now something anyone can do from their own phone before showing someone. */
export function ResetDemo({ onDone }: { onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    await seed();
    setBusy(false);
    setConfirming(false);
    onDone();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="tap mx-auto mt-10 flex items-center gap-1.5 text-xs font-medium text-ink-faint"
      >
        <RotateCcw size={13} /> Reset demo data
      </button>
    );
  }

  return (
    <div className="mt-10 rounded-card border border-line p-4 text-center">
      <p className="text-sm font-medium">Restore the demo items?</p>
      <p className="mt-1 text-xs text-ink-soft">
        Anything you added on this device will be removed.
      </p>
      <div className="mt-3 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="tap rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="tap rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Resetting…" : "Reset"}
        </button>
      </div>
    </div>
  );
}
