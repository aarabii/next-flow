import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-9fa6062fc2e84197b79b0f5a74aafa86.r2.dev",
      },
    ],
  },
};

export default nextConfig;
