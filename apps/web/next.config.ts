import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/theme", "@repo/icons"],
};

export default nextConfig;
