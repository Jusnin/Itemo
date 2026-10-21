// `npm run demo` — build if needed, serve on the LAN, print a scannable QR code.
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import qrcode from "qrcode-terminal";
import { lanAddress } from "./lan.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const PORT = process.env.PORT || "3000";

const exists = (p) => fs.access(p).then(() => true, () => false);

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`))));
  });
}

// First run: make sure there is data to show.
if (!(await exists(path.join(ROOT, "data", "db.json")))) {
  await run(process.execPath, [path.join(ROOT, "scripts", "reset.mjs")]);
}

if (!(await exists(path.join(ROOT, ".next", "BUILD_ID")))) {
  console.log("\n  Building ITEMO for the first time — this takes a minute.\n");
  await run("npm", ["run", "build"]);
}

const server = spawn("npm", ["run", "start"], {
  cwd: ROOT,
  stdio: ["inherit", "pipe", "inherit"],
  shell: process.platform === "win32",
  env: { ...process.env, PORT },
});

let announced = false;
server.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  // Wait for "Ready" specifically — announcing on the earlier "Local:" line
  // invites a scan before the server can answer it.
  if (announced || !/\bReady\b|started server/i.test(String(chunk))) return;
  announced = true;

  const ip = lanAddress();
  const phoneUrl = ip ? `http://${ip}:${PORT}` : null;

  console.log("\n  \x1b[1mITEMO is running.\x1b[0m\n");
  console.log(`  On this computer:  http://localhost:${PORT}`);
  console.log(`  On your phone:     ${phoneUrl ?? "no network connection found"}\n`);

  if (phoneUrl) {
    qrcode.generate(phoneUrl, { small: true });
    console.log("  Scan the code above with your phone camera.");
    console.log("  Phone and computer must be on the same wifi.\n");
  } else {
    console.log("  Connect this computer to wifi, then restart to get a phone link.\n");
  }
  console.log("  Press Ctrl+C to stop.\n");
});

const stop = () => { server.kill("SIGINT"); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
