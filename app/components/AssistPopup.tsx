'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
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
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary to-blue-600 text-white p-4 rounded-full shadow-[0_0_20px_rgba(0,123,255,0.5)] hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <MessageCircle size={28} />
        <span className="absolute right-full mr-4 bg-dark/90 backdrop-blur-sm border border-white/10 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Need Help?
        </span>
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
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
              className="relative w-full max-w-lg bg-[#0f1115] border border-white/10 shadow-2xl rounded-[2rem] overflow-hidden z-10"
            >
              <div className="bg-gradient-to-r from-primary/20 to-transparent p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">Get Assist</h3>
                  <p className="text-sm text-gray-400 mt-1">Leave your details and our EV expert will call you back.</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
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
