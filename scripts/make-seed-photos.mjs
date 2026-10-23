// Generates the bundled demo set: public/seed/seed.json + public/seed/photos/*.svg
// These are illustrations, not photographs — see docs/ISSUES.md ISSUE-6.
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const SEED_DIR = path.join(ROOT, "public", "seed");
const SEED_PHOTOS = path.join(SEED_DIR, "photos");

// Tints drawn from the ITEMO! brand purple and yellow, so the tiles read as one family.
const PALETTE = {
  "Personal Care": ["#F3EDFA", "#D7C5EE", "#6B4E96"],
  Cleaning: ["#EEEBFB", "#CFC8F1", "#53499A"],
  "Food & Drink": ["#FFF8DF", "#FFE7A0", "#8A6D12"],
  Medicine: ["#FBEBF5", "#EFC9E1", "#8C3F72"],
  Electronics: ["#EAE4F8", "#C5B6E9", "#5B4590"],
  Other: ["#F2F2F5", "#DEDEE3", "#4C4F56"],
};

/**
 * One silhouette per product type, so a grid reads as a varied shelf rather than
 * sixteen identical bottles. Drawn in an 800x800 box, body roughly x 270..530.
 * W = product body, D = cap/soft detail, A = label band.
 */
const SHAPES = {
  pump: (W, D, A) => `
    <rect x="296" y="300" width="208" height="330" rx="34" fill="${W}"/>
    <rect x="374" y="244" width="52" height="60" rx="12" fill="${W}"/>
    <path d="M400 250v-30h54a16 16 0 0 1 0 32h-16" stroke="${W}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <rect x="322" y="400" width="156" height="128" rx="14" fill="${A}"/>
    <rect x="344" y="432" width="112" height="12" rx="6" fill="${W}"/>`,

  bottle: (W, D, A) => `
    <path d="M330 630V372c0-34 18-48 18-78v-20h104v20c0 30 18 44 18 78v258z" fill="${W}"/>
    <rect x="364" y="212" width="72" height="62" rx="12" fill="${D}"/>
    <rect x="344" y="430" width="112" height="128" rx="12" fill="${A}"/>`,

  tube: (W, D, A) => `
    <path d="M342 272h116l22 296a28 28 0 0 1-28 30H348a28 28 0 0 1-28-30z" fill="${W}"/>
    <rect x="336" y="250" width="128" height="26" rx="8" fill="${D}"/>
    <rect x="372" y="596" width="56" height="42" rx="10" fill="${D}"/>
    <rect x="350" y="352" width="100" height="112" rx="12" fill="${A}"/>`,

  jar: (W, D, A) => `
    <rect x="286" y="370" width="228" height="252" rx="30" fill="${W}"/>
    <rect x="300" y="302" width="200" height="80" rx="24" fill="${D}"/>
    <rect x="322" y="438" width="156" height="116" rx="14" fill="${A}"/>`,

  slim: (W, D, A) => `
    <rect x="334" y="300" width="132" height="326" rx="26" fill="${W}"/>
    <path d="M366 302v-38h68v38z" fill="${D}"/>
    <rect x="378" y="228" width="44" height="36" rx="10" fill="${D}"/>
    <rect x="354" y="398" width="92" height="150" rx="12" fill="${A}"/>`,

  jug: (W, D, A) => `
    <path d="M300 322h200a30 30 0 0 1 30 30v248a30 30 0 0 1-30 30H300a30 30 0 0 1-30-30V352a30 30 0 0 1 30-30z" fill="${W}"/>
    <path d="M530 402h26a38 38 0 0 1 0 76h-26" stroke="${W}" stroke-width="30" fill="none" stroke-linecap="round"/>
    <rect x="378" y="258" width="80" height="66" rx="14" fill="${D}"/>
    <rect x="304" y="420" width="164" height="124" rx="14" fill="${A}"/>`,

  spray: (W, D, A) => `
    <rect x="312" y="356" width="176" height="272" rx="26" fill="${W}"/>
    <rect x="372" y="302" width="56" height="58" rx="10" fill="${W}"/>
    <path d="M372 302v-44h92v30h-40l-16 14z" fill="${D}"/>
    <rect x="330" y="284" width="44" height="26" rx="8" fill="${D}"/>
    <rect x="336" y="432" width="128" height="124" rx="14" fill="${A}"/>`,

  box: (W, D, A) => `
    <rect x="276" y="288" width="248" height="322" rx="20" fill="${W}"/>
    <rect x="276" y="288" width="248" height="54" rx="20" fill="${D}"/>
    <rect x="312" y="398" width="176" height="148" rx="14" fill="${A}"/>
    <rect x="338" y="434" width="124" height="14" rx="7" fill="${W}"/>`,

  oil: (W, D, A) => `
    <path d="M336 630V404c0-44 22-56 22-92v-44h84v44c0 36 22 48 22 92v226z" fill="${W}"/>
    <rect x="374" y="208" width="52" height="62" rx="10" fill="${D}"/>
    <rect x="352" y="450" width="96" height="132" rx="12" fill="${A}"/>`,

  coffee: (W, D, A) => `
    <rect x="300" y="332" width="200" height="294" rx="26" fill="${W}"/>
    <rect x="288" y="270" width="224" height="70" rx="22" fill="${D}"/>
    <rect x="330" y="412" width="140" height="144" rx="14" fill="${A}"/>
    <circle cx="400" cy="470" r="26" fill="${W}"/>`,

  sack: (W, D, A) => `
    <path d="M304 326c0-16 192-16 192 0v272a34 34 0 0 1-34 34H338a34 34 0 0 1-34-34z" fill="${W}"/>
    <path d="M304 326c0-18 42-68 96-68s96 50 96 68c0 16-192 16-192 0z" fill="${D}"/>
    <rect x="334" y="416" width="132" height="138" rx="14" fill="${A}"/>`,

  carton: (W, D, A) => `
    <path d="M318 332h164v268a30 30 0 0 1-30 30H348a30 30 0 0 1-30-30z" fill="${W}"/>
    <path d="M318 332l82-116 82 116z" fill="${W}"/>
    <rect x="382" y="198" width="36" height="34" rx="8" fill="${D}"/>
    <rect x="342" y="412" width="116" height="138" rx="12" fill="${A}"/>`,

  pills: (W, D, A) => `
    <rect x="280" y="320" width="240" height="264" rx="22" fill="${W}"/>
    <rect x="280" y="320" width="240" height="46" rx="22" fill="${D}"/>
    <g fill="${A}">
      <circle cx="336" cy="434" r="24"/><circle cx="400" cy="434" r="24"/><circle cx="464" cy="434" r="24"/>
      <circle cx="336" cy="508" r="24"/><circle cx="400" cy="508" r="24"/><circle cx="464" cy="508" r="24"/>
    </g>`,

  tin: (W, D, A) => `
    <rect x="268" y="356" width="264" height="202" rx="34" fill="${W}"/>
    <rect x="268" y="356" width="264" height="40" rx="20" fill="${D}"/>
    <rect x="322" y="430" width="156" height="92" rx="14" fill="${A}"/>
    <rect x="352" y="464" width="96" height="12" rx="6" fill="${W}"/>`,

  battery: (W, D, A) => `
    <rect x="296" y="290" width="92" height="296" rx="18" fill="${W}"/>
    <rect x="320" y="268" width="44" height="26" rx="8" fill="${D}"/>
    <rect x="296" y="400" width="92" height="92" rx="10" fill="${A}"/>
    <rect x="412" y="290" width="92" height="296" rx="18" fill="${W}"/>
    <rect x="436" y="268" width="44" height="26" rx="8" fill="${D}"/>
    <rect x="412" y="400" width="92" height="92" rx="10" fill="${A}"/>`,

  cable: (W, D, A) => `
    <path d="M400 290c-96 0-96 86 0 86s96 86 0 86-96 86 0 86" stroke="${W}" stroke-width="34" fill="none" stroke-linecap="round"/>
    <rect x="368" y="242" width="64" height="50" rx="12" fill="${D}"/>
    <rect x="368" y="542" width="64" height="50" rx="12" fill="${A}"/>`,
};

