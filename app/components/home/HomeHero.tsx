"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { btn, Container, cx } from "../ui/kit";
import { isInternalHref, toInternalHref } from "../../lib/links";

export type HeroBannerLite = {
  id: string;
  href?: string;
  cta?: string;
  details?: string;
  label?: string;
  imageHorizontal?: string;
  imageVertical?: string;
  videoUrl?: string;
};

const FALLBACK_BANNERS: HeroBannerLite[] = [
  { id: "f1", imageHorizontal: "/herobanner/banner-1-horizontal.webp", imageVertical: "/herobanner/banner-1-vertical.webp", href: "/catalog", cta: "Explore EVs", details: "Compare every electric car, bike, scooter & commercial EV in one place." },
  { id: "f2", imageHorizontal: "/herobanner/banner-2-horizontal.jpg", imageVertical: "/herobanner/banner-2-vertical.jpg", href: "/new-launches", cta: "See new launches", details: "Fresh launches, verified specs and on-road prices." },
  { id: "f3", imageHorizontal: "/herobanner/banner-3-horizontal.jpg", imageVertical: "/herobanner/banner-3-vertical.jpg", href: "/offers", cta: "View offers", details: "Bank, city and festival offers on electric vehicles." },
];

function renderHeroMedia(banner: HeroBannerLite, isPriority: boolean) {
  const vUrl = banner.videoUrl?.trim();
  if (vUrl) {
    const ytMatch = vUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const ytId = ytMatch ? ytMatch[1] : null;
    if (ytId) {
      return (
        <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&playsinline=1`}
            title={banner.details || banner.label || "Hero Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] object-cover border-0"
          />
        </div>
      );
    }

    const vimeoMatch = vUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
    const vimeoId = vimeoMatch ? vimeoMatch[1] : null;
    if (vimeoId) {
      return (
        <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&autopause=0`}
            title={banner.details || banner.label || "Hero Video"}
            allow="autoplay; fullscreen; picture-in-picture"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] object-cover border-0"
          />
        </div>
      );
    }

    return (
      <video
        src={vUrl}
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <picture>
      {banner.imageVertical && <source media="(max-width: 639px)" srcSet={banner.imageVertical} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.imageHorizontal || banner.imageVertical}
        alt={banner.details || banner.label || "EVPLSE featured banner"}
        className="h-full w-full object-cover"
        fetchPriority={isPriority ? "high" : "auto"}
      />
    </picture>
  );
}

const QUICK = [
  { label: "Electric cars", href: "/catalog?type=cars" },
  { label: "Scooters", href: "/catalog?type=scooter" },
  { label: "Bikes", href: "/catalog?type=bike" },
  { label: "Commercial", href: "/catalog?type=commercial" },
  { label: "Under ₹1 lakh", href: "/catalog?price=max-1" },
  { label: "Upcoming", href: "/upcoming" },
];


