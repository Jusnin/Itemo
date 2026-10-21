// Restores the demo to its seeded state. Run between demos.
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");

await fs.rm(path.join(DATA, "photos"), { recursive: true, force: true });
await fs.cp(path.join(DATA, "seed-photos"), path.join(DATA, "photos"), { recursive: true });
await fs.copyFile(path.join(DATA, "seed.json"), path.join(DATA, "db.json"));

const db = JSON.parse(await fs.readFile(path.join(DATA, "db.json"), "utf8"));
console.log(`\n  Reset complete — ${db.products.length} products, ${db.batches.length} purchase records.\n`);
