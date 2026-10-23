# ITEMO — Issues & Open Decisions

Risks, constraints and decisions that need an answer. `OPEN` needs a call from you; `DECIDED` is settled and recorded here so it doesn't get re-litigated; `ACCEPTED` is a known limitation we are deliberately living with for the demo.

---

### ISSUE-1 — How does the recipient get Anthropic API access? · **OPEN** · blocks T3.4

The scan feature needs an API key. Shipping yours inside a zip exposes it; asking a non-technical recipient to create an Anthropic account kills the "double-click and go" handover.

| Option | Recipient effort | Risk |
|---|---|---|
| **A. Hosted proxy** — a Vercel endpoint holding your key, called by the local app | None | Your key is used by anyone with the build; needs a shared token + daily cap |
| **B. Offline demo mode only** — canned results for known props | None | Not a real scan; fine for a scripted demo, falls apart if someone hands you a random object |
| **C. Recipient's own key** in `.env.local` | High | Only workable if they're technical |

**Interim decision (unblocks the build):** `/api/analyze` reads `ANTHROPIC_API_KEY` if present, otherwise falls back to offline demo mode. An optional `ANALYZE_PROXY_URL` env var switches it to option A without a code change. All three routes stay open; pick one before handover.

---

### ISSUE-2 — JSON file store has no concurrency control · **ACCEPTED**

`data/db.json` is read-modify-written on every mutation. Two simultaneous writes could lose one.

Mitigated by routing every write through a single serialised `saveDb()` queue in `src/lib/db.ts`. At demo scale (one or two people, tens of items) this is sufficient. Swapping to SQLite is roughly a day's work if the demo ever becomes a pilot.

---

### ISSUE-3 — No HTTPS over the LAN · **ACCEPTED** · constrains T3.1, T5.2

Serving on `http://192.168.x.x:3000` is not a secure context. Consequences:

- `getUserMedia()` is blocked → **use `<input capture>` instead**, which works. This is already the plan.
- Service workers won't register → no offline caching, no true PWA install.
- Add-to-Home-Screen still works on iOS and Android; the app will still look native enough.

Route B (`npm run share`, Cloudflare Tunnel) gives real HTTPS when any of this matters.

---

### ISSUE-4 — Venue wifi may block phone → laptop · **MITIGATED** · T5.5

Guest and corporate networks often enable client isolation, which silently breaks the LAN URL. Two fallbacks, both must be tested before demo day:

1. `npm run share` — Cloudflare Tunnel, public HTTPS URL, works from any network.
2. Laptop joins the **phone's hotspot** — no internet needed for the LAN part.

---

### ISSUE-5 — Expiry-date OCR is unreliable · **ACCEPTED** · affects T3.4

Expiry dates are often tiny, embossed, or laser-etched on dark plastic. Product names and categories read well; dates do not.

The prompt instructs the model to return `null` rather than guess, and the confirm screen is mandatory. The spec already requires this ("the app must not assume these details are accurate"). Don't demo expiry capture on a product you haven't tested.

---

### ISSUE-6 — Seed photos are placeholders · **OPEN** · T5.3

The seeded dataset ships with generated placeholder images. They look deliberate but they are not product photographs, and Find Item is the screen where photo quality carries the whole feature.

Needs ~15 real photos of household products taken on a phone before the demo. This is the highest-value hour of work in the project and it needs you, not code.

---

### ISSUE-7 — Node is still a prerequisite · **ACCEPTED** · T5.4

The recipient must install Node LTS before anything works. Bundling a standalone binary (Node SEA / pkg) would remove this but costs more than it's worth for a demo.

`START-HERE.md` links directly to the nodejs.org LTS download and says to take the default options. Also note the macOS firewall prompt on first run — "click Allow" — which otherwise looks like a failure.

---

### ISSUE-8 — First-run `npm install` takes a few minutes · **MITIGATED**

Dependencies are deliberately minimal (no shadcn CLI, no component library, no animation library, nothing requiring `node-gyp`) so install is fast and can't fail on a toolchain we can't see.

The launcher scripts print a "this takes a few minutes the first time" message so the wait doesn't read as a hang.

---

### ISSUE-9 — Dependency versions in the plan were stale · **RESOLVED** · 2026-10-21

The first scaffold pinned `@anthropic-ai/sdk@^0.68.0` and `zod@^3`. Neither worked:
`messages.parse` and the `helpers/zod` subpath don't exist in SDK 0.68, and the
current `zodOutputFormat` requires Zod 4's internals.

Now on `@anthropic-ai/sdk@^0.137.0` and `zod@^4.6.7`. Worth re-checking before
handover — a stale pin fails at build time on the recipient's machine, which is
the worst place to find out.

---

### ISSUE-10 — Login and Sign Up do nothing · **OPEN** · T6.7

`docs/ItemO!-2.pdf` shows a welcome screen with Login and Sign Up. There is no
account system in the demo, so both buttons navigate straight to Home and a small
"Demo mode — no account needed" line sits underneath.

That is the fastest path on stage, but if the pitch needs to *show* an onboarding
flow, the alternative is a dummy form — two fields, no validation, any input
continues. Half a day. Your call which story the business plan is telling.

---

### ISSUE-11 — Welcome screen is unskippable on every visit · **ACCEPTED** · T6.3

`/` always shows the welcome screen, so reopening the app means one extra tap.
Deliberate: the welcome screen *is* the startup page the spec asks for, and a
demo benefits from always opening on the branded screen.

Note the manifest's `start_url` is `/home`, so an Add-to-Home-Screen install opens
straight into the app and skips it.

---

### ISSUE-12 — New spec drops the "avoid unnecessary features" guardrail · **NOTED**

The original `app itemo.pdf` §4 explicitly ruled out social sharing, complex
analytics, AI shopping recommendations and advanced dashboards. `ITEMO!.pdf` does
not carry that paragraph forward.

Nothing to build — but the demo scope still follows the old guardrail, because it
is what keeps this shippable in a week. If the omission was deliberate and one of
those features is now wanted, it needs to be scoped as new work rather than
assumed in.

---

### ISSUE-13 — Static hosting forced the data layer into the browser · **RESOLVED** · 2026-10-23

GitHub Pages serves static files only — it cannot run the Next.js API routes or
write to `data/db.json`. Hosting the demo as a public website meant moving the
whole store into the browser.

Products, batches and photos now live in **IndexedDB**, seeded on first visit from
`public/seed/`. What this bought:

- A public URL anyone can open on a phone, served over HTTPS.
- Installable to the home screen; the camera API is available in a secure context,
  which plain LAN HTTP never allowed (supersedes ISSUE-3).
- Every visitor gets a private copy of the demo, so a room full of people can try
  it at once without touching each other's data.

What it cost: data no longer lives on one laptop, so there is no single dataset to
curate for a demo. `npm run reset` is replaced by a **Reset demo data** button on
the home screen. ISSUE-2 (JSON file concurrency) no longer applies.

---

### ISSUE-14 — Automatic label reading is off on the public site · **OPEN**

A static site has nowhere to hide an API key, so the deployed demo falls back to
manual entry. This is the public-hosting form of ISSUE-1 and it needs the same
decision: stand up a small endpoint holding the key (Cloudflare Worker or a Vercel
function, roughly an hour), then set the repository variable `ANALYZE_URL`.

Until then the scan saves the photo and opens the confirm form with empty fields.
Everything else — Find, My Stock, purchase records — works fully.
