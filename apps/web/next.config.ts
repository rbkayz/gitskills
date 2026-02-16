import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gitskills/db", "@gitskills/sdk"]
};

export default nextConfig;
