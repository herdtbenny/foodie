import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Fotos werden im Browser verkleinert, das passt locker
    serverActions: { bodySizeLimit: "4mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
