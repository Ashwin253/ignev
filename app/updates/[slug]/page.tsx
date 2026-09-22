import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar } from "lucide-react";
import { fetchWPUpdateBySlug, fetchWPUpdates } from "../../lib/wordpress";
import { fetchArticleById, extractArticleMeta } from "../../lib/supabase";

// Allow slugs not known at build time; revalidate every 60 s
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const updates = await fetchWPUpdates(50);
    return updates.map((u) => ({ slug: u.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.evplse.com").replace(/\/+$/, "");

  const sbArticle = await fetchArticleById(slug);
  if (sbArticle) {
    const meta = extractArticleMeta(sbArticle.body);
    const cleanBody = meta.cleanBody || sbArticle.body || "";
    const description = cleanBody.replace(/[#*`_\[\]]/g, "").slice(0, 160).trim() || `Read about ${sbArticle.title} on EVPULSE`;
    const articleSlug = sbArticle.slug || sbArticle.url || sbArticle.id;
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    const images = sbArticle.thumbnail ? [sbArticle.thumbnail] : [`${baseUrl}/og-image.jpg`];
    const authorName = sbArticle.author_name || meta.authorName || "EVPULSE Editorial";

    return {
      title: `${sbArticle.title} | EVPULSE`,
      description,
      alternates: {
        canonical: articleUrl,
      },
      openGraph: {
        title: sbArticle.title,
        description,
        url: articleUrl,
        siteName: "EVPULSE",
        type: "article",
        publishedTime: sbArticle.created_at,
        authors: [authorName],
        images: images.map((img: string) => ({ url: img, alt: sbArticle.title })),
      },
      twitter: {
        card: "summary_large_image",
        title: sbArticle.title,
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
  }

  const update = await fetchWPUpdateBySlug(slug);
  if (!update) return {};

  const pageUrl = `${baseUrl}/updates/${slug}`;
  const images = update.photo ? [update.photo] : [`${baseUrl}/og-image.jpg`];
  const description = update.excerpt || `Read the latest update on ${update.title} at EVPULSE.`;

  return {
    title: `${update.title} | EVPULSE Updates`,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: update.title,
      description,
      url: pageUrl,
      siteName: "EVPULSE",
      type: "article",
      publishedTime: update.date,
      authors: ["EVPULSE Editorial"],
      images: images.map((img: string) => ({ url: img, alt: update.title })),
    },
    twitter: {
      card: "summary_large_image",
      title: update.title,
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
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function UpdateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.evplse.com").replace(/\/+$/, "");

  const sbArticle = await fetchArticleById(slug);
  if (sbArticle) {
    redirect(`/article/${sbArticle.slug || sbArticle.url || sbArticle.id}`);
  }

  const [update, allUpdates] = await Promise.all([
    fetchWPUpdateBySlug(slug),
    fetchWPUpdates(6),
  ]);

  if (!update) notFound();

  const canonicalUrl = `${baseUrl}/updates/${slug}`;

  // Google Discover & Google News Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    "headline": update.title,
    "description": update.excerpt || update.title,
    "image": update.photo ? [update.photo] : [`${baseUrl}/og-image.jpg`],
    "datePublished": update.date || new Date().toISOString(),
    "dateModified": update.date || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": "EVPULSE Editorial",
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

  const related = allUpdates
    .filter((u) => u.slug !== slug)
    .slice(0, 3);

  return (
    <article className="bg-white min-h-screen py-24 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Schema.org Structured Data for Google Discover & Google News */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section (Centered and narrower) */}
        <header className="mx-auto max-w-3xl text-center mb-12">
          <nav className="mb-8 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-600">
            <Link href="/" className="hover:text-emerald-800 transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link href="/updates" className="hover:text-emerald-800 transition-colors">Updates</Link>
          </nav>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15] mb-6 font-sans">
            {update.title}
          </h1>

          <div className="flex items-center justify-center gap-4 text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                EV
              </span>
              <span>EVPLSE Editorial</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <span>{formatDate(update.date)}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>4 min read</span>
          </div>
        </header>

        {/* Featured image (Wider than text) */}
        {update.photo && (
          <div className="mx-auto max-w-5xl relative aspect-[21/9] sm:aspect-[16/9] overflow-hidden rounded-3xl bg-slate-50 mb-16 shadow-2xl ring-1 ring-slate-900/5">
            <Image
              src={update.photo}
              alt={update.title}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content (Narrow column for reading) */}
        <div className="mx-auto max-w-2xl">
          <div
            className="prose prose-lg sm:prose-xl prose-slate max-w-none
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
              prose-p:leading-relaxed prose-p:text-slate-700
              prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-img:rounded-2xl prose-img:shadow-lg prose-img:mx-auto
              prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50/50 prose-blockquote:rounded-r-xl prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:text-slate-800 prose-blockquote:font-medium prose-blockquote:not-italic
              prose-ul:marker:text-emerald-500 prose-ol:marker:text-emerald-600
              prose-strong:text-slate-900 prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: update.content }}
          />

          {/* Share & Back link */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex items-center justify-between">
            <Link
              href="/updates"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
            >
              <ArrowLeft size={16} /> Back to updates
            </Link>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-20 border-t border-slate-100 pt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-8">More updates</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/updates/${rel.slug}`}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] transition-all hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                    {rel.photo ? (
                      <Image
                        src={rel.photo}
                        alt={rel.title}
                        fill
                        sizes="33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-sky-50 to-slate-100" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <Calendar size={12} /> {formatDate(rel.date)}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2">
                      {rel.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
