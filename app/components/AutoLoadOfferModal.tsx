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
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#D0E2CC] bg-white p-6 sm:p-8 shadow-2xl text-[#0A2A1E]"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-[#0A2A1E] hover:bg-slate-200 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>

          {succeeded ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF5EE] border border-[#C5E5D0] text-[#1F7A4D]">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#0A2A1E]">Offer Request Logged!</h3>
              <p className="mt-2 text-sm text-[#526B60] leading-relaxed font-medium">
                Thank you! We've registered your query. Our dealer manager will contact you with exclusive prices and cash benefits.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-[#1F7A4D] font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} className="animate-pulse" /> Limited Time Deal
              </div>
              
              <div>
                <h3 className="text-2xl font-black tracking-tight text-[#0A2A1E] flex items-center gap-2">
                  Get Exclusive Offers <Gift size={20} className="text-[#1F7A4D]" />
                </h3>
                <p className="mt-1.5 text-xs text-[#526B60] font-medium leading-relaxed">
                  Register today to unlock special cash discounts, accessories packages, and fast-track delivery options on purchase.
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3 mt-2">
                <label className="block">
                  <span className="text-[11px] font-bold text-[#3C5347] uppercase tracking-wider">Full Name</span>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="mt-1 w-full rounded-2xl border border-[#D0E2CC] bg-[#F8FAF7] px-4 py-3 text-sm text-[#0A2A1E] font-medium placeholder:text-[#8CA094] outline-none focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20 focus:bg-white transition"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-[#3C5347] uppercase tracking-wider">Mobile Number</span>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter mobile number"
                      className="mt-1 w-full rounded-2xl border border-[#D0E2CC] bg-[#F8FAF7] px-4 py-3 text-sm text-[#0A2A1E] font-medium placeholder:text-[#8CA094] outline-none focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20 focus:bg-white transition"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-bold text-[#3C5347] uppercase tracking-wider">City</span>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Enter your city"
                      className="mt-1 w-full rounded-2xl border border-[#D0E2CC] bg-[#F8FAF7] px-4 py-3 text-sm text-[#0A2A1E] font-medium placeholder:text-[#8CA094] outline-none focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/20 focus:bg-white transition"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[#1F7A4D] hover:bg-[#18633e] py-3.5 text-sm font-bold text-white transition shadow-md shadow-[#1F7A4D]/20 cursor-pointer disabled:opacity-50 mt-4"
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
