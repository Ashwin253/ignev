"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bike, Truck, CarFront, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { catalogFilterUrl } from "../lib/catalog-filters";

export default function HeaderSearch({ isScrolled }: { isScrolled: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (searchVal: string) => {
    if (!searchVal.trim()) return;
    router.push(catalogFilterUrl({ q: searchVal.trim() }));
    setIsOpen(false);
    setMobileOpen(false);
  };

  const handleTabClick = (filters: Parameters<typeof catalogFilterUrl>[0]) => {
    router.push(catalogFilterUrl(filters));
    setIsOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ── DESKTOP SEARCH ── */}
      <div ref={containerRef} className="relative hidden md:block w-full max-w-[200px] xl:max-w-[320px] transition-all duration-300">
        {!isScrolled ? (
          /* Small search box when not scrolled */
          <div className="relative">
            <input
              type="text"
              placeholder="Search EV..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(query);
                }
              }}
              className="w-full bg-slate-100 hover:bg-slate-200/80 focus:bg-white border border-slate-250/60 text-slate-800 text-xs font-semibold rounded-full pl-9 pr-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#34ebb1] focus:border-[#34ebb1]"
            />
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={13} />
          </div>
        ) : (
          /* Search box in center when scrolled */
          <div className="relative">
            <input
              type="text"
              placeholder="Search models, brands..."
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(query);
                }
              }}
              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-full pl-9 pr-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#34ebb1] focus:border-[#34ebb1] shadow-xs"
            />
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={13} />

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl p-4 shadow-xl z-50 text-slate-800 w-[320px]"
                >
                  {/* Upper Tabs */}
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Filter by Type</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleTabClick({ type: "2 Wheeler" })}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-600 border border-slate-100 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <Bike size={14} className="text-sky-600" />
                        2-Wheeler
                      </button>
                      <button
                        onClick={() => handleTabClick({ type: "3 Wheeler" })}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-600 border border-slate-100 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <CarFront size={14} className="text-sky-600" />
                        3-Wheeler
                      </button>
                      <button
                        onClick={() => handleTabClick({ comm: true })}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-600 border border-slate-100 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <Truck size={14} className="text-sky-600" />
                        Commercial
                      </button>
                    </div>
                  </div>

                  {/* Bottom Tabs */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Popular Brands</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTabClick({ brand: "ATHER" })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-[#34ebb1]/10 hover:text-slate-900 border border-slate-100 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Ather
                      </button>
                      <button
                        onClick={() => handleTabClick({ brand: "EULER MOTORS" })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-[#34ebb1]/10 hover:text-slate-900 border border-slate-100 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Euler
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── MOBILE SEARCH (Trigger Icon & Overlay Modal) ── */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className={`p-2.5 rounded-full transition-all active:scale-95 border cursor-pointer ${
            isScrolled
              ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              : "bg-slate-900/10 hover:bg-slate-900/15 text-slate-800 border-slate-300/60"
          }`}
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex flex-col justify-start p-4"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                className="w-full bg-white rounded-3xl p-5 shadow-2xl mt-4 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-slate-900">Search EV Marketplace</span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="relative mb-5">
                  <input
                    type="text"
                    placeholder="Search models, brands, categories..."
                    value={query}
                    autoFocus
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchSubmit(query);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#34ebb1] focus:border-[#34ebb1]"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                </div>

                {/* Upper Tabs */}
                <div className="mb-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">Filter by Type</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleTabClick({ type: "2 Wheeler" })}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 active:bg-sky-50 border border-slate-100 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <Bike size={16} className="text-sky-600" />
                      2-Wheeler
                    </button>
                    <button
                      onClick={() => handleTabClick({ type: "3 Wheeler" })}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 active:bg-sky-50 border border-slate-100 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <CarFront size={16} className="text-sky-600" />
                      3-Wheeler
                    </button>
                    <button
                      onClick={() => handleTabClick({ comm: true })}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 active:bg-sky-50 border border-slate-100 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <Truck size={16} className="text-sky-600" />
                      Commercial
                    </button>
                  </div>
                </div>

                {/* Bottom Tabs */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">Popular Brands</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTabClick({ brand: "ATHER" })}
                      className="flex-1 py-3 rounded-2xl bg-slate-50 active:bg-[#34ebb1]/20 border border-slate-100 text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      Ather
                    </button>
                    <button
                      onClick={() => handleTabClick({ brand: "EULER MOTORS" })}
                      className="flex-1 py-3 rounded-2xl bg-slate-50 active:bg-[#34ebb1]/20 border border-slate-100 text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      Euler
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
