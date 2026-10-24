import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BatteryCharging, Calculator, Compass, Eye, Handshake, Map, Rocket, ShieldCheck, Sparkles, Target,
  Banknote, CarFront, Package, ShoppingCart, Wrench, Zap, ArrowLeftRight, Layers,
} from "lucide-react";
import { btn, Container, Eyebrow, SectionHeading } from "../components/ui/kit";
import Reveal from "../components/ui/Reveal";

export const metadata: Metadata = {
  title: "About Us | EVPLSE - India's Premier EV Marketplace",
  description: "Learn about EVPLSE (EVPLSE Future Mobility), India's leading platform for electric and hybrid vehicles, charging stations, and green mobility solutions.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | EVPLSE",
    description: "Learn about EVPLSE (EVPLSE Future Mobility), India's leading platform for electric and hybrid vehicles.",
    url: "https://www.evplse.com/about",
    siteName: "EVPLSE",
    type: "website",
  },
};

const WHAT = [
  { icon: Layers, t: "Comprehensive catalog", d: "From affordable electric scooters to luxury electric SUVs — the entire spectrum of zero-emission vehicles, side by side." },
  { icon: Calculator, t: "Cost transparency", d: "Calculators that show the exact savings from switching from fossil fuels to electric power — EMI, running cost and range." },
  { icon: BadgeCheck, t: "Verified listings", d: "Vehicles on our platform meet strict quality and transparency standards — including verified pre-owned EVs." },
  { icon: Map, t: "Integrated charging maps", d: "Plan routes with confidence using our built-in EV charging station locator and interactive maps." },
  { icon: Handshake, t: "Expert guidance", d: "Neutral advice across every brand. Tell us what you need and our EV experts help you decide." },
  { icon: Compass, t: "Insight & news", d: "Reviews, comparisons and launch tracking explained simply, so you always know what is next." },
];

const PRINCIPLES = [
  { icon: ShieldCheck, t: "Trust", d: "Verified information, not marketing copy. No paid rankings, ever." },
  { icon: Sparkles, t: "Expertise", d: "Industry knowledge turned into plain, useful answers." },
  { icon: BatteryCharging, t: "Ecosystem", d: "Vehicles, charging, finance, insurance, parts and resale — all connected." },
];

