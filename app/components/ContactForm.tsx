'use client';

import React from 'react';
import { motion } from 'framer-motion';
import EnquiryForm from './EnquiryForm';

export default function ContactForm() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-panel p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden border border-white/5"
    >
      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full" />

      <div className="relative z-10">
        <EnquiryForm 
          source="Contact Us Page" 
          title="Get in Touch"
          subtitle="Have a question or want to work together? Drop us a line and our team will get back to you shortly."
          buttonText="Send Message"
        />
      </div>
    </motion.div>
  );
}
