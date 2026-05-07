import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar } from "lucide-react";
import { fetchWPUpdateBySlug, fetchWPUpdates } from "../../lib/wordpress";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const update = await fetchWPUpdateBySlug(slug);
  if (!update) return {};
  return {
    title: `${update.title} | EVPULSE Updates`,
    description: update.excerpt || update.title,
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
  const [update, allUpdates] = await Promise.all([
    fetchWPUpdateBySlug(slug),
    fetchWPUpdates(6),
  ]);

  if (!update) notFound();

  const related = allUpdates
    .filter((u) => u.slug !== slug)
    .slice(0, 3);

  return (
    <article className="bg-white min-h-screen py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/updates" className="hover:text-sky-600 transition-colors">Updates</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium line-clamp-1">{update.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl leading-tight mb-5">
          {update.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-slate-400 mb-10 pb-8 border-b border-slate-100">
          <Calendar size={15} />
          <span>{formatDate(update.date)}</span>
        </div>

        {/* Featured image */}
        {update.photo && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100 mb-10 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <Image
              src={update.photo}
              alt={update.title}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-slate prose-lg max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-md
            prose-blockquote:border-sky-400 prose-blockquote:bg-sky-50 prose-blockquote:rounded-xl prose-blockquote:px-6 prose-blockquote:py-1"
          dangerouslySetInnerHTML={{ __html: update.content }}
        />

        {/* Back link */}
        <div className="mt-16 pt-8 border-t border-slate-100">
          <Link
            href="/updates"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={15} /> All updates
          </Link>
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
