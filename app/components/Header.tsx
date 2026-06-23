"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, LayoutGrid, Newspaper, MapPin, IndianRupee, ShoppingBag, Download, Wrench, CarFront, Percent, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/catalog", icon: LayoutGrid },
  // { name: "Updates", href: "/updates", icon: Newspaper },
  { name: "Map", href: "/map", icon: MapPin },
  { name: "Compare", href: "/compare", icon: IndianRupee },
  // { name: "Quick", href: "/service", icon: Wrench },
  // { name: "Shop", href: "/shop", icon: ShoppingBag },
  // { name: "Offer", href: "/offers", icon: Percent },
  // { name: "Community", href: "https://evplse.online/community/", icon: MessageSquare, external: true },
];

// Pages that have a white/light background — nav text should be dark
const lightBgRoutes = ["/catalog", "/product", "/updates", "/map", "/own", "/service", "/shop", "/team", "/mis", "/analytics"];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Apply homepage styling globally
  const isLightPage = false;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── PWA Install State ──
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallTooltip, setShowInstallTooltip] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallTooltip(true);
      setTimeout(() => setShowInstallTooltip(false), 5000);
    }
  };

  // ── Style helpers ──────────────────────────────────────────────────────────
  const headerBg = isLightPage
    ? isScrolled
      ? "bg-white/95 backdrop-blur-md border-slate-200 shadow-sm"
      : "bg-white/80 backdrop-blur-sm border-slate-100"
    : isScrolled
      ? "bg-slate-900/90 backdrop-blur-md border-white/10 shadow-lg"
      : "bg-transparent border-transparent";

  const linkBase = "text-sm text-black lg:text-base font-medium px-3 py-2 rounded-md transition-colors";

  // On dark pages before scroll: soft dark text readable against the light hero gradient
  const linkColor = isLightPage
    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    : isScrolled
      ? "text-white/90 hover:text-white hover:bg-white/10"
      : "text-slate-700 hover:text-slate-900 hover:bg-black/5";

  const activeLinkColor = isLightPage
    ? "text-sky-600 bg-sky-50"
    : isScrolled
      ? "text-white bg-white/15"
      : "text-sky-700 bg-sky-50/80";

  const mobileLinkColor = isLightPage
    ? "text-slate-700 hover:text-slate-900"
    : "text-white/90 hover:text-white";

  const mobileBg = isLightPage
    ? "bg-white border-slate-200"
    : "bg-slate-900/95 backdrop-blur-lg border-white/10";

  const mobileToggleColor = isLightPage
    ? "text-slate-600 hover:text-slate-900"
    : isScrolled
      ? "text-white hover:text-white/80"
      : "text-slate-700 hover:text-slate-900";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${headerBg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="z-50 hover:opacity-80  transition-opacity">
            <img src="/evplsenewlogo.png" alt="IgnEV Logo" className="h-16 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href.split("#")[0]) &&
                  link.href.split("#")[0] !== "/";
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  {...((link as any).external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`${linkBase} ${isActive ? activeLinkColor : linkColor}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <link.icon size={14} />
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-3 z-50">
            {/* <button
              onClick={() => window.dispatchEvent(new CustomEvent("install-request"))}
              className={`hidden md:block font-semibold px-5 py-2.5 rounded-full text-sm transition-all shadow-sm hover:shadow-md active:scale-95 ${!isLightPage && !isScrolled
                ? "bg-slate-900/10 hover:bg-slate-900/15 text-slate-800 border border-slate-300/60"
                : "bg-white hover:bg-slate-100 text-slate-900 border border-slate-200"
                }`}
            >
              <span className="inline-flex items-center gap-2">
                <Download size={16} />
                Install now
              </span>
            </button> */}
            <Link
              href="/nearme"
              className={`hidden md:flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full text-sm transition-all shadow-sm hover:shadow-md active:scale-95 ${!isLightPage && !isScrolled
                ? "bg-slate-900/10 hover:bg-slate-900/15 text-slate-800 border border-slate-300/60"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
            >
              <MapPin size={16} /> Near Me
            </Link>
            <Link
              href="/assist"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("open-assist"));
              }}
              className={`hidden md:block font-semibold px-5 py-2.5 rounded-full text-sm transition-all shadow-sm hover:shadow-md active:scale-95 ${!isLightPage && !isScrolled
                ? "bg-slate-900/10 hover:bg-slate-900/15 text-slate-800 border border-slate-300/60"
                : "bg-sky-600 hover:bg-sky-700 text-white"
                }`}            >
              Get Assist
            </Link>
            <button
              className={`md:hidden p-2 rounded-md transition-colors ${mobileToggleColor}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 right-0 border-b shadow-xl md:hidden ${mobileBg}`}
          >
            <div className="px-4 py-6 space-y-1 flex flex-col">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href.split("#")[0]) &&
                    link.href.split("#")[0] !== "/";
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    {...((link as any).external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`text-base px-4 py-3 rounded-xl transition-colors font-medium ${isActive
                      ? isLightPage
                        ? "text-sky-600 bg-sky-50"
                        : "text-white bg-white/15"
                      : mobileLinkColor
                      }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <link.icon size={16} />
                      {link.name}
                    </span>
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-slate-200/50">
                <div className="relative w-full mb-3">
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold px-6 py-3 rounded-full transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Install now
                  </button>
                  {showInstallTooltip && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold p-3 rounded-xl shadow-lg w-56 text-center animate-in fade-in zoom-in duration-200 z-50">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 transform rotate-45"></div>
                      To install, tap Share and select &quot;Add to Home Screen&quot;.
                    </div>
                  )}
                </div>
                <Link
                  href="/nearme"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full mb-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-full transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <MapPin size={18} /> Near Me
                </Link>
                <Link
                  href="/assist"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent("open-assist"));
                  }}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-full transition-all shadow-sm block text-center"
                >
                  Get Assist
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


