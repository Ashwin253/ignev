"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Car, BatteryCharging, PlugZap, Globe } from "lucide-react";

const tabs = [
  {
    id: 1,
    label: "EV Skeleton",
    fullLabel: "Electric Vehicle Skeleton / Mechanics",
    icon: Car,
    image: "/tabspic/Picture1.png",
    accent: "from-sky-500 to-cyan-400",
    accentBg: "bg-sky-50",
    accentBorder: "border-sky-300",
    accentText: "text-sky-600",
    accentDot: "bg-sky-500",
    description:
      "The structural backbone of every electric vehicle - chassis, suspension geometry, drivetrain layout, and the mechanical systems that translate electrical energy into motion.",
    highlights: ["Chassis & frame", "Suspension geometry", "Drivetrain layout", "Thermal management"],
  },
  {
    id: 2,
    label: "Battery BMS",
    fullLabel: "Battery Management System",
    icon: BatteryCharging,
    image: "/tabspic/Picture2.png",
    accent: "from-emerald-500 to-lime-400",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-300",
    accentText: "text-emerald-600",
    accentDot: "bg-emerald-500",
    description:
      "The brain behind the battery pack - monitoring cell voltages, balancing charge across modules, managing temperature, and protecting against over-charge or deep discharge.",
    highlights: ["Cell balancing", "State of charge", "Thermal protection", "OTA diagnostics"],
  },
  {
    id: 3,
    label: "Charging",
    fullLabel: "EV Charging Infrastructure",
    icon: PlugZap,
    image: "/tabspic/Picture3.png",
    accent: "from-amber-500 to-orange-400",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-300",
    accentText: "text-amber-600",
    accentDot: "bg-amber-500",
    description:
      "From home wall-boxes to public DC fast chargers - the full charging ecosystem that keeps EVs on the road, including connector standards, grid integration, and smart scheduling.",
    highlights: ["AC / DC charging", "CCS & CHAdeMO", "Smart scheduling", "Grid integration"],
  },
  {
    id: 4,
    label: "360° Ecosystem",
    fullLabel: "360° EV Ecosystem (Full Coverage Concept)",
    icon: Globe,
    image: "/tabspic/Picture4.png",
    accent: "from-violet-500 to-fuchsia-400",
    accentBg: "bg-violet-50",
    accentBorder: "border-violet-300",
    accentText: "text-violet-600",
    accentDot: "bg-violet-500",
    description:
      "The complete picture - vehicle, energy, software, service, and ownership all connected. A holistic view of how every layer of the EV world works together.",
    highlights: ["Vehicle + energy", "Software & OTA", "Service network", "Ownership lifecycle"],
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ElectricCore3D() {
  const [activeId, setActiveId] = useState<TabId>(1);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(tabs[i].id);
          }
        },
        {
          root: null,
          rootMargin: "-35% 0px -35% 0px",
          threshold: 0,
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateProgress = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (maxScroll <= 0) {
        setScrollProgress(0);
        return;
      }

      setScrollProgress(Math.min(1, Math.max(0, rail.scrollLeft / maxScroll)));
    };

    rail.scrollTo({ left: 0, behavior: "auto" });
    updateProgress();
    rail.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      rail.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [activeId]);

  const progressIndex = Math.min(3, Math.max(0, Math.round(scrollProgress * 3)));

  const scrollToTab = (id: TabId) => {
    const idx = tabs.findIndex((t) => t.id === id);
    sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className={`py-20 transition-colors duration-700 ${active.accentBg}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">


        <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
          <span className={`h-1.5 rounded-full transition-all duration-300 ${progressIndex === 0 ? "w-12 bg-sky-500" : "w-8 bg-slate-200"}`} />
          <span className={`h-1.5 rounded-full transition-all duration-300 ${progressIndex === 1 ? "w-12 bg-sky-500" : "w-8 bg-slate-200"}`} />
          <span className={`h-1.5 rounded-full transition-all duration-300 ${progressIndex === 2 ? "w-12 bg-sky-500" : "w-8 bg-slate-200"}`} />
          <span className={`h-1.5 rounded-full transition-all duration-300 ${progressIndex === 3 ? "w-12 bg-sky-500" : "w-8 bg-slate-200"}`} />
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-16 lg:items-start">
          <div className="hidden lg:block lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 backdrop-blur-sm shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="relative aspect-[4/3]">
                {tabs.map((tab) => (
                  <motion.div
                    key={tab.id}
                    animate={{
                      opacity: tab.id === activeId ? 1 : 0,
                      scale: tab.id === activeId ? 1 : 1.03,
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                    style={{ pointerEvents: tab.id === activeId ? "auto" : "none" }}
                  >
                    <Image
                      src={tab.image}
                      alt={tab.fullLabel}
                      fill
                      sizes="50vw"
                      className="object-cover"
                    />
                  </motion.div>
                ))}

                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => scrollToTab(tab.id)}
                      aria-label={tab.label}
                      className={`h-1.5 rounded-full transition-all duration-300 ${tab.id === activeId ? `w-6 ${tab.accentDot}` : "w-1.5 bg-white/50 hover:bg-white/80"
                        }`}
                    />
                  ))}
                </div>

                <div className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {activeId} / {tabs.length}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden flex-col gap-6 lg:flex lg:gap-10 lg:py-4">
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <div
                  key={tab.id}
                  ref={(el) => {
                    sectionRefs.current[i] = el;
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-80px" }}
                    className={`rounded-3xl border p-7 transition-all duration-500 ${tab.id === activeId
                      ? `bg-white ${tab.accentBorder} shadow-[0_18px_48px_rgba(15,23,42,0.12)]`
                      : "border-white/60 bg-white/50 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                      }`}
                  >
                    <div className="mb-5 inline-flex items-center gap-3">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br ${tab.accent} text-white shadow-sm`}
                      >
                        <Icon size={20} />
                      </span>
                      <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${tab.accentText}`}>
                        {tab.label}
                      </span>
                    </div>

                    <h3 className="mb-3 text-xl font-semibold leading-snug text-slate-900">
                      {tab.fullLabel}
                    </h3>
                    <p className="mb-6 text-sm leading-7 text-slate-600">
                      {tab.description}
                    </p>

                    <ul className="grid grid-cols-2 gap-2">
                      {tab.highlights.map((h) => (
                        <li
                          key={h}
                          className={`flex items-center gap-2 rounded-xl border bg-white/70 px-3 py-2 text-xs font-medium ${tab.accentBorder} ${tab.accentText}`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tab.accentDot}`} />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              );
            })}
          </div>

          <div
            ref={railRef}
            className="flex gap-4 overflow-x-auto pb-2 pr-2 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-900/50"
          >
            {tabs.map((tab, i) => {
              const Icon = tab.icon;

              return (
                <motion.article
                  key={tab.id}
                  ref={(el) => {
                    sectionRefs.current[i] = el;
                  }}
                  onClick={() => scrollToTab(tab.id)}
                  className="flex w-[84vw] flex-shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 shadow-[0_14px_36px_rgba(15,23,42,0.08)] backdrop-blur-sm"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <Image
                      src={tab.image}
                      alt={tab.fullLabel}
                      fill
                      sizes="90vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
                      <Icon size={12} />
                      {tab.label}
                    </div>
                    <div className="absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      {tab.id} / {tabs.length}
                    </div>
                  </div>
                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{tab.fullLabel}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{tab.description}</p>
                    </div>
                    <ul className="grid grid-cols-2 gap-2">
                      {tab.highlights.map((h) => (
                        <li
                          key={h}
                          className={`rounded-xl border bg-white/70 px-3 py-2 text-[11px] font-medium ${tab.accentBorder} ${tab.accentText}`}
                        >
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
