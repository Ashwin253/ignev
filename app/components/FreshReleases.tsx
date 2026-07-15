"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Gauge, Send, Play } from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";
import { formatPricing, type EvListing } from "../lib/wordpress";

function FreshReleaseCard({ listing, index }: { listing: EvListing; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoUrl = listing.video_links?.[0]?.url;
  const isYoutubeOrVimeo = videoUrl && (
    videoUrl.includes("youtube.com") ||
    videoUrl.includes("youtu.be") ||
    videoUrl.includes("vimeo.com")
  );
  const isDirectVideo = videoUrl && !isYoutubeOrVimeo;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isDirectVideo) return;
    if (isHovered) {
      video.muted = true;
      // If video data isn't loaded yet, load it and wait for canplay
      if (video.readyState < 3) {
        video.load();
        const onCanPlay = () => {
          video.play().catch(() => {});
          video.removeEventListener("canplay", onCanPlay);
        };
        video.addEventListener("canplay", onCanPlay);
        return () => video.removeEventListener("canplay", onCanPlay);
      } else {
        video.play().catch(() => {});
      }
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovered, isDirectVideo]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group w-[78vw] max-w-xs shrink-0 snap-start md:w-auto md:max-w-none overflow-hidden rounded-3xl border border-slate-200/40 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:border-slate-250/70 transition-all duration-300"
    >
      <Link href={`/product/${listing.slug}`} className="flex flex-col h-full">
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
          {listing.photo && (
            <Image
              src={listing.photo}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 78vw, 25vw"
              className={`object-cover transition-all duration-500 ${isHovered && isDirectVideo ? 'scale-105 opacity-0' : 'group-hover:scale-105'}`}
            />
          )}

          {/* Video overlay — plays on hover */}
          {isDirectVideo && (
            <video
              ref={videoRef}
              src={videoUrl}
              preload="metadata"
              loop
              muted
              playsInline
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={{ pointerEvents: "none" }}
            />
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />

          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-slate-900 shadow-sm" style={{ backgroundColor: "#34ebb1" }}>
            <Sparkles size={10} /> New
          </span>

          {/* Video play icon — bottom right, hides on hover */}
          {videoUrl && (
            <div className={`absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-white backdrop-blur-md transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
              <Play size={14} className="ml-0.5 fill-current" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">{listing.brand}</p>
            <h3 className="text-base font-bold text-slate-900 line-clamp-1">{listing.title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {listing.prices.length > 0 && (
              <span className="font-bold text-slate-800">{formatPricing(listing.prices)}</span>
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
              className="flex-1 bg-slate-900 hover:bg-slate-700 text-white py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors active:scale-95"
            >
              Enquire <Send size={10} />
            </button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function FreshReleases({ listings }: { listings: EvListing[] }) {
  // Filter to only show SUV, Hatchback, Compact SUV body types
  const ALLOWED_BODY_TYPES = ["suv", "hatchback", "compact suv"];
  const filteredListings = listings.filter((l) => {
    const bt = (l.body_type || "").toLowerCase().trim();
    const types = (l.types || []).map((t: string) => t.toLowerCase().trim());
    return ALLOWED_BODY_TYPES.includes(bt) || types.some((t: string) => ALLOWED_BODY_TYPES.includes(t));
  });

  const displayListings = filteredListings.length > 0 ? filteredListings : listings;
  if (displayListings.length === 0) return null;

  return (
    <section className="py-16" style={{ backgroundColor: "#b5ebea" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg" style={{ backgroundColor: "#34ebb1" }}>
              <Sparkles size={20} className="text-slate-900" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">New Releases</h2>
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
          {displayListings.map((listing, i) => (
            <FreshReleaseCard key={listing.id} listing={listing} index={i} />
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
