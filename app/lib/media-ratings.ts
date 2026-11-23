export type VehicleMediaSource = {
  id: string;
  name: string;
  website_url: string | null;
  logo_url: string | null;
  created_at: string;
};

export type VehicleMediaRating = {
  id: string;
  listing_id: string;
  variant_id: string | null;
  source_id: string;
  source_name: string;
  media_source: Pick<VehicleMediaSource, "id" | "name" | "website_url" | "logo_url"> | null;
  rating_value: number;
  rating_max: number;
  review_url: string | null;
  created_at: string;
};

type VehicleMediaSourceSummary = Pick<VehicleMediaSource, "id" | "name" | "website_url" | "logo_url">;
type VehicleMediaRatingQueryRow = Omit<VehicleMediaRating, "media_source"> & {
  media_source: VehicleMediaSourceSummary | VehicleMediaSourceSummary[] | null;
};

export function normalizeVehicleMediaRatings(rows: VehicleMediaRatingQueryRow[]): VehicleMediaRating[] {
  return rows.map((rating) => ({
    ...rating,
    media_source: Array.isArray(rating.media_source) ? rating.media_source[0] ?? null : rating.media_source,
  }));
}

export function getMediaRatingSummary(
  ratings: Pick<VehicleMediaRating, "rating_value" | "rating_max">[]
) {
  const values = ratings
    .map((rating) => {
      const value = Number(rating.rating_value);
      const maximum = Number(rating.rating_max);
      return Number.isFinite(value) && Number.isFinite(maximum) && maximum > 0 && value >= 0 && value <= maximum
        ? (value / maximum) * 5
        : null;
    })
    .filter((value): value is number => value !== null);

  if (!values.length) return null;

  return {
    ratingValue: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100,
    ratingCount: values.length,
  };
}

export function getSafeReviewUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
