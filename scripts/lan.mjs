import os from "node:os";

/** Best-guess LAN address: prefer a private IPv4 on a non-virtual interface. */
export function lanAddress() {
  const skip = /^(lo|utun|awdl|llw|bridge|vmnet|vboxnet|docker|tun|tap)/i;
  const candidates = [];

  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    if (skip.test(name) || !addrs) continue;
    for (const a of addrs) {
      if (a.family !== "IPv4" || a.internal) continue;
      // en0/eth0/wlan are the usual real interfaces; rank them first.
      const rank = /^(en0|eth0|wlan0|wlp)/i.test(name) ? 0 : 1;
      candidates.push({ rank, address: a.address });
    }
  }

  candidates.sort((a, b) => a.rank - b.rank);
  return candidates[0]?.address ?? null;
}
