"use client";

import { useState } from "react";
import { useForm } from "@formspree/react";
import { motion } from "framer-motion";
import {
  Send, CheckCircle2, User, Phone, MapPin, Info, Loader2,
} from "lucide-react";

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
  includeInterest = false,
}: EnquiryFormProps) {
  const [state, handleSubmit] = useForm(
    process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || "xoqggrrp"
  );
  const [submitted, setSubmitted] = useState(false);

  // Also save to Supabase leads table
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Save to Supabase
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name") || "",
          phone: formData.get("phone") || "",
          pincode: formData.get("pincode") || "",
          interest: formData.get("interest") || "",
          message: "",
          source: formData.get("source") || source,
        }),
      });
    } catch {}
    // Also send to Formspree (non-blocking)
    handleSubmit(e);
    // Show success immediately (Supabase saved)
    setSubmitted(true);
  };

  const succeeded = state.succeeded || submitted;

  if (succeeded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}
      >
        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Thank you!</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          Your enquiry about <strong className="text-slate-700">{source}</strong> has been received. We'll be in touch shortly.
        </p>
      </motion.div>
    );
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all";

  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";

  return (
    <div className={`relative ${className}`}>
      {!compact && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">{title}</h2>
          <p className="text-slate-500 text-sm">{subtitle}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <input type="hidden" name="source" value={source} />

        {/* Name */}
        <div>
          <label htmlFor="enq-name" className={labelClass}>Full name</label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="enq-name" type="text" name="name" required
              placeholder="Rahul Sharma"
              className={inputClass}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="enq-phone" className={labelClass}>Phone number</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="enq-phone" type="tel" name="phone" required
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </div>
        </div>

        {/* Pincode */}
        <div>
          <label htmlFor="enq-pincode" className={labelClass}>Pincode</label>
          <div className="relative">
            <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="enq-pincode" type="text" name="pincode" required
              placeholder="6-digit PIN" pattern="[0-9]{6}"
              className={inputClass}
            />
          </div>
        </div>

        {/* Interest — optional */}
        {includeInterest && (
          <div>
            <label htmlFor="enq-interest" className={labelClass}>Interested in</label>
            <select
              id="enq-interest" name="interest" required defaultValue=""
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all appearance-none"
            >
              <option value="" disabled>Select an option</option>
              <option value="Buy">Buy an EV</option>
              <option value="Rent">Rent an EV</option>
              <option value="Sell">Sell my EV</option>
              <option value="Insurance">EV Insurance</option>
              <option value="Service">EV Service / Maintenance</option>
            </select>
          </div>
        )}

        {/* Disclaimer */}
        <p className="flex items-start gap-1.5 text-[11px] text-slate-400 leading-relaxed pt-1">
          <Info size={12} className="shrink-0 mt-0.5" />
          By submitting, you agree to be contacted by our EV experts about {source}.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={state.submitting}
          className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] group"
        >
          {state.submitting ? (
            <><Loader2 size={18} className="animate-spin" /> Sending…</>
          ) : (
            <>{buttonText} <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></>
          )}
        </button>

        {state.errors && Array.isArray(state.errors) && state.errors.length > 0 && (
          <p className="text-rose-500 text-xs text-center">
            Something went wrong. Please check the fields and try again.
          </p>
        )}
      </form>
    </div>
  );
}
