"use client";

import { Star } from "lucide-react";
import MediaSourceLogo from "../components/MediaSourceLogo";
import { getMediaRatingSummary, getSafeReviewUrl, type VehicleMediaRating } from "../lib/media-ratings";
import type { EvListing } from "../lib/wordpress";

export default function ProductMediaRatings({
  item,
  ratings,
}: {
  item: EvListing;
  ratings: VehicleMediaRating[];
}) {
  if (ratings.length === 0) return null;

  const summary = getMediaRatingSummary(ratings);
  const variantNames = new Map<string, string>();
  for (const variant of [...(item.batteryVariants ?? []), ...(item.baasVariants ?? [])]) {
    if (variant.id && variant.modelName) variantNames.set(variant.id, variant.modelName);
  }

  return (
    <section id="media-ratings" className="scroll-mt-32 pt-12">
      <div className="rounded-[28px] border border-line-strong bg-white/70 p-6 shadow-card backdrop-blur-xl md:p-8">
        <header className="mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">Media ratings</h2>
          <p className="mt-1 text-sm text-zinc-500">Ratings and reviews from vehicle media outlets.</p>
        </header>

        <div className="space-y-4">
          {summary && (
            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4">
              <Star size={24} className="text-amber-500" fill="currentColor" />
              <div>
                <p className="text-xl font-extrabold text-zinc-900">
                  {summary.ratingValue.toFixed(2)} <span className="text-sm font-semibold text-zinc-500">/ 5</span>
                </p>
                <p className="text-xs font-medium text-zinc-600">
                  Average normalized rating across the model and variants from {summary.ratingCount} media {summary.ratingCount === 1 ? "rating" : "ratings"}
                </p>
              </div>
            </div>
          )}

          {ratings.map((rating) => {
            const reviewUrl = getSafeReviewUrl(rating.review_url);
            const sourceName = rating.media_source?.name ?? rating.source_name;

            return (
              <article key={rating.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <MediaSourceLogo name={sourceName} logoUrl={rating.media_source?.logo_url} />
                  <div>
                    <p className="font-bold text-zinc-900">{sourceName}</p>
                    <p className="mt-0.5 text-xs font-medium text-zinc-500">
                      {rating.variant_id ? variantNames.get(rating.variant_id) ?? "Vehicle variant" : "Entire model"}
                    </p>
                    <div className="mt-1 flex gap-3">
                      {reviewUrl && (
                        <a href={reviewUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-700 underline">
                          Read review
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-zinc-800">
                  {rating.rating_value} / {rating.rating_max}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
