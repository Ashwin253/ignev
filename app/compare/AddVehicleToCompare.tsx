"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getVehiclePhoto } from "../lib/vehicle-images";

type CompactProduct = {
  slug: string;
  title: string;
  brand: string;
  types?: string[];
  type?: string;
  photo: string | null;
};

export default function AddVehicleToCompare({ 
  allProducts, 
  currentSlugs, 
  targetPath = "/compare" 
}: { 
  allProducts: CompactProduct[]; 
  currentSlugs: string[];
  targetPath?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const available = useMemo(() => {
    return allProducts.filter(p => !currentSlugs.includes(p.slug));
  }, [allProducts, currentSlugs]);

  const filtered = useMemo(() => {
    if (!search) return available.slice(0, 10);
    const s = search.toLowerCase();
    return available.filter(p => 
      p.title.toLowerCase().includes(s) || 
      p.brand.toLowerCase().includes(s)
    ).slice(0, 10);
  }, [available, search]);

  const handleAdd = (slug: string) => {
    // If targetPath is /own, we might want to replace the slug instead of appending
    let newSlugs = [...currentSlugs, slug];
    if (targetPath === "/own") {
       newSlugs = [slug];
    }
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("slugs", newSlugs.join(","));
    router.push(`${targetPath}?${params.toString()}`);
    setIsOpen(false);
    setSearch("");
  };

  if (currentSlugs.length >= 4) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all group"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
          <Plus size={20} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider">Add Vehicle</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-[70] w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Add to Compare</h3>
                  <button onClick={() => setIsOpen(false)} className="rounded-full p-2 hover:bg-slate-100 text-slate-400">
                    <X size={20} />
                  </button>
                </div>
                <div className="relative flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
                  <Search size={18} className="text-slate-400" />
                  <input
                    autoFocus
                    placeholder="Search vehicle..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2 no-scrollbar">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400 font-medium">
                    No results found
                  </div>
                ) : (
                  <div className="grid gap-1">
                    {filtered.map((p) => (
                      <button
                        key={p.slug}
                        onClick={() => handleAdd(p.slug)}
                        className="flex items-center gap-4 rounded-2xl p-3 hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-slate-100">
                          <Image src={getVehiclePhoto(p.photo, p)} alt={p.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{p.brand}</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{p.title}</p>
                        </div>
                        <div className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex">
                          <Plus size={16} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
