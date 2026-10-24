"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BatteryCharging, Compass, Home, Search, Sparkles } from "lucide-react";

const tabs = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/catalog", icon: Compass },
  { label: "Search", href: "#search", icon: Search, center: true },
  { label: "Charging", href: "/charging-station", icon: BatteryCharging },
  { label: "For You", href: "/foryou", icon: Sparkles },
];

// Hide on pages that are full-screen tools
const HIDDEN = ["/map", "/nearme", "/ride", "/team", "/mis", "/login", "/signup"];

export default function FloatingMobileNav() {
  const pathname = usePathname();
  const [isWebApp, setIsWebApp] = useState(false);

  useEffect(() => {
    const checkWebApp = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        ("standalone" in window.navigator && Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)) ||
        new URLSearchParams(window.location.search).get("webapp") === "true" ||
        new URLSearchParams(window.location.search).get("mode") === "pwa";

      setIsWebApp(Boolean(standalone));
    };

    checkWebApp();

    const mql = window.matchMedia("(display-mode: standalone)");
    mql.addEventListener?.("change", checkWebApp);
    return () => mql.removeEventListener?.("change", checkWebApp);
  }, []);

  // Only render the bottom mobile navigation when running as a WebApp
  if (!isWebApp) return null;
  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-[120] border-t border-line bg-white/92 backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2 pt-1.5">
        {tabs.map(({ label, href, icon: Icon, center }) => {
          const active = href !== "#search" && (href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]));
          const inner = (
            <>
              <span
                className={`grid place-items-center transition-all ${
                  center
                    ? "-mt-6 h-12 w-12 rounded-full bg-brand text-white shadow-glow ring-4 ring-white"
                    : `h-8 w-12 rounded-full ${active ? "bg-brand-soft text-brand-deep" : "text-ink-mute"}`
                }`}
              >
                <Icon size={center ? 21 : 19} strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={`mt-0.5 text-[10px] font-bold ${active ? "text-brand-deep" : "text-ink-mute"} ${center ? "mt-1" : ""}`}>{label}</span>
            </>
          );
          return (
            <li key={label} className="flex justify-center">
              {href === "#search" ? (
                <button onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))} className="flex flex-col items-center pb-1" aria-label="Search">
                  {inner}
                </button>
              ) : (
                <Link href={href} className="flex flex-col items-center pb-1" aria-current={active ? "page" : undefined}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