export default function HomeHero({ banners, modelCount }: { banners: HeroBannerLite[]; modelCount: number }) {
  const router = useRouter();
  const slides = (banners && banners.length ? banners : FALLBACK_BANNERS).filter(
    (b) => b.imageHorizontal || b.imageVertical || b.videoUrl
  );
  const list = slides.length ? slides : FALLBACK_BANNERS;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || list.length < 2) return;
    timer.current = setInterval(() => setIdx((i) => (i + 1) % list.length), 6000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, list.length]);

  const go = (d: number) => setIdx((i) => (i + d + list.length) % list.length);
  const cur = list[idx % list.length];

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <section
      style={{ paddingTop: "calc(var(--header-h, 72px) + 2.5rem)" }}
      className="hero-aurora relative overflow-hidden pt-28 sm:pt-32 lg:pt-36 pb-14 sm:pb-18 lg:pb-24"
    >
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <div className="pointer-events-none absolute -right-40 top-10 hidden h-[620px] w-[620px] animate-spin-slow rounded-full border border-dashed border-brand/35 lg:block" />
      <div className="pointer-events-none absolute -right-16 top-32 hidden h-[380px] w-[380px] rounded-full border border-brand/25 lg:block" />
      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white py-1.5 pl-2.5 pr-4 text-xs font-extrabold text-ink shadow-sm"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-volt text-ink"><Zap size={12} fill="currentColor" /></span>
              {modelCount > 0 ? `${modelCount}+ electric vehicles, one honest platform` : "One honest platform for electric mobility"}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.6 }}
              className="mt-6 text-[2.6rem] font-extrabold leading-[1.04] text-ink sm:text-6xl lg:text-[4.2rem]"
            >
              India&apos;s <span className="text-gradient">trusted</span> electric mobility platform.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg"
            >
              Verified specs, on-road prices, offers, charging and finance — everything you need to choose, buy and run an EV, with no paid rankings.
            </motion.p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <motion.button
                type="button"
                onClick={openSearch}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.6 }}
                className="inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-white px-5 py-3 text-sm font-extrabold text-ink shadow-sm transition hover:border-brand hover:bg-paper hover:text-brand cursor-pointer"
                aria-label="Search electric vehicles (Ctrl K)"
              >
                <Search size={17} className="text-brand shrink-0" />
                <span>Search EVs</span>
                <kbd className="hidden sm:inline-flex items-center rounded-md border border-line bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-mute">
                  Ctrl K
                </kbd>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-extrabold text-white shadow-lift transition hover:bg-brand-deep active:scale-95 cursor-pointer border border-ink group"
                aria-label="Ask Plse AI Assistant"
              >
                <Sparkles size={16} className="text-volt group-hover:rotate-12 transition-transform" />
                <span>Ask Plse AI</span>
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="mt-5 flex flex-wrap gap-2"
            >
              {QUICK.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="rounded-full border border-line-strong bg-white px-3.5 py-1.5 text-[13px] font-bold text-ink shadow-xs transition hover:border-brand hover:bg-brand-soft hover:text-brand"
                >
                  {c.label}
                </Link>
              ))}
            </motion.div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-ink-soft">
              <span className="inline-flex items-center gap-2"><BadgeCheck size={18} className="text-brand" /> Verified information</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-brand" /> No paid rankings</span>
            </div>
          </div>

          {/* Banner carousel */}
          <div className="relative lg:col-span-6">
            <div
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-brand-soft to-white shadow-lift sm:aspect-[16/11]"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={cur.id + idx}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55 }}
                  className="absolute inset-0"
                >
                  {renderHeroMedia(cur, idx === 0)}
                </motion.div>
              </AnimatePresence>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/75 via-ink/30 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
                <p className="max-w-md text-[15px] font-semibold leading-snug text-white drop-shadow sm:text-base">
                  {cur.details || cur.label || "Discover the right EV for you."}
                </p>
                {cur.href &&
                  (isInternalHref(cur.href) ? (
                    <Link href={toInternalHref(cur.href)} className={btn("volt", "md", "self-start")}>
                      {cur.cta || "Explore"} <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <a href={cur.href} target="_blank" rel="noopener noreferrer" className={btn("volt", "md", "self-start")}>
                      {cur.cta || "Explore"} <ArrowRight size={16} />
                    </a>
                  ))}
              </div>

              {list.length > 1 && (
                <>
                  <button
                    onClick={() => go(-1)}
                    aria-label="Previous banner"
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-card transition group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => go(1)}
                    aria-label="Next banner"
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-card transition group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute right-5 top-5 flex gap-1.5">
                    {list.map((b, i) => (
                      <button
                        key={b.id + i}
                        onClick={() => setIdx(i)}
                        aria-label={`Show banner ${i + 1}`}
                        className={cx("h-1.5 rounded-full transition-all", i === idx % list.length ? "w-7 bg-white" : "w-3 bg-white/55 hover:bg-white/80")}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute left-5 top-5 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-deep shadow-sm sm:inline-flex">
                <Sparkles size={12} /> Featured
              </div>
            </div>
            {/* floating glass chips */}
            <div className="pointer-events-none hidden lg:block">
              <div className="absolute -bottom-5 -left-8 animate-float rounded-2xl border border-line-strong bg-white px-4 py-3 shadow-lift">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-mute">Verified models</p>
                <p className="font-display text-2xl font-extrabold text-brand">{modelCount > 0 ? `${modelCount}+` : "100+"}</p>
              </div>
              <div className="absolute -right-5 -top-5 animate-float-slow rounded-2xl bg-gradient-to-br from-brand-deep to-brand px-4 py-3 text-white shadow-glow border border-brand/40">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">Paid rankings</p>
                <p className="font-display text-2xl font-extrabold text-volt">Zero</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
