"use client";

import React from "react";
import { ArrowLeft, ShieldCheck, Sparkles, Info, HeartHandshake } from "lucide-react";
import Link from "next/link";
import LeadCaptureForm from "../../components/LeadCaptureForm";

export default function InsurancePage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_40%),linear-gradient(180deg,#fafafa_0%,#f5f3ff_100%)] text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Service Subcategory</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
              EV Insurance
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-500">
              Protect your electric vehicle with comprehensive, battery-specific covers. Get customized policies with zero depreciation and 24/7 roadside assistance.
            </p>
          </div>
        </div>

        {/* EV Insurances benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { title: "Battery & Motor Cover", desc: "Covers accidental damage, water ingress, and short circuits in battery/motor assembly.", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
            { title: "Zero Depreciation", desc: "No deduction for depreciation on parts replacement in case of claims.", icon: Sparkles, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
            { title: "Charger & Cables Protection", desc: "Protects your home/portable wallbox charger against theft or electrical damage.", icon: HeartHandshake, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
            { title: "24/7 Roadside Assist", desc: "Includes towing to nearest EV charging station if battery drains mid-trip.", icon: Info, color: "text-amber-600 bg-amber-50 border-amber-100" }
          ].map((benefit, idx) => (
            <div key={idx} className={`p-5 border rounded-2xl bg-white/70 backdrop-blur-md flex gap-4 items-start`}>
              <div className={`p-2.5 rounded-xl ${benefit.color} border shrink-0`}>
                <benefit.icon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-800 text-sm">{benefit.title}</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Unified Lead Capture Form */}
        <LeadCaptureForm
          formType="insurance"
          source="Insurance Request"
          themeColor="indigo"
        />

      </div>
    </main>
  );
}
