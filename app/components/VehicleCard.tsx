"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, BatteryCharging, CalendarClock, GitCompare, Heart, Play, ImageIcon, Send, Truck, Zap, Gauge } from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";
import { useCompare } from "../context/CompareContext";
import { useShortlist } from "../context/ShortlistContext";
import { getVehiclePhoto } from "../lib/vehicle-images";
import { getVehicleCardSpecs } from "../lib/listing-specs";
import { isLaunched } from "../lib/wordpress";
import { emiPerMonth, inrShort, itemSlug, priceLowLakh } from "../lib/format";
import type { CatalogItem } from "../lib/catalog-types";
import { cx } from "./ui/kit";

function getEmbedUrl(url: string) {
  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const id = url.includes("youtu.be")
        ? url.split("youtu.be/")[1]?.split("?")[0]
        : new URL(url).searchParams.get("v") || "";
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&mute=1` : null;
    }
    if (url.includes("vimeo.com")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function VehicleCard({
  item,
  priority = false,
  className = "",
  showEmi = true,
  compact = false,
}: {
  item: CatalogItem;
  priority?: boolean;
  className?: string;
  showEmi?: boolean;
  compact?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const shortlist = useShortlist();

  const slug = itemSlug(item);
  const launched = item.upcoming !== undefined ? !item.upcoming : isLaunched(item.launchdate);
  const { power, torque, battery } = getVehicleCardSpecs(item);
  const inCompare = isInCompare(slug);
  const saved = shortlist.has(slug);
  const label = `${item.brand} ${item.name}`;

  const videoUrl = item.video_links?.[0]?.url;
  const isEmbed = !!videoUrl && /youtube\.com|youtu\.be|vimeo\.com/.test(videoUrl);
  const isDirect = !!videoUrl && !isEmbed;

  const lakh = priceLowLakh(item);
  const emi = showEmi && lakh > 0 && launched ? emiPerMonth(lakh * 100000 * 0.8) : 0;

  return (
    <article
      className={cx(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift",
        className,
      )}
    >
      {/* Media */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-brand-soft/70 via-white to-white">
        <Link href={`/product/${slug}`} className="absolute inset-0 z-0" aria-label={`View ${label}`}>
          <Image
            src={getVehiclePhoto(item.photo, item)}
            alt={label}
            fill
            priority={priority}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 300px"
            className={cx("object-cover transition-transform duration-500 group-hover:scale-[1.04]", playing && "opacity-0")}
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />

        {playing && isDirect && (
          <div className="absolute inset-0 z-20 bg-black">
            <video src={videoUrl} autoPlay muted loop playsInline className="h-full w-full object-contain" />
          </div>
        )}
        {playing && isEmbed && (
          <div className="absolute inset-0 z-20 bg-black">
            {getEmbedUrl(videoUrl!) ? (
              <iframe
                src={getEmbedUrl(videoUrl!)!}
                title={`${label} video`}
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white">Video unavailable</div>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-1.5">
          <span
            className={cx(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md",
              launched ? "bg-white/90 text-brand-deep" : "bg-ink text-white",
            )}
          >
            {launched ? <BadgeCheck size={12} /> : <CalendarClock size={12} />}
            {launched ? "Available" : "Coming soon"}
          </span>
          {item.commercial && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
              <Truck size={12} /> Commercial
            </span>
          )}
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={() => shortlist.toggle(slug, label)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${label} from shortlist` : `Save ${label} to shortlist`}
          className={cx(
            "absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-full border backdrop-blur-md transition active:scale-90",
            saved ? "border-coral bg-coral text-white" : "border-white/70 bg-white/90 text-ink-soft hover:text-coral",
          )}
        >
          <Heart size={16} className={saved ? "fill-current" : ""} />
        </button>

        {/* Bottom controls */}
        <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (inCompare ? removeFromCompare(slug) : addToCompare(slug))}
            aria-pressed={inCompare}
            className={cx(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold backdrop-blur-md transition active:scale-95",
              inCompare ? "bg-brand text-white" : "bg-white/90 text-ink hover:bg-white",
            )}
          >
            <GitCompare size={13} /> {inCompare ? "Added" : "Compare"}
          </button>
          {videoUrl && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Show photo" : "Play video preview"}
              className="grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-white backdrop-blur-md transition hover:bg-ink"
            >
              {playing ? <ImageIcon size={14} /> : <Play size={13} className="ml-0.5 fill-current" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={`/product/${slug}`} className="block">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand">{item.brand}</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-bold leading-tight text-ink group-hover:text-brand-deep" title={item.name}>
              {item.name}
            </h3>
            <div className="shrink-0 text-right">
              <p className="text-[17px] font-extrabold leading-none tracking-tight text-ink">{item.pricing || "TBA"}</p>
              {item.baas && <span className="mt-1 inline-block rounded bg-sky-soft px-1.5 py-0.5 text-[9px] font-bold text-[#0a4a30]">BaaS</span>}
            </div>
          </div>
          {emi > 0 && <p className="mt-1 text-right text-[11px] font-medium text-ink-mute">EMI from ~{inrShort(emi)}/mo</p>}
        </Link>

        {!compact && (
          <div className="mt-4 grid grid-cols-3 divide-x divide-line rounded-2xl bg-paper py-2.5 text-center">
            <Spec icon={<Zap size={13} className="text-brand" />} value={power || (item.topSpeed ? `${item.topSpeed} km/h` : "—")} label="Power" />
            <Spec icon={<Gauge size={13} className="text-brand" />} value={torque || "—"} label="Torque" />
            <Spec icon={<BatteryCharging size={13} className="text-brand" />} value={battery || (item.drivingRange ? `${item.drivingRange} km` : "—")} label="Battery" />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Link
            href={`/product/${slug}`}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-full border border-line-strong text-[13px] font-bold text-ink transition hover:border-ink"
          >
            Details <ArrowUpRight size={14} />
          </Link>
          <button
            type="button"
            onClick={() => triggerEnquiryModal(label)}
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-brand text-[13px] font-bold text-white transition hover:bg-brand-deep active:scale-[0.97]"
          >
            Enquire <Send size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Spec({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="min-w-0 px-1">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="truncate text-[12px] font-extrabold text-ink">{value}</span>
      </div>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-mute">{label}</p>
    </div>
  );
}
