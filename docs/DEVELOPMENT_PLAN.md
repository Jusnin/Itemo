# ITEMO! — Spec Review & Development Plan

*Target: a working demo to show alongside the business plan, handed to someone else who runs it on their own laptop and opens it on their phone. Optimised for speed of build, quality of presentation, and zero setup for the recipient — not for production scale.*

---

## 1. Review of the spec

### What's good
The scope is genuinely tight — three features, one home screen, an explicit "avoid these" list. That is unusually disciplined for a pitch doc and it is the main reason this is buildable in about a week. Keep that discipline.

"Scan it. Find it. Check your stock." is a strong product line and it maps 1:1 onto the three home buttons. The demo should follow that same order.

### Ambiguities to settle before coding

| # | Issue | Resolution I'd recommend |
|---|---|---|
| 1 | **Product vs. purchase record.** Page 2 asks for "one main product record… with separate purchase records." This is the only structurally complex part of the whole app. | Two collections: `products` (identity: name, category, photo) and `batches` (one entry per purchase: date, expiry, quantity). Stock = sum of batch quantities. Settled in §3. |
| 2 | **Where does quantity live?** Feature 1 says "quantity purchased", Feature 3 says "quantity of each item". | Quantity lives on the **batch**. The product's stock is the sum. Decrementing pulls from the earliest-expiring batch first (FEFO). |
| 3 | **Purchase date: auto or manual?** Page 1 says "record the purchase date"; page 3 says it's "automatically recorded on the day user scanned". | Default to today, always editable. Both statements hold. |
| 4 | **"Visual search" is not image search.** Feature 2 searches by *name or category* and *displays results as photos*. | Build text search over a photo grid. Do **not** build image-similarity search — it's weeks of work and the spec doesn't ask for it. |
| 5 | **Expiry OCR reliability.** Expiry dates are often tiny, embossed, or laser-etched. Name and category extraction is reliable; expiry is not. | Treat expiry as best-effort. The confirm screen is mandatory, which the spec already requires ("must not assume these details are accurate"). |
| 6 | **No user accounts mentioned.** | None. One device, one dataset, no login screen. See §3. |

### Gaps worth one line of scope each
- **Delete / mark as finished** — users will ask immediately when a demo item hits zero.
- **Empty states** — the first screen a new viewer sees is empty. It needs to look designed, not broken.
- **Units** — skip. "3" not "3 × 500ml". Adding units costs a day and adds nothing to the pitch.

---

## 2. Tech stack

**Two decisions drive everything: mobile web rather than native, and a plain file-based store rather than a hosted database.**

Mobile web, because a URL opens on any phone in the room, mirrors to a projector, and needs no TestFlight invite or review queue. The camera, the photo library and Add-to-Home-Screen all work from the browser.

No hosted database, because you're shipping this to someone else. Supabase (or any cloud DB) means an account, a project, API keys pasted into a `.env`, and a schema migration before the app will even start. That is four ways for a recipient to fail before seeing the product. **The whole dataset is a JSON file and a folder of photos inside the project.** It ships pre-seeded, so the app looks alive the first time it opens, and `npm run reset` returns it to the seeded state between demos.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | One repo for the UI, the local file store, and the API route that calls Claude. One command to run. |
| Styling | **Tailwind CSS + shadcn/ui** | Good-looking, consistent components without a designer. This is where the "good design" requirement gets met cheaply. |
| Icons / motion | **lucide-react** + **framer-motion** | A few well-placed transitions make a demo feel finished. |
| Data | **`data/db.json`** read/written by API route handlers | No database, no driver, no native module, no migration. Human-readable, diffable, trivially seedable and resettable. |
| Photos | **`data/photos/`**, served via `/api/photo/[id]` | Plain files on disk. Keeps them out of the build and out of browser storage. |
| AI extraction | **Claude Opus 5** (`claude-opus-5`) vision, called from a route handler | Reads product labels well and returns structured JSON directly. See §7 for how the recipient gets access without an API key. |
| Camera | `<input type="file" accept="image/*" capture="environment">` | One line, opens the native camera on iOS and Android — and crucially it works over plain `http://` on a local network, which `getUserMedia` does not. |
| Sharing to the phone | **LAN URL + terminal QR code** | Recipient runs one command, scans the code, the app is on their phone. §7. |

