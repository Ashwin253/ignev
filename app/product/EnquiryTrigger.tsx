"use client";

import { triggerEnquiryModal } from "../components/EnquiryModal";

export default function EnquiryTrigger({ vehicle }: { vehicle: string }) {
  return (
    <button
      onClick={() => triggerEnquiryModal(vehicle)}
      className="flex-1 rounded-full bg-gradient-to-r from-[#a5e6d1] to-[#14a375] px-6 py-3 text-sm font-extrabold text-slate-950 shadow-[0_0_15px_rgba(165,230,209,0.2)] hover:brightness-110 hover:shadow-[0_0_25px_rgba(165,230,209,0.4)] transition-all duration-300 active:scale-95"
    >
      Enquire Now
    </button>
  );
}
