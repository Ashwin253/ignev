'use client';

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactForm() {
  const [state, handleSubmit] = useForm(process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || "xoqggrrp");

  if (state.succeeded) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px] border border-secondary/20"
      >
        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-secondary" />
        </div>
        <h3 className="text-3xl font-bold mb-2">Message Sent!</h3>
        <p className="text-white/60 max-w-xs">
          Thanks for reaching out. Our team will get back to you shortly.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-panel p-8 md:p-10 rounded-3xl relative overflow-hidden"
    >
      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 blur-[100px] rounded-full" />

      <div className="relative z-10">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          Get in <span className="text-gradient">Touch</span>
        </h2>
        <p className="text-white/50 mb-8">
          Have a question or want to work together? Drop us a line.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="full-name" className="text-sm font-medium text-white/70 ml-1">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                name="name"
                required
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
              />
              <ValidationError prefix="Name" field="name" errors={state.errors} className="text-red-400 text-xs mt-1 ml-1" />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white/70 ml-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                placeholder="john@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
              />
              <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-400 text-xs mt-1 ml-1" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium text-white/70 ml-1">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              name="subject"
              required
              placeholder="How can we help?"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-white/70 ml-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Tell us more about your project..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20 resize-none"
            />
            <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-400 text-xs mt-1 ml-1" />
          </div>

          <button
            type="submit"
            disabled={state.submitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-primary/20"
          >
            {state.submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              <>
                Send Message
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </button>

          {state.errors && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 mt-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">
                Something went wrong. Please check the form and try again.
              </p>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