A JSON file is obviously not a real database. It's the right call at this size — a demo holds tens of items, not thousands, and one person is using it at a time. The migration path when it stops being right is a day's work, and it's worth saying on a roadmap slide rather than building now.

### On the AI call
Use structured outputs so the model returns a typed object rather than prose to parse:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const ItemSchema = z.object({
  product_name: z.string(),
  brand: z.string().nullable(),
  category: z.enum(["Personal Care", "Cleaning", "Food & Drink",
                    "Electronics", "Medicine", "Other"]),
  expiry_date: z.string().nullable(),   // ISO date, null if not legible
  confidence: z.enum(["high", "medium", "low"]),
});

const result = await client.messages.parse({
  model: "claude-opus-5",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
      { type: "text", text: "Identify this product from its packaging. If the expiry date is not clearly legible, return null — do not guess." },
    ],
  }],
  output_config: { format: zodOutputFormat(ItemSchema) },
});
```

**Cost:** Opus 5 is $5 / $25 per million input / output tokens. A phone photo downscaled to ~1100px is roughly 1,600 input tokens, and the response is a couple of hundred output tokens — about **1.5 cents per scan**. A few hundred demo scans cost less than a coffee, so there is no reason to optimise this before the pitch. If scan volume ever becomes a real line item, Haiku 4.5 ($1 / $5) is the lever — measure accuracy on your own photos before switching.

Two things that matter on stage: **downscale the image client-side** before upload (a 12MP photo is slow to send and no more accurate), and **show the confirm form immediately** with fields filling in as the response arrives, rather than a blocking spinner. Perceived speed is most of the demo.

---

## 3. Data model

One file, `data/db.json`:

```jsonc
{
  "products": [
    { "id": "p_01", "name": "Dettol Hand Wash", "brand": "Dettol",
      "category": "Personal Care", "heroPhotoId": "ph_01",
      "createdAt": "2026-10-18T09:12:00Z" }
  ],
  "batches": [
    { "id": "b_01", "productId": "p_01", "quantity": 2,
      "purchaseDate": "2026-10-18", "expiryDate": "2027-06-01",
      "photoId": "ph_01", "createdAt": "2026-10-18T09:12:00Z" }
  ]
}
```

Photos live at `data/photos/<photoId>.jpg` and are served through `/api/photo/[id]`.

- **Stock for a product** = sum of its batch quantities.
- **Decrement** removes from the batch with the earliest expiry date that still has stock (FEFO).
- **Add an item** → look for an existing product with a matching name; attach a new batch if found, otherwise create the product and its first batch. This is what makes "one main record, separate purchase records" work without the user thinking about it.
- **No user IDs.** The dataset belongs to whoever is running the server. Multi-user is a roadmap slide, not a demo feature.

**Writes:** read the file, mutate, write back through a single `saveDb()` helper that serialises calls. At demo scale that is entirely sufficient; two people tapping at once will not corrupt it if every write goes through that one function.

**Seeding and reset:** `data/seed.json` and `data/seed-photos/` ship in the repo. `npm run reset` copies them over `data/db.json` and `data/photos/`. Run it between demos and every run starts identical.

---

## 4. Screens

Six screens. Mobile-first, one column, large touch targets.

0. **Welcome** (`/`) — the startup screen from `docs/ItemO!-2.pdf`: the logo on the
   torn-paper folder, "WELCOME", the tagline, and Login / Sign Up. Both buttons go
   straight to Home; there is no account system and none is planned for the demo.
1. **Home** (`/home`) — the three buttons (Add Item / Find Item / My Stock) as large cards, plus a horizontal strip of recently added items with their photos. Stock counts on each card.
2. **Add Item** — camera or upload → downscale → "Reading the label…" → confirm form pre-filled with name, category, purchase date (today) and expiry if detected. Every field editable. Save.
3. **Find Item** — search field, category chips, results as a photo grid. The user's own photos are the search results; that is the product's signature moment.
4. **My Stock** — list grouped by category: thumbnail, name, quantity with −/+ steppers, expiry badge (red when expired, amber within 7 days).
5. **Item Detail** — large photo, the batch list (each with its own purchase and expiry date), adjust quantity, edit, delete.

**Brand** (from `docs/ITEMO!.pdf` §2): purple `#9A7CC5` and yellow `#FDC904`, with
the ITEMÖ! wordmark and sock artwork extracted from the source PDFs into
`public/brand/`. Purple only reaches ~3.4:1 against white, so it carries fills,
chips and icon tiles while primary buttons stay near-black — which also matches
the Login button in the welcome mockup. Yellow marks items expiring soon.

