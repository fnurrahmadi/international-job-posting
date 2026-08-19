import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel provides its own Next.js deployment adapter. Next.js 16.3 currently
  // conflicts with standalone output when that adapter is active, while
  // standalone remains useful for Docker or another self-hosted runtime.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
