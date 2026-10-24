"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { ChevronDown, Compass, GitCompareArrows, Handshake, Search } from "lucide-react";
import { btn, Container, Eyebrow, SectionHeading, cx } from "../ui/kit";
import Reveal from "../ui/Reveal";
import { triggerEnquiryModal } from "../EnquiryModal";

function Count({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: (n) => setV(Math.round(n)) });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref}>{v.toLocaleString("en-IN")}{suffix}</span>;
}

/* ---- Stats band ---- */
export function StatsBand({ models, brands }: { models: number; brands: number }) {
  const stats = [
    { n: Math.max(models, 100), s: "+", l: "EV models listed" },
    { n: Math.max(brands, 40), s: "+", l: "Brands covered" },
    { n: 28, s: "", l: "States with city-wise prices" },
    { n: 0, s: "", l: "Paid rankings — ever" },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#06301f] via-brand-deep to-[#0c6a43] py-14 sm:py-16">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-volt/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-brand/40 blur-3xl" />
      <Container className="relative">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.l} delay={i * 0.07} y={14}>
              <div className="border-l-2 border-white/30 pl-5">
                <p className="font-display text-4xl font-extrabold text-white sm:text-5xl">
                  <Count to={s.n} suffix={s.s} />
                </p>
                <p className="mt-2 text-sm font-bold text-white/90">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---- How it works ---- */
const STEPS = [
  { icon: Search, t: "Discover", d: "Search 100+ EVs or answer a few questions and let Quick Match shortlist the right ones." },
  { icon: GitCompareArrows, t: "Compare", d: "Put up to four vehicles side by side — range, power, price, charging and running cost." },
  { icon: Compass, t: "Decide", d: "Use EMI, savings and range calculators to see what each EV really costs you." },
  { icon: Handshake, t: "Buy with confidence", d: "Get the best offer from verified dealers near you — no obligation." },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <SectionHeading align="center" eyebrow="How it works" title={<>From curious to <span className="text-gradient">confident</span> in four steps</>} description="A simple path that keeps you in control." />
        <div className="relative grid gap-5 md:grid-cols-4">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-9 hidden border-t-2 border-dashed border-brand/45 md:block" />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.t} delay={i * 0.08}>
                <div className="relative h-full rounded-3xl border border-line bg-white p-6 text-center shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                  <span className="relative mx-auto grid h-[72px] w-[72px] place-items-center rounded-full bg-gradient-to-br from-brand-soft to-white text-brand shadow-card ring-4 ring-white">
                    <Icon size={28} />
                    <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-extrabold text-white">{i + 1}</span>
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold text-ink">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.d}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ---- FAQ ---- */
const FAQ = [
  { q: "Is EVPLSE free to use?", a: "Yes. Browsing, comparing, calculators and offers are completely free for buyers." },
  { q: "Are the rankings paid?", a: "No. There are no paid rankings. Specs and prices are verified, and comparisons are side by side." },
  { q: "How do I get the best price on an EV?", a: "Open any vehicle and tap “Get best offer”. We compare dealer, finance and incentive options for your city." },
  { q: "Can I compare cars, scooters and bikes together?", a: "Yes — add up to four vehicles to compare from any listing and see them side by side." },
  { q: "Do you cover upcoming launches?", a: "Yes. The Upcoming page tracks expected launch dates and prices, and you can enquire early." },
];

export function HomeFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-paper py-16 sm:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight text-ink">Answers, before you ask.</h2>
            <p className="mt-4 text-ink-soft">Can&apos;t find what you need? Talk to an EV expert — it takes a minute.</p>
            <button onClick={() => triggerEnquiryModal("Home FAQ")} className={btn("primary", "lg", "mt-6")}>Talk to an expert</button>
          </div>
          <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            {FAQ.map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className="font-bold text-ink">{f.q}</span>
                  <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full transition", open === i ? "rotate-180 bg-brand text-white" : "bg-brand-soft text-brand")}><ChevronDown size={17} /></span>
                </button>
                {open === i && <p className="px-6 pb-6 pr-14 text-[15px] leading-relaxed text-ink-soft">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
