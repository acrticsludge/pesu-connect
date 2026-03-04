import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    // Performance optimization
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  // Enable compression
  compress: true,
  // Generate ETags for better caching
  generateEtags: true,
  // Optimize fonts
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Production optimizations
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
