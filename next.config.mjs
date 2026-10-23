/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig = {
  // Static export: the whole app runs in the browser, so GitHub Pages can host it.
  output: "export",
  basePath,
  images: { unoptimized: true },
  // Pages serves /about as /about.html; trailing slashes keep relative URLs sane.
  trailingSlash: true,
};

export default nextConfig;
