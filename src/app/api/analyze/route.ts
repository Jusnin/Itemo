import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { CATEGORIES } from "@/lib/types";

export const maxDuration = 60;

const DetectedItem = z.object({
  product_name: z.string().describe("Product name as printed, without the brand"),
  brand: z.string().nullable(),
  category: z.enum(CATEGORIES),
  expiry_date: z.string().nullable().describe("ISO YYYY-MM-DD, or null if not clearly legible"),
  confidence: z.enum(["high", "medium", "low"]),
});

const PROMPT = `Identify this household product from its packaging.

- product_name: the product as printed, without the brand (e.g. "Hand Wash", not "Dettol Hand Wash").
- brand: the manufacturer if visible, otherwise null.
- category: the best fit from the allowed list.
- expiry_date: only if a date is clearly legible. Expiry dates are often tiny, embossed or laser-etched. If you cannot read one with confidence, return null — do not guess, and never infer a date from the manufacture date.
- confidence: how sure you are about the product name.`;

/** Offline mode: scripted results for rehearsed props, else a blank form.
 *  Never invents a product — see docs/ISSUES.md ISSUE-1 and ISSUE-5. */
async function offlineResult() {
  try {
    const file = path.join(process.cwd(), "data", "demo-recognitions.json");
    const canned = JSON.parse(await fs.readFile(file, "utf8")) as unknown[];
    if (Array.isArray(canned) && canned.length > 0) {
      const pick = canned[Math.floor(Math.random() * canned.length)];
      return { item: pick, source: "demo" as const };
    }
  } catch {
    // no script file — fall through to manual entry
  }
  return {
    item: { product_name: "", brand: null, category: "Other", expiry_date: null, confidence: "low" },
    source: "manual" as const,
  };
}

export async function POST(req: Request) {
  const { imageBase64 } = (await req.json()) as { imageBase64?: string };
  if (!imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  // Option A from ISSUE-1: a hosted endpoint holds the key instead of this machine.
  const proxy = process.env.ANALYZE_PROXY_URL;
  if (proxy) {
    try {
      const res = await fetch(proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!res.ok) throw new Error(String(res.status));
      return NextResponse.json({ ...(await res.json()), source: "proxy" });
    } catch {
      return NextResponse.json(await offlineResult());
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(await offlineResult());
  }

  try {
    const client = new Anthropic();
    const message = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 1024,
      // Low effort: this is a short extraction, and latency is what the demo feels.
      output_config: { effort: "low", format: zodOutputFormat(DetectedItem) },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: imageBase64 },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json(await offlineResult());
    }

    return NextResponse.json({ item: message.parsed_output, source: "claude" });
  } catch (error) {
    // A failed scan must never block the demo — fall back to manual entry.
    console.error("[analyze]", error instanceof Error ? error.message : error);
    return NextResponse.json(await offlineResult());
  }
}
