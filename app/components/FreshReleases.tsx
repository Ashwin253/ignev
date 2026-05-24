"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BadgeCheck, Gauge, Send } from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";
import type { EvListing } from "../lib/wordpress";

export default function FreshReleases({ listings }: { listings: EvListing[] }) {
  if (listings.length === 0) return null;

  return (
    <section className="py-16 bg-linear-to-b from-emerald-50/50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Fresh Releases</h2>
              <p className="text-xs text-slate-500">Launched in the last 2 months</p>
            </div>
          </div>
          <Link
            href="/catalog"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {/* Cards */}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
          {listings.map((listing, i) => (
            <motion.article
              key={listing.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="group w-[78vw] max-w-xs shrink-0 snap-start md:w-auto md:max-w-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow"
            >
              <Link href={`/product/${listing.slug}`} className="flex flex-col h-full">
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  {listing.photo && (
                    <Image
                      src={listing.photo}
                      alt={listing.title}
                      fill
                      sizes="(max-width: 768px) 78vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                    <Sparkles size={10} /> New
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">{listing.brand}</p>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{listing.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {listing.prices.length > 0 && (
                      <span className="font-bold text-slate-800">₹{listing.prices[0]} Lakh</span>
                    )}
                    {listing.topSpeed !== null && (
                      <span className="inline-flex items-center gap-0.5">
                        <Gauge size={10} className="text-amber-500" /> {listing.topSpeed} km/h
                      </span>
                    )}
                    {listing.types[0] && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {listing.types[0]}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-2 flex gap-2">
                    <div className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-[11px] font-bold transition-colors">
                      Details <ArrowRight size={10} />
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerEnquiryModal(`${listing.brand} ${listing.title}`); }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors active:scale-95"
                    >
                      Enquire <Send size={10} />
                    </button>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-4 sm:hidden">
          <Link
            href="/catalog"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View all listings <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
