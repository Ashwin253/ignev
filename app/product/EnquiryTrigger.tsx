"use client";

import { triggerEnquiryModal } from "../components/EnquiryModal";

export default function EnquiryTrigger({ vehicle }: { vehicle: string }) {
  return (
    <button
      onClick={() => triggerEnquiryModal(vehicle)}
      className="flex-1 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors active:scale-95"
    >
      Enquire Now
    </button>
  );
}
