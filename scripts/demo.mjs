// `npm run demo` — build the static site and serve it on the LAN with a QR code.
// Useful before pushing; the published site is the same files on GitHub Pages.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import qrcode from "qrcode-terminal";
import { lanAddress } from "./lan.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const OUT = path.join(ROOT, "out");
const PORT = Number(process.env.PORT ?? 3000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const exists = (p) => fs.access(p).then(() => true, () => false);

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`))));
  });
}

if (!(await exists(OUT))) {
  console.log("\n  Building ITEMO! — this takes a minute.\n");
  await run("npm", ["run", "build"]);
}

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  // Resolve against OUT and refuse anything that escapes it.
  let file = path.normalize(path.join(OUT, url));
  if (!file.startsWith(OUT)) return res.writeHead(403).end("Forbidden");

  if (await exists(file)) {
    const stat = await fs.stat(file);
    if (stat.isDirectory()) file = path.join(file, "index.html");
  } else if (await exists(`${file}.html`)) {
    file = `${file}.html`;
  } else {
    file = path.join(OUT, "404.html");
  }

  try {
    const body = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
}).listen(PORT, "0.0.0.0", () => {
  const ip = lanAddress();
  const phoneUrl = ip ? `http://${ip}:${PORT}` : null;

  console.log("\n  \x1b[1mITEMO! is running.\x1b[0m\n");
  console.log(`  On this computer:  http://localhost:${PORT}`);
  console.log(`  On your phone:     ${phoneUrl ?? "no network connection found"}\n`);

  if (phoneUrl) {
    qrcode.generate(phoneUrl, { small: true });
    console.log("  Scan the code above with your phone camera.");
    console.log("  Phone and computer must be on the same wifi.\n");
  }
  console.log("  Press Ctrl+C to stop.\n");
});
