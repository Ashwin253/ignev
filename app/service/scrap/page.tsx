"use client";

import React from "react";
import { ArrowLeft, Leaf, Shield, BadgePercent, Recycle, Info } from "lucide-react";
import Link from "next/link";
import LeadCaptureForm from "../../components/LeadCaptureForm";

export default function ScrapPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_40%),linear-gradient(180deg,#fafafa_0%,#f0fdf4_100%)] text-zinc-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Service Subcategory</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
              Vehicle Scrapping
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-500">
              Scrap your old internal combustion (ICE) or end-of-life EV responsibly. Get government-approved Certificate of Deposit, road tax waivers, and instant scrap value.
            </p>
          </div>
        </div>

        {/* Scrapping Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { title: "Eco-Friendly Recycling", desc: "95% of vehicle materials are recovered and repurposed, reducing environmental impact.", icon: Recycle, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
            { title: "Registration Waiver", desc: "Get zero registration fees on your new EV by presenting your Certificate of Deposit.", icon: BadgePercent, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
            { title: "Fair Scrap Value", desc: "Receive transparent metal-weight valuation and prompt payment on pickup.", icon: Shield, color: "text-amber-700 bg-amber-50 border-amber-100" },
          ].map((benefit, idx) => (
            <div key={idx} className="p-4 border rounded-2xl bg-white/60 backdrop-blur-md flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className={`p-2.5 rounded-xl ${benefit.color} border inline-flex mb-3`}>
                <benefit.icon size={18} />
              </div>
              <h3 className="font-bold text-zinc-800 text-sm">{benefit.title}</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Unified Lead Capture Form */}
        <LeadCaptureForm
          formType="scrap"
          source="Scrap Request"
          themeColor="emerald"
        />

        {/* Scrap Steps */}
        <div className="mt-8 bg-zinc-100 rounded-2xl p-5 border border-zinc-200/60 flex gap-3 text-zinc-600 text-xs sm:text-sm">
          <Info className="text-emerald-600 shrink-0 mt-0.5" size={16} />
          <div>
            <span className="font-bold text-zinc-700">How does the process work?</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-3">
              {[
                { step: "1. Request", desc: "Submit details & get approximate estimate." },
                { step: "2. Inspect", desc: "Free home inspection & document check." },
                { step: "3. Tow", desc: "Vehicle towed to authorized recycling yard." },
                { step: "4. Certificate", desc: "Receive COD certificate and final payment." },
              ].map((s, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-zinc-200">
                  <p className="font-bold text-zinc-800 text-xs">{s.step}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
