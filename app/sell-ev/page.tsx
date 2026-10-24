"use client";

import React from "react";
import { ArrowLeft, Sparkles, DollarSign, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import LeadCaptureForm from "../components/LeadCaptureForm";
import AutoLoadOfferModal from "../components/AutoLoadOfferModal";

export default function SellEvPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_40%),linear-gradient(180deg,#fafafa_0%,#f4fbf7_100%)] text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Buy/Sell Subcategory</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
              Sell Your Electric Vehicle
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-500">
              Get the best price for your pre-owned EV. Fill out the details below and our team will get back to you with an instant valuation.
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { title: "Best Valuation", desc: "Get highly competitive offers based on real-time market data.", icon: DollarSign, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            { title: "Instant Approval", desc: "Get your vehicle inspected and approved within 24 hours.", icon: Sparkles, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            { title: "Hassle-Free Transfer", desc: "We take care of all RC transfer paperwork and registration.", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          ].map((item, idx) => (
            <div key={idx} className={`p-4 border rounded-2xl ${item.color} flex flex-col items-center sm:items-start text-center sm:text-left`}>
              <div className="p-2.5 rounded-xl bg-white shadow-sm inline-flex mb-3">
                <item.icon size={18} />
              </div>
              <h3 className="font-bold text-sm text-zinc-800">{item.title}</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Unified Multi-step Lead Capture Form */}
        <LeadCaptureForm
          formType="sell"
          source="Valuation Request"
          themeColor="emerald"
        />

      </div>
      <AutoLoadOfferModal />
    </main>
  );
}
