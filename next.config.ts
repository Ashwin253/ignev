import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove X-Powered-By header (minor security + saves bytes)
  poweredByHeader: false,

  // Enable gzip/brotli compression
  compress: true,

  // Allow local network access in dev (mobile testing)
  allowedDevOrigins: ["192.168.137.1"],

  images: {
    // Prefer AVIF then WebP — smaller files, same quality
    formats: ["image/avif", "image/webp"],

    // Aggressive caching — images don't change often
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days

    remotePatterns: [
      { protocol: "https", hostname: "imgd.aeplcdn.com" },
      { protocol: "https", hostname: "stimg.cardekho.com" },
      { protocol: "https", hostname: "www.mahindraelectric.com" },
      { protocol: "https", hostname: "cdn.bajajauto.com" },
      { protocol: "https", hostname: "www.terramotorsindia.com" },
      { protocol: "https", hostname: "www.piaggio-cv.co.in" },
      { protocol: "https", hostname: "eulermotors.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "evplse.online" },
      { protocol: "https", hostname: "ijkofkibmxlqwolknosi.supabase.co" },
      { protocol: "https", hostname: "m.media-amazon.com" },
    ],
  },

  // Strict mode catches subtle bugs early
  reactStrictMode: true,

  // Experimental: faster builds, better tree-shaking
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
    ],
  },
};

export default nextConfig;
