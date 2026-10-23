"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image as ImageIcon, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { downscale } from "@/lib/downscale";
import { savePhoto } from "@/lib/store";
import { addItem } from "@/lib/actions";
import { analyze, autoDetectEnabled } from "@/lib/analyze";
import type { Detected } from "@/lib/analyze";
import { CATEGORIES } from "@/lib/types";
import type { Category } from "@/lib/types";

type Source = "remote" | "manual";

const today = () => new Date().toISOString().slice(0, 10);

export function AddClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [quantity, setQuantity] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [expiryDate, setExpiryDate] = useState("");

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    let image;
    try {
      image = await downscale(file);
    } catch {
      setError("That image could not be read. Try another photo.");
      return;
    }

    // Show the form straight away — the fields fill in underneath.
    setPreview(image.previewUrl);
    setReading(autoDetectEnabled);
    setSource(null);

    // Storing the photo and reading the label are independent; run them together.
    const stored = savePhoto(image.blob).then(setPhotoId).catch(() => setPhotoId(null));

    const { item, source } = await analyze(image.base64);
    if (item) {
      if (item.product_name) setName(item.product_name);
      if (item.brand) setBrand(item.brand);
      if (item.category) setCategory(item.category);
      if (item.expiry_date) setExpiryDate(item.expiry_date);
    }
    setSource(source);
    setReading(false);
    await stored;
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give the item a name.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const { item } = await addItem({
        name,
        brand: brand || null,
        category,
        quantity,
        purchaseDate,
        expiryDate: expiryDate || null,
        photoId,
      });
      router.push(`/item?id=${item.id}`);
    } catch {
      setSaving(false);
      setError("Could not save on this device. Check your browser allows storage.");
    }
  }

  if (!preview) {
    return (
      <main className="px-5 pb-16 pt-8">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPick}
          className="sr-only"
        />
        <div className="rounded-card border border-dashed border-line bg-canvas px-6 py-12 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
            <Camera size={28} strokeWidth={1.75} />
          </span>
          <h2 className="mt-4 font-semibold">Photograph the product</h2>
          <p className="mx-auto mt-1 max-w-[17rem] text-sm text-ink-soft">
            Point at the front of the label. The name and category fill in automatically —
            you confirm before saving.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="tap mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-semibold text-white"
        >
          <Camera size={18} /> Take a photo
        </button>
        <button
          type="button"
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.removeAttribute("capture");
              fileRef.current.click();
            }
          }}
          className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-line py-3.5 font-semibold text-ink-soft"
        >
          <ImageIcon size={18} /> Choose from library
        </button>

        {error && <Notice tone="danger">{error}</Notice>}
      </main>
    );
  }

  return (
    <form onSubmit={save} className="px-5 pb-20 pt-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preview} alt="" className="h-56 w-full rounded-card object-cover" />

      {reading && (
        <Notice tone="accent">
          <Loader2 size={15} className="animate-spin" /> Reading the label…
        </Notice>
      )}
      {!reading && source === "remote" && (
        <Notice tone="accent">
          <Sparkles size={15} /> Detected automatically — check it is right.
        </Notice>
      )}
      {!reading && source === "manual" && (
        <Notice tone="warn">
          <TriangleAlert size={15} /> Enter the details yourself — automatic detection is off.
        </Notice>
      )}

      <div className="mt-5 space-y-4">
        <Field label="Product name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hand Wash"
            className={inputClass}
            autoFocus={!reading && !name}
          />
        </Field>

        <Field label="Brand" hint="optional">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`tap rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                  category === c
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface text-ink-soft"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className={inputClass}
            />
          </Field>
          <Field label="Bought on">
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Expiry date" hint="if applicable">
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      <button
        type="submit"
        disabled={saving}
        className="tap mt-6 w-full rounded-full bg-accent py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save item"}
      </button>
      <button
        type="button"
        onClick={() => {
          setPreview(null);
          setPhotoId(null);
          setName("");
          setBrand("");
          setExpiryDate("");
          setSource(null);
        }}
        className="tap mt-3 w-full py-2 text-sm font-medium text-ink-soft"
      >
        Retake photo
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] outline-none focus:border-brand";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Notice({ tone, children }: { tone: "accent" | "warn" | "danger"; children: React.ReactNode }) {
  const tones = {
    accent: "bg-brand-soft text-brand-deep",
    warn: "bg-pop-soft text-ink",
    danger: "bg-danger-soft text-danger",
  } as const;
  return (
    <p className={`mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium ${tones[tone]}`}>
      {children}
    </p>
  );
}
