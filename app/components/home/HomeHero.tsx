"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Search, ShieldCheck, Sparkles } from "lucide-react";
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

function BannerLink({ href, className, label, children }: { href: string; className?: string; label?: string; children?: React.ReactNode }) {
  return isInternalHref(href) ? (
    <Link href={toInternalHref(href)} className={className} aria-label={label}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
      {children}
    </a>
  );
}

export default function HomeHero({ banners, modelCount, loading = false }: { banners: HeroBannerLite[]; modelCount: number; loading?: boolean }) {
  const slides = (banners && banners.length ? banners : loading ? [] : FALLBACK_BANNERS).filter(
    (b) => b.imageHorizontal || b.imageVertical || b.videoUrl
  );
  const list = slides.length ? slides : loading ? [] : FALLBACK_BANNERS;
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
  const cur = list.length ? list[idx % list.length] : FALLBACK_BANNERS[0];

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <section
      style={{ paddingTop: "calc(var(--header-h, 72px) + 1rem)" }}
      className="hero-aurora relative overflow-hidden pb-10 sm:pb-12 lg:pb-16"
    >
      <Container className="relative">
        {/* Banner: the hero */}
        {loading ? (
          <div className="relative h-[60svh] min-h-[320px] max-h-[720px] w-full animate-pulse overflow-hidden rounded-[1.5rem] border border-line bg-slate-200 sm:rounded-[2rem]" aria-label="Loading featured banner" aria-busy="true">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent motion-safe:animate-[shimmer_1.8s_infinite]" />
            <div className="absolute bottom-8 left-6 h-5 w-2/3 rounded bg-white/50 sm:left-8" />
            <div className="absolute bottom-8 right-8 hidden h-11 w-36 rounded-full bg-white/50 sm:block" />
          </div>
        ) : <div
          className="group relative h-[60svh] min-h-[320px] max-h-[720px] w-full overflow-hidden rounded-[1.5rem] border border-line bg-gradient-to-br from-brand-soft to-white shadow-lift sm:rounded-[2rem]"
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

          {/* whole banner is clickable */}
          {cur.href && (
            <BannerLink
              href={cur.href}
              label={cur.cta || cur.details || "Open banner"}
              className="absolute inset-0 z-[1]"
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-2/5 bg-gradient-to-t from-ink/75 via-ink/30 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <p className="max-w-xl text-[15px] font-semibold leading-snug text-white drop-shadow sm:text-lg">
              {cur.details || cur.label || "Discover the right EV for you."}
            </p>
            {cur.href && (
              <BannerLink href={cur.href} className={cx(btn("volt", "md", "self-start"), "pointer-events-auto")}>
                {cur.cta || "Explore"} <ArrowRight size={16} />
              </BannerLink>
            )}
          </div>

          {list.length > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                aria-label="Previous banner"
                className="absolute left-3 top-1/2 z-[4] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-card transition group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => go(1)}
                aria-label="Next banner"
                className="absolute right-3 top-1/2 z-[4] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-card transition group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute right-5 top-5 z-[4] flex gap-1.5">
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
        </div>}

        {/* Headline + actions: compact row under the banner */}
        <div className="mt-8 grid items-center gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="hidden text-3xl font-extrabold leading-[1.1] text-ink sm:block sm:text-4xl lg:text-[2.75rem]"
            >
              India&apos;s <span className="text-gradient">trusted</span> electric mobility platform.
            </motion.h1>
            <div className="mt-4 hidden flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-ink-soft sm:flex">
              <span className="inline-flex items-center gap-2"><BadgeCheck size={18} className="text-brand" /> {modelCount > 0 ? `${modelCount}+ verified models` : "Verified information"}</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-brand" /> No paid rankings</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
            <motion.button
              type="button"
              onClick={openSearch}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
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
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-extrabold text-white shadow-lift transition hover:bg-brand-deep active:scale-95 cursor-pointer border border-ink group"
              aria-label="Ask Plse AI Assistant"
            >
              <Sparkles size={16} className="text-volt group-hover:rotate-12 transition-transform" />
              <span>Ask Plse AI</span>
            </motion.button>
          </div>
        </div>
      </Container>
    </section>
  );
}
