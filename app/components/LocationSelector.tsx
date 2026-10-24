"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, LocationItem } from "../context/LocationContext";

interface LocationSelectorProps {
  isTransparent?: boolean;
  isLight?: boolean;
  isMobile?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export default function LocationSelector({
  isTransparent = false,
  isLight = false,
  isMobile = false,
  iconOnly = false,
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
    : "bg-white hover:border-ink text-ink border border-line-strong font-bold";

  if (isMobile) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Select your state or city"
          className="flex items-center justify-between w-full px-4 py-3 rounded-2xl border border-line bg-paper text-ink font-bold text-xs transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600  shrink-0">
              <MapPin size={13} strokeWidth={2.4} />
            </span>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold leading-none mb-0.5">Location</span>
              <span className="truncate text-xs font-bold text-zinc-900 leading-tight">
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
                className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-zinc-200 bg-white  shadow-2xl p-3 text-zinc-900 "
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
                    className="w-full bg-zinc-100 text-xs font-medium pl-8 pr-8 py-2 rounded-xl outline-none border border-transparent focus:border-emerald-500/50"
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
                            ? "bg-emerald-500/10 text-emerald-600  font-bold"
                            : "hover:bg-zinc-100  text-zinc-700  font-medium"
                        }`}
                      >
                        <span className="truncate">
                          {loc.name} <span className="text-[10px] text-zinc-400">· {loc.state}</span>
                        </span>
                        {isSelected && <Check size={14} className="shrink-0 text-emerald-600 " />}
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
      {iconOnly ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={`Current location: ${location.name}. Click to change.`}
          className="group relative grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-white text-ink transition hover:border-brand hover:text-brand active:scale-95 cursor-pointer"
        >
          <MapPin size={17} />
          <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-lg opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 z-50">
            {location.name || "Location"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={`Current location: ${location.name}. Click to change.`}
          className={`flex h-10 items-center gap-1.5 px-3.5 rounded-full transition-all active:scale-95 cursor-pointer text-[13px] font-bold ${buttonStyle}`}
        >
          <MapPin size={14} strokeWidth={2.4} className="text-emerald-600 shrink-0" />
          <span className="tracking-tight">{location.name}</span>
          <ChevronDown
            size={13}
            strokeWidth={2.5}
            className={`text-zinc-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-zinc-200 bg-white/95  backdrop-blur-2xl shadow-2xl p-3 z-50 text-zinc-900 "
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 ">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Select Location</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 ">
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
                  className="w-full bg-zinc-100 text-xs font-medium pl-8 pr-7 py-1.5 rounded-xl outline-none border border-transparent focus:border-emerald-500/50  transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 "
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
                          ? "bg-emerald-500/10 text-emerald-600  font-bold"
                          : "hover:bg-zinc-100  text-zinc-700  font-medium"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate text-xs leading-tight">{loc.name}</span>
                        <span className="text-[10px] text-zinc-400 leading-none mt-0.5">{loc.state}</span>
                      </div>
                      {isSelected && (
                        <Check size={14} className="shrink-0 text-emerald-600 " />
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
