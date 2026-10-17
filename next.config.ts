import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const nextConfig: NextConfig = {
  basePath,
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  output: "standalone",
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXTPUBLICBASEURL:
      process.env.NEXTPUBLICBASEURL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:5000/api/v1",
  },
  turbopack: {
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};
export default nextConfig;
