import type { EvListing } from "./wordpress";
import { formatPricing, isLaunched } from "./wordpress";
import { getVehicleCardSpecs } from "./listing-specs";
import { isUpcomingVehicle, parseVehicleLaunchDate } from "./launch";
import type { CatalogItem } from "./catalog-types";

/** Slim, serialisable version of a listing for client components (keeps page payloads small). */
export function toCatalogItem(l: EvListing): CatalogItem {
  const { power, torque, battery } = getVehicleCardSpecs(l);
  const upcomingVariant = l.batteryVariants?.find((variant) =>
    variant.usage_type === "Coming Soon" || !isLaunched(variant.launch_date)
  );
  const hasLaunchedVariant = l.batteryVariants?.some((variant) =>
    !["Coming Soon", "Announced", "Concept", "Facelift"].includes(variant.usage_type || "") &&
    isLaunched(variant.launch_date)
  ) ?? false;
  const modelUpcoming = isUpcomingVehicle(l) && !hasLaunchedVariant;
  return {
    name: l.title,
    brand: l.brand,
    type: l.types?.[0] ?? "",
    types: l.types ?? [],
    body_type: l.body_type || (l as any).bodyType || "",
    bodyType: l.body_type || (l as any).bodyType || "",
    pricing: formatPricing(l.prices),
    photo: l.photo,
    slug: l.slug,
    topSpeed: l.topSpeed,
    drivingRange: l.batteryVariants?.[0]?.range || "",
    commercial: l.commercial,
    usageType: (l as any).usage_type || "",
    launchdate: l.launchdate,
    prices: l.prices,
    baas: l.baas,
    video_links: l.video_links?.slice(0, 1),
    power,
    torque,
    battery,
    upcoming: modelUpcoming || !!upcomingVariant,
    launchTs: upcomingVariant
      ? parseVehicleLaunchDate(upcomingVariant.launch_date)?.getTime() ?? 0
      : parseVehicleLaunchDate(l.launchdate)?.getTime() ?? 0,
    upcomingVariantName: upcomingVariant?.modelName,
    upcomingVariantPrice: upcomingVariant?.price,
  };
}
