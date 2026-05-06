'use client';

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, User, Phone, MapPin, MessageSquare, Info } from 'lucide-react';

interface EnquiryFormProps {
  source: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  className?: string;
  compact?: boolean;
  includeInterest?: boolean;
}

export default function EnquiryForm({
  source,
  title = "Enquire Now",
  subtitle = "Get in touch with our experts to learn more.",
  buttonText = "Send Enquiry",
  className = "",
  compact = false,
  includeInterest = false
}: EnquiryFormProps) {
  const [state, handleSubmit] = useForm(process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || "xoqggrrp");

  if (state.succeeded) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass-panel p-8 rounded-3xl text-center flex flex-col items-center justify-center border border-emerald-500/20 bg-emerald-500/5 ${className}`}
      >
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
        <p className="text-white/60 max-w-xs text-sm">
          Your enquiry regarding <strong>{source}</strong> has been received. Our team will contact you shortly.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-xs font-medium"
        >
          Send another enquiry
        </button>
      </motion.div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!compact && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            {title}
          </h2>
          <p className="text-white/50 text-sm md:text-base">
            {subtitle}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden field for source tracking */}
        <input type="hidden" name="source" value={source} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                <User size={16} />
              </div>
              <input
                id="name"
                type="text"
                name="name"
                required
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
              Phone Number
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                <Phone size={16} />
              </div>
              <input
                id="phone"
                type="tel"
                name="phone"
                required
                placeholder="+91 00000 00000"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
              Email Address (Optional)
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                <Send size={16} />
              </div>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="john@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pincode" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
              Pincode
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                <MapPin size={16} />
              </div>
              <input
                id="pincode"
                type="text"
                name="pincode"
                required
                placeholder="6-digit PIN"
                pattern="[0-9]{6}"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 text-sm"
              />
            </div>
          </div>
        </div>

        {includeInterest && (
          <div className="space-y-1.5">
            <label htmlFor="interest" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
              Interested In
            </label>
            <select
              id="interest"
              name="interest"
              required
              defaultValue=""
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-primary/50 transition-all text-sm appearance-none"
            >
              <option value="" disabled className="bg-slate-900">Select an option</option>
              <option value="Buy" className="bg-slate-900">Buy an EV</option>
              <option value="Rent" className="bg-slate-900">Rent an EV</option>
              <option value="Sell" className="bg-slate-900">Sell my EV</option>
              <option value="Insurance" className="bg-slate-900">EV Insurance</option>
              <option value="Service" className="bg-slate-900">EV Service/Maintenance</option>
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="message" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
            Message
          </label>
          <div className="relative group">
            <div className="absolute top-4 left-4 pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
              <MessageSquare size={16} />
            </div>
            <textarea
              id="message"
              name="message"
              rows={compact ? 2 : 3}
              placeholder={`I'm interested in ${source}...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 px-1 text-[10px] text-white/30 italic">
          <Info size={12} className="shrink-0 mt-0.5" />
          <p>By submitting, you agree to be contacted by our EV experts regarding your interest in {source}.</p>
        </div>

        <button
          type="submit"
          disabled={state.submitting}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
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
              {buttonText}
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </>
          )}
        </button>

        {state.errors && (
          <div className="text-red-400 text-xs text-center mt-2">
            Something went wrong. Please check the fields and try again.
          </div>
        )}
      </form>
    </div>
  );
}
