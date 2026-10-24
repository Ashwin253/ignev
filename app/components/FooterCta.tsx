"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";
import { btn } from "./ui/kit";

export default function FooterCta() {
  return (
    <div className="-mt-16 mb-4 overflow-hidden rounded-[32px] border border-line bg-gradient-to-br from-brand-soft via-white to-volt-soft p-7 shadow-lift sm:p-10">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-xl">
          <h3 className="text-2xl font-extrabold leading-tight text-ink sm:text-3xl">Ready to go electric? Get the best offer on your EV.</h3>
          <p className="mt-2 text-[15px] text-ink-soft">Tell us what you&apos;re looking for — our experts compare dealers, offers and finance so you don&apos;t have to.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => triggerEnquiryModal("Best EV offer")} className={btn("primary", "lg")}>
            Get best offer <ArrowRight size={18} />
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))} className={btn("outline", "lg")}>
            <Sparkles size={17} className="text-brand" /> Ask Plse AI
          </button>
        </div>
      </div>
    </div>
  );
}
