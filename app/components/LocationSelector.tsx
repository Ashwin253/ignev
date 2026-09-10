"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, LocationItem } from "../context/LocationContext";

interface LocationSelectorProps {
  isTransparent?: boolean;
  isLight?: boolean;
  isMobile?: boolean;
  className?: string;
}

export default function LocationSelector({
  isTransparent = false,
  isLight = false,
  isMobile = false,
  className = "",
}: LocationSelectorProps) {
  const { location, setLocation, locations } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredLocations = locations.filter((loc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q) ||
      loc.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });

  const handleSelect = (loc: LocationItem) => {
    setLocation(loc);
    setIsOpen(false);
  };

  const buttonStyle = isTransparent
    ? isLight
      ? "bg-white/90 hover:bg-white text-zinc-900 border-2 border-zinc-300 shadow-xs backdrop-blur-md font-bold"
      : "bg-white/15 hover:bg-white/25 text-white border-2 border-white/30 backdrop-blur-md font-bold"
    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-2 border-zinc-300/90 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-100 dark:border-zinc-700 shadow-xs font-bold";

  if (isMobile) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Select your state or city"
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-bold text-xs shadow-xs transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <MapPin size={13} strokeWidth={2.4} />
            </span>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold leading-none mb-0.5">Location</span>
              <span className="truncate text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                {location.name} <span className="text-[10px] text-zinc-400 font-normal">({location.state})</span>
              </span>
            </div>
          </div>
          <ChevronDown size={14} className={`text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-3 text-zinc-900 dark:text-white"
              >
                {/* Search */}
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search state or city..."
                    className="w-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium pl-8 pr-8 py-2 rounded-xl outline-none border border-transparent focus:border-emerald-500/50"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-56 overflow-y-auto space-y-1 [scrollbar-width:thin]">
                  {filteredLocations.map((loc) => {
                    const isSelected = loc.id === location.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelect(loc)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition text-left cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                        }`}
                      >
                        <span className="truncate">
                          {loc.name} <span className="text-[10px] text-zinc-400">· {loc.state}</span>
                        </span>
                        {isSelected && <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    );
                  })}
                  {filteredLocations.length === 0 && (
                    <p className="text-center text-xs text-zinc-400 py-4">No locations found</p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop View
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Current location: ${location.name}. Click to change.`}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 transition-all shadow-xs active:scale-95 cursor-pointer text-[13px] font-bold ${buttonStyle}`}
      >
        <MapPin size={14} strokeWidth={2.4} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="tracking-tight">{location.name}</span>
        <ChevronDown
          size={13}
          strokeWidth={2.5}
          className={`text-zinc-500 dark:text-zinc-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl p-3 z-50 text-zinc-900 dark:text-white"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Select Location</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  India
                </span>
              </div>

              {/* Search Box */}
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city or state..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium pl-8 pr-7 py-1.5 rounded-xl outline-none border border-transparent focus:border-emerald-500/50 dark:text-white transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto space-y-0.5 [scrollbar-width:thin] pr-1">
                {filteredLocations.map((loc) => {
                  const isSelected = loc.id === location.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelect(loc)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition text-left cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate text-xs leading-tight">{loc.name}</span>
                        <span className="text-[10px] text-zinc-400 leading-none mt-0.5">{loc.state}</span>
                      </div>
                      {isSelected && (
                        <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
                  );
                })}
                {filteredLocations.length === 0 && (
                  <p className="text-center text-xs text-zinc-400 py-4">No matching location</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
