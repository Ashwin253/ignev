import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Car, Rss } from "lucide-react";
import { fetchPublicEventBySlug, fetchEventContent } from "../../lib/supabase";
import { extractArticleMeta, getArticleAuthor, stripMarkdown } from "../../lib/supabase";
import { formatPricing, type EvListing } from "../../lib/wordpress";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId: slug } = await params;
  const event = await fetchPublicEventBySlug(slug);
  const title = `${event?.title || slug.toUpperCase()} | EVPLSE`;
  return { title, description: event?.description || `News and electric vehicle listings for ${event?.title || slug.toUpperCase()}.` };
}

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId: rawEventId } = await params;
  const event = await fetchPublicEventBySlug(decodeURIComponent(rawEventId).trim());
  if (!event) notFound();
  const { stories, listings, variants: eventVariants } = await fetchEventContent(event.id);
  if (!stories.length && !listings.length && !eventVariants.length) notFound();

  return (
    <main className="min-h-screen bg-slate-50 pb-20 pt-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link href="/updates" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> All news
        </Link>
        {listings.length > 0 && <section>
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold text-slate-900"><Car size={21} /> Vehicles at this event</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing: EvListing) => <article key={listing.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <Link href={`/product/${listing.slug}`} className="block">
              {listing.photo && <div className="relative aspect-[16/10] bg-slate-100"><Image src={listing.photo} alt={`${listing.brand} ${listing.title}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" unoptimized /></div>}
              <div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{listing.brand}</p><h3 className="mt-1 text-lg font-bold text-slate-900">{listing.title}</h3><p className="mt-2 text-sm text-slate-600">{formatPricing(listing.prices)}</p></div>
              </Link>
              {stories[0] && <div className="border-t border-slate-100 px-5 py-3">
                <Link href={`/article/${stories[0].slug || stories[0].url || stories[0].id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  Know more <ArrowRight size={14} />
                </Link>
              </div>}
            </article>)}
          </div>
        </section>}

        {eventVariants.length > 0 && <section className={listings.length ? "mt-10" : ""}>
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold text-slate-900"><Car size={21} /> Event variants</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventVariants.map((variant: any) => {
              const parent = variant.evlistings;
              return <Link key={variant.id} href={`/product/${parent.slug}`} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                {parent.photo && <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100"><Image src={parent.photo} alt={`${parent.brand} ${parent.title}`} fill sizes="112px" className="object-cover" unoptimized /></div>}
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{parent.brand} {parent.title}</p><h3 className="mt-1 font-bold text-slate-900">{variant.variant_name}</h3><p className="mt-1 text-sm text-slate-500">{variant.price ? formatPricing([String(variant.price)]) : "View model"}</p></div>
              </Link>;
            })}
          </div>
        </section>}

        {stories.length > 0 && <section id="news" className={`${listings.length ? "mt-12 border-t border-slate-200 pt-8" : ""}`}>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900"><Rss size={18} /> Event news</h2>
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5">
            {stories.map((story: any) => {
              const meta = extractArticleMeta(story.body);
              const excerpt = stripMarkdown(meta.cleanBody || story.body || "").slice(0, 140);
              return <Link key={story.id} href={`/article/${story.slug || story.url || story.id}`} className="flex items-center gap-4 py-4">
                {story.thumbnail ? <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-[72px] sm:w-28"><Image src={story.thumbnail} alt="" fill sizes="112px" className="object-cover" unoptimized /></div> : <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300 sm:h-[72px] sm:w-28"><Rss size={18} /></div>}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">{story.created_at ? new Date(story.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Recently"}{getArticleAuthor(story) && ` · ${getArticleAuthor(story)}`}</p>
                  <h3 className="mt-1 font-semibold text-slate-900">{story.title}</h3>
                  {excerpt && <p className="mt-1 line-clamp-1 text-sm text-slate-500">{excerpt}</p>}
                </div>
                <ArrowRight size={16} className="shrink-0 text-slate-400" />
              </Link>;
            })}
          </div>
        </section>}
      </div>
    </main>
  );
}
