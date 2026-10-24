import type { CatalogItem } from "./catalog-types";

export function toSlug(brand: string, name: string) {
  return `${brand}-${name}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function itemSlug(item: Pick<CatalogItem, "slug" | "brand" | "name">) {
  return item.slug ?? toSlug(item.brand, item.name);
}

/** Lowest listed price in LAKHS (0 when unknown). */
export function priceLowLakh(item: Pick<CatalogItem, "prices" | "pricing">): number {
  if (item.prices?.length) {
    const raw = String(item.prices[0]).replace(/[₹,a-zA-Z\s]/g, "");
    const low = parseFloat(raw.split(/[-–]/)[0]);
    if (!isNaN(low) && low > 0) return low > 1000 ? low / 100000 : low;
  }
  const match = (item.pricing || "").replace(/[₹,]/g, "").match(/[\d.]+/);
  const v = match ? parseFloat(match[0]) : 0;
  if (/cr/i.test(item.pricing || "")) return v * 100;
  return v;
}

export function emiPerMonth(principal: number, annualRatePct = 9.5, months = 36) {
  const m = annualRatePct / 12 / 100;
  if (m === 0) return principal / months;
  return (principal * m * Math.pow(1 + m, months)) / (Math.pow(1 + m, months) - 1);
}

export function inr(v: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v));
}

/** "3,793" → "₹3.8k" style short rupee. */
export function inrShort(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2).replace(/\.?0+$/, "")}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2).replace(/\.?0+$/, "")}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `₹${Math.round(v)}`;
}

export function titleCaseSlug(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
