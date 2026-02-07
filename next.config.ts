import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-appwrite", "sharp"],
  output: "standalone",
};

export default nextConfig;
