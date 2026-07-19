"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Sparkles, CheckCircle2, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AutoLoadOfferModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", city: "" });
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check if already shown in this session
    const shown = sessionStorage.getItem("evezy_offer_modal_shown");
    if (shown) return;

    // Show after 5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("evezy_offer_modal_shown", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          pincode: formData.city,
          interest: "Exclusive Offers",
          source: `${pathname} (Exclusive Offer)`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSucceeded(true);
        sessionStorage.setItem("evezy_offer_modal_shown", "true");
        // Auto close after 3 seconds
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
      } else {
        setErrorMsg(data.error || "Failed to submit. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-white"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-zinc-400 hover:bg-white/20 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>

          {succeeded ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-bold">Offer Request Logged!</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Thank you! We've registered your query. Our dealer manager will contact you with exclusive prices and cash benefits.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} className="animate-pulse" /> Limited Time Deal
              </div>
              
              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Get Exclusive Offers <Gift size={20} className="text-emerald-400" />
                </h3>
                <p className="mt-1.5 text-xs text-zinc-400">
                  Register today to unlock special cash discounts, accessories packages, and fast-track delivery options on purchase.
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3.5 mt-2">
                <label className="block">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Full Name</span>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:bg-white/10 transition"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Mobile Number</span>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your mobile number"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:bg-white/10 transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">City</span>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Enter your city"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:bg-white/10 transition"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-bold text-zinc-950 transition cursor-pointer disabled:opacity-50 mt-4"
              >
                {submitting ? "Claiming offer..." : "Unlock Offers"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
