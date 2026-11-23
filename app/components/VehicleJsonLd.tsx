import type { EvListing } from "../lib/wordpress";
import { isLaunched } from "../lib/wordpress";
import { getMediaRatingSummary, type VehicleMediaRating } from "../lib/media-ratings";

type Promotion = {
  text?: string | null;
  cities?: string | string[] | null;
  valid_until?: string | null;
};

type VehicleJsonLdProps = {
  item: EvListing;
  promotions: Promotion[];
  mediaRatings: VehicleMediaRating[];
  launched: boolean;
  photos: string[];
};

const SITE_URL = "https://www.evplse.com";
const IN_STOCK = "https://schema.org/InStock";
const PRE_ORDER = "https://schema.org/PreOrder";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";

function toRupees(value: string): number[] {
  const amounts = value.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  const hasCroreUnit = /(?:crores?|cr)\b/i.test(value);
  const hasLakhUnit = /(?:lakhs?|lacs?)\b/i.test(value);

  return amounts
    .map((amount) => Number(amount.replace(/,/g, "")))
    .filter((amount) => Number.isFinite(amount) && amount > 0)
    .map((amount) => {
      if (hasCroreUnit) return amount * 10_000_000;
      if (hasLakhUnit || amount <= 1000) return amount * 100_000;
      return amount;
    });
}

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

function splitCities(cities: Promotion["cities"]): string[] {
  if (Array.isArray(cities)) return cities.map((city) => city.trim()).filter(Boolean);
  return cities?.split(",").map((city) => city.trim()).filter(Boolean) ?? [];
}

export default function VehicleJsonLd({
  item,
  promotions,
  mediaRatings,
  launched,
  photos,
}: VehicleJsonLdProps) {
  const productUrl = absoluteUrl(`/product/${encodeURIComponent(item.slug)}`);
  const productId = `${productUrl}#product`;
  const imageUrls = photos.map(absoluteUrl);
  const ratingSummary = getMediaRatingSummary(mediaRatings);
  const variants = (item.batteryVariants ?? []).flatMap((variant) => {
    if (!variant.price) return [];
    return toRupees(variant.price).map((price) => ({
      name: variant.modelName,
      price,
      availability: item.discontinued
        ? OUT_OF_STOCK
        : !["Coming Soon", "Announced", "Concept", "Facelift"].includes(variant.usage_type || "") &&
            isLaunched(variant.launch_date)
          ? IN_STOCK
          : PRE_ORDER,
    }));
  });
  const pricedVariants = variants.length
    ? variants
    : (item.prices ?? []).flatMap((rawPrice) =>
        toRupees(rawPrice).map((price) => ({
          name: undefined,
          price,
          availability: item.discontinued ? OUT_OF_STOCK : launched ? IN_STOCK : PRE_ORDER,
        }))
      );
  const priceOffers = pricedVariants.map((variant, index) => ({
    "@id": `${productUrl}#offer-${index + 1}`,
    "@type": "Offer",
    ...(variant.name ? { name: `${item.brand} ${item.title} ${variant.name}` } : {}),
    price: variant.price,
    priceCurrency: "INR",
    availability: variant.availability,
    itemCondition: "https://schema.org/NewCondition",
    url: productUrl,
    itemOffered: { "@id": productId },
  }));
  const today = new Date().toISOString().slice(0, 10);
  const promotionOffers = promotions
    .filter((promotion) => promotion.text?.trim())
    .filter((promotion) => !promotion.valid_until || promotion.valid_until >= today)
    .map((promotion, index) => ({
      "@id": `${productUrl}#promotion-${index + 1}`,
      "@type": "Offer",
      name: promotion.text!.trim(),
      description: promotion.text!.trim(),
      url: productUrl,
      itemOffered: { "@id": productId },
      ...(promotion.valid_until ? { validThrough: promotion.valid_until } : {}),
      ...(splitCities(promotion.cities).length
        ? {
            eligibleRegion: splitCities(promotion.cities).map((city) => ({
              "@type": "AdministrativeArea",
              name: city,
            })),
          }
        : {}),
    }));

  const product = {
    "@type": "Product",
    "@id": productId,
    name: `${item.brand} ${item.title}`.trim(),
    image: imageUrls,
    description:
      `${item.brand} ${item.title} — Electric ${item.types[0] || "vehicle"}.` +
      (item.pros?.length ? ` Highlights: ${item.pros.slice(0, 3).join(", ")}.` : ""),
    brand: { "@type": "Brand", name: item.brand },
    category: item.types[0] || "Electric Vehicle",
    ...(ratingSummary
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            name: "EVPLSE media average",
            description: `Normalized average across the model and its variants from ${ratingSummary.ratingCount} media ${ratingSummary.ratingCount === 1 ? "rating" : "ratings"}.`,
            ratingValue: ratingSummary.ratingValue,
            bestRating: 5,
            worstRating: 0,
            ratingCount: ratingSummary.ratingCount,
          },
        }
      : {}),
    additionalProperty: [
      ...(item.topSpeed
        ? [{ "@type": "PropertyValue", name: "Top Speed", value: `${item.topSpeed} km/h` }]
        : []),
      ...(item.batteryVariants?.[0]?.range
        ? [{
            "@type": "PropertyValue",
            name: "Driving Range",
            value: `${item.batteryVariants[0].range} km`,
          }]
        : []),
      ...(item.batteryVariants?.[0]?.capacity
        ? [{
            "@type": "PropertyValue",
            name: "Battery Capacity",
            value: `${item.batteryVariants[0].capacity} kWh`,
          }]
        : []),
    ],
    ...(priceOffers.length
      ? { offers: priceOffers.map((offer) => ({ "@id": offer["@id"] })) }
      : {}),
  };
  const breadcrumbList = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Catalog", item: absoluteUrl("/catalog") },
      {
        "@type": "ListItem",
        position: 3,
        name: `${item.brand} ${item.title}`.trim(),
        item: productUrl,
      },
    ],
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [product, ...priceOffers, ...promotionOffers, breadcrumbList],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
