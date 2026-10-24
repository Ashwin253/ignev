"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Download, Heart, Menu, Search, Share, Smartphone, Sparkles, User, X } from "lucide-react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../lib/firebaseClient";
import { DISCOVER, SERVICES, TOOLS, VEHICLE_TYPES } from "../lib/nav";
import { useShortlist } from "../context/ShortlistContext";
import { toast } from "../lib/toast";
import LocationSelector from "./LocationSelector";

type MegaKey = "explore" | "tools" | "services" | null;

const openPalette = () => window.dispatchEvent(new CustomEvent("open-command-palette"));

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mega, setMega] = useState<MegaKey>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [mobileSection, setMobileSection] = useState<string | null>("explore");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { slugs } = useShortlist();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setMega(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const openMega = (k: MegaKey) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMega(k);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(null), 140);
  };

  const is = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));

  const navBtn = (active: boolean) =>
    `relative inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-[14px] font-bold tracking-tight transition-colors ${
      active ? "bg-brand-soft text-brand-deep" : "text-ink-soft hover:bg-ink/5 hover:text-ink"
    }`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[130] transition-all duration-300 ${
          scrolled || menuOpen ? "border-b border-line bg-white/90 shadow-[0_8px_30px_-18px_rgba(14,27,20,0.25)] backdrop-blur-xl" : "border-b border-transparent bg-white/60 backdrop-blur-md"
        }`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">
          Skip to content
        </a>
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center" aria-label="EVPLSE home">
            <Image src="/evplsenewlogo.png" alt="EVPLSE" width={160} height={40} priority className="h-9 w-auto sm:h-10" style={{ width: "auto" }} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex" onMouseLeave={scheduleClose}>
            <button onMouseEnter={() => openMega("explore")} onFocus={() => openMega("explore")} onClick={() => setMega(mega === "explore" ? null : "explore")} className={navBtn(is("/catalog") || is("/new-launches") || is("/upcoming") || is("/compare") || mega === "explore")} aria-expanded={mega === "explore"}>
              Explore EVs <ChevronDown size={14} className={`transition-transform ${mega === "explore" ? "rotate-180" : ""}`} />
            </button>
            <button onMouseEnter={() => openMega("tools")} onFocus={() => openMega("tools")} onClick={() => setMega(mega === "tools" ? null : "tools")} className={navBtn(is("/tools") || mega === "tools")} aria-expanded={mega === "tools"}>
              Tools <ChevronDown size={14} className={`transition-transform ${mega === "tools" ? "rotate-180" : ""}`} />
            </button>
            <Link href="/charging-station" className={navBtn(is("/charging-station") || is("/map"))} onMouseEnter={() => openMega(null)}>Charging</Link>
            <button onMouseEnter={() => openMega("services")} onFocus={() => openMega("services")} onClick={() => setMega(mega === "services" ? null : "services")} className={navBtn(is("/service") || is("/shop") || is("/sell-ev") || mega === "services")} aria-expanded={mega === "services"}>
              Services <ChevronDown size={14} className={`transition-transform ${mega === "services" ? "rotate-180" : ""}`} />
            </button>
            <Link href="/updates" className={navBtn(is("/updates") || is("/article"))} onMouseEnter={() => openMega(null)}>News</Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search */}
            <button
              onClick={openPalette}
              className="group relative grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-white text-ink transition hover:border-brand hover:text-brand active:scale-95 cursor-pointer"
              aria-label="Search EVs (Ctrl K)"
            >
              <Search size={17} />
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-lg opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 z-50">
                Search <kbd className="ml-1 font-mono text-[10px] text-white/70">Ctrl K</kbd>
              </span>
            </button>

            {/* Location */}
            <LocationSelector iconOnly className="hidden sm:block" />

            {/* For You */}
            <Link
              href="/foryou"
              className={`group relative grid h-10 w-10 place-items-center rounded-full transition active:scale-95 shadow-xs ${
                is("/foryou")
                  ? "bg-brand-deep text-white border border-brand-deep"
                  : "bg-brand text-white border border-brand hover:bg-brand-deep"
              }`}
              aria-label="For You"
            >
              <Sparkles size={17} className="text-volt group-hover:scale-110 transition-transform" />
              {!is("/foryou") && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse-ring rounded-full bg-volt ring-2 ring-white" />
              )}
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-lg opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 z-50">
                For You
              </span>
            </Link>

            {/* Shortlist */}
            <Link
              href="/shortlist"
              className={`group relative grid h-10 w-10 place-items-center rounded-full border transition active:scale-95 ${
                is("/shortlist")
                  ? "border-coral bg-coral-soft text-coral"
                  : "border-line-strong bg-white text-ink hover:border-coral hover:text-coral"
              }`}
              aria-label={`Shortlist (${slugs.length})`}
            >
              <Heart size={17} className={slugs.length > 0 ? "fill-coral text-coral" : ""} />
              {slugs.length > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                  {slugs.length}
                </span>
              )}
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-lg opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 z-50">
                Shortlist {slugs.length > 0 ? `(${slugs.length})` : ""}
              </span>
            </Link>

            {/* Profile */}
            <Link
              href={user ? "/profile" : "/login"}
              className="group relative hidden h-10 w-10 place-items-center rounded-full border border-line-strong bg-white text-ink transition hover:border-ink active:scale-95 sm:grid"
              aria-label={user ? user.displayName || "My profile" : "Login or register"}
              title={user ? user.displayName || "My profile" : "Login / Register"}
            >
              {user?.photoURL ? (
                <Image src={user.photoURL} alt="" width={40} height={40} className="h-full w-full rounded-full object-cover" />
              ) : (
                <User size={17} />
              )}
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-lg opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 z-50">
                {user ? user.displayName || "Profile" : "Login / Register"}
              </span>
            </Link>

            <button
              className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition active:scale-95 lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mega menus (desktop) */}
        <AnimatePresence>
          {mega && (
            <motion.div
              key={mega}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              onMouseEnter={() => openMega(mega)}
              onMouseLeave={scheduleClose}
              className="absolute left-1/2 top-[70px] hidden w-[min(940px,calc(100vw-2rem))] -translate-x-1/2 lg:block"
            >
              <div className="rounded-[28px] border border-line bg-white p-5 shadow-lift">
                {mega === "explore" && (
                  <div className="grid grid-cols-[1.25fr_1fr_0.95fr] gap-5">
                    <div>
                      <p className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-mute">Browse by type</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {VEHICLE_TYPES.map((l) => (
                          <MegaLink key={l.href} {...l} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-mute">Discover</p>
                      <div className="grid gap-1.5">
                        {DISCOVER.map((l) => (
                          <MegaLink key={l.href} {...l} />
                        ))}
                      </div>
                    </div>
                    <Link href="/foryou" className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-volt p-5 text-ink">
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40" />
                      <Sparkles size={22} />
                      <div className="relative mt-10">
                        <p className="text-lg font-extrabold leading-tight">Not sure what to buy?</p>
                        <p className="mt-1 text-[13px] font-medium text-ink/70">Answer 4 quick questions and get picks that fit your budget &amp; routine.</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold">
                          Try For You <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </div>
                )}
                {mega === "tools" && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {TOOLS.map((l) => (
                      <MegaLink key={l.href} {...l} />
                    ))}
                  </div>
                )}
                {mega === "services" && (
                  <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3">
                    {SERVICES.map((l) => (
                      <MegaLink key={l.href} {...l} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-[72px] z-[125] overflow-y-auto bg-white lg:hidden"
          >
            <div className="space-y-2 p-4 pb-28">
              <LocationSelector isMobile className="mb-3" />

              <Accordion id="explore" label="Explore EVs" open={mobileSection} setOpen={setMobileSection}>
                {[...VEHICLE_TYPES, ...DISCOVER].map((l) => (
                  <MobileLink key={l.href} {...l} />
                ))}
              </Accordion>
              <Accordion id="tools" label="Tools" open={mobileSection} setOpen={setMobileSection}>
                {TOOLS.map((l) => (
                  <MobileLink key={l.href} {...l} />
                ))}
              </Accordion>
              <Accordion id="services" label="Services" open={mobileSection} setOpen={setMobileSection}>
                {SERVICES.map((l) => (
                  <MobileLink key={l.href} {...l} />
                ))}
              </Accordion>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link href="/charging-station" className="rounded-2xl border border-line bg-paper px-4 py-3.5 text-sm font-bold text-ink">Charging map</Link>
                <Link href="/updates" className="rounded-2xl border border-line bg-paper px-4 py-3.5 text-sm font-bold text-ink">News &amp; reviews</Link>
                <Link href="/shortlist" className="rounded-2xl border border-line bg-paper px-4 py-3.5 text-sm font-bold text-ink">Shortlist ({slugs.length})</Link>
                <Link href={user ? "/profile" : "/login"} className="rounded-2xl border border-line bg-paper px-4 py-3.5 text-sm font-bold text-ink">{user ? "My profile" : "Login / Sign up"}</Link>
              </div>

              <Link href="/foryou" className="mt-2 flex items-center justify-between rounded-3xl bg-volt px-5 py-4 text-ink">
                <span>
                  <span className="block text-base font-extrabold">For You</span>
                  <span className="block text-xs font-medium text-ink/70">Personalised EV picks &amp; finance</span>
                </span>
                <Sparkles size={22} />
              </Link>

              {/* Add to homescreen for WebApp */}
              <HamburgerAddToHomescreen />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MegaLink({ label, href, desc, icon: Icon }: { label: string; href: string; desc?: string; icon?: any }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-brand-soft/70">
      {Icon && (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-brand transition group-hover:bg-white">
          <Icon size={19} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink">{label}</span>
        {desc && <span className="block truncate text-xs text-ink-mute">{desc}</span>}
      </span>
    </Link>
  );
}

function MobileLink({ label, href, desc, icon: Icon }: { label: string; href: string; desc?: string; icon?: any }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl px-3 py-3 active:bg-brand-soft">
      {Icon && (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-brand">
          <Icon size={18} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-ink">{label}</span>
        {desc && <span className="block truncate text-xs text-ink-mute">{desc}</span>}
      </span>
    </Link>
  );
}

function Accordion({ id, label, open, setOpen, children }: { id: string; label: string; open: string | null; setOpen: (v: string | null) => void; children: React.ReactNode }) {
  const isOpen = open === id;
  return (
    <div className="overflow-hidden rounded-3xl border border-line">
      <button onClick={() => setOpen(isOpen ? null : id)} className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-extrabold text-ink" aria-expanded={isOpen}>
        {label}
        <ChevronDown size={18} className={`text-ink-mute transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="grid gap-0.5 px-2 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HamburgerAddToHomescreen() {
  const [mode, setMode] = useState<"installed" | "ready" | "ios" | "manual">("manual");
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const compute = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        ("standalone" in navigator && Boolean((navigator as unknown as { standalone?: boolean }).standalone));
      if (standalone) return setMode("installed");
      if (window.__evplseInstallPrompt) return setMode("ready");
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return setMode("ios");
      setMode("manual");
    };
    compute();
    window.addEventListener("evplse-install-ready", compute);
    return () => window.removeEventListener("evplse-install-ready", compute);
  }, []);

  const handleInstall = async () => {
    const promptEvent = window.__evplseInstallPrompt;
    if (promptEvent) {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      window.__evplseInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("evplse-install-ready"));
      if (outcome === "accepted") {
        toast("EVPLSE app added to home screen!");
      }
      return;
    }
    setShowGuide((prev) => !prev);
  };

  if (mode === "installed") {
    return (
      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand-soft/70 px-4 py-3 text-xs font-bold text-brand-deep">
        <Check size={16} className="shrink-0 text-brand" />
        <span>EVPLSE Web App installed on this device</span>
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-soft/50 to-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-sm">
            <Smartphone size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-ink">Add to Home Screen</p>
            <p className="truncate text-xs text-ink-mute">Install EVPLSE as a Web App</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-deep active:scale-95"
          aria-label="Add EVPLSE Web App to Home Screen"
        >
          <Download size={14} /> Install
        </button>
      </div>

      {showGuide && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 border-t border-line/70 pt-2.5 text-xs leading-relaxed text-ink-soft"
        >
          {mode === "ios" ? (
            <p>
              Tap the <strong>Share</strong> button <Share size={12} className="inline -mt-0.5" /> in Safari, then scroll down and tap <strong>Add to Home Screen</strong>.
            </p>
          ) : (
            <p>
              Tap your browser menu (<strong>⋮</strong>) in the top corner and select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
