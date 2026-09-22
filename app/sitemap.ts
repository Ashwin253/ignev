import { MetadataRoute } from 'next';
import { fetchEvListingsFromSupabase, fetchLatestUpdates } from './lib/supabase';
import { fetchWPUpdates } from './lib/wordpress';

function safeDate(val: any): Date {
  if (!val) return new Date();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.evplse.com').replace(/\/+$/, '');

  let products: any[] = [];
  let articles: any[] = [];
  let wpArticles: any[] = [];

  try {
    products = await fetchEvListingsFromSupabase(500);
  } catch (err) {
    console.warn("Sitemap products fetch error:", err);
  }

  try {
    articles = await fetchLatestUpdates(500);
  } catch (err) {
    console.warn("Sitemap articles fetch error:", err);
  }

  try {
    wpArticles = await fetchWPUpdates(100);
  } catch (err) {
    console.warn("Sitemap WP articles fetch error:", err);
  }

  const productUrls: MetadataRoute.Sitemap = (products || [])
    .filter((p) => p && p.slug)
    .map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: safeDate(product.created_at || product.date),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  const articleUrls: MetadataRoute.Sitemap = (articles || [])
    .filter((a) => a && (a.slug || a.url || a.id))
    .map((article: any) => ({
      url: `${baseUrl}/article/${article.slug || article.url || article.id}`,
      lastModified: safeDate(article.created_at),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

  const wpUrls: MetadataRoute.Sitemap = (wpArticles || [])
    .filter((w) => w && w.slug)
    .map((wp: any) => ({
      url: `${baseUrl}/updates/${wp.slug}`,
      lastModified: safeDate(wp.date),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/service`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ride`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/offers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [...staticUrls, ...productUrls, ...articleUrls, ...wpUrls];
}
