import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Rss } from "lucide-react";
import { fetchWPUpdates } from "../lib/wordpress";

// ISR — revalidate every 5 min
export const revalidate = 300;

export const metadata = {
  title: "EV Updates | EVPULSE",
  description: "Latest news, policy updates, and insights from the electric vehicle world.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function UpdatesPage() {
  const updates = await fetchWPUpdates(50);

  return (
    <section className="bg-white min-h-screen py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 mb-6"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm mb-4">
                <Rss size={13} /> EV Updates
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                News &amp; Insights
              </h1>
              <p className="mt-3 text-slate-500 text-base max-w-xl">
                The latest from the electric vehicle world — policy, launches, technology, and more.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm shrink-0">
              <Rss size={15} className="text-sky-500" />
              {updates.length} articles
            </div>
          </div>
        </div>

        {updates.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Rss size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No updates yet.</p>
            <p className="text-sm mt-1">Check back soon — content is coming from WordPress.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {updates.map((update) => (
              <Link
                key={update.id}
                href={`/updates/${update.slug}`}
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
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-sky-50 to-slate-100 flex items-center justify-center">
                      <Rss size={32} className="text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <Calendar size={13} />
                    {formatDate(update.date)}
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors line-clamp-3 flex-1">
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
