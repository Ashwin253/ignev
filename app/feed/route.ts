import { NextResponse } from "next/server";
import { fetchLatestUpdates, extractArticleMeta, stripMarkdown } from "../lib/supabase";
import { fetchWPUpdates } from "../lib/wordpress";

export const revalidate = 300;

type FeedItem = {
  title: string;
  link: string;
  pubDate: Date;
  author: string;
  description: string;
  thumbnail?: string;
};

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.evplse.com").replace(/\/+$/, "");

  let articles: any[] = [];
  try {
    articles = await fetchLatestUpdates(50);
  } catch (err) {
    console.warn("Error fetching articles for RSS feed:", err);
  }

  let wpArticles: any[] = [];
  try {
    wpArticles = await fetchWPUpdates(50);
  } catch (err) {
    console.warn("Error fetching WP updates for RSS feed:", err);
  }

  const sbItems: FeedItem[] = (articles || []).map((article) => {
    const meta = extractArticleMeta(article.body);
    const cleanBody = meta.cleanBody || article.body || "";
    const description = stripMarkdown(cleanBody).slice(0, 300).trim();
    const slug = article.slug || article.url || article.id;
    const link = `${baseUrl}/article/${slug}`;
    const pubDate = article.created_at ? new Date(article.created_at) : new Date();
    const author = article.author_name || meta.authorName || "EVPLSE Editorial";

    return {
      title: article.title,
      link,
      pubDate: isNaN(pubDate.getTime()) ? new Date() : pubDate,
      author,
      description,
      thumbnail: article.thumbnail || undefined,
    };
  });

  const wpItems: FeedItem[] = (wpArticles || []).map((wp) => {
    const description = wp.excerpt || stripMarkdown(wp.content || "").slice(0, 300).trim();
    const link = `${baseUrl}/updates/${wp.slug}`;
    const pubDate = wp.date ? new Date(wp.date) : new Date();

    return {
      title: wp.title,
      link,
      pubDate: isNaN(pubDate.getTime()) ? new Date() : pubDate,
      author: "EVPLSE Editorial",
      description,
      thumbnail: wp.photo || undefined,
    };
  });

  // Combine and sort by newest first
  const combinedItems = [...sbItems, ...wpItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime()
  );

  const itemsXml = combinedItems
    .map((item) => {
      const imageTag = item.thumbnail
        ? `<enclosure url="${escapeXml(item.thumbnail)}" type="image/jpeg" length="0" />`
        : "";

      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <dc:creator>${escapeXml(item.author)}</dc:creator>
      <description>${escapeXml(item.description)}</description>
      ${imageTag}
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>EVPLSE - Electric Vehicle News, Reviews &amp; Guides</title>
    <link>${baseUrl}</link>
    <description>Latest news, reviews, policy updates, and insights from the electric vehicle world.</description>
    <language>en-IN</language>
    <atom:link href="${baseUrl}/feed" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}

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
