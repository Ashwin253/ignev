import type { EvListing } from "./wordpress";
import { formatPricing } from "./wordpress";

export type Faq = { q: string; a: string };

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
};

function chargeText(minutes: number) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}

/** Data-driven FAQs — only includes questions we can answer from the listing. */
export function buildProductFaqs(item: EvListing): Faq[] {
  const name = `${item.brand} ${item.title}`.trim();
  const faqs: Faq[] = [];
  const variants = item.batteryVariants ?? [];

  if (item.prices?.length) {
    faqs.push({
      q: `What is the price of the ${name}?`,
      a: `The ${name} starts at ${formatPricing(item.prices)} (ex-showroom)${variants.length > 1 ? ` across ${variants.length} variants` : ""}. On-road price varies by city, insurance and registration — use "Get best offer" for a city-specific quote.`,
    });
  }

  const maxRange = Math.max(0, ...variants.map((v) => num(v.range)));
  if (maxRange) {
    faqs.push({
      q: `What is the range of the ${name}?`,
      a: `The ${name} has a claimed range of up to ${maxRange} km on a full charge. Real-world range depends on riding or driving style, load, terrain and temperature.`,
    });
  }

  const maxCap = Math.max(0, ...variants.map((v) => num(v.capacity)));
  if (maxCap) {
    faqs.push({
      q: `What is the battery capacity of the ${name}?`,
      a: `The ${name} is offered with a battery of up to ${maxCap} kWh${variants.length > 1 ? `; smaller options are available on other variants` : ""}.`,
    });
  }

  const minCharge = Math.min(...variants.map((v) => num(v.charge)).filter(Boolean), Infinity);
  const ac = item.chargingSpecs?.find((c) => c.acRegularCharging)?.acRegularCharging;
  if (isFinite(minCharge) || ac) {
    faqs.push({
      q: `How long does the ${name} take to charge?`,
      a: `${isFinite(minCharge) ? `Charging takes about ${chargeText(minCharge)} on the quoted charger.` : ""}${ac ? ` AC regular charging: ${ac}.` : ""} Charging time varies with charger power and starting battery level.`.trim(),
    });
  }

  if (item.topSpeed) {
    faqs.push({
      q: `What is the top speed of the ${name}?`,
      a: `The ${name} has a claimed top speed of ${item.topSpeed} km/h.`,
    });
  }

  if (item.colors?.length) {
    faqs.push({
      q: `How many colours does the ${name} come in?`,
      a: `The ${name} is available in ${item.colors.length} colour option${item.colors.length > 1 ? "s" : ""}. Open the colour picker in the gallery to preview each one.`,
    });
  }

  faqs.push({
    q: `How do I get the best offer on the ${name}?`,
    a: `Tap "Get best offer" and share your city. EVPLSE experts compare dealers, finance and current offers for you — there are no paid rankings and no obligation.`,
  });

  return faqs;
}
