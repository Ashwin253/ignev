import { NextResponse } from "next/server";
import { extractArticleMeta, fetchLatestUpdates, stripMarkdown } from "../../lib/supabase";

export const revalidate = 300;

const FALLBACK_NEWS_PHOTO = "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80";

export async function GET() {
  try {
    const updates = await fetchLatestUpdates(3);
    const news = updates.map((update: any) => {
      const meta = extractArticleMeta(update.body);
      const plain = stripMarkdown(meta.cleanBody || update.body || "");
      return {
        id: String(update.id),
        title: update.title,
        href: `/article/${update.slug || update.url || update.id}`,
        excerpt: plain.length > 120 ? plain.slice(0, 117) + "…" : plain,
        date: update.created_at,
        photo: update.thumbnail || FALLBACK_NEWS_PHOTO,
      };
    });
    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ error: "Homepage news unavailable" }, { status: 503 });
  }
}
