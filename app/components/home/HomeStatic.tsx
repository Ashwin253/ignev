import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Banknote, Bike, BatteryCharging, CalendarDays, Car, CarFront, CheckCircle2, Gauge, Package,
  ShieldCheck, ShoppingCart, Sparkles, Truck, Wrench, Zap, ArrowLeftRight, TrendingDown,
} from "lucide-react";
import { Container, Eyebrow, SectionHeading, cx } from "../ui/kit";
import Reveal from "../ui/Reveal";

/* ---------------- Category tiles ---------------- */
const CATS = [
  { label: "Electric Cars", sub: "SUVs, sedans & hatchbacks", href: "/catalog?type=cars", icon: Car, tint: "from-[#06301f] to-[#0f8f56] text-white", dark: true },
  { label: "Electric Scooters", sub: "Daily commuters", href: "/catalog?type=scooter", icon: Zap, tint: "from-[#e3f6ec] to-white", dark: false },
  { label: "Electric Bikes", sub: "Performance motorcycles", href: "/catalog?type=bike", icon: Bike, tint: "from-[#bdeccf] to-[#eef9f2]", dark: false },
  { label: "Commercial EVs", sub: "Cargo, fleet & 3-wheelers", href: "/catalog?type=commercial", icon: Truck, tint: "from-[#0a4a30] to-[#2fb673] text-white", dark: true },
];

export function CategoryTiles({ counts }: { counts: Record<string, number> }) {
  const keyOf = (href: string) => new URL(href, "http://x").searchParams.get("type") || "";
  return (
    <section className="relative z-10 -mt-6 pb-4 sm:-mt-10">
      <Container>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {CATS.map((c, i) => {
            const Icon = c.icon;
            const n = counts[keyOf(c.href)] ?? 0;
            return (
              <Reveal key={c.href} delay={i * 0.06} y={16}>
                <Link
                  href={c.href}
                  className={cx("group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-line bg-gradient-to-br p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-6", c.tint)}
                >
                  <span className={cx("grid h-11 w-11 place-items-center rounded-2xl shadow-sm sm:h-12 sm:w-12", c.dark ? "bg-white/15 text-volt backdrop-blur" : "bg-white text-brand ring-1 ring-brand/15")}>
                    <Icon size={22} />
                  </span>
                  <div className="mt-6 sm:mt-8">
                    <h3 className={cx("text-[15px] font-extrabold leading-tight sm:text-lg", c.dark ? "text-white" : "text-ink")}>{c.label}</h3>
                    <p className={cx("mt-1 hidden text-[13px] sm:block", c.dark ? "text-emerald-100/80" : "text-ink-soft")}>{c.sub}</p>
                    <p className={cx("mt-2 flex items-center gap-1 text-xs font-bold", c.dark ? "text-volt" : "text-brand")}>
                      {n > 0 ? `${n} models` : "Explore"} <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Brand marquee ---------------- */
const BRANDS = ["Tata", "Mahindra", "MG", "BYD", "Hyundai", "Ola Electric", "Ather", "TVS", "Bajaj", "Hero Vida", "Revolt", "Ultraviolette", "Kia", "BMW", "Mercedes-Benz", "Euler", "Piaggio", "Simple Energy"];

export function BrandMarquee() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <section className="border-y border-line bg-white py-6" aria-label="Brands on EVPLSE">
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-12 whitespace-nowrap">
          {row.map((b, i) => (
            <Link
              key={b + i}
              href={`/catalog?q=${encodeURIComponent(b)}`}
              className="font-display text-xl font-extrabold tracking-tight text-ink/80 transition-colors hover:text-brand sm:text-2xl"
            >
              {b}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why EVPLSE ---------------- */
const WHY = [
  { title: "Trust", icon: ShieldCheck, items: ["Verified information, not marketing copy", "No paid rankings, ever", "Transparent, side-by-side comparisons"] },
  { title: "Expertise", icon: Sparkles, items: ["Backed by industry experts", "Real-world, on-road testing", "The latest EV insights, explained simply"] },
  { title: "Ecosystem", icon: BatteryCharging, items: ["Vehicles, charging & finance", "Insurance & genuine parts", "Fleet management — everything connected"] },
];

export function WhySection() {
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Why EVPLSE" title="Why EVPLSE?" description="Trust isn't claimed — it's built into how the platform works." />
        <div className="grid gap-5 md:grid-cols-3">
          {WHY.map((w, i) => {
            const Icon = w.icon;
            return (
              <Reveal key={w.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-line bg-white p-7 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon size={24} /></span>
                  <h3 className="mt-5 text-xl font-extrabold text-ink">{w.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {w.items.map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-[15px] font-medium text-ink-soft">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- News ---------------- */
export type NewsItem = { id: string; title: string; href: string; excerpt: string; date?: string; photo: string };

function fmt(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function NewsGrid({ items }: { items: NewsItem[] }) {
  if (!items.length) return null;
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Latest updates" title="Reviews, comparisons & insight." description="Real testing, honest opinions, and in-depth EV insights — updated regularly." href="/updates" hrefLabel="All articles" />
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((n, i) => (
            <Reveal key={n.id} delay={i * 0.07}>
              <Link href={n.href} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                <div className="relative aspect-[16/10] overflow-hidden bg-brand-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.photo} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {n.date && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-mute">
                      <CalendarDays size={13} /> {fmt(n.date)}
                    </p>
                  )}
                  <h3 className="mt-2 line-clamp-2 text-lg font-extrabold leading-snug text-ink transition-colors group-hover:text-brand">{n.title}</h3>
                  {n.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{n.excerpt}</p>}
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-brand">
                    Read more <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------------- Tools ---------------- */
const TOOLS = [
  { title: "Charging Calculator", desc: "Estimate charge time & cost for any EV battery", icon: BatteryCharging, tool: "charging" },
  { title: "Savings Calculator", desc: "Compare fuel vs EV running costs over years", icon: TrendingDown, tool: "savings" },
  { title: "EMI Calculator", desc: "Monthly loan payment & interest breakdown", icon: Banknote, tool: "emi" },
  { title: "Range Calculator", desc: "Real-world range based on driving conditions", icon: Gauge, tool: "range" },
];

export function ToolsGrid() {
  return (
    <section className="border-t border-line bg-white py-14 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Tools" title="Tools that do the maths for you." description="Calculators built specifically for Indian EV buyers & operators." href="/tools" hrefLabel="All tools" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {TOOLS.map((t, i) => {
            const Icon = t.icon;
            return (
              <Reveal key={t.tool} delay={i * 0.05} y={14}>
                <Link href={`/tools?tool=${t.tool}`} className="group flex h-full min-h-[170px] flex-col justify-between rounded-3xl border border-line-strong bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-brand hover:shadow-lift sm:p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand shadow-sm ring-1 ring-brand/20 transition group-hover:bg-brand group-hover:text-white">
                    <Icon size={21} />
                  </span>
                  <div className="mt-5">
                    <h3 className="font-extrabold text-ink group-hover:text-brand">{t.title}</h3>
                    <p className="mt-1 text-[13px] leading-snug text-ink-soft">{t.desc}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export { Eyebrow };
