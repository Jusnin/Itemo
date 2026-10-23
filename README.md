# ITEMO!

> Scan it. Find it. Check your stock.

A personal inventory app for households: photograph what you buy, find it again by
its own photo, and check what's left before buying more.

**Live demo:** https://jusnin.github.io/Itemo/

This is a working demo built to accompany a business plan, not a production app.
See [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) for the reasoning behind
every choice and [`docs/ISSUES.md`](docs/ISSUES.md) for known limitations.

---

## The three features

| | |
|---|---|
| **Add Item** | Photograph a product. Name, brand and category fill in automatically where an extraction endpoint is configured; you confirm or correct everything before saving. |
| **Find Item** | Search by name or category. Results are your own saved photos. |
| **My Stock** | Quantities per product, with −/+ as you use or buy things. |

One product record holds **separate purchase records**, so the same product bought
twice keeps both purchase and expiry dates. Using an item draws from the batch
expiring soonest.

## Your data stays on your device

There is no account, no server and no database. Everything lives in your browser's
IndexedDB, including the photos. Open the site on your phone and you get your own
private copy of the demo to play with; clearing site data resets it, as does the
**Reset demo data** button at the bottom of the home screen.

## Running it locally

```bash
npm install
npm run demo     # builds, serves on your network, prints a QR code for your phone
```

Scan the QR code with your phone camera. Phone and computer must share a wifi
network. See [`START-HERE.md`](START-HERE.md) for a non-technical walkthrough.

```bash
npm run dev          # Next dev server
npm run build        # static export into out/
npm run seed:photos  # regenerate the bundled demo items
```

## Automatic label reading

The app is a static site, so there is nowhere to hide an API key. Label reading is
therefore optional and off by default — the app falls back to manual entry and
remains fully usable.

To enable it, deploy an endpoint that holds an Anthropic API key and accepts
`{ imageBase64 }`, then set the repository variable `ANALYZE_URL` to its address.
The build wires it in via `NEXT_PUBLIC_ANALYZE_URL`. Background in
[`docs/ISSUES.md`](docs/ISSUES.md) ISSUE-1.

## Stack

Next.js (static export) · TypeScript · Tailwind CSS · IndexedDB · GitHub Pages.
No backend, no build-time secrets, no native dependencies.

## Deployment

Every push to `main` builds and publishes to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Credits

Logo, sock mark and folder artwork are the ITEMO! brand assets, extracted from the
product documents in [`docs/`](docs/). Brand colours `#9A7CC5` and `#FDC904`.
