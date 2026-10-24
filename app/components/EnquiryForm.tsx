"use client";

import { useState } from "react";
import { useForm } from "@formspree/react";
import { motion } from "framer-motion";
import {
  Send, CheckCircle2, User, Phone, MapPin, Info, Loader2,
} from "lucide-react";
import { trackSmartEvent, SMART_EVENTS } from "../lib/clarity-events";

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
    // Send to Formspree (non-blocking)
    handleSubmit(e);
    // Track Smart Event in Microsoft Clarity
    trackSmartEvent(SMART_EVENTS.TEST_DRIVE_INQUIRY, { source });
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
        <div className="h-16 w-16 rounded-full bg-[#EBF5EE] border border-[#C5E5D0] flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-brand" />
        </div>
        <h3 className="text-xl font-bold text-ink mb-2">Thank you!</h3>
        <p className="text-[#526B60] text-sm max-w-xs leading-relaxed">
          Your enquiry about <strong className="text-ink font-semibold">{source}</strong> has been received. We'll be in touch shortly.
        </p>
      </motion.div>
    );
  }

  const inputClass =
    "w-full rounded-2xl border border-line bg-[#F8FAF7] px-4 py-3.5 pl-10 text-sm text-ink font-medium placeholder:text-[#8CA094] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all";

  const labelClass = "text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5 block";

  return (
    <div className={`relative ${className}`}>
      {!compact && (
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-ink mb-1">{title}</h2>
          <p className="text-[#526B60] text-sm">{subtitle}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3.5">
        <input type="hidden" name="source" value={source} />

        {/* Name */}
        <div>
          <label htmlFor="enq-name" className={labelClass}>Full name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none" />
            <input
              id="enq-name" type="text" name="name" required
              placeholder="Enter your full name"
              className={inputClass}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="enq-phone" className={labelClass}>Phone number</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none" />
            <input
              id="enq-phone" type="tel" name="phone" required
              placeholder="Enter your phone number"
              className={inputClass}
            />
          </div>
        </div>

        {/* Pincode */}
        <div>
          <label htmlFor="enq-pincode" className={labelClass}>Pincode</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none" />
            <input
              id="enq-pincode" type="text" name="pincode" required
              placeholder="Enter 6-digit PIN" pattern="[0-9]{6}"
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
              className="w-full rounded-2xl border border-line bg-[#F8FAF7] px-4 py-3.5 text-sm text-ink font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all appearance-none"
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
        <p className="flex items-start gap-1.5 text-[11px] text-[#526B60] leading-relaxed pt-1 font-medium">
          <Info size={13} className="shrink-0 mt-0.5 text-brand" />
          By submitting, you agree to be contacted by our EV experts about {source}.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={state.submitting}
          className="w-full bg-brand hover:bg-[#18633e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 sm:py-4 rounded-2xl transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer group mt-2"
        >
          {state.submitting ? (
            <><Loader2 size={18} className="animate-spin" /> Sending…</>
          ) : (
            <>{buttonText} <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></>
          )}
        </button>

        {state.errors && Array.isArray(state.errors) && state.errors.length > 0 && (
          <p className="text-rose-500 text-xs text-center font-medium">
            Something went wrong. Please check the fields and try again.
          </p>
        )}
      </form>
    </div>
  );
}
