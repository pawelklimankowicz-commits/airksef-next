import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  /** Dev: allow same app opened via LAN IP (avoids cross-origin warnings for static chunks). */
  allowedDevOrigins: ["192.168.0.111", "127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/invoices", destination: "/faktury", permanent: true },
      { source: "/invoices/:path*", destination: "/faktury", permanent: true },
    ];
  },
};

export default nextConfig;
