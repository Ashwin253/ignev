"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import EnquiryForm from "./EnquiryForm";

export default function EnquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState("General Enquiry");

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ source?: string }>).detail;
      setSource(detail?.source || "General Enquiry");
      setIsOpen(true);
    };
    window.addEventListener("open-enquiry-modal", handler);
    return () => window.removeEventListener("open-enquiry-modal", handler);
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet / Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full sm:max-w-lg bg-white text-ink sm:rounded-3xl rounded-t-3xl shadow-2xl border border-line overflow-hidden max-h-[92vh] flex flex-col z-10"
          >
            {/* Drag handle — mobile only */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0 bg-white">
              <div className="w-10 h-1.5 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-4 pb-4 sm:pt-6 shrink-0 border-b border-line bg-gradient-to-b from-paper to-white">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  EV Assistant
                </div>
                <h2 className="text-xl font-extrabold text-ink leading-tight">
                  Interested in {source}?
                </h2>
                <p className="text-xs text-[#526B60] mt-1 font-medium">
                  Leave your details and our EV experts will get back to you shortly.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-4 shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-ink hover:text-black transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 bg-white text-ink">
              <EnquiryForm
                source={source}
                compact
                buttonText="Send Enquiry"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Helper to trigger from anywhere
export const triggerEnquiryModal = (source: string) => {
  window.dispatchEvent(new CustomEvent("open-enquiry-modal", { detail: { source } }));
};
