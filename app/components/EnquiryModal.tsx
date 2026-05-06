'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import EnquiryForm from './EnquiryForm';

export default function EnquiryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalSource, setModalSource] = useState('');

  useEffect(() => {
    const handleOpenModal = (event: any) => {
      setModalSource(event.detail?.source || 'General Enquiry');
      setIsOpen(true);
    };

    window.addEventListener('open-enquiry-modal', handleOpenModal);
    return () => window.removeEventListener('open-enquiry-modal', handleOpenModal);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-[#0a0a0b] border border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden"
          >
            {/* Header */}
            <div className="absolute top-6 right-6 z-20">
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 md:p-12">
              <EnquiryForm 
                source={modalSource} 
                title={`Interested in ${modalSource}?`}
                subtitle="Fill out the form below and our EV experts will get back to you with all the details."
                buttonText="Send Enquiry Now"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Helper function to trigger the modal from anywhere
export const triggerEnquiryModal = (source: string) => {
  const event = new CustomEvent('open-enquiry-modal', { detail: { source } });
  window.dispatchEvent(event);
};