**Design direction:** white/near-black base, purple and yellow accents, generous whitespace, 16px rounded cards, photos doing the visual work. Three things carry a demo: real-looking seeded data, consistent spacing, and transitions that aren't janky.

---

## 5. Build plan — 5 working days

| Day | Work | Done when |
|---|---|---|
| **1** | Next.js + Tailwind + shadcn scaffold. `db.json` read/write helpers, photo route handler, seed data and `npm run reset`. The LAN + QR start script (§7). | The seeded app opens on your phone by scanning a QR code from the terminal. |
| **2** | Home, My Stock, Item Detail against the seeded data. Quantity steppers writing to `db.json`. | You can browse and adjust stock, and the changes survive a restart. |
| **3** | Add Item: camera capture, client-side downscale, photo save, the `/api/analyze` route, the confirm form, product/batch merge logic. | You can photograph a real bottle and it lands in My Stock with the right name. |
| **4** | Find Item: search, category chips, photo grid, detail sheet. Empty states. Delete. Offline demo mode (§7). | All three home buttons work end to end, with and without an internet connection. |
| **5** | Design pass: spacing, typography, transitions, expiry badges, app icon and manifest. Seed ~15 realistic household items with good photos. Write `START-HERE.md`, test the handover on a clean machine. Rehearse. | Someone who has never seen the repo can run it in under five minutes. |

Add 2–3 days of buffer if this is part-time work. Nothing on the critical path depends on anything external, so the schedule is yours to compress.

### Explicitly out of scope for the demo
Multi-user households, accounts, sync across devices, barcode lookup against a product database, shopping lists, notifications, analytics, dark mode. Each is a credible *roadmap* slide — which is more useful in a business plan than a half-built feature.

---

## 6. Demo-day notes

The riskiest moment is the live scan: it depends on the venue's wifi and on whatever object is to hand. Three precautions:

1. **Ship it seeded.** Never demo onto an empty app — Find and My Stock need content to be legible. `npm run reset` guarantees this before every run.
2. **Bring your own props.** Two or three products you have already tested, with clean, well-lit labels.
3. **Keep a fallback path.** If the API call fails, the confirm form should still open with empty fields so you can type the name and carry on. A demo that degrades to manual entry survives; one that shows an error screen does not. Offline demo mode (§7) is the stronger version of this.

Suggested running order, which mirrors the product line: scan a real item on stage (**Scan it**) → search for something seeded (**Find it**) → decrement a quantity (**Check your stock**). Under ninety seconds end to end.

### Success measure from the spec, made testable
- Add an item: **under 15 seconds** from tapping Add to saved.
- Retrieve a saved photo: **under 3 seconds** from tapping Find.
- Check remaining quantity: **2 taps** from home.

Time these during the day-5 rehearsal. They are also the numbers worth putting on a slide.

---

## 7. Packaging and handover

The goal: the recipient unzips a folder, double-clicks one file, scans a QR code, and is demoing on their phone.

### What they receive

