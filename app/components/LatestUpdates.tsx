import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Rss, Calendar } from "lucide-react";
import type { WPUpdate } from "../lib/wordpress";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function LatestUpdates({ updates }: { updates: WPUpdate[] }) {
  if (!updates.length) return null;

  const [featured, ...rest] = updates.slice(0, 3);

  return (
    <section className="py-20 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm">
              <Rss size={13} />
              Latest Updates
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              EV news &amp; insights
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 md:text-base">
              Stay current with the latest in electric mobility.
            </p>
          </div>
          <Link
            href="/updates"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors shrink-0"
          >
            All updates <ArrowRight size={15} />
          </Link>
        </div>

        {/* Grid: featured left, two smaller right */}
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr_1fr]">
          {/* Featured */}
          <Link
            href={`/updates/${featured.slug}`}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)] transition-shadow"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              {featured.photo ? (
                <Image
                  src={featured.photo}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-sky-100 to-slate-100" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent" />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <Calendar size={13} />
                {formatDate(featured.date)}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors line-clamp-2">
                {featured.title}
              </h3>
              {featured.excerpt && (
                <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">
                  {featured.excerpt}
                </p>
              )}
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 group-hover:gap-2.5 transition-all">
                Read more <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          {/* Two smaller cards */}
          <div className="flex flex-col gap-5 lg:col-span-2 lg:grid lg:grid-cols-2">
            {rest.map((update) => (
              <Link
                key={update.id}
                href={`/updates/${update.slug}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] transition-shadow flex flex-col"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  {update.photo ? (
                    <Image
                      src={update.photo}
                      alt={update.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-sky-50 to-slate-100" />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <Calendar size={12} />
                    {formatDate(update.date)}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors line-clamp-3 flex-1">
                    {update.title}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:gap-2 transition-all">
                    Read more <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
