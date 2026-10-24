"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Banknote, CarFront, Package, ShieldCheck, ShoppingCart, Wrench, Zap, ArrowLeftRight } from "lucide-react";
import { Container, Eyebrow, cx } from "../ui/kit";
import Reveal from "../ui/Reveal";

type Svc = {
  title: string;
  blurb: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  /** bubble centre, in % of the stage */
  x: number;
  y: number;
  /** bubble diameter in px (desktop) */
  d: number;
  tone: string;
  delay: string;
};

const SERVICES: Svc[] = [
  { title: "Buy", blurb: "Compare 100+ new EVs with verified specs & on-road prices.", href: "/catalog", icon: ShoppingCart, x: 17, y: 24, d: 150, tone: "bg-[#e3f6ec] text-brand-deep border-[#9ddcb9]", delay: "0s" },
  { title: "Rent", blurb: "Flexible daily, weekly & monthly electric rentals.", href: "/assist", icon: CarFront, x: 42, y: 9, d: 112, tone: "bg-[#c9f1da] text-brand-deep border-[#78d79c]", delay: "-2s" },
  { title: "Finance", blurb: "EMI plans, loan offers and a calculator that does the maths.", href: "/tools?tool=emi", icon: Banknote, x: 70, y: 13, d: 136, tone: "bg-[#d8f5e5] text-brand-deep border-[#8de0b1]", delay: "-4s" },
  { title: "Insure", blurb: "EV-specific insurance with battery cover.", href: "/service/insurance", icon: ShieldCheck, x: 87, y: 40, d: 120, tone: "bg-[#bdeccf] text-brand-deep border-[#6bc995]", delay: "-1s" },
  { title: "Charge", blurb: "Find nearby charging stations and plan your route.", href: "/charging-station", icon: Zap, x: 82, y: 76, d: 148, tone: "bg-[#8df0b0] text-ink border-[#4ad67e]", delay: "-3s" },
  { title: "Service", blurb: "Expert EV care from verified service partners.", href: "/service", icon: Wrench, x: 52, y: 90, d: 116, tone: "bg-[#e3f6ec] text-brand-deep border-[#9ddcb9]", delay: "-5s" },
  { title: "Spare parts", blurb: "Genuine OEM parts, delivered to your door.", href: "/shop", icon: Package, x: 24, y: 80, d: 130, tone: "bg-[#d6f4e2] text-brand-deep border-[#87dbab]", delay: "-2.5s" },
  { title: "Sell", blurb: "Get the best resale value for your used EV.", href: "/sell-ev", icon: ArrowLeftRight, x: 9, y: 52, d: 112, tone: "bg-[#c9f1da] text-brand-deep border-[#78d79c]", delay: "-4.5s" },
];

export default function ServicesOrbit() {
  const [active, setActive] = useState<string | null>(null);
  const cur = SERVICES.find((s) => s.title === active);

  return (
    <section className="relative overflow-hidden border-y border-line bg-gradient-to-b from-white via-[#f5fbf7] to-white py-16 sm:py-24" aria-labelledby="services-h">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <Eyebrow>Complete EV ecosystem</Eyebrow>
            <h2 id="services-h" className="mt-3 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              One platform, <span className="text-gradient">every step</span>
            </h2>
            <p className="mt-4 text-base text-ink-soft sm:text-lg">From your first search to the day you sell — every part of owning an EV, connected around you.</p>
          </Reveal>
        </div>

        {/* Desktop orbit */}
        <div className="relative mx-auto mt-12 hidden h-[620px] max-w-5xl lg:block">
          {/* concentric rings */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-dashed border-brand/40" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-brand/30" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(141,240,176,0.35),transparent_65%)]" />

          {/* connectors */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {SERVICES.map((s) => (
              <line
                key={s.title}
                x1="50" y1="50" x2={s.x} y2={s.y}
                stroke="#0f8f56"
                strokeOpacity={active === s.title ? 1 : 0.65}
                strokeWidth={active === s.title ? 2.5 : 2}
                strokeDasharray="4 4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ transition: "all .3s" }}
              />
            ))}
          </svg>

          {/* hub */}
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute inset-0 -m-4 animate-pulse-ring rounded-full" />
            <div className="relative grid h-[190px] w-[190px] place-items-center rounded-full bg-white shadow-lift ring-8 ring-brand/15 border border-line-strong">
              <div className="text-center">
                <Image src="/evplsenewlogo.png" alt="EVPLSE" width={130} height={34} className="mx-auto h-8 w-auto" style={{ width: "auto" }} />
                <p className="mt-2 px-4 text-[11px] font-bold leading-tight text-ink">
                  {cur ? cur.blurb : "Your EV, start to finish"}
                </p>
              </div>
            </div>
          </div>

          {/* bubbles */}
          {SERVICES.map((s) => {
            const Icon = s.icon;
            const on = active === s.title;
            return (
              <div key={s.title} className="absolute z-20" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.d, height: s.d, marginLeft: -s.d / 2, marginTop: -s.d / 2 }}>
                <Link
                  href={s.href}
                  onMouseEnter={() => setActive(s.title)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(s.title)}
                  onBlur={() => setActive(null)}
                  style={{ animationDelay: s.delay }}
                  className={cx(
                    "group flex h-full w-full animate-float-slow flex-col items-center justify-center gap-1.5 rounded-full border-2 shadow-card transition-all duration-300 hover:scale-110 hover:shadow-lift",
                    s.tone,
                    on && "ring-4 ring-brand/40 shadow-glow scale-105",
                  )}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow-sm text-brand-deep"><Icon size={22} /></span>
                  <span className="text-[15px] font-extrabold">{s.title}</span>
                  <ArrowUpRight size={14} className="-mt-0.5 opacity-0 transition group-hover:opacity-100" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Mobile / tablet grid */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:hidden">
          <div className="col-span-2 mb-1 flex items-center justify-center sm:col-span-4">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-lift ring-8 ring-brand/15 border border-line-strong">
              <Image src="/evplsenewlogo.png" alt="EVPLSE" width={80} height={22} className="h-6 w-auto" style={{ width: "auto" }} />
            </div>
          </div>
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.title} delay={(i % 4) * 0.05} y={14}>
                <Link href={s.href} className={cx("flex h-full flex-col items-start gap-3 rounded-3xl border-2 p-4 shadow-card transition active:scale-[0.98]", s.tone)}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-brand-deep"><Icon size={20} /></span>
                  <span>
                    <span className="block text-base font-extrabold text-ink">{s.title}</span>
                    <span className="mt-0.5 block text-[12px] font-medium leading-snug text-ink/80">{s.blurb}</span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
