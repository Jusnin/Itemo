/** @type {import('next').NextConfig} */
const nextConfig = {
  // Photos are read from data/ at runtime, never bundled.
  outputFileTracingIncludes: { "/api/**": ["./data/**"] },
};
export default nextConfig;
