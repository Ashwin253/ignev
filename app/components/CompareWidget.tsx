"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, GitCompare, X } from "lucide-react";
import { useCompare } from "../context/CompareContext";

export default function CompareWidget() {
  const { selectedSlugs, removeFromCompare, clearCompare } = useCompare();

  if (selectedSlugs.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-1/2 z-50 w-[95%] max-w-lg -translate-x-1/2 md:bottom-8"
      >
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_48px_rgba(15,23,42,0.15)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                <GitCompare size={14} />
              </div>
              <span className="text-sm font-bold text-slate-900">
                Compare Vehicles ({selectedSlugs.length})
              </span>
            </div>
            <button
              onClick={clearCompare}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-rose-500 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="flex items-center gap-3 p-4">
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                {selectedSlugs.map((slug) => (
                  <div
                    key={slug}
                    className="group relative flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 pr-2 shadow-sm"
                  >
                    <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[80px]">
                      {slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </span>
                    <button
                      onClick={() => removeFromCompare(slug)}
                      className="rounded-md p-0.5 hover:bg-slate-100 text-slate-400 hover:text-rose-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/compare?slugs=${selectedSlugs.join(",")}`}
              className="flex h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all shrink-0"
            >
              Compare <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
