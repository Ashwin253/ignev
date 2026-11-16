import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { fetchArticleById, fetchLatestUpdates, extractArticleMeta, getArticleAuthor, stripMarkdown } from "../../lib/supabase";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export const revalidate = 60; // revalidate every minute
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.evplse.com").replace(/\/+$/, "");
  try {
    const article = await fetchArticleById(id);
    if (!article) return { title: "Article Not Found | EVPLSE" };

    const meta = extractArticleMeta(article.body);
    const cleanBody = meta.cleanBody || article.body || "";
    const description = cleanBody.replace(/[#*`_\[\]]/g, "").slice(0, 160).trim() || `Read about ${article.title} on EVPLSE`;
    const authorName = getArticleAuthor(article) || "Editorial Team";
    const articleSlug = article.slug || article.url || article.id;
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    const images = article.thumbnail ? [article.thumbnail] : [`${baseUrl}/og-image.jpg`];

    return {
      title: `${article.title} | EVPLSE`,
      description,
      alternates: {
        canonical: articleUrl,
      },
      openGraph: {
        title: article.title,
        description,
        url: articleUrl,
        siteName: "EVPLSE",
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
    return { title: "Article | EVPLSE" };
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.evplse.com").replace(/\/+$/, "");

  const article = await fetchArticleById(id);
  if (!article || !article.is_active) notFound();

  const meta = extractArticleMeta(article.body);
  const authorName = getArticleAuthor(article);
  const displayBody = meta.cleanBody || article.body;
  const articleSlug = article.slug || article.url || article.id;
  const canonicalUrl = `${baseUrl}/article/${articleSlug}`;

  const formattedDate = article.created_at
    ? new Date(article.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
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
      "name": "EVPLSE",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/favicon.ico`,
      },
    },
  };

  const shouldSkipOptimization = (src: string) =>
    !src.includes("supabase.co") && !src.includes("unsplash.com") && !src.includes("evplse.online");

  return (
    <article className="min-h-screen bg-white text-slate-900 pt-24 pb-24 sm:pt-28">
      {/* Schema.org Structured Data for Google Discover & Google Feed */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Header */}
        <header className="mx-auto max-w-3xl">
          <Link
            href="/updates"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={15} /> Updates
          </Link>

          <h1 className="mt-6 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.1] text-balance">
            {article.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {authorName && <span className="font-semibold text-slate-800">{authorName}</span>}
            {authorName && <span aria-hidden="true">·</span>}
            <time dateTime={article.created_at || undefined}>{formattedDate}</time>
            {article.product_slug && (
              <>
                <span aria-hidden="true">·</span>
                <Link
                  href={`/product/${article.product_slug}`}
                  className="font-medium text-brand hover:underline underline-offset-4"
                >
                  View vehicle
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Thumbnail */}
        {article.thumbnail && (
          <div className="relative mt-10 aspect-video sm:aspect-[2/1] w-full overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              unoptimized={shouldSkipOptimization(article.thumbnail)}
            />
          </div>
        )}

        {/* Body */}
        <div className="mx-auto mt-10 max-w-3xl sm:mt-12">
          {displayBody ? (
            <MarkdownRenderer content={displayBody} />
          ) : (
            <p className="py-10 text-center italic text-slate-500">This article is currently empty.</p>
          )}
        </div>

        {/* More updates */}
        {recentArticles.length > 0 && (
          <section className="mx-auto mt-16 max-w-3xl border-t border-slate-200 pt-10">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Keep reading</h2>
              <Link
                href="/updates"
                className="group inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                All updates
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <ul className="divide-y divide-slate-200">
              {recentArticles.map((item: any) => {
                const itemMeta = extractArticleMeta(item.body);
                const itemExcerpt = stripMarkdown(itemMeta.cleanBody || item.body || "").slice(0, 130).trim();
                const itemSlug = item.slug || item.url || item.id;
                const itemAuthor = getArticleAuthor(item);
                const itemDate = item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "";

                return (
                  <li key={item.id}>
                    <Link href={`/article/${itemSlug}`} className="group flex items-center gap-5 py-6">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400">
                          {[itemAuthor, itemDate].filter(Boolean).join(" · ")}
                        </p>
                        <h3 className="mt-1 text-lg font-bold leading-snug text-slate-900 line-clamp-2 group-hover:text-brand transition-colors">
                          {item.title}
                        </h3>
                        {itemExcerpt && (
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-500 line-clamp-2">{itemExcerpt}</p>
                        )}
                      </div>

                      {item.thumbnail && (
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-36">
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            sizes="144px"
                            className="object-cover"
                            unoptimized={shouldSkipOptimization(item.thumbnail)}
                          />
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}
