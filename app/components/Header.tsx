"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Home, LayoutGrid, MapPin, IndianRupee, Download, SlidersHorizontal, Volume2, VolumeX, Smartphone, Sparkles, ChevronDown, User, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedback } from "../context/FeedbackContext";
import { playClickSound, playHaptic } from "../lib/feedback";
import { supabaseClient } from "../lib/supabase-client";
import { auth } from "../lib/firebaseClient";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/catalog", icon: LayoutGrid },
  { name: "Map", href: "/map", icon: MapPin },
  { name: "For You", href: "/foryou", icon: Sparkles },
  // { name: "Compare", href: "/compare", icon: IndianRupee },
];

const lightBgRoutes = ["/catalog", "/product", "/updates", "/map", "/own", "/service", "/shop", "/team", "/mis", "/analytics", "/buy-ev", "/sell-ev", "/upcoming", "/new-launches", "/charging-station"];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileBuySellOpen, setMobileBuySellOpen] = useState(false);
  const [mobileServiceOpen, setMobileServiceOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [prefOpen, setPrefOpen] = useState(false);
  const { soundEnabled, setSoundEnabled, hapticsEnabled, setHapticsEnabled, theme, setTheme } = useFeedback();
  const pathname = usePathname();

  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const isHome = pathname === "/";
  const isLightPage = !isHome && lightBgRoutes.some(r => pathname.startsWith(r));
  const isTransparent = isHome && !isScrolled;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // PWA install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallTooltip, setShowInstallTooltip] = useState(false);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      setShowInstallTooltip(true);
      setTimeout(() => setShowInstallTooltip(false), 4000);
    }
  };

  // ── Styles ──
  const isLight = theme === "light";

  const headerBg = isTransparent
    ? "bg-transparent border-transparent"
    : "bg-white dark:bg-zinc-950/85 dark:backdrop-blur-xl border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-none";

  const linkBase = "text-sm font-medium px-3 py-2 rounded-full transition-all";
  
  const linkColor = isTransparent
    ? isLight
      ? "text-zinc-800 hover:text-emerald-800 hover:bg-emerald-950/5 font-semibold"
      : "text-white/85 hover:text-white hover:bg-white/10"
    : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70";

  const activeLinkColor = isTransparent
    ? isLight
      ? "text-emerald-900 bg-emerald-100/80 font-bold"
      : "text-white bg-white/15 backdrop-blur-sm"
    : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";

  const ctaClass = isTransparent
    ? isLight
      ? "bg-[#0A2A1E] hover:bg-[#1B6642] text-white font-medium border border-[#0A2A1E]/20 shadow-xs"
      : "bg-white/12 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md"
    : "bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 text-white";

  const iconBtnClass = isTransparent
    ? isLight
      ? "bg-emerald-950/5 hover:bg-emerald-950/10 text-zinc-800 border-zinc-300/80"
      : "bg-white/12 hover:bg-white/20 text-white border-white/25"
    : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 border-b pointer-events-auto ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/evplsenewlogo.png"
              alt="logo"
              width={176}
              height={44}
              priority
              className="h-11 w-auto object-contain"
              style={{ width: "auto" }}
            />
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {/* Buy/Sell Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("buysell")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`${linkBase} ${
                  pathname.startsWith("/buy-ev") || pathname.startsWith("/sell-ev") || pathname.startsWith("/upcoming") || pathname.startsWith("/new-launches")
                    ? activeLinkColor
                    : linkColor
                } flex items-center gap-1.5 cursor-pointer font-medium text-sm`}
              >
                Buy/Sell <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "buysell" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "buysell" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 mt-1 w-48 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-zinc-200/60 z-50 border border-zinc-100 text-zinc-800"
                  >
                    <Link href="/buy-ev" className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-zinc-100/70 transition-colors">
                      Buy EV
                    </Link>
                    <Link href="/sell-ev" className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-zinc-100/70 transition-colors">
                      Sell EV
                    </Link>
                    <Link href="/upcoming" className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-zinc-100/70 transition-colors">
                      Upcoming
                    </Link>
                    <Link href="/new-launches" className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-zinc-100/70 transition-colors">
                      New Launches
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Service Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("service")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`${linkBase} ${
                  pathname.startsWith("/service/")
                    ? activeLinkColor
                    : linkColor
                } flex items-center gap-1.5 cursor-pointer font-medium text-sm`}
              >
                Service <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "service" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "service" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 mt-1 w-48 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-zinc-200/60 z-50 border border-zinc-100 text-zinc-800"
                  >
                    <Link href="/service/insurance" className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-zinc-100/70 transition-colors">
                      Insurance
                    </Link>
                    <Link href="/service/scrap" className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-zinc-100/70 transition-colors">
                      Scrap
                    </Link>
                    <Link href="/service/product" className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium hover:bg-zinc-100/70 transition-colors">
                      Product
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Charging Station */}
            <Link
              href="/charging-station"
              className={`${linkBase} ${pathname.startsWith("/charging-station") ? activeLinkColor : linkColor}`}
            >
              Charging Station
            </Link>

            {/* For You */}
            <Link
              href="/foryou"
              className={`${linkBase} ${
                pathname.startsWith("/foryou")
                  ? "bg-violet-600 text-white font-bold shadow-md shadow-violet-500/15"
                  : isTransparent
                  ? isLight
                    ? "bg-violet-100 text-violet-800 border border-violet-300 hover:bg-violet-200 font-bold"
                    : "bg-violet-500/20 text-violet-200 border border-violet-400/20 hover:bg-violet-500/30 hover:text-white font-bold"
                  : "bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/50 font-bold"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={15} />
                For You
                {!pathname.startsWith("/foryou") && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-600"></span>
                  </span>
                )}
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/nearme" className={`hidden md:flex items-center gap-1.5 font-medium px-4 py-2 rounded-full text-sm transition-all border shadow-sm active:scale-95 ${ctaClass}`}>
              <MapPin size={15} /> Near Me
            </Link>

            {/* User Profile / Auth Button */}
            <Link
              href={user ? "/profile" : "/login"}
              className={`hidden md:flex items-center gap-1.5 font-semibold px-4 py-2 rounded-full text-sm transition-all border shadow-sm active:scale-95 ${
                user
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : ctaClass
              }`}
            >
              <User size={15} />
              <span>{user ? (user.displayName?.split(" ")[0] || "Profile") : "Login / Register"}</span>
            </Link>

            {/* Preferences */}
            <div className="relative">
              <button onClick={() => setPrefOpen(!prefOpen)} aria-label="Open page preferences" className={`p-2.5 rounded-full border transition-all shadow-sm active:scale-95 cursor-pointer ${iconBtnClass}`}>
                <SlidersHorizontal size={17} />
              </button>
              <AnimatePresence>
                {prefOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setPrefOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 mt-3 w-60 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 text-white">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-3 font-medium">Preferences</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm"><Volume2 size={16} className={soundEnabled ? "text-[#34ebb1]" : "text-zinc-500"} /> Sound</span>
                          <button onClick={() => { const v = !soundEnabled; setSoundEnabled(v); if(v) setTimeout(playClickSound,50); }} aria-label={soundEnabled ? "Disable interface sounds" : "Enable interface sounds"} className={`w-10 h-5 rounded-full relative transition ${soundEnabled ? 'bg-[#34ebb1]' : 'bg-zinc-700'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${soundEnabled ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm"><Smartphone size={16} className={hapticsEnabled ? "text-[#34ebb1]" : "text-zinc-500"} /> Haptics</span>
                          <button onClick={() => { const v = !hapticsEnabled; setHapticsEnabled(v); if(v) setTimeout(()=>playHaptic('click'),50); }} aria-label={hapticsEnabled ? "Disable haptic feedback" : "Enable haptic feedback"} className={`w-10 h-5 rounded-full relative transition ${hapticsEnabled ? 'bg-[#34ebb1]' : 'bg-zinc-700'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${hapticsEnabled ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/10 pt-2.5 mt-2.5">
                          <span className="flex items-center gap-2 text-sm">
                            {theme === "dark" ? <Moon size={16} className="text-[#34ebb1]" /> : <Sun size={16} className="text-amber-400" />} 
                            Dark Mode
                          </span>
                          <button 
                            onClick={() => {
                              const newTheme = theme === "dark" ? "light" : "dark";
                              setTheme(newTheme);
                              playHaptic('click');
                            }} 
                            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} 
                            className={`w-10 h-5 rounded-full relative transition ${theme === "dark" ? 'bg-[#34ebb1]' : 'bg-zinc-700'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${theme === "dark" ? 'left-5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button className={`md:hidden p-2 rounded-full ${isTransparent ? (isLight ? "text-zinc-800 hover:bg-black/5" : "text-white hover:bg-white/10") : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="md:hidden absolute top-full left-0 right-0 bg-white backdrop-blur-xl border-b border-zinc-200 shadow-2xl max-h-[85vh] overflow-y-auto z-[60]">
            <div className="p-4 space-y-2">
              {/* Buy/Sell Accordion */}
              <div className="border border-zinc-100 rounded-xl overflow-hidden bg-zinc-50/50">
                <button
                  onClick={() => setMobileBuySellOpen(!mobileBuySellOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 font-semibold text-zinc-700 hover:bg-zinc-100 transition-all"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <LayoutGrid size={16} className="text-emerald-600" /> Buy/Sell
                  </span>
                  <ChevronDown size={15} className={`transition-transform duration-200 text-zinc-400 ${mobileBuySellOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileBuySellOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-white border-t border-zinc-100 px-6 py-2 space-y-1.5"
                    >
                      <Link href="/buy-ev" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-zinc-600 hover:text-emerald-700">
                        Buy EV
                      </Link>
                      <Link href="/sell-ev" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-zinc-600 hover:text-emerald-700">
                        Sell EV
                      </Link>
                      <Link href="/upcoming" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-zinc-600 hover:text-emerald-700">
                        Upcoming
                      </Link>
                      <Link href="/new-launches" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-zinc-600 hover:text-emerald-700">
                        New Launches
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Service Accordion */}
              <div className="border border-zinc-100 rounded-xl overflow-hidden bg-zinc-50/50">
                <button
                  onClick={() => setMobileServiceOpen(!mobileServiceOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 font-semibold text-zinc-700 hover:bg-zinc-100 transition-all"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <SlidersHorizontal size={16} className="text-emerald-600" /> Service
                  </span>
                  <ChevronDown size={15} className={`transition-transform duration-200 text-zinc-400 ${mobileServiceOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileServiceOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-white border-t border-zinc-100 px-6 py-2 space-y-1.5"
                    >
                      <Link href="/service/insurance" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-zinc-600 hover:text-emerald-700">
                        Insurance
                      </Link>
                      <Link href="/service/scrap" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-zinc-600 hover:text-emerald-700">
                        Scrap
                      </Link>
                      <Link href="/service/product" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-zinc-600 hover:text-emerald-700">
                        Product
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Charging Station */}
              <Link
                href="/charging-station"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  pathname.startsWith("/charging-station") ? "bg-emerald-50 text-emerald-800" : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <MapPin size={16} className="text-emerald-600" /> Charging Station
              </Link>

              {/* For You */}
              <Link
                href="/foryou"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  pathname.startsWith("/foryou")
                    ? "bg-violet-600 text-white font-bold"
                    : "bg-violet-50 hover:bg-violet-100/80 text-violet-700 border border-violet-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={16} className={pathname.startsWith("/foryou") ? "" : "text-violet-500"} /> For You
                </span>
                {!pathname.startsWith("/foryou") && (
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${pathname.startsWith("/foryou") ? "bg-white text-violet-700" : "bg-violet-600 text-white animate-pulse"}`}>
                    New
                  </span>
                )}
              </Link>

              <Link href="/nearme" onClick={() => setMobileMenuOpen(false)} className="mt-3 flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm shadow-md">
                <MapPin size={16} /> Near Me
              </Link>

              {/* User Profile / Auth Button */}
              <Link
                href={user ? "/profile" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className={`mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm shadow-md border ${
                  user
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                <User size={16} />
                <span>{user ? (user.displayName || "Profile") : "Login / Register"}</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
    </>
  );
}