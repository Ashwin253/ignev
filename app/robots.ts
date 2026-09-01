
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.evplse.com';

  return {
   rules: [
      {
        userAgent: "Googlebot",
          allow: '/',
        disallow: '/team',       // Disallow crawling of internal API routes
      },
      {
        userAgent: ["Mediapartners-Google", "Google-Display-Ads-Bot"],
          allow: '/',
        disallow: '/team',
    },
      {
        userAgent: "FacebookExternalHit",
      allow: '/',
        disallow: '/team',
      },
      {
        userAgent:["GPTBot", "MetaBot", "MetaAdsBot", "MetaBusinessBot","OAI-SearchBot","ChatGPT-User"],
      allow: '/',
        disallow: '/team',
      },
      {
        userAgent: "DuckDuckGoBot",    
      allow: '/',
        disallow: '/team',
      },
      {
        userAgent: "YandexMobileBot",
      allow: '/',
        disallow: '/team',
      },
      {
        userAgent: "Baiduspider",
      allow: '/',
        disallow: '/team',
      },
      {
        userAgent: [
          "Applebot",
          "Bingbot",
          "Slurp",
          "AhrefsBot",
          "AhrefsSiteAudit",
          "BingPreview",
          "SiteAuditBot",
        ],
      allow: '/',
        disallow: '/team',
      },
      {
        userAgent: "*",
      allow: '/',
        disallow: '/team',
      },
    ],
    
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

