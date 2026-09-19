import { NextResponse } from "next/server";
import { fetchLatestUpdates, extractArticleMeta, stripMarkdown } from "../lib/supabase";

export const revalidate = 300;

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.evplse.com").replace(/\/+$/, "");

  let articles: any[] = [];
  try {
    articles = await fetchLatestUpdates(50);
  } catch (err) {
    console.warn("Error fetching articles for RSS feed:", err);
  }

  const itemsXml = articles
    .map((article) => {
      const meta = extractArticleMeta(article.body);
      const cleanBody = meta.cleanBody || article.body || "";
      const description = stripMarkdown(cleanBody).slice(0, 300).trim();
      const slug = article.slug || article.url || article.id;
      const link = `${baseUrl}/article/${slug}`;
      const pubDate = article.created_at ? new Date(article.created_at).toUTCString() : new Date().toUTCString();
      const author = article.author_name || meta.authorName || "EVPULSE Editorial";
      const imageTag = article.thumbnail
        ? `<enclosure url="${escapeXml(article.thumbnail)}" type="image/jpeg" length="0" />`
        : "";

      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(author)}</dc:creator>
      <description>${escapeXml(description)}</description>
      ${imageTag}
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>EVPULSE - Electric Vehicle News, Reviews &amp; Guides</title>
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
