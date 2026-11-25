import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_SUPABASE_PUBLISHABLE_KEY || "",
  },
  // Remove X-Powered-By header (minor security + saves bytes)
  poweredByHeader: false,

  // Enable gzip/brotli compression
  compress: true,

  // Allow local network access in dev (mobile testing)
  allowedDevOrigins: ["192.168.137.1"],

  images: {
    // Single output format: WebP only. AVIF compresses ~20% smaller but takes
    // ~50% longer to encode, and Next caches one variant per format — so
    // dropping AVIF halves the stored/generated variants.
    formats: ["image/webp"],

    // Cache optimized images for 31 days. Vercel uses whichever is larger:
    // this value or the upstream Cache-Control header. Supabase Storage sends
    // a short max-age, so this applies immediately to already-uploaded files
    // without re-uploading them.
    minimumCacheTTL: 60 * 60 * 24 * 31, // 2678400s

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
      // Supabase Storage: only public objects, not the whole project host.
      {
        protocol: "https",
        hostname: "ijkofkibmxlqwolknosi.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
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
