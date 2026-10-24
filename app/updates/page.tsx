import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Rss, User, Car } from "lucide-react";
import { fetchWPUpdates } from "../lib/wordpress";
import { fetchLatestUpdates, extractArticleMeta, stripMarkdown } from "../lib/supabase";

// ISR — revalidate every 60 s; dynamicParams allows slugs not known at build time
export const revalidate = 60;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "EV Updates & Articles | EVPLSE",
  description: "Latest news, reviews, policy updates, and insights from the electric vehicle world.",
};

function formatDate(iso: string) {
  if (!iso) return "Recently";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type UnifiedUpdate = {
  id: string;
  title: string;
  slug: string;
  href: string;
  date: string;
  excerpt: string;
  photo: string;
  authorName?: string;
  authorEmail?: string;
  productSlug?: string;
  source: "supabase" | "wordpress";
};

export default async function UpdatesPage() {
  // 1. Fetch Supabase articles
  let sbItems: any[] = [];
  try {
    sbItems = await fetchLatestUpdates(100);
  } catch (err) {
    console.warn("Error fetching Supabase updates:", err);
  }

  // 2. Fetch WordPress updates
  let wpItems: any[] = [];
  try {
    wpItems = await fetchWPUpdates(50);
  } catch (err) {
    console.warn("Error fetching WP updates:", err);
  }

  // Map Supabase articles
  const mappedSb: UnifiedUpdate[] = (sbItems || []).map((item: any) => {
    const meta = extractArticleMeta(item.body);
    const cleanBody = meta.cleanBody || item.body || "";
    const plainText = stripMarkdown(cleanBody);
    const excerpt = plainText.length > 150 ? plainText.slice(0, 147) + "…" : plainText;
    const authorName = item.author_name || meta.authorName || "";
    const authorEmail = item.author_email || meta.authorEmail || "";
    const articleSlug = item.slug || item.url || item.id;

    return {
      id: `sb-${item.id}`,
      title: item.title,
      slug: articleSlug,
      href: `/article/${articleSlug}`,
      date: item.created_at,
      excerpt,
      photo: item.thumbnail || "",
      authorName,
      authorEmail,
      productSlug: item.product_slug || "",
      source: "supabase" as const,
    };
  });

  // Map WordPress articles
  const mappedWp: UnifiedUpdate[] = (wpItems || []).map((item: any) => ({
    id: `wp-${item.id}`,
    title: item.title,
    slug: item.slug,
    href: `/updates/${item.slug}`,
    date: item.date,
    excerpt: item.excerpt || "",
    photo: item.photo || "",
    authorName: "Editorial Team",
    authorEmail: "",
    productSlug: "",
    source: "wordpress" as const,
  }));

  // Combine: Supabase articles first, then WP articles (avoiding duplicate slugs/titles)
  const seenSlugs = new Set<string>();
  const combinedUpdates: UnifiedUpdate[] = [];

  for (const item of [...mappedSb, ...mappedWp]) {
    const key = (item.slug || item.title).toLowerCase().trim();
    if (!seenSlugs.has(key)) {
      seenSlugs.add(key);
      combinedUpdates.push(item);
    }
  }

  return (
    <section className="bg-white min-h-screen py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-6"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          {/* <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm mb-4">
                <Rss size={13} /> EV Updates
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                News &amp; Insights
              </h1>
              <p className="mt-3 text-slate-500 text-base max-w-xl">
                The latest from the electric vehicle world — reviews, guides, policy updates, and team analysis.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm shrink-0">
              <Rss size={15} className="text-emerald-500" />
              {combinedUpdates.length} articles
            </div>
          </div> */}
        </div>

        {combinedUpdates.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Rss size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No updates yet.</p>
            <p className="text-sm mt-1">Check back soon — articles and insights will appear here when published.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {combinedUpdates.map((update) => (
              <Link
                key={update.id}
                href={update.href}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] transition-all hover:-translate-y-0.5 flex flex-col"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  {update.photo ? (
                    <Image
                      src={update.photo}
                      alt={update.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized={!update.photo.includes("supabase.co") && !update.photo.includes("unsplash.com") && !update.photo.includes("evplse.online")}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center">
                      <Rss size={32} className="text-slate-300" />
                    </div>
                  )}
                  {update.productSlug && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      <Car size={11} /> {update.productSlug.replace(/-/g, " ")}
                    </span>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {formatDate(update.date)}
                    </div>
                    {update.authorName && (
                      <div className="flex items-center gap-1 text-slate-600 font-semibold truncate max-w-[150px]">
                        <User size={12} className="text-brand shrink-0" />
                        <span className="truncate">{update.authorName}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-3 flex-1">
                    {update.title}
                  </h2>
                  {update.excerpt && (
                    <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">
                      {update.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
