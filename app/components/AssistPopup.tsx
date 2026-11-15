'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, IndianRupee, ArrowRight } from 'lucide-react';
import EnquiryForm from './EnquiryForm';

export default function AssistPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-assist', handleOpen);
    return () => window.removeEventListener('open-assist', handleOpen);
  }, []);

  return (
    <>
      {/* Floating EV loan lead card */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 hidden w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-emerald-200 bg-white p-4 text-left shadow-[0_8px_32px_rgba(15,60,40,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(15,60,40,0.25)] sm:block"
        aria-label="Register for EV loan assistance"
      >
        <span className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
            <IndianRupee size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold leading-snug text-ink">EV loan assistance</span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-soft">Explore loan approval options with competitive interest rates.</span>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">
              Register Now <ArrowRight size={14} />
            </span>
          </span>
        </span>
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-line text-ink shadow-2xl rounded-3xl overflow-hidden z-10"
            >
              <div className="bg-gradient-to-b from-paper to-white p-6 border-b border-line flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    EV Loan Assistance
                  </div>
                  <h3 className="text-2xl font-black text-ink">Find your EV loan</h3>
                  <p className="text-xs text-[#526B60] font-medium mt-0.5">Share your details and our team will help you explore financing options.</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-ink hover:text-black transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 bg-white">
                <EnquiryForm 
                  source="EV Loan Assistance"
                  compact={true}
                  buttonText="Register Now"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
