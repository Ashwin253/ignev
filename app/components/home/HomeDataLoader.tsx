"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import HomeHero, { type HeroBannerLite } from "./HomeHero";
import { QuickMatch, Rail, RecentlyViewed, Showcase } from "./HomeInteractive";
import { StatsBand } from "./HomeExtras";
import { NewsGrid, type NewsItem } from "./HomeStatic";
import type { CatalogItem } from "../../lib/catalog-types";

type HomeData = {
  items: CatalogItem[];
  quickMatch2Lakh: CatalogItem[];
  byCategory: Record<string, CatalogItem[]>;
  fresh: CatalogItem[];
  modelCount: number;
  brandCount: number;
};

type HomeDataContextValue = {
  data: HomeData | null;
  heroBanners: HeroBannerLite[];
  heroLoaded: boolean;
  news: NewsItem[] | null;
  upcoming: CatalogItem[] | null;
  loadMainData: () => void;
  loadLowerData: () => void;
};
const HomeDataContext = createContext<HomeDataContextValue | null>(null);

export default function HomeDataLoader({ children }: { children: ReactNode }) {
  const [data, setData] = useState<HomeData | null>(null);
  const [heroBanners, setHeroBanners] = useState<HeroBannerLite[]>([]);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [upcoming, setUpcoming] = useState<CatalogItem[] | null>(null);
  const mainRequestStarted = useRef(false);
  const lowerRequestStarted = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/homepage-hero", { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Homepage banners request failed");
        return response.json();
      })
      .then((result: { heroBanners: HeroBannerLite[] }) => setHeroBanners(result.heroBanners))
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Could not load homepage banners", error);
      })
      .finally(() => setHeroLoaded(true));
    return () => controller.abort();
  }, []);

  const loadMainData = useCallback(() => {
    if (mainRequestStarted.current) return;
    mainRequestStarted.current = true;
    fetch("/api/homepage")
      .then((response) => {
        if (!response.ok) throw new Error("Homepage data request failed");
        return response.json();
      })
      .then((result: HomeData) => setData(result))
      .catch((error) => console.error("Could not load homepage data", error));
  }, []);

  const loadLowerData = useCallback(() => {
    if (lowerRequestStarted.current) return;
    lowerRequestStarted.current = true;
    fetch("/api/homepage-lower")
      .then((response) => {
        if (!response.ok) throw new Error("Lower homepage data request failed");
        return response.json();
      })
      .then((result: { news: NewsItem[] }) => setNews(result.news))
      .catch((error) => console.error("Could not load lower homepage data", error));
    fetch("/api/homepage-upcoming")
      .then((response) => {
        if (!response.ok) throw new Error("Upcoming vehicles request failed");
        return response.json();
      })
      .then((result: { upcoming: CatalogItem[] }) => setUpcoming(result.upcoming))
      .catch((error) => console.error("Could not load upcoming vehicles", error));
  }, []);

  return <HomeDataContext.Provider value={{ data, heroBanners, heroLoaded, news, upcoming, loadMainData, loadLowerData }}>{children}</HomeDataContext.Provider>;
}

function useHomeData() {
  const context = useContext(HomeDataContext);
  if (!context) throw new Error("Homepage data sections must be inside HomeDataLoader");
  return context;
}

export function HomeHeroSection() {
  const { heroBanners, heroLoaded, data } = useHomeData();
  return <HomeHero banners={heroBanners} modelCount={data?.modelCount ?? 0} loading={!heroLoaded} />;
}

export function HomeVehicleSections() {
  const { data, loadMainData } = useHomeData();
  if (!data) {
    return (
      <HomeCatalogLoading onNearView={loadMainData} />
    );
  }
  return (
    <>
      <Showcase byCategory={data.byCategory} />
      <Rail eyebrow="Just launched" title="New launches" description="Vehicles that hit the Indian market in the last two months." href="/new-launches" hrefLabel="All new launches" items={data.fresh} tone="tint" />
      <QuickMatch items={data.items} precomputedTwoLakh={data.quickMatch2Lakh} />
    </>
  );
}

function HomeCatalogLoading({ onNearView }: { onNearView: () => void }) {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      onNearView();
      observer.disconnect();
    }, { rootMargin: "300px 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, [onNearView]);

  return (
    <div ref={sectionRef} className="mx-auto grid min-h-[32rem] max-w-7xl content-start gap-5 px-4 py-10 sm:px-6 lg:px-8" aria-label="Loading vehicle listings" aria-busy="true">
          <div className="h-10 w-56 animate-pulse rounded-full bg-slate-100" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-3xl bg-slate-100" />)}
          </div>
          <div className="mt-10 h-64 animate-pulse rounded-3xl bg-slate-100" />
    </div>
  );
}

export function HomeLowerGate({ children }: { children: ReactNode }) {
  const { loadLowerData } = useHomeData();
  const [ready, setReady] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setReady(true);
      loadLowerData();
      observer.disconnect();
    }, { rootMargin: "200px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadLowerData]);

  return <><div ref={sentinelRef} aria-hidden="true" />{ready ? children : <div className="min-h-40" aria-hidden="true" />}</>;
}

export function HomeUpcomingSections() {
  const { data, upcoming } = useHomeData();
  if (!data || !upcoming) return null;
  return <><Rail eyebrow="Coming soon" title="Upcoming electric vehicles" description="Track what's launching next — and be first in line." href="/upcoming" hrefLabel="All upcoming" items={upcoming} /><RecentlyViewed items={data.items} /></>;
}

export function HomeStatsSection() {
  const { data } = useHomeData();
  return data ? <StatsBand models={data.modelCount} brands={data.brandCount} /> : null;
}

export function HomeNewsSection() {
  const { news } = useHomeData();
  return news ? <NewsGrid items={news} /> : null;
}
