"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Home, LayoutGrid, MapPin, IndianRupee, Download, SlidersHorizontal, Volume2, VolumeX, Smartphone, Sparkles, ChevronDown, ChevronUp, User, Sun, Moon, Zap, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedback } from "../context/FeedbackContext";
import { playClickSound, playHaptic } from "../lib/feedback";
import { supabaseClient } from "../lib/supabase-client";
import { auth } from "../lib/firebaseClient";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import LocationSelector from "./LocationSelector";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/catalog", icon: LayoutGrid },
  { name: "Map", href: "/map", icon: MapPin },
  { name: "For You", href: "/foryou", icon: Sparkles },
  // { name: "Compare", href: "/compare", icon: IndianRupee },
];

const lightBgRoutes = ["/catalog", "/product", "/updates", "/map", "/own", "/service", "/shop", "/team", "/mis", "/analytics", "/buy-ev", "/sell-ev", "/upcoming", "/new-launches", "/charging-station", "/nearme"];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServiceOpen, setMobileServiceOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [prefOpen, setPrefOpen] = useState(false);
  const { soundEnabled, setSoundEnabled, hapticsEnabled, setHapticsEnabled, theme, setTheme } = useFeedback();
  const pathname = usePathname();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [isManuallyMinimized, setIsManuallyMinimized] = useState(false);
  const [temporarilyExpanded, setTemporarilyExpanded] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      const sticky = Boolean(e.detail?.isSticky);
      setIsTabsSticky(sticky);
      if (!sticky) {
        setTemporarilyExpanded(false);
      }
    };
    window.addEventListener("ecosystem-tabs-sticky", handler);
    return () => window.removeEventListener("ecosystem-tabs-sticky", handler);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const isHome = pathname === "/";
  const isLightPage = !isHome && lightBgRoutes.some(r => pathname.startsWith(r));
  const isTransparent = isHome && !isScrolled && !mobileMenuOpen;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
    };
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
    ? "bg-transparent border-transparent shadow-none"
    : "bg-white/95 dark:bg-zinc-955/95 backdrop-blur-xl border-b-2 border-zinc-300/90 dark:border-zinc-800 shadow-sm dark:shadow-md";

  const linkBase = "text-[14px] font-bold tracking-tight px-3.5 py-2 rounded-full transition-all duration-150 select-none";
  
  const linkColor = isTransparent
    ? isLight
      ? "text-zinc-900 hover:text-emerald-800 hover:bg-emerald-950/10 font-bold"
      : "text-white hover:text-white hover:bg-white/20 font-bold drop-shadow-xs"
    : "text-zinc-900 dark:text-zinc-100 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 font-bold";

  const activeLinkColor = isTransparent
    ? isLight
      ? "text-emerald-950 bg-emerald-100/90 font-black shadow-xs ring-1 ring-emerald-300/80"
      : "text-white bg-white/25 backdrop-blur-md font-black shadow-xs ring-1 ring-white/30"
    : "text-emerald-950 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/70 font-black shadow-xs ring-1 ring-emerald-400/40 dark:ring-emerald-600/40";

  const ctaClass = isTransparent
    ? isLight
      ? "bg-[#0A2A1E] hover:bg-[#1B6642] text-white font-bold border-2 border-[#0A2A1E]/30 shadow-xs"
      : "bg-white/15 hover:bg-white/25 text-white font-bold border-2 border-white/30 backdrop-blur-md"
    : "bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 text-white font-bold";

  const iconBtnClass = isTransparent
    ? isLight
      ? "bg-emerald-950/5 hover:bg-emerald-950/15 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-300/80 dark:border-zinc-700 font-bold shadow-xs active:scale-95"
      : "bg-white/15 hover:bg-white/25 text-white border-2 border-white/30 font-bold shadow-xs active:scale-95"
    : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-300/90 dark:border-zinc-700 font-bold shadow-xs active:scale-95";

  const isMinimized = ((isTabsSticky && !temporarilyExpanded) || isManuallyMinimized) && !mobileMenuOpen;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[130] transition-all duration-300 ease-out border-b ${headerBg} ${
          isMinimized
            ? "-translate-y-full opacity-0 pointer-events-none shadow-none"
            : "translate-y-0 opacity-100 pointer-events-auto"
        }`}
      >
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
            {/* Home */}
            <Link
              href="/"
              className={`${linkBase} ${
                pathname === "/"
                  ? activeLinkColor
                  : linkColor
              }`}
            >
              Home
            </Link>

            {/* Find */}
            <Link
              href="/catalog"
              className={`${linkBase} ${
                pathname.startsWith("/catalog")
                  ? activeLinkColor
                  : linkColor
              }`}
            >
              Find EV
            </Link>

            {/* Sell */}
            {/* <Link
              href="/sell-ev"
              className={`${linkBase} ${
                pathname.startsWith("/sell-ev")
                  ? activeLinkColor
                  : linkColor
              }`}
            >
              Sell
            </Link> */}

            {/* Service Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("service")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`${linkBase} ${
                  pathname.startsWith("/service")
                    ? activeLinkColor
                    : linkColor
                } flex items-center gap-1.5 cursor-pointer`}
              >
                Service <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-200 ${activeDropdown === "service" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "service" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 mt-1 w-48 rounded-2xl bg-white dark:bg-zinc-900 p-2 shadow-2xl ring-2 ring-zinc-200/80 dark:ring-zinc-800 z-50 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <Link href="/service/insurance" className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13.5px] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                      Insurance
                    </Link>
                    <Link href="/service/scrap" className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13.5px] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                      Scrap
                    </Link>
                    <Link href="/service/product" className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13.5px] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                      Product
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Charging Station (in 2 lines) */}
            <Link
              href="/charging-station"
              className={`${linkBase} ${
                pathname.startsWith("/charging-station")
                  ? activeLinkColor
                  : linkColor
              } flex flex-col justify-center text-left leading-tight py-1`}
            >
              <span className="text-[12.5px] font-black leading-[1.12]">
                Charging<br />Station
              </span>
            </Link>

            {/* For You */}
            <Link
              href="/foryou"
              className={`${linkBase} ${
                pathname.startsWith("/foryou")
                  ? "bg-violet-600 text-white font-black shadow-md shadow-violet-500/25 ring-2 ring-violet-400/40"
                  : isTransparent
                  ? isLight
                    ? "bg-violet-100 text-violet-950 border-2 border-violet-300 hover:bg-violet-200 font-black"
                    : "bg-violet-500/30 text-violet-100 border-2 border-violet-400/30 hover:bg-violet-500/40 hover:text-white font-black"
                  : "bg-violet-100 hover:bg-violet-200 text-violet-950 dark:bg-violet-950/60 dark:text-violet-200 border-2 border-violet-300/80 dark:border-violet-700/60 font-black shadow-xs"
              }`}
            >
              <span className="inline-flex items-center gap-1.5 font-black">
                <Sparkles size={15} strokeWidth={2.4} />
                For You
                {!pathname.startsWith("/foryou") && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600"></span>
                  </span>
                )}
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            {/* State / Location Selector */}
            <LocationSelector
              isTransparent={isTransparent}
              isLight={isLight}
              className="hidden md:block"
            />

            {/* User Profile / Auth Button (Icon Only) */}
            <Link
              href={user ? "/profile" : "/login"}
              title={user ? (user.displayName || "My Profile") : "Login / Register"}
              aria-label={user ? (user.displayName || "My Profile") : "Login or Register"}
              className={`hidden md:flex items-center justify-center p-2.5 rounded-full border-2 transition-all shadow-xs active:scale-95 cursor-pointer ${
                user
                  ? "bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-300 font-bold"
                  : iconBtnClass
              }`}
            >
              <User size={17} strokeWidth={2.3} />
            </Link>

            {/* Preferences */}
            <div className="relative">
              <button onClick={() => setPrefOpen(!prefOpen)} aria-label="Open page preferences" className={`p-2.5 rounded-full border-2 transition-all shadow-xs active:scale-95 cursor-pointer ${iconBtnClass}`}>
                <SlidersHorizontal size={17} strokeWidth={2.3} />
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

            {/* Minimize Header Button */}
            <button
              onClick={() => {
                if (isTabsSticky) {
                  setTemporarilyExpanded(false);
                } else {
                  setIsManuallyMinimized(true);
                }
              }}
              title="Minimize Header"
              aria-label="Minimize header"
              className={`p-2.5 rounded-full border-2 transition-all shadow-xs active:scale-95 cursor-pointer ${iconBtnClass}`}
            >
              <ChevronUp size={17} strokeWidth={2.4} />
            </button>

            <button
              className={`md:hidden p-2.5 rounded-full border-2 transition-all shadow-xs active:scale-95 cursor-pointer ${iconBtnClass}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -8 }} 
            className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-zinc-950 backdrop-blur-xl border-b-2 border-zinc-300 dark:border-zinc-800 shadow-2xl max-h-[85vh] overflow-y-auto z-[100]"
          >
            <div className="p-4 space-y-2.5">
              {/* Home */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[15px] transition-all ${
                  pathname === "/"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300/90 dark:border-emerald-700/80 shadow-xs"
                    : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                }`}
              >
                <Home size={19} strokeWidth={2.4} className="text-emerald-600 dark:text-emerald-400" />
                <span>Home</span>
              </Link>

              {/* Find */}
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[15px] transition-all ${
                  pathname.startsWith("/catalog")
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300/90 dark:border-emerald-700/80 shadow-xs"
                    : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                }`}
              >
                <LayoutGrid size={19} strokeWidth={2.4} className="text-emerald-600 dark:text-emerald-400" />
                <span>Find</span>
              </Link>

              {/* Sell */}
              <Link
                href="/sell-ev"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[15px] transition-all ${
                  pathname.startsWith("/sell-ev")
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300/90 dark:border-emerald-700/80 shadow-xs"
                    : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                }`}
              >
                <IndianRupee size={19} strokeWidth={2.4} className="text-emerald-600 dark:text-emerald-400" />
                <span>Sell</span>
              </Link>

              {/* Service Accordion */}
              <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/70 dark:bg-zinc-900/60">
                <button
                  onClick={() => setMobileServiceOpen(!mobileServiceOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <span className="flex items-center gap-3 text-[15px]">
                    <SlidersHorizontal size={19} strokeWidth={2.4} className="text-emerald-600 dark:text-emerald-400" /> Service
                  </span>
                  <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform duration-200 text-zinc-500 dark:text-zinc-400 ${mobileServiceOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileServiceOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-white dark:bg-zinc-900 border-t-2 border-zinc-200 dark:border-zinc-800 px-6 py-2 space-y-1.5"
                    >
                      <Link href="/service/insurance" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-400">
                        Insurance
                      </Link>
                      <Link href="/service/scrap" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-400">
                        Scrap
                      </Link>
                      <Link href="/service/product" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-400">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[15px] transition-all ${
                  pathname.startsWith("/charging-station")
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300/90 dark:border-emerald-700/80 shadow-xs"
                    : "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                }`}
              >
                <Zap size={19} strokeWidth={2.4} className="text-amber-500" />
                <span>Charging Station</span>
              </Link>

              {/* For You */}
              <Link
                href="/foryou"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-black text-[15px] transition-all ${
                  pathname.startsWith("/foryou")
                    ? "bg-violet-600 text-white font-black shadow-sm"
                    : "bg-violet-100 dark:bg-violet-950/50 hover:bg-violet-200/80 dark:hover:bg-violet-900/60 text-violet-950 dark:text-violet-200 border-2 border-violet-300/80 dark:border-violet-800/80"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={17} strokeWidth={2.4} className={pathname.startsWith("/foryou") ? "" : "text-violet-600"} /> For You
                </span>
                {!pathname.startsWith("/foryou") && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-600 text-white animate-pulse">
                    New
                  </span>
                )}
              </Link>

              {/* State / Location Selector */}
              <div className="mt-3">
                <LocationSelector isMobile />
              </div>

              {/* User Profile / Auth Button */}
              <Link
                href={user ? "/profile" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className={`mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm shadow-md border-2 ${
                  user
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                    : "bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-700"
                }`}
              >
                <User size={16} strokeWidth={2.3} />
                <span>{user ? (user.displayName || "Profile") : "Login / Register"}</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>

      {/* Floating Restore Bar / Pill when Header is Minimized */}
      <AnimatePresence>
        {isMinimized && !mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 sm:top-3.5 sm:right-6 sm:left-auto sm:w-auto z-[120] pointer-events-auto"
          >
            <button
              onClick={() => {
                if (isTabsSticky) {
                  setTemporarilyExpanded(true);
                }
                setIsManuallyMinimized(false);
              }}
              title="Expand Header"
              aria-label="Expand header"
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-2 sm:px-3.5 sm:py-1.5 rounded-none sm:rounded-full bg-white/95 dark:bg-[#071E15]/95 backdrop-blur-2xl border-b sm:border-2 border-[#1F7A4D]/30 dark:border-emerald-500/40 shadow-xs sm:shadow-xl sm:shadow-emerald-950/20 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-[#0C2B1F] transition-all cursor-pointer active:scale-[0.99] sm:active:scale-95 group"
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/evplsenewlogo.png"
                  alt="EVPLSE"
                  width={56}
                  height={14}
                  className="h-3 sm:h-3.5 w-auto object-contain"
                />
                <span className="text-[11px] sm:text-xs font-black text-emerald-700 dark:text-[#8FE24A]">Header</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#1F7A4D] dark:text-[#8FE24A] font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                <span>Tap to expand</span>
                <ChevronDown size={12} strokeWidth={2.6} className="group-hover:translate-y-0.5 transition-transform" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}