import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag, Zap } from "lucide-react";
import { getSiteContent } from "../../lib/site-content";
import ProductGallery from "../../components/ProductGallery";

// Build a URL-safe slug from brand + name
function toSlug(brand: string, name: string) {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function generateStaticParams() {
  const content = await getSiteContent();
  const all = [
    ...content.products.electric_cars,
    ...content.products.electric_two_wheelers,
    ...content.products.electric_autos,
  ];
  return all.map((item) => ({ slug: toSlug(item.brand, item.name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getSiteContent();
  const all = [
    ...content.products.electric_cars,
    ...content.products.electric_two_wheelers,
    ...content.products.electric_autos,
  ];
  const item = all.find((p) => toSlug(p.brand, p.name) === slug);
  if (!item) return {};
  return {
    title: `${item.brand} ${item.name} | EVPULSE`,
    description: `${item.brand} ${item.name} — ${item.type}. Starting at ${item.pricing}.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getSiteContent();

  const all = [
    ...content.products.electric_cars,
    ...content.products.electric_two_wheelers,
    ...content.products.electric_autos,
  ];

  const item = all.find((p) => toSlug(p.brand, p.name) === slug);
  if (!item) notFound();

  // Build a small gallery — the single photo repeated at different crop hints
  // so the carousel has something to show. When real multi-photo data is added
  // to products.json, replace this array with item.photos.
  const photos: string[] = [item.photo];

  // Related vehicles — same brand or same type, excluding self
  const related = all
    .filter(
      (p) =>
        p !== item &&
        (p.brand === item.brand || p.type === item.type)
    )
    .slice(0, 3);

  return (
    <section className="bg-white min-h-screen py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-sky-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-sky-600 transition-colors">
            Catalog
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">
            {item.brand} {item.name}
          </span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Gallery */}
          <ProductGallery photos={photos} name={`${item.brand} ${item.name}`} />

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 mb-1">
                {item.brand}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                {item.name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                <Zap size={14} className="text-sky-500" />
                {item.type}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700">
                <Tag size={14} />
                {item.pricing}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Quick specs
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Brand</dt>
                  <dd className="font-medium text-slate-900">{item.brand}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Model</dt>
                  <dd className="font-medium text-slate-900">{item.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-medium text-slate-900">{item.type}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Price range</dt>
                  <dd className="font-medium text-slate-900">{item.pricing}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={undefined}
                className="flex-1 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
              >
                Enquire Now
              </button>
              <Link
                href="/catalog"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Catalog
              </Link>
            </div>
          </div>
        </div>

        {/* Related vehicles */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-semibold text-slate-900 mb-8">
              You might also like
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rel) => (
                <Link
                  key={`${rel.brand}-${rel.name}`}
                  href={`/product/${toSlug(rel.brand, rel.name)}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] transition-shadow"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={rel.photo}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                      {rel.brand}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {rel.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{rel.pricing}</p>
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
