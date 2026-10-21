# ITEMO — Build Checklist

Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` cut from demo scope

---

## Day 1 — Foundation & handover rig

- [x] **T1.1** Scaffold Next.js (App Router) + TypeScript + Tailwind
- [x] **T1.2** `git init`, `.gitignore` (exclude `data/db.json`, `data/photos/`, `.env.local`)
- [x] **T1.3** Types: `Product`, `Batch`, `Db` in `src/lib/types.ts`
- [x] **T1.4** File store: `readDb()` / `saveDb()` with a write queue, `src/lib/db.ts`
- [x] **T1.5** Seed data: `data/seed.json` + `data/seed-photos/` (~15 household items)
- [x] **T1.6** `npm run reset` — restore seed over live data
- [x] **T1.7** `npm run demo` — start on `0.0.0.0`, print LAN URL + terminal QR code
- [x] **T1.8** Launchers: `start-mac.command`, `start-windows.bat`
- [x] **T1.9** Design tokens: colour, type scale, spacing, radius in `globals.css`

**Done when:** the seeded app opens on a phone by scanning a QR code from the terminal.

## Day 2 — Browse (Home · My Stock · Detail)

- [x] **T2.1** `GET /api/products` — products with computed stock totals
- [x] **T2.2** `GET /api/photo/[id]` — serve photo from disk
- [x] **T2.3** App shell: mobile viewport, safe-area insets, header
- [x] **T2.4** Home: three action cards + recently-added photo strip
- [x] **T2.5** My Stock: grouped by category, thumbnail, qty stepper, expiry badge
- [x] **T2.6** `POST /api/stock` — increment / decrement with FEFO batch selection
- [x] **T2.7** Item Detail: hero photo, batch list, edit, delete
- [x] **T2.8** `DELETE /api/products/[id]`

**Done when:** you can browse and adjust stock, and changes survive a restart.

## Day 3 — Add Item (the scan)

- [x] **T3.1** Camera/upload input with `capture="environment"`
- [x] **T3.2** Client-side downscale to ~1100px, JPEG re-encode
- [x] **T3.3** `POST /api/photo` — save image to `data/photos/`
- [x] **T3.4** `POST /api/analyze` — Claude Opus 5 vision + Zod structured output
- [x] **T3.5** Offline/no-key fallback path in `/api/analyze` (see ISSUE-1)
- [x] **T3.6** Confirm form — every field editable, today as default purchase date
- [x] **T3.7** Product/batch merge on save (match existing product by name)
- [x] **T3.8** Optimistic UI: form opens immediately, fields fill as the response lands

**Done when:** photographing a real product lands it in My Stock with the right name.

## Day 4 — Find Item & edges

- [x] **T4.1** `GET /api/search?q=&category=` — name + category text match
- [x] **T4.2** Find screen: search field, category chips, photo grid
- [x] **T4.3** Result → detail sheet
- [x] **T4.4** Empty states for all three screens
- [x] **T4.5** Error + offline states (never show a raw error page)
- [~] **T4.6** Loading skeletons

**Done when:** all three home buttons work end to end, with and without internet.

## Day 5 — Polish & handover test

- [ ] **T5.1** Design pass: spacing, type, transitions, expiry badge colours
- [ ] **T5.2** App icon + `manifest.json` + Add-to-Home-Screen metadata
- [ ] **T5.3** Replace placeholder seed photos with real product photographs
- [x] **T5.4** `START-HERE.md` for the recipient
- [x] **T5.5** `npm run share` — Cloudflare Tunnel escape hatch
- [ ] **T5.6** Clean-machine handover test
- [ ] **T5.7** Rehearse; time the three success measures

**Done when:** someone who has never seen the repo can run it in under five minutes.

---

## Cut from demo scope

- [-] Accounts, multi-user, cross-device sync
- [-] Barcode lookup against a product database
- [-] Shopping lists, notifications, analytics
- [-] Image-similarity search (see plan §1, ambiguity 4)
- [-] Units of measure (bottles vs. ml)
- [-] Dark mode
- [-] Offline service worker (blocked over LAN HTTP — see ISSUE-3)
