// Generates the seeded dataset: data/seed.json + data/seed-photos/*.svg
// Placeholders are deliberately designed rather than grey boxes, but they are
// still placeholders — see docs/ISSUES.md ISSUE-6.
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const SEED_PHOTOS = path.join(ROOT, "data", "seed-photos");

const PALETTE = {
  "Personal Care": ["#E8F0FE", "#C6DAFC", "#1B4FA8"],
  Cleaning: ["#E6F7F1", "#BDEBDC", "#0F6B4F"],
  "Food & Drink": ["#FFF2E3", "#FFDCB8", "#9A4E09"],
  Medicine: ["#FDE9EC", "#F9C8D1", "#A31B3C"],
  Electronics: ["#EFEBFB", "#D6CCF5", "#4A2FA8"],
  Other: ["#F1F2F4", "#DCDFE4", "#44474D"],
};

/** name, brand, category, qtyPerBatch[], purchase offsets (days ago), expiry offsets (days from today, null = n/a) */
const ITEMS = [
  ["Hand Wash", "Dettol", "Personal Care", [[2, 68, 420], [1, 9, 610]]],
  ["Shampoo", "Head & Shoulders", "Personal Care", [[1, 31, 540]]],
  ["Toothpaste", "Colgate", "Personal Care", [[3, 12, 730]]],
  ["Body Lotion", "Nivea", "Personal Care", [[1, 96, 300]]],
  ["Dish Soap", "Sunlight", "Cleaning", [[2, 23, null]]],
  ["Laundry Detergent", "Breeze", "Cleaning", [[1, 47, null]]],
  ["Surface Spray", "Mr Muscle", "Cleaning", [[2, 6, null]]],
  ["Bin Bags", "Glad", "Cleaning", [[4, 15, null]]],
  ["Olive Oil", "Bertolli", "Food & Drink", [[1, 40, 390]]],
  ["Instant Coffee", "Nescafé", "Food & Drink", [[2, 11, 480]]],
  ["Rice 5kg", "Jasmine", "Food & Drink", [[1, 54, 210]]],
  ["Milk 1L", "Farmhouse", "Food & Drink", [[2, 3, 4]]],
  ["Paracetamol", "Panadol", "Medicine", [[1, 120, -12]]],
  ["Plasters", "Hansaplast", "Medicine", [[1, 200, 900]]],
  ["AA Batteries", "Energizer", "Electronics", [[6, 80, null]]],
  ["USB-C Cable", "Anker", "Electronics", [[2, 150, null]]],
];

const iso = (daysFromToday) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
};

function photoSvg(name, brand, category) {
  const [bg, mid, ink] = PALETTE[category];
  // Deliberately wordless: a clean product silhouette reads as a photo stand-in
  // and never competes with the real product name in the UI.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${mid}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect x="272" y="236" width="256" height="380" rx="40" fill="#fff" opacity="0.78"/>
  <rect x="352" y="160" width="96" height="88" rx="20" fill="#fff" opacity="0.78"/>
  <rect x="306" y="372" width="188" height="150" rx="16" fill="${ink}" opacity="0.09"/>
</svg>`;
}

const products = [];
const batches = [];
let n = 0;

for (const [name, brand, category, purchases] of ITEMS) {
  n += 1;
  const pid = `p_seed${String(n).padStart(2, "0")}`;
  const heroPhotoId = `ph_seed${String(n).padStart(2, "0")}`;

  await fs.mkdir(SEED_PHOTOS, { recursive: true });
  await fs.writeFile(path.join(SEED_PHOTOS, `${heroPhotoId}.svg`), photoSvg(name, brand, category), "utf8");

  const oldest = Math.max(...purchases.map(([, ago]) => ago));
  products.push({
    id: pid,
    name,
    brand,
    category,
    heroPhotoId,
    createdAt: new Date(Date.now() - oldest * 864e5).toISOString(),
  });

  purchases.forEach(([qty, daysAgo, expiryIn], i) => {
    batches.push({
      id: `b_seed${String(n).padStart(2, "0")}_${i + 1}`,
      productId: pid,
      quantity: qty,
      purchaseDate: iso(-daysAgo),
      expiryDate: expiryIn === null ? null : iso(expiryIn),
      photoId: heroPhotoId,
      createdAt: new Date(Date.now() - daysAgo * 864e5).toISOString(),
    });
  });
}

await fs.writeFile(
  path.join(ROOT, "data", "seed.json"),
  JSON.stringify({ products, batches }, null, 2),
  "utf8",
);

console.log(`Seed written: ${products.length} products, ${batches.length} batches, ${products.length} photos.`);
