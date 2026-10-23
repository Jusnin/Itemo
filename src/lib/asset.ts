/**
 * GitHub Pages serves the site from /<repo>/, so Next is configured with a
 * basePath. Next rewrites its own links and chunks, but NOT raw <img src>,
 * so every static asset reference goes through here.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
