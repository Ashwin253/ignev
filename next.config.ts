import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
      // WooCommerce product images (same domain or CDN)
      { protocol: "https", hostname: "*.evplse.online" },
      // Local fallback product images
      { protocol: "https", hostname: "m.media-amazon.com" },
    ],
  },
};

export default nextConfig;
