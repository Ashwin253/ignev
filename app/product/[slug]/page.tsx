import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Tag, Zap, BatteryCharging, Gauge, MapPin,
  CheckCircle2, XCircle, CalendarDays, BadgeCheck, Truck,
} from "lucide-react";
import {
  fetchEvListings, fetchEvListingBySlug,
  formatLaunchDate, isLaunched,
} from "../../lib/wordpress";
import { getSiteContent } from "../../lib/site-content";
import ProductGallery from "../../components/ProductGallery";

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  // Try WP first, fall back to local JSON slugs
  try {
    const listings = await fetchEvListings(200);
    if (listings.length) return listings.map((l) => ({ slug: l.slug }));
  } catch { /* fall through */ }

  const content = await getSiteContent();
  const all = [
    ...content.products.electric_cars,
    ...content.products.electric_two_wheelers,
    ...content.products.electric_autos,
  ];
  return all.map((item) => ({
    slug: `${item.brand}-${item.name}`
      .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await fetchEvListingBySlug(slug);
  if (!item) return {};
  return {
    title: `${item.brand} ${item.title} | EVPULSE`,
    description: `${item.brand} ${item.title} — ${item.types[0] ?? "EV"}. Starting at ₹${item.prices.join("-")} lakh.`,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await fetchEvListingBySlug(slug);
  if (!item) notFound();

  const photos = item.photo ? [item.photo] : [];
  const launched = isLaunched(item.launchdate);
  const launchLabel = formatLaunchDate(item.launchdate);

  // Related — fetch all and pick same brand or type
  const all = await fetchEvListings(100);
  const related = all
    .filter((l) => l.slug !== slug && (l.brand === item.brand || l.types[0] === item.types[0]))
    .slice(0, 3);

  return (
    <section className="bg-white min-h-screen py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-sky-600 transition-colors">Catalog</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">{item.brand} {item.title}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Gallery */}
          <ProductGallery photos={photos} name={`${item.brand} ${item.title}`} />

          {/* Details */}
          <div className="flex flex-col gap-6">
            {/* Brand + title */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 mb-1">
                {item.brand}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                {item.title}
              </h1>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {item.types[0] && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Zap size={14} className="text-sky-500" />
                  {item.types[0]}
                </span>
              )}
              {item.commercial && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1.5 text-sm font-medium text-orange-700">
                  <Truck size={14} />
                  Commercial
                </span>
              )}
              {item.prices.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700">
                  <Tag size={14} />
                  ₹{item.prices.join(" – ")} lakh
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                launched
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                <CalendarDays size={14} />
                {launched ? (
                  <><BadgeCheck size={14} className="text-emerald-500" /> {launchLabel}</>
                ) : launchLabel}
              </span>
            </div>

            {/* Specs grid */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Specifications
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Brand</dt>
                  <dd className="font-semibold text-slate-900">{item.brand}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs mb-0.5">Category</dt>
                  <dd className="font-semibold text-slate-900">{item.types.join(", ") || "—"}</dd>
                </div>
                {item.realWorldRange !== null && (
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-sky-500 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-slate-400 text-xs mb-0.5">Real-world range</dt>
                      <dd className="font-semibold text-slate-900">{item.realWorldRange} km</dd>
                    </div>
                  </div>
                )}
                {item.batteryCapacity !== null && (
                  <div className="flex items-start gap-2">
                    <BatteryCharging size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-slate-400 text-xs mb-0.5">Battery</dt>
                      <dd className="font-semibold text-slate-900">{item.batteryCapacity} kWh</dd>
                    </div>
                  </div>
                )}
                {item.chargingSpeed !== null && (
                  <div className="flex items-start gap-2">
                    <Gauge size={15} className="text-violet-500 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-slate-400 text-xs mb-0.5">Charging speed</dt>
                      <dd className="font-semibold text-slate-900">{item.chargingSpeed} kW</dd>
                    </div>
                  </div>
                )}
                {item.topSpeed !== null && (
                  <div className="flex items-start gap-2">
                    <Zap size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-slate-400 text-xs mb-0.5">Top speed</dt>
                      <dd className="font-semibold text-slate-900">{item.topSpeed} km/h</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Pros & Cons */}
            {(item.pros.length > 0 || item.cons.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {item.pros.length > 0 && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3">
                      Pros
                    </p>
                    <ul className="space-y-2">
                      {item.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.cons.length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-3">
                      Cons
                    </p>
                    <ul className="space-y-2">
                      {item.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <XCircle size={15} className="text-rose-500 mt-0.5 shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button className="flex-1 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors">
                Enquire Now
              </button>
              <Link
                href="/catalog"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Catalog
              </Link>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-semibold text-slate-900 mb-8">You might also like</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/product/${rel.slug}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] transition-shadow"
                >
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    {rel.photo && (
                      <img
                        src={rel.photo}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{rel.brand}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{rel.title}</h3>
                    {rel.prices.length > 0 && (
                      <p className="mt-1 text-sm text-slate-500">₹{rel.prices.join(" – ")} lakh</p>
                    )}
                    {/* Launch status */}
                    <p className={`mt-2 text-xs font-medium ${isLaunched(rel.launchdate) ? "text-emerald-600" : "text-amber-600"}`}>
                      {formatLaunchDate(rel.launchdate)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
