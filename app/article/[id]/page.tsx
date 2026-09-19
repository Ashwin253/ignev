import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays, User, ArrowRight, Car, Sparkles } from "lucide-react";
import { fetchArticleById, fetchLatestUpdates, extractArticleMeta, stripMarkdown } from "../../lib/supabase";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export const revalidate = 60; // revalidate every minute
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.evplse.com").replace(/\/+$/, "");
  try {
    const article = await fetchArticleById(id);
    if (!article) return { title: "Article Not Found | EVPULSE" };

    const meta = extractArticleMeta(article.body);
    const cleanBody = meta.cleanBody || article.body || "";
    const description = cleanBody.replace(/[#*`_\[\]]/g, "").slice(0, 160).trim() || `Read about ${article.title} on EVPULSE`;
    const authorName = article.author_name || meta.authorName || "EVPULSE Editorial";
    const articleSlug = article.slug || article.url || article.id;
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    const images = article.thumbnail ? [article.thumbnail] : [`${baseUrl}/og-image.jpg`];

    return {
      title: `${article.title} | EVPULSE`,
      description,
      alternates: {
        canonical: articleUrl,
      },
      openGraph: {
        title: article.title,
        description,
        url: articleUrl,
        siteName: "EVPULSE",
        type: "article",
        publishedTime: article.created_at,
        authors: [authorName],
        images: images.map((img: string) => ({
          url: img,
          alt: article.title,
        })),
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description,
        images,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } catch {
    return { title: "Article | EVPULSE" };
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.evplse.com").replace(/\/+$/, "");
  
  const article = await fetchArticleById(id);
  if (!article || !article.is_active) notFound();

  const meta = extractArticleMeta(article.body);
  const authorName = article.author_name || meta.authorName || "";
  const displayBody = meta.cleanBody || article.body;
  const articleSlug = article.slug || article.url || article.id;
  const canonicalUrl = `${baseUrl}/article/${articleSlug}`;

  const formattedDate = article.created_at 
    ? new Date(article.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
    : "Recently";

  // Fetch recent updates for the bottom section (excluding current article)
  let recentArticles: any[] = [];
  try {
    const allRecent = await fetchLatestUpdates(6);
    const currentSlug = article.slug || article.url;
    recentArticles = (allRecent || [])
      .filter((item: any) => {
        if (!item || item.id === article.id) return false;
        const itemSlug = item.slug || item.url;
        if (currentSlug && itemSlug && itemSlug === currentSlug) return false;
        return true;
      })
      .slice(0, 2);
  } catch (err) {
    console.warn("Failed to fetch recent articles for article page:", err);
  }

  // Google Feed & Discover Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    "headline": article.title,
    "description": (meta.cleanBody || article.body || "").replace(/[#*`_\[\]]/g, "").slice(0, 200).trim(),
    "image": article.thumbnail ? [article.thumbnail] : [`${baseUrl}/og-image.jpg`],
    "datePublished": article.created_at || new Date().toISOString(),
    "dateModified": article.created_at || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": authorName || "Editorial Team",
    },
    "publisher": {
      "@type": "Organization",
      "name": "EVPULSE",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/favicon.ico`,
      },
    },
  };

  return (
    <article className="min-h-screen bg-[#f8f5f0] text-slate-900 py-28 relative">
      {/* Schema.org Structured Data for Google Discover & Google Feed */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Decorative Ambient Glowing Blurs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#34ebb1]/15 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation / Back Links */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Link href="/updates" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#10855f] hover:text-sky-600 transition-colors">
            <ArrowLeft size={16} /> Back to Updates
          </Link>
          <span className="text-slate-300">•</span>
          {article.product_slug ? (
            <Link href={`/product/${article.product_slug}`} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              View Vehicle
            </Link>
          ) : (
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              Home
            </Link>
          )}
        </div>

        {/* Header */}
        <header className="mb-12 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 mb-5 leading-tight">{article.title}</h1>
          <div className="flex items-center justify-center gap-3 text-sm font-medium text-slate-500 flex-wrap">
            {authorName && (
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <User size={15} className="text-[#10855f]" />
                <span>By {authorName}</span>
              </span>
            )}
            {authorName && <span className="text-slate-300">•</span>}
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              <span>Published on {formattedDate}</span>
            </div>
          </div>
        </header>

        {/* Thumbnail (if any) */}
        {article.thumbnail && (
          <div className="relative aspect-video sm:aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-xl mb-12 bg-slate-100">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover"
              unoptimized={!article.thumbnail.includes("supabase.co") && !article.thumbnail.includes("unsplash.com") && !article.thumbnail.includes("evplse.online")}
            />
          </div>
        )}

        {/* Content Body */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-12 lg:p-14 shadow-sm">
          {displayBody ? (
            <MarkdownRenderer content={displayBody} />
          ) : (
            <p className="text-slate-500 italic text-center py-10">This article is currently empty.</p>
          )}
        </div>

        {/* More Recent Updates */}
        {recentArticles.length > 0 && (
          <section className="mt-14 pt-10 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#10855f] flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} /> More Stories
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Updates</h2>
              </div>
              <Link
                href="/updates"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#10855f] hover:text-[#0b6346] transition-colors group"
              >
                <span>View all updates</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentArticles.map((item: any) => {
                const itemMeta = extractArticleMeta(item.body);
                const itemExcerpt = stripMarkdown(itemMeta.cleanBody || item.body || "").slice(0, 130).trim();
                const itemSlug = item.slug || item.url || item.id;
                const itemAuthor = item.author_name || itemMeta.authorName || "";
                const itemDate = item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "";

                return (
                  <Link
                    key={item.id}
                    href={`/article/${itemSlug}`}
                    className="group flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {item.thumbnail ? (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized={!item.thumbnail.includes("supabase.co") && !item.thumbnail.includes("unsplash.com") && !item.thumbnail.includes("evplse.online")}
                        />
                        {item.product_slug && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            <Car size={11} /> {item.product_slug.replace(/-/g, " ")}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[#34ebb1]/10 to-slate-100 flex items-center justify-center text-slate-400">
                        <CalendarDays size={28} className="opacity-40" />
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5 gap-2">
                        {itemDate && <span>{itemDate}</span>}
                        {itemAuthor && (
                          <span className="font-semibold text-slate-600 truncate max-w-[160px]">By {itemAuthor}</span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-[#10855f] transition-colors line-clamp-2 mb-2">
                        {item.title}
                      </h3>

                      {itemExcerpt && (
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mt-auto">
                          {itemExcerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </article>
  );
}