/** name, brand, category, shape, [[qty, days ago, expiry in days | null], ...] */
const ITEMS = [
  ["Hand Wash", "Dettol", "Personal Care", "pump", [[2, 68, 420], [1, 9, 610]]],
  ["Shampoo", "Head & Shoulders", "Personal Care", "bottle", [[1, 31, 540]]],
  ["Toothpaste", "Colgate", "Personal Care", "tube", [[3, 12, 730]]],
  ["Body Lotion", "Nivea", "Personal Care", "jar", [[1, 96, 300]]],
  ["Dish Soap", "Sunlight", "Cleaning", "slim", [[2, 23, null]]],
  ["Laundry Detergent", "Breeze", "Cleaning", "jug", [[1, 47, null]]],
  ["Surface Spray", "Mr Muscle", "Cleaning", "spray", [[2, 6, null]]],
  ["Bin Bags", "Glad", "Cleaning", "box", [[4, 15, null]]],
  ["Olive Oil", "Bertolli", "Food & Drink", "oil", [[1, 40, 390]]],
  ["Instant Coffee", "Nescafé", "Food & Drink", "coffee", [[2, 11, 480]]],
  ["Rice 5kg", "Jasmine", "Food & Drink", "sack", [[1, 54, 210]]],
  ["Milk 1L", "Farmhouse", "Food & Drink", "carton", [[2, 3, 4]]],
  ["Paracetamol", "Panadol", "Medicine", "pills", [[1, 120, -12]]],
  ["Plasters", "Hansaplast", "Medicine", "tin", [[1, 200, 900]]],
  ["AA Batteries", "Energizer", "Electronics", "battery", [[6, 80, null]]],
  ["USB-C Cable", "Anker", "Electronics", "cable", [[2, 150, null]]],
];

