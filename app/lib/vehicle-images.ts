/**
 * Vehicle image helper utilities.
 * Provides fallback images:
 * - /twowheelwrap.png for 2-wheelers (scooters, bikes, motorcycles)
 * - /fourwheelwrap.png for 4-wheelers (cars, SUVs, etc.) and default
 */

export function isTwoWheeler(item?: {
  types?: string[];
  type?: string;
  body_type?: string;
  bodyType?: string;
  category?: string;
  usage_type?: string | null;
  usageType?: string | null;
  name?: string;
  title?: string;
}): boolean {
  if (!item) return false;

  const rawValues = [
    ...(item.types || []),
    item.type || "",
    item.body_type || "",
    item.bodyType || "",
    item.category || "",
    item.usage_type || "",
    item.usageType || "",
  ];

  const str = rawValues.join(" ").toLowerCase();

  return (
    str.includes("2-wheeler") ||
    str.includes("2 wheeler") ||
    str.includes("2wheeler") ||
    str.includes("two wheeler") ||
    str.includes("twowheeler") ||
    str.includes("scooter") ||
    str.includes("motorcycle") ||
    str.includes("bike")
  );
}

export function getVehicleFallbackImage(item?: {
  types?: string[];
  type?: string;
  body_type?: string;
  bodyType?: string;
  category?: string;
  usage_type?: string | null;
  usageType?: string | null;
  name?: string;
  title?: string;
}): string {
  return isTwoWheeler(item) ? "/twowheelwrap.png" : "/fourwheelwrap.png";
}

export function getVehiclePhoto(
  photo?: string | null,
  item?: {
    types?: string[];
    type?: string;
    body_type?: string;
    bodyType?: string;
    category?: string;
    usage_type?: string | null;
    usageType?: string | null;
    name?: string;
    title?: string;
  }
): string {
  if (
    photo &&
    typeof photo === "string" &&
    photo.trim() !== "" &&
    photo !== "null" &&
    photo !== "undefined"
  ) {
    return photo;
  }
  return getVehicleFallbackImage(item);
}
