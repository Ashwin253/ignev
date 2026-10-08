"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  User,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
  LocateFixed,
  ChevronRight,
  Tag,
} from "lucide-react";
import { trackSmartEvent, SMART_EVENTS } from "../lib/clarity-events";
import { supabaseClient } from "../lib/supabase-client";
const SESSION_KEY = "best_offer_dismissed";
const DELAY_MS = 12000;
const RETRY_DELAY_MS = 25 * 1000;

type LocationState = "idle" | "fetching" | "done" | "error";

type OfferBanner = {
  cta: string;           // used as popup title
  details: string;       // used as popup subtitle
  image_horizontal: string;
  background_color?: string;
  href?: string;
};

// Module-level so timers survive React unmount/remount cycles
let scheduleTimer: ReturnType<typeof setTimeout> | null = null;
const clearSchedule = () => {
  if (scheduleTimer) {
    clearTimeout(scheduleTimer);
    scheduleTimer = null;
  }
};

export default function BestOfferPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState<OfferBanner | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabaseClient
          .from("hero_banners")
          .select("cta, details, image_horizontal, background_color, href")
          .eq("label", "offer_popup")
          .eq("is_active", true)
          .order("order_index", { ascending: true })
          .limit(1);
        if (data && data.length > 0) setBanner(data[0] as OfferBanner);
      } catch {}
    })();
  }, []);

  // â”€â”€ Schedule helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const scheduleShow = (delay: number) => {
    clearSchedule();
    scheduleTimer = setTimeout(() => {
      scheduleTimer = null;
      if (!sessionStorage.getItem(SESSION_KEY)) setVisible(true);
    }, delay);
  };

  // â”€â”€ Initial schedule on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname?.startsWith("/team")) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    scheduleShow(DELAY_MS);
    return () => clearSchedule();
  }, [pathname]);

  // â”€â”€ Auto-fetch location each time the popup opens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!visible) return;
    setLocationState("idle");
    fetchLocation();
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLocation = () => {
    if (!("geolocation" in navigator)) return;
    setLocationState("fetching");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const pc = data?.address?.postcode || data?.address?.postal_code || "";
          setPincode(pc.replace(/\s/g, "").slice(0, 6));
          setLocationState("done");
        } catch {
          setLocationState("error");
        }
      },
      () => setLocationState("error"),
      { timeout: 8000 }
    );
  };

  // â”€â”€ Ask later â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const askLater = () => {
    clearSchedule();
    setVisible(false);
    if (pathname?.startsWith("/team")) return;
    scheduleShow(RETRY_DELAY_MS);
  };

  // â”€â”€ Dismiss forever â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const dismiss = () => {
    setVisible(false);
    clearSchedule();
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          pincode: pincode.trim(),
          interest: "Best Offer",
          message: "",
          source: "Get Best Offer",
        }),
      });
      trackSmartEvent(SMART_EVENTS.TEST_DRIVE_INQUIRY, { source: "Get Best Offer" });
    } catch {}
    setSubmitting(false);
    setSubmitted(true);
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  // Derived banner values with sensible defaults
  const popupTitle   = banner?.cta     || "Get the Best Offer";
  const popupSub     = banner?.details || "Share your details and our EV expert will find you the best deal â€” no spam, ever.";
  const popupImage   = banner?.image_horizontal || "";
  const popupBgColor = banner?.background_color || "";

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            key="bo-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
            onClick={askLater}
            aria-hidden="true"
          />

          {/* Card */}
          <motion.div
            key="bo-card"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="relative w-full sm:max-w-md pointer-events-auto rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Get Best Offer"
          >
            {/* Keep this outside the media/header layers so it remains tappable in every layout. */}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                askLater();
              }}
              aria-label="Ask me later"
              className="absolute top-3 right-3 z-[80] inline-flex pointer-events-auto items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white/80 cursor-pointer"
            >
              Ask me later
            </button>

            {/* â”€â”€ Header: photo (if set) OR gradient fallback â”€â”€ */}
            {popupImage ? (
              <div
                className="relative h-44 sm:h-52 overflow-hidden"
                style={popupBgColor ? { backgroundColor: popupBgColor } : undefined}
              >
                {/* Photo */}
                <img
                  src={popupImage}
                  alt={popupTitle}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Dark gradient scrim so text is readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Title block over the image */}
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8FE24A]/20 border border-[#8FE24A]/40 mb-2">
                    <Tag className="w-3 h-3 text-[#8FE24A]" />
                    <span className="text-[#8FE24A] text-[10px] font-bold uppercase tracking-widest">
                      Exclusive for you
                    </span>
                  </div>
                  <h2 className="text-white text-xl font-black leading-tight drop-shadow-sm">
                    {popupTitle}
                  </h2>
                  <p className="text-white/80 text-xs mt-1 leading-relaxed line-clamp-2">
                    {popupSub}
                  </p>
                </div>
              </div>
            ) : (
              /* â”€â”€ Gradient fallback header (no photo set) â”€â”€ */
              <div
                className="relative px-6 pt-7 pb-6 overflow-hidden"
                style={
                  popupBgColor
                    ? { background: `linear-gradient(135deg, ${popupBgColor}cc, ${popupBgColor})` }
                    : { background: "linear-gradient(135deg, #0A2A1E, #1F7A4D, #0A2A1E)" }
                }
              >
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[#8FE24A]/20 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#8FE24A] flex items-center justify-center shrink-0 shadow-lg shadow-[#8FE24A]/30">
                    <Gift className="w-6 h-6 text-[#07130E]" />
                  </div>
                  <div>
                    <p className="text-[#8FE24A] text-[11px] font-bold uppercase tracking-widest mb-0.5">
                      Exclusive for you
                    </p>
                    <h2 className="text-white text-xl font-black leading-tight">{popupTitle}</h2>
                    <p className="text-emerald-100/80 text-xs mt-1 leading-relaxed">{popupSub}</p>
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€ Body â”€â”€ */}
            <div className="bg-white px-6 py-5">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-6 gap-3"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-[#1F7A4D]" />
                  </div>
                  <h3 className="text-lg font-black text-[#0A2A1E]">You're all set!</h3>
                  <p className="text-[#526B60] text-sm max-w-xs leading-relaxed">
                    Our expert will reach out with the best offer just for you.
                  </p>
                  <button
                    onClick={dismiss}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#1F7A4D] hover:underline cursor-pointer"
                  >
                    Continue browsing <ChevronRight size={13} />
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#3C5347] uppercase tracking-wider mb-1.5">
                      Your name
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C8377] pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Full name"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D0E2CC] bg-[#F8FAF7] text-sm text-[#0A2A1E] font-medium placeholder:text-[#8CA094] focus:outline-none focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#3C5347] uppercase tracking-wider mb-1.5">
                      Mobile number
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C8377] pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        inputMode="numeric"
                        maxLength={13}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D0E2CC] bg-[#F8FAF7] text-sm text-[#0A2A1E] font-medium placeholder:text-[#8CA094] focus:outline-none focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Pincode */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-[#3C5347] uppercase tracking-wider">
                        Location (Pincode)
                      </label>
                      {locationState === "idle" || locationState === "error" ? (
                        <button type="button" onClick={fetchLocation} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1F7A4D] hover:underline cursor-pointer">
                          <LocateFixed size={11} />
                          {locationState === "error" ? "Retry" : "Auto-detect"}
                        </button>
                      ) : locationState === "fetching" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#6C8377]">
                          <Loader2 size={11} className="animate-spin" /> Detectingâ€¦
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#1F7A4D] font-bold">
                          <CheckCircle2 size={11} /> Detected
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C8377] pointer-events-none" />
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="6-digit PIN code"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D0E2CC] bg-[#F8FAF7] text-sm text-[#0A2A1E] font-medium placeholder:text-[#8CA094] focus:outline-none focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20 focus:bg-white transition-all"
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-[#6C8377] leading-snug">
                      Used to find offers near you. You can edit if auto-detect is wrong.
                    </p>
                  </div>

                  {error && <p className="text-rose-500 text-xs font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-1 flex items-center justify-center gap-2 bg-[#1F7A4D] hover:bg-[#18633e] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-[#1F7A4D]/25 active:scale-[0.98] cursor-pointer"
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Please waitâ€¦</>
                    ) : (
                      <><Gift size={16} /> Get Best Offer</>
                    )}
                  </button>

                  <p className="text-[10px] text-[#8CA094] text-center leading-relaxed">
                    No spam. Your details are only shared with our verified EV experts.
                  </p>

                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
