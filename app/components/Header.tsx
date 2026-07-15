"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Home, LayoutGrid, MapPin, IndianRupee, Download, SlidersHorizontal, Volume2, VolumeX, Smartphone, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedback } from "../context/FeedbackContext";
import { playClickSound, playHaptic } from "../lib/feedback";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/catalog", icon: LayoutGrid },
  { name: "Map", href: "/map", icon: MapPin },
  { name: "For You", href: "/foryou", icon: Sparkles },
  // { name: "Compare", href: "/compare", icon: IndianRupee },
];

const lightBgRoutes = ["/catalog", "/product", "/updates", "/map", "/own", "/service", "/shop", "/team", "/mis", "/analytics"];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prefOpen, setPrefOpen] = useState(false);
  const { soundEnabled, setSoundEnabled, hapticsEnabled, setHapticsEnabled } = useFeedback();
  const pathname = usePathname();

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
  const headerBg = isTransparent
    ? "bg-transparent border-transparent"
    : "bg-white/80 backdrop-blur-xl border-emerald-100/60 shadow-[0_4px_24px_-12px_rgba(16,185,129,0.2)]";

  const linkBase = "text-sm font-medium px-3 py-2 rounded-full transition-all";
  const linkColor = isTransparent
    ? "text-white/85 hover:text-white hover:bg-white/10"
    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70";
  const activeLinkColor = isTransparent
    ? "text-white bg-white/15 backdrop-blur-sm"
    : "text-emerald-700 bg-emerald-50";

  const ctaClass = isTransparent
    ? "bg-white/12 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md"
    : "bg-emerald-600 hover:bg-emerald-700 text-white";

  const iconBtnClass = isTransparent
    ? "bg-white/12 hover:bg-white/20 text-white border-white/25"
    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${headerBg}`}>
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

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              const isForYou = link.href === "/foryou";
              
              let customClass = `${linkBase} ${isActive ? activeLinkColor : linkColor}`;
              if (isForYou) {
                if (isActive) {
                  customClass = `${linkBase} bg-violet-600 text-white font-bold shadow-md shadow-violet-500/15`;
                } else {
                  customClass = isTransparent
                    ? `${linkBase} bg-violet-500/20 text-violet-200 border border-violet-400/20 hover:bg-violet-500/30 hover:text-white font-bold`
                    : `${linkBase} bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/50 font-bold`;
                }
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={customClass}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <link.icon size={15} />
                    {link.name}
                    {isForYou && !isActive && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-600"></span>
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/nearme" className={`hidden md:flex items-center gap-1.5 font-medium px-4 py-2 rounded-full text-sm transition-all border shadow-sm active:scale-95 ${ctaClass}`}>
              <MapPin size={15} /> Near Me
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
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button className={`md:hidden p-2 rounded-full ${isTransparent ? "text-white hover:bg-white/10" : "text-zinc-700 hover:bg-zinc-100"}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-emerald-100 shadow-xl">
            <div className="p-4 space-y-1">
              {navLinks.map(link => {
                const isForYou = link.href === "/foryou";
                const isSelected = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    onClick={()=>setMobileMenuOpen(false)} 
                    className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                      isForYou 
                        ? (isSelected ? "bg-violet-600 text-white font-bold" : "bg-violet-50 hover:bg-violet-100/80 text-violet-700 border border-violet-100")
                        : (isSelected ? "bg-emerald-50 text-emerald-800" : "text-zinc-700 hover:bg-zinc-100")
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <link.icon size={16} className={isForYou && !isSelected ? "text-violet-500" : ""} /> {link.name}
                    </span>
                    {isForYou && (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? "bg-white text-violet-700" : "bg-violet-600 text-white animate-pulse"}`}>
                        New
                      </span>
                    )}
                  </Link>
                );
              })}
              <Link href="/nearme" onClick={()=>setMobileMenuOpen(false)} className="mt-3 flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-3 rounded-xl font-medium">
                <MapPin size={16} /> Near Me
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}