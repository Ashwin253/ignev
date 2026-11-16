
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.evplse.com').replace(/\/+$/, '');

  return {
   rules: [
      {
        userAgent: "Googlebot",
          allow: ['/', '/event/'],
        disallow: '/team',       // Disallow crawling of internal API routes
      },
      {
        userAgent: ["Mediapartners-Google", "Google-Display-Ads-Bot"],
          allow: ['/', '/event/'],
        disallow: '/team',
    },
      {
        userAgent: "FacebookExternalHit",
      allow: ['/', '/event/'],
        disallow: '/team',
      },
      {
        userAgent:["GPTBot", "MetaBot", "MetaAdsBot", "MetaBusinessBot","OAI-SearchBot","ChatGPT-User"],
      allow: ['/', '/event/'],
        disallow: '/team',
      },
      {
        userAgent: "DuckDuckGoBot",    
      allow: ['/', '/event/'],
        disallow: '/team',
      },
      {
        userAgent: "YandexMobileBot",
      allow: ['/', '/event/'],
        disallow: '/team',
      },
      {
        userAgent: "Baiduspider",
      allow: ['/', '/event/'],
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
      allow: ['/', '/event/'],
        disallow: '/team',
      },
      {
        userAgent: "*",
      allow: ['/', '/event/'],
        disallow: '/team',
      },
    ],
    
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/news-sitemap.xml`,
    ],
  };
}

