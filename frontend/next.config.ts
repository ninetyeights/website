import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? "127.0.0.1")
    .split(",").map(origin => origin.trim()).filter(Boolean),
  async rewrites() {
    return [{
      source: "/api/:path*",
      destination: `${process.env.API_INTERNAL_URL ?? "http://localhost:8000"}/api/:path*`,
    }];
  },
};
export default nextConfig;
