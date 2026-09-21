import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["unpdf", "mammoth", "better-sqlite3"],
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
