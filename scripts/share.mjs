// `npm run share` — public HTTPS URL via Cloudflare Tunnel, for when the venue
// wifi blocks phone-to-laptop traffic (docs/ISSUES.md ISSUE-4).
import { spawn } from "node:child_process";
import qrcode from "qrcode-terminal";

const PORT = process.env.PORT || "3000";
console.log("\n  Opening a public HTTPS link for http://localhost:" + PORT + " ...\n");
console.log("  (Start the app itself in another terminal with `npm run demo`.)\n");

const tunnel = spawn("npx", ["-y", "cloudflared", "tunnel", "--url", `http://localhost:${PORT}`], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: process.platform === "win32",
});

let shown = false;
const scan = (chunk) => {
  const text = String(chunk);
  process.stderr.write(text);
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (match && !shown) {
    shown = true;
    console.log(`\n  \x1b[1mPublic link:\x1b[0m ${match[0]}\n`);
    qrcode.generate(match[0], { small: true });
    console.log("\n  Works from any network. Press Ctrl+C to stop sharing.\n");
  }
};
tunnel.stdout.on("data", scan);
tunnel.stderr.on("data", scan);
