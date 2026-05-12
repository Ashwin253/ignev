"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { MapPin, Tag, Sparkles, Landmark, LayoutGrid, X, Maximize2 } from "lucide-react";

type WPOfferPage = {
  id: string;
  databaseId: number;
  title: string;
  detail: string;
  location: string;
  options: string[];
  image: string;
};

export default function OffersMainUI({ offers }: { offers: WPOfferPage[] }) {
  const [selectedCity, setSelectedCity] = useState("All");
  const [activeToggle, setActiveToggle] = useState<"Bank" | "Brand">("Bank");
  const [selectedOffer, setSelectedOffer] = useState<WPOfferPage | null>(null);

  // Derive filter options
  const cities = useMemo(() => ["All", ...new Set(offers.map(o => o.location).filter(Boolean))], [offers]);

  // Filtered list
  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const matchCity = selectedCity === "All" || o.location === selectedCity;
      const matchType = o.options.includes(activeToggle);
      return matchCity && matchType;
    });
  }, [offers, selectedCity, activeToggle]);

  return (
    <div className="space-y-12">
      {/* Header Section */}
      {/* <div className="text-center space-y-6 pt-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-sky-600 border border-sky-100">
          <Tag size={12} />
          <span>Exclusive Promotions</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900">
          Best <span className="text-sky-600">EV Offers</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed">
          Unlock exclusive bank discounts and brand cashbacks available in your city.
        </p>
      </div> */}

      {/* Simplified Controller Bar */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        {/* Type Toggle */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full max-w-[400px] shadow-inner">
          <button
            onClick={() => setActiveToggle("Bank")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-black transition-all ${activeToggle === "Bank" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            <Landmark size={16} /> Banks
          </button>
          <button
            onClick={() => setActiveToggle("Brand")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-black transition-all ${activeToggle === "Brand" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            <LayoutGrid size={16} /> Brands
          </button>
        </div>

        {/* City Dropdown */}
        <div className="relative w-full max-w-[250px]">
          <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full appearance-none rounded-2xl border-2 border-slate-100 bg-white py-4 pl-12 pr-10 text-sm font-black text-slate-900 outline-none focus:border-sky-500 transition-all cursor-pointer shadow-sm"
          >
            <option value="All">All Cities</option>
            {cities.filter(c => c !== "All").map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>
      </div>

      {/* Pure Image Grid */}
      {filteredOffers.length > 0 ? (
        <div className="grid gap-10 sm:grid-cols-2">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => setSelectedOffer(offer)}
              className="group relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 hover:shadow-sky-500/20 transition-all duration-500 cursor-pointer"
            >
              <div className="relative aspect-video sm:aspect-4/3 lg:aspect-video overflow-hidden">
                {offer.image ? (
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-50 text-slate-200">
                    <Sparkles size={64} />
                  </div>
                )}

                {/* Floating Info Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end bg-linear-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-white text-xl font-black leading-tight drop-shadow-lg mb-3">
                      {offer.detail}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-sky-500 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                        {offer.location}
                      </span>
                      <Maximize2 size={20} className="text-white/80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-pulse rounded-full bg-slate-50 blur-3xl" />
            <Tag size={64} className="relative text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">No {activeToggle} Offers Found</h3>
          <p className="mt-2 text-slate-500 max-w-sm font-medium">Try selecting a different city or switching toggles.</p>
        </div>
      )}

      {/* Offer Modal (Popup) */}
      {selectedOffer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
        >
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            onClick={() => setSelectedOffer(null)}
          />

          <div className="relative w-full max-w-6xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedOffer(null)}
              className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/10 text-slate-900 backdrop-blur-xl hover:bg-black/20 transition-all"
            >
              <X size={24} />
            </button>

            <div className="grid lg:grid-cols-12">
              {/* Large Image */}
              <div className="relative aspect-video lg:aspect-auto lg:col-span-8 bg-slate-100">
                <Image
                  src={selectedOffer.image}
                  alt={selectedOffer.title}
                  fill
                  className="object-contain lg:object-cover"
                />
              </div>

              {/* Details Side */}
              <div className="p-8 md:p-12 lg:col-span-4 flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-sky-600 border border-sky-100">
                    <Tag size={12} />
                    <span>Special Deal</span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                    {selectedOffer.detail}
                  </h2>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border border-slate-100">
                      <MapPin size={16} className="text-sky-500" />
                      <span className="text-sm font-black text-slate-700">{selectedOffer.location}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border border-slate-100">
                      <Landmark size={16} className="text-emerald-500" />
                      <span className="text-sm font-black text-slate-700">{selectedOffer.options.join(" & ")}</span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    This offer is valid for a limited time. Please contact our official sales points or enquire below to claim this deal and get the exact on-road price for your city.
                  </p>

                  <div className="pt-8">
                    <button
                      onClick={() => setSelectedOffer(null)}
                      className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-black text-white hover:bg-sky-600 transition-all shadow-xl shadow-slate-900/20"
                    >
                      Enquire Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-24 rounded-3xl border border-slate-100 bg-slate-50/50 p-8 text-center backdrop-blur-sm max-w-4xl mx-auto">
        <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-widest">
          * Offers are subject to terms and conditions. Valid for a limited period only.
          <span className="block mt-2 font-bold text-sky-600">Please contact our team for exact on-road pricing and active deal verification.</span>
        </p>
      </div>
    </div>
  );
}
