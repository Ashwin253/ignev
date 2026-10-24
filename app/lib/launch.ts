import type { EvListing } from "./wordpress";

/** Parse the many launch-date formats used in listings into a Date (or null). */
export function parseVehicleLaunchDate(launchdate: string | null | undefined): Date | null {
  if (!launchdate) return null;
  const raw = String(launchdate).trim();
  if (!raw) return null;

  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const d = new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
    return isNaN(d.getTime()) ? null : d;
  }
  const ym = raw.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (ym) return new Date(parseInt(ym[1], 10), parseInt(ym[2], 10), 0, 23, 59, 59);
  if (/^\d{4}$/.test(raw)) return new Date(parseInt(raw, 10), 11, 31, 23, 59, 59);

  const q = raw.match(/(?:Q([1-4])|early|mid|late)\s*(\d{4})/i);
  if (q) {
    const year = parseInt(q[2] || q[1], 10);
    if (!isNaN(year)) return new Date(year, 11, 31, 23, 59, 59);
  }
  const std = new Date(raw);
  return isNaN(std.getTime()) ? null : std;
}

/** True when a vehicle is an upcoming / future release. */
export function isUpcomingVehicle(l: Pick<EvListing, "coming_soon" | "announced" | "concept" | "launchdate" | "prices">): boolean {
  if (l.coming_soon || l.announced || l.concept) return true;
  if (!l.launchdate) return !(l.prices && l.prices.length > 0);

  const raw = String(l.launchdate).trim().toLowerCase();
  if (raw === "tba" || raw.includes("coming soon") || raw.includes("expected") || raw.includes("unannounced")) return true;

  const parsed = parseVehicleLaunchDate(l.launchdate);
  if (parsed) return parsed.getTime() > Date.now();
  return false;
}

export function launchLabel(launchdate: string | null | undefined): string {
  const d = parseVehicleLaunchDate(launchdate);
  if (!d) return "";
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