```
itemo-demo/
  START-HERE.md          ← one page, five lines, with a screenshot
  start-mac.command      ← double-click on macOS
  start-windows.bat      ← double-click on Windows
  data/                  ← seeded db.json + photos, ready to go
  src/ ...               ← the app
```

`START-HERE.md` says exactly this and nothing more: install Node LTS from nodejs.org, double-click the start file, wait for the QR code, scan it with your phone's camera, keep phone and laptop on the same wifi.

The launcher scripts run `npm install` on first use (and skip it afterwards), then `npm run demo`.

### The start script

`npm run demo` builds if needed, starts Next on `0.0.0.0:3000`, finds the machine's LAN address from `os.networkInterfaces()`, and prints:

```
  ITEMO is running.

  On this computer:   http://localhost:3000
  On your phone:      http://192.168.1.42:3000

  ▄▄▄▄▄▄▄ ▄  ▄▄ ▄▄▄▄▄▄▄
  █ ▄▄▄ █ ▀█▄▀▄ █ ▄▄▄ █     ← scan this with the phone camera
  ...
```

The QR code comes from `qrcode-terminal`, about three lines of code. It is the single highest-leverage detail in the whole handover — it removes the step where someone mistypes an IP address.

### Delivery options, in order of preference

| | Route | Recipient needs | HTTPS | Use when |
|---|---|---|---|---|
| **A** | **Local Node + LAN + QR** *(recommended)* | Node LTS, same wifi as the phone | No | The default. Data stays on their machine, works without internet once scanning is handled. |
| **B** | **Local + `npm run share`** (Cloudflare Tunnel, bundled) | Node, internet | Yes | Venue wifi blocks device-to-device, or the demo is remote. One extra command, prints a public `https://…trycloudflare.com` link. |
| **C** | **You host it on Vercel** | Nothing — just a link | Yes | Zero friction, but data is shared and lives on your deployment. Worth having as a backup link regardless. |
| **D** | Docker | Docker Desktop | No | Only if the recipient already lives in Docker. More friction than Node for everyone else. |

Build **A**, and add **B** as a one-line npm script — it's the escape hatch for the two failure modes you can't control (guest wifi with client isolation, and remote demos). Keep **C** deployed as a backup URL you can text to someone when everything else fails.

### Three gotchas worth designing around

**The API key.** This is the real blocker in "send the app to someone else", and it has nothing to do with the database. The scan feature needs Anthropic API access, and you do not want to ship your key in a zip file, nor make a non-technical recipient create an account. Three options:

- **Hosted proxy (recommended).** Deploy a tiny endpoint on Vercel that holds *your* key and forwards the image to Claude. The local app calls it. The recipient configures nothing. Protect it with a shared token baked into the build and a simple per-day request cap, so a leaked build can't run up a bill.
- **Offline demo mode (build this too, it's half a day).** A toggle that returns canned recognition results for your known demo props. The app then works with no key and no internet at all. This is the safety net that makes a live scan on stage a low-risk move rather than a gamble.
- **Their own key** in `.env.local`. Only reasonable if the recipient is technical and already has an Anthropic account.

**HTTP on the LAN.** Serving over plain `http://192.168.x.x` is why the plan uses a file input with `capture` rather than `getUserMedia` — the file input works, `getUserMedia` is blocked outside a secure context. Add-to-Home-Screen still works and the app will look native enough. A service worker won't register, so there's no offline caching over LAN — use route B if that matters.

**First-run friction.** macOS will show a firewall prompt the first time Node listens on the network — `START-HERE.md` should say "click Allow" with a screenshot. Also pin the Node version in `package.json` `engines` and keep `npm install` working on Node LTS, so there's no native module to compile. The JSON store exists partly for this reason: no `node-gyp`, no build toolchain, nothing to go wrong on a machine you can't see.

### Test the handover
On day 5, copy the zip to a machine that has never run the project — ideally someone else's — and walk through `START-HERE.md` without helping. Every question they ask is a line that needs rewriting. This takes twenty minutes and is the difference between a demo that gets shown and one that gets abandoned at step two.
