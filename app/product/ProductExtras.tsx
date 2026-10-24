"use client";

import { useEffect } from "react";
import { Heart, Send } from "lucide-react";
import { triggerEnquiryModal } from "../components/EnquiryModal";
import { useShortlist } from "../context/ShortlistContext";
import { pushRecentlyViewed } from "../lib/recently-viewed";
import { btn, cx } from "../components/ui/kit";

/** Tracks "recently viewed" and shows a sticky action bar on phones. */
export default function ProductExtras({ slug, title, price }: { slug: string; title: string; price?: string }) {
  const { has, toggle } = useShortlist();
  const saved = has(slug);

  useEffect(() => {
    pushRecentlyViewed(slug);
  }, [slug]);

  return (
    <div className="pb-safe fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 border-t border-line bg-white/95 px-4 pt-3 shadow-[0_-10px_30px_-12px_rgba(14,27,20,0.2)] backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold uppercase tracking-wider text-ink-mute">{title}</p>
          <p className="truncate text-base font-extrabold text-ink">{price || "Price on request"}</p>
        </div>
        <button
          onClick={() => toggle(slug, title)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
          className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-full border transition", saved ? "border-coral bg-coral-soft text-coral" : "border-line-strong bg-white text-ink-soft")}
        >
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
        <button onClick={() => triggerEnquiryModal(title)} className={btn("primary", "md")}>
          Get offer <Send size={15} />
        </button>
      </div>
    </div>
  );
}
