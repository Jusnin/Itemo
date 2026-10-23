"use client";

import type { Category } from "./types";

export interface Detected {
  product_name: string;
  brand: string | null;
  category: Category;
  expiry_date: string | null;
  confidence: "high" | "medium" | "low";
}

export type AnalyzeSource = "remote" | "manual";

/**
 * A static site has nowhere to hide an API key, so label reading needs an
 * endpoint that holds one. Set NEXT_PUBLIC_ANALYZE_URL at build time to enable
 * it; without one the app falls back to manual entry and still works fully.
 * See docs/ISSUES.md ISSUE-1.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_ANALYZE_URL ?? "";

export const autoDetectEnabled = Boolean(ENDPOINT);

export async function analyze(imageBase64: string): Promise<{ item: Detected | null; source: AnalyzeSource }> {
  if (!ENDPOINT) return { item: null, source: "manual" };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { item?: Detected };
    return data.item ? { item: data.item, source: "remote" } : { item: null, source: "manual" };
  } catch {
    // A failed scan must never block the demo.
    return { item: null, source: "manual" };
  }
}
