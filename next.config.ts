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
    ],
  },
};

export default nextConfig;
