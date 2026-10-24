import { NextResponse } from "next/server";
import { fetchLatestUpdates } from "../lib/supabase";
import { fetchWPUpdates } from "../lib/wordpress";

export const revalidate = 300; // 5 minutes

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
}

type NewsItem = {
  loc: string;
  title: string;
  pubDate: Date;
};

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.evplse.com").replace(/\/+$/, "");

  let sbArticles: any[] = [];
  let wpArticles: any[] = [];

  try {
    sbArticles = await fetchLatestUpdates(50);
  } catch (err) {
    console.warn("News sitemap: Supabase fetch error:", err);
  }

  try {
    wpArticles = await fetchWPUpdates(50);
  } catch (err) {
    console.warn("News sitemap: WP fetch error:", err);
  }

  const items: NewsItem[] = [];

  // 1. Process Supabase articles
  for (const article of sbArticles || []) {
    if (!article || (!article.slug && !article.url && !article.id)) continue;
    const slug = article.slug || article.url || article.id;
    const pubDate = article.created_at ? new Date(article.created_at) : new Date();
    items.push({
      loc: `${baseUrl}/article/${slug}`,
      title: article.title || "EV Update",
      pubDate: isNaN(pubDate.getTime()) ? new Date() : pubDate,
    });
  }

  // 2. Process WordPress articles
  for (const wp of wpArticles || []) {
    if (!wp || !wp.slug) continue;
    const pubDate = wp.date ? new Date(wp.date) : new Date();
    items.push({
      loc: `${baseUrl}/updates/${wp.slug}`,
      title: wp.title || "EV Update",
      pubDate: isNaN(pubDate.getTime()) ? new Date() : pubDate,
    });
  }

  // Sort descending by date
  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  // Google requires News sitemaps to contain only articles from the last 48 hours.
  // An empty News sitemap is valid when there are no newly published articles;
  // older URLs belong in the regular sitemap instead.
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  const selectedItems = items
    .filter((item) => item.pubDate.getTime() >= twoDaysAgo)
    .slice(0, 1000);

  const urlsXml = selectedItems
    .map(
      (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>EVPLSE</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${item.pubDate.toISOString()}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlsXml}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}
