import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { fetchArticleById } from "../../lib/supabase";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export const revalidate = 60; // revalidate every minute
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const article = await fetchArticleById(id);
    if (!article) return { title: "Article Not Found" };
    return {
      title: `${article.title} | EVPULSE`,
      description: `Read about ${article.title}`,
    };
  } catch {
    return { title: "Article | EVPULSE" };
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const article = await fetchArticleById(id);
  if (!article || !article.is_active) notFound();

  const formattedDate = article.created_at 
    ? new Date(article.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
    : "Recently";

  return (
    <article className="min-h-screen bg-[#f8f5f0] text-slate-900 py-28 relative">
      {/* Decorative Ambient Glowing Blurs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#34ebb1]/15 rounded-full blur-[130px] pointer-events-none"></div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Back Link */}
        <Link href={`/product/${article.product_slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#10855f] hover:text-sky-600 transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Product
        </Link>

        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 mb-4">{article.title}</h1>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
            <CalendarDays size={14} />
            <span>Published on {formattedDate}</span>
          </div>
        </header>

        {/* Thumbnail (if any) */}
        {article.thumbnail && (
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-xl mb-12 bg-slate-100">
            <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
          </div>
        )}

        {/* Content Body */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          {article.body ? (
            <MarkdownRenderer content={article.body} />
          ) : (
            <p className="text-slate-500 italic text-center py-10">This article is currently empty.</p>
          )}
        </div>

      </div>
    </article>
  );
}
