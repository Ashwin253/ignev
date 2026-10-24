'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Sparkles } from 'lucide-react';
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
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 bg-brand hover:bg-[#18633e] text-white p-4 rounded-full shadow-[0_0_20px_rgba(31,122,77,0.4)] hover:scale-110 transition-transform flex items-center justify-center group cursor-pointer"
        aria-label="Need Help"
      >
        <MessageCircle size={26} />
        <span className="absolute left-full ml-3 bg-white border border-line text-ink font-bold px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Need Help?
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
                    Instant Support
                  </div>
                  <h3 className="text-2xl font-black text-ink">Get Assist</h3>
                  <p className="text-xs text-[#526B60] font-medium mt-0.5">Leave your details and our EV expert will call you back.</p>
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
                  source="Floating Assist"
                  compact={true}
                  includeInterest={true}
                  buttonText="Request Callback"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