const iso = (daysFromToday) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
};

function photoSvg(category, shape) {
  const [bg, mid, ink] = PALETTE[category];
  const draw = SHAPES[shape] ?? SHAPES.bottle;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${mid}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <ellipse cx="400" cy="650" rx="148" ry="20" fill="${ink}" opacity="0.08"/>
  ${draw("rgba(255,255,255,0.92)", `${ink}55`, `${ink}26`)}
</svg>`;
}

const products = [];
const batches = [];

await fs.mkdir(SEED_PHOTOS, { recursive: true });

ITEMS.forEach(([name, brand, category, shape, purchases], index) => {
  const n = String(index + 1).padStart(2, "0");
  const pid = `p_seed${n}`;
  const heroPhotoId = `ph_seed${n}`;

  products.push({
    id: pid,
    name,
    brand,
    category,
    heroPhotoId,
    createdAt: new Date(Date.now() - Math.max(...purchases.map(([, ago]) => ago)) * 864e5).toISOString(),
  });

  purchases.forEach(([qty, daysAgo, expiryIn], i) => {
    batches.push({
      id: `b_seed${n}_${i + 1}`,
      productId: pid,
      quantity: qty,
      purchaseDate: iso(-daysAgo),
      expiryDate: expiryIn === null ? null : iso(expiryIn),
      photoId: heroPhotoId,
      createdAt: new Date(Date.now() - daysAgo * 864e5).toISOString(),
    });
  });
});

await Promise.all(
  ITEMS.map(([, , category, shape], index) =>
    fs.writeFile(
      path.join(SEED_PHOTOS, `ph_seed${String(index + 1).padStart(2, "0")}.svg`),
      photoSvg(category, shape),
      "utf8",
    ),
  ),
);

await fs.writeFile(path.join(SEED_DIR, "seed.json"), JSON.stringify({ products, batches }, null, 2), "utf8");

console.log(`Seed written: ${products.length} products, ${batches.length} batches, ${ITEMS.length} illustrations.`);