const ECO = [
  { t: "Buy", icon: ShoppingCart, href: "/catalog" },
  { t: "Rent", icon: CarFront, href: "/assist" },
  { t: "Finance", icon: Banknote, href: "/tools?tool=emi" },
  { t: "Insure", icon: ShieldCheck, href: "/service/insurance" },
  { t: "Charge", icon: Zap, href: "/charging-station" },
  { t: "Service", icon: Wrench, href: "/service" },
  { t: "Spare parts", icon: Package, href: "/shop" },
  { t: "Sell", icon: ArrowLeftRight, href: "/sell-ev" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-aurora relative overflow-hidden pb-16 pt-[calc(var(--header-h)+48px)] sm:pb-24">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="pointer-events-none absolute -right-40 top-10 hidden h-[560px] w-[560px] animate-spin-slow rounded-full border border-dashed border-brand/20 lg:block" />
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <Reveal>
              <Eyebrow>About EVPLSE</Eyebrow>
              <h1 className="mt-4 text-[2.6rem] font-extrabold leading-[1.04] text-ink sm:text-6xl">
                Making electric mobility <span className="text-gradient">simple, honest</span> and accessible.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
                Welcome to EVPLSE (EVPLSE Future Mobility), India&apos;s premier marketplace for electric and hybrid vehicles. Our mission is to accelerate the transition to sustainable mobility by making it seamless, transparent, and accessible for everyone.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/catalog" className={btn("primary", "lg")}>Explore EVs <ArrowRight size={18} /></Link>
                <Link href="/assist" className={btn("outline", "lg")}>Talk to an expert</Link>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative mx-auto grid max-w-md grid-cols-2 gap-4">
                <div className="col-span-2 rounded-3xl bg-gradient-to-br from-[#06301f] via-brand-deep to-brand p-6 text-white shadow-lift">
                  <Rocket size={26} className="text-volt" />
                  <p className="mt-6 font-display text-2xl font-extrabold leading-tight">Cleaner, greener future — one informed choice at a time.</p>
                </div>
                <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
                  <p className="font-display text-4xl font-extrabold text-brand">4</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">Vehicle types: cars, scooters, bikes &amp; commercial</p>
                </div>
                <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
                  <p className="font-display text-4xl font-extrabold text-brand">0</p>
                  <p className="mt-1 text-sm font-semibold text-ink-soft">Paid rankings. Comparisons you can trust.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Mission & vision */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-[2rem] border border-line bg-paper p-8 sm:p-10">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white"><Target size={22} /></span>
                <h2 className="mt-6 text-3xl font-extrabold text-ink">Our story &amp; mission</h2>
                <p className="mt-4 leading-relaxed text-ink-soft">
                  Founded with a vision for a cleaner, greener future, we provide a unified platform where buyers, sellers, and EV enthusiasts can explore the latest models, find verified pre-owned vehicles, compare total cost of ownership, and even locate essential charging infrastructure on our interactive maps.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#06301f] via-brand-deep to-[#0c6a43] p-8 text-white sm:p-10">
                <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-volt/20 blur-3xl" />
                <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-volt"><Eye size={22} /></span>
                <h2 className="relative mt-6 text-3xl font-extrabold">Our vision</h2>
                <p className="relative mt-4 leading-relaxed text-emerald-50/90">
                  We envision a world where electric mobility is the default choice. By empowering consumers with the right tools, accurate data, and an intuitive user experience, we are breaking down the barriers to EV adoption.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* What we do */}
      <section className="bg-paper py-16 sm:py-24">
        <Container>
          <SectionHeading align="center" eyebrow="Why choose us" title={<>Everything you need to <span className="text-gradient">go electric</span></>} description="Built around the questions real EV buyers ask." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT.map((w, i) => {
              const Icon = w.icon;
              return (
                <Reveal key={w.t} delay={(i % 3) * 0.07}>
                  <div className="group h-full rounded-3xl border border-line bg-white p-7 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white"><Icon size={22} /></span>
                    <h3 className="mt-5 text-lg font-extrabold text-ink">{w.t}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{w.d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Principles */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow="What we stand for" title="Three principles behind every page." />
          <div className="grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.t} delay={i * 0.08}>
                  <div className="relative h-full overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-soft/70 to-white p-8">
                    <span className="absolute right-6 top-4 font-display text-7xl font-extrabold text-brand/10">0{i + 1}</span>
                    <Icon size={28} className="text-brand" />
                    <h3 className="mt-6 text-2xl font-extrabold text-ink">{p.t}</h3>
                    <p className="mt-2 leading-relaxed text-ink-soft">{p.d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Ecosystem */}
      <section className="border-t border-line bg-paper py-16 sm:py-20">
        <Container>
          <SectionHeading align="center" eyebrow="Complete ecosystem" title={<>One platform, <span className="text-gradient">every step</span></>} description="From your first search to the day you sell." />
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
            {ECO.map((e) => {
              const Icon = e.icon;
              return (
                <Link key={e.t} href={e.href} className="inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-white px-5 py-3 font-bold text-ink shadow-card transition hover:-translate-y-0.5 hover:border-brand hover:text-brand">
                  <Icon size={18} className="text-brand" /> {e.t}
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#06301f] via-brand-deep to-[#0c6a43] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-volt/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-brand/40 blur-3xl" />
            <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">Ready to find your next electric vehicle?</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-emerald-50/85">Compare models, check real costs and get the best offer — all in one place.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/catalog" className={btn("volt", "lg")}>Browse all EVs <ArrowUpRight size={18} /></Link>
              <Link href="/tools" className="inline-flex h-14 items-center gap-2 rounded-full border border-white/30 px-7 font-bold text-white transition hover:bg-white/10">Try our calculators</Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
