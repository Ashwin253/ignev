"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, BatteryCharging, Zap, MapPin, Gauge, Calendar, Award, Phone,
  CheckCircle2, AlertCircle, Wrench, ChevronDown, ChevronUp, Share2, Heart,
  Calculator, Sparkles, Car, Check, Info, ArrowRight, Clock, User
} from "lucide-react";
import type { UsedVehicle } from "../../lib/used-vehicles";
import { formatUsedVehiclePrice } from "../../lib/used-vehicles";
import UsedVehicleGallery from "../UsedVehicleGallery";
import UsedEnquiryModal from "../UsedEnquiryModal";

interface UsedVehicleDetailsClientProps {
  vehicle: UsedVehicle;
  similarVehicles: UsedVehicle[];
}

export default function UsedVehicleDetailsClient({
  vehicle,
  similarVehicles = [],
}: UsedVehicleDetailsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"test_drive" | "enquire">("test_drive");
  const [activeInspectionTab, setActiveInspectionTab] = useState<number | null>(0);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [loanTenureYears, setLoanTenureYears] = useState<number>(5);
  const [activeVisualCategory, setActiveVisualCategory] = useState<"all" | "outside" | "inside" | "tyres" | "details">("all");
  const [showAllVisuals, setShowAllVisuals] = useState(false);

  const price = vehicle.price || 900000;
  const isInventory = vehicle.listing_type === "inventory";
  const mediaImages = vehicle.media_images || [];
  const visibleVisuals = activeVisualCategory === "all"
    ? mediaImages
    : mediaImages.filter((item) => item.category === activeVisualCategory);
  const downPayment = Math.round((price * downPaymentPercent) / 100);
  const loanAmount = price - downPayment;
  const interestRateAnnual = 0.095; // 9.5% per annum
  const monthlyRate = interestRateAnnual / 12;
  const tenureMonths = loanTenureYears * 12;
  const calculatedEmi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  );

  const savingsVsNew = vehicle.original_price && vehicle.original_price > price
    ? vehicle.original_price - price
    : null;

  const openAction = (type: "test_drive" | "enquire") => {
    setModalType(type);
    setModalOpen(true);
  };

  const sourceConfig = {
    direct: {
      badge: "Evplse Assured",
      tagline: "Inspected & Direct from Evezy Hub",
      badgeClass: "bg-emerald-600 text-white",
      hubNotice: "Parked at verified Evezy Hub with free doorstep test drive option.",
    },
    dealer: {
      badge: "Verified Dealer",
      tagline: vehicle.seller_name || "Verified Dealer Inventory",
      badgeClass: "bg-blue-600 text-white",
      hubNotice: "Available at authorized partner dealership showroom.",
    },
    customer: {
      badge: "Individual Seller",
      tagline: vehicle.seller_name || "Direct Customer Listing",
      badgeClass: "bg-purple-600 text-white",
      hubNotice: "Inspected vehicle listed directly by individual EV owner.",
    },
  }[vehicle.source_type] || {
    badge: "Evplse Assured",
    tagline: "Certified Pre-Owned EV",
    badgeClass: "bg-emerald-600 text-white",
    hubNotice: "Verified electric vehicle.",
  };

  return (
    <div className="space-y-10">
      {/* 2-Column Main Layout: Gallery & Details (Left 1.2fr, Sidebar 0.8fr) */}
      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.85fr]">
        {/* Left Column: Gallery & Core Details */}
        <div className="min-w-0 space-y-8">
          {/* Gallery with 360 & Inside/Outside photos */}
          <UsedVehicleGallery
            title={vehicle.title}
            images360={vehicle.images_360}
            galleryImages={vehicle.gallery_images}
            photo={vehicle.photo}
            mediaImages={vehicle.media_images}
          />

          {/* Quick Overview Badges (Spinny Style) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-4">{isInventory ? "Inventory Overview" : "Vehicle Overview"}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {isInventory && <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3.5"><span className="text-[11px] font-bold uppercase text-violet-500">Stock left</span><p className="mt-0.5 text-sm font-extrabold text-violet-900">{vehicle.stock_left} {vehicle.stock_left === 1 ? "unit" : "units"}</p></div>}
              {!isInventory && <>
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Reg. Year</span>
                <p className="mt-0.5 text-sm font-extrabold text-slate-800">
                  {vehicle.reg_month_year || vehicle.year}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Odometer</span>
                <p className="mt-0.5 text-sm font-extrabold text-slate-800">
                  {vehicle.odometer_km.toLocaleString()} km
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Ownership</span>
                <p className="mt-0.5 text-sm font-extrabold text-slate-800">
                  {vehicle.ownership}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Fuel &amp; Gearbox</span>
                <p className="mt-0.5 text-sm font-extrabold text-emerald-700">
                  Electric (Automatic)
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">RTO / Location</span>
                <p className="mt-0.5 text-sm font-extrabold text-slate-800">
                  {vehicle.rto || vehicle.city} ({vehicle.city})
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Insurance</span>
                <p className="mt-0.5 text-xs font-extrabold text-slate-800 line-clamp-1">
                  {vehicle.insurance_type || "Comprehensive"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Color</span>
                <p className="mt-0.5 text-sm font-extrabold text-slate-800">
                  {vehicle.color || "Factory Finish"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Keys &amp; Title</span>
                <p className="mt-0.5 text-xs font-extrabold text-slate-800">
                  2 Keys • Clean RC
                </p>
              </div>
              </>}
            </div>
          </div>

          {/* EV Performance & Battery State of Health (SoH) */}
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                  <BatteryCharging size={16} className="text-emerald-700" />
                  <span>EV Battery &amp; Motor Health Report</span>
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  Certified Battery State of Health: {vehicle.battery_health_percentage || 94}% SoH
                </h3>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs">
                <ShieldCheck size={14} /> Certified Healthy
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-3.5 border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500">Real Driving Range</span>
                <p className="mt-1 text-lg font-black text-slate-900">
                  ~{vehicle.real_range_km || 220} km
                </p>
                <span className="text-[10px] text-slate-400">Tested full charge</span>
              </div>

              <div className="rounded-2xl bg-white p-3.5 border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500">Battery Pack</span>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {vehicle.battery_capacity_kwh ? `${vehicle.battery_capacity_kwh} kWh` : "Li-ion Pack"}
                </p>
                <span className="text-[10px] text-slate-400">Liquid-cooled IP67</span>
              </div>

              <div className="rounded-2xl bg-white p-3.5 border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500">Fast Charging</span>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {vehicle.fast_charging_minutes || 60} mins
                </p>
                <span className="text-[10px] text-slate-400">10% to 80% DC Fast</span>
              </div>

              <div className="rounded-2xl bg-white p-3.5 border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500">Peak Motor Power</span>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {vehicle.motor_power_ps ? `${vehicle.motor_power_ps} PS` : "Instant Torque"}
                </p>
                <span className="text-[10px] text-slate-400">{vehicle.motor_torque_nm || 245} Nm torque</span>
              </div>
            </div>

            {vehicle.warranty_remaining && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-100/60 px-4 py-2.5 text-xs font-bold text-emerald-950">
                <Award size={16} className="text-emerald-700 shrink-0" />
                <span>{vehicle.warranty_remaining}</span>
              </div>
            )}
          </div>

          {/* Spinny 200-Point Inspection Report */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Quality Assurance</span>
                <h3 className="mt-0.5 text-lg font-extrabold text-slate-900">
                  200-Point Inspection Report ({vehicle.inspection_rating || 4.8} / 5.0)
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
                <CheckCircle2 size={13} className="text-emerald-600" />
                All 6 Major Categories Passed
              </span>
            </div>

            {/* Inspection Category Accordion */}
            <div className="mt-4 divide-y divide-slate-100">
              {vehicle.inspection_summary && vehicle.inspection_summary.length > 0 ? (
                vehicle.inspection_summary.map((item, idx) => (
                  <div key={idx} className="py-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveInspectionTab(activeInspectionTab === idx ? null : idx)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check size={14} />
                        </div>
                        <span className="text-sm font-extrabold text-slate-800">{item.category}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          {item.status}
                        </span>
                        {activeInspectionTab === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {activeInspectionTab === idx && (
                      <div className="mt-2.5 pl-8 text-xs leading-relaxed text-slate-600">
                        <p>{item.notes}</p>
                        {item.rating && (
                          <p className="mt-1 font-bold text-emerald-700">Category Score: {item.rating} / 5.0</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-4 text-xs text-slate-500">
                  All 200 points including battery health, electric powertrain, chassis, suspensions, air conditioning, and electronics have passed our master EV technician checklist.
                </div>
              )}
            </div>
          </div>

          {/* Transparent Imperfections Tracker (Spinny Transparency standard) */}
          {vehicle.imperfections && vehicle.imperfections.length > 0 && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-800">
                <Info size={15} />
                <span>Spinny Transparency Standard: Imperfection Log</span>
              </div>
              <h3 className="mt-1 text-base font-extrabold text-slate-900">
                Known Cosmetic Imperfections ({vehicle.imperfections.length})
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                We believe in 100% upfront honesty. Below are the minor cosmetic items noted during physical inspection:
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {vehicle.imperfections.map((imp, idx) => (
                  <div key={idx} className="rounded-2xl border border-amber-200 bg-white p-3.5 text-xs shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{imp.part}</span>
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                        {imp.type}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">{imp.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Checklist */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900 mb-3">Key Features &amp; Equipment</h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {vehicle.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inside & Outside Photo Inspection Gallery */}
          {mediaImages.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Detailed Visuals</span>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Inside &amp; Outside Inspection Photos ({mediaImages.length})
                  </h3>
                </div>
                <p className="text-xs text-slate-500">Browse photos by area.</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Inspection photo categories">
                {(["all", "outside", "inside", "tyres", "details"] as const).map((category) => {
                  const count = category === "all" ? mediaImages.length : mediaImages.filter((item) => item.category === category).length;
                  if (!count) return null;
                  const label = category === "all" ? "All" : category === "outside" ? "Outside" : category === "inside" ? "Inside" : category === "tyres" ? "Tyres" : "Details";
                  return <button key={category} type="button" role="tab" aria-selected={activeVisualCategory === category} onClick={() => { setActiveVisualCategory(category); setShowAllVisuals(false); }} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${activeVisualCategory === category ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}>{label} ({count})</button>;
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {visibleVisuals.slice(0, showAllVisuals ? undefined : 4).map((item, idx) => (
                  <div key={`${item.url}-${idx}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5 transition hover:bg-white hover:shadow-md">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-200">
                      <img src={item.url} alt={`${item.category} inspection photo`} className="h-full w-full object-cover transition duration-300 group-hover:scale-103" />
                      <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs ${
                        item.category === "inside"
                          ? "bg-indigo-600"
                          : item.category === "outside"
                          ? "bg-emerald-700"
                          : item.category === "tyres"
                          ? "bg-amber-600"
                          : "bg-slate-700"
                      }`}>
                        {item.category === "inside" ? "Inside (Interior)" : item.category === "outside" ? "Outside (Exterior)" : item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {visibleVisuals.length > 4 && (
                <button type="button" onClick={() => setShowAllVisuals((current) => !current)} className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100">
                  {showAllVisuals ? "Show less" : `View ${visibleVisuals.length - 4} more`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Sticky Sidebar: Pricing, Hub & CTAs */}
        <div className="min-w-0 space-y-6">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            {/* Source Tag */}
            <div className="mb-3 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold shadow-2xs ${sourceConfig.badgeClass}`}>
                <ShieldCheck size={13} />
                {sourceConfig.badge}
              </span>

              <span className="text-xs font-bold text-slate-500">
                ID: {vehicle.slug.slice(-8)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-slate-900">{vehicle.title}</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {isInventory ? `${vehicle.stock_left} ${vehicle.stock_left === 1 ? "unit" : "units"} currently available • ${vehicle.city}` : `${vehicle.odometer_km.toLocaleString()} km • ${vehicle.ownership} • ${vehicle.city}`}
            </p>

            {/* Price Row */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <span className="text-xs font-bold uppercase text-slate-400">Special Offer Price</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {formatUsedVehiclePrice(vehicle.price)}
                </span>
                {vehicle.original_price && vehicle.original_price > vehicle.price && (
                  <span className="text-sm font-bold text-slate-400 line-through">
                    New: {formatUsedVehiclePrice(vehicle.original_price)}
                  </span>
                )}
              </div>

              {savingsVsNew && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  <Sparkles size={12} /> You save {formatUsedVehiclePrice(savingsVsNew)} vs buying new!
                </div>
              )}
            </div>

            {/* Primary Action Buttons (Test Drive / Visit & Enquire) */}
            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => openAction("test_drive")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700 active:scale-98"
              >
                <Car size={18} />
                <span>Book Test Drive / Visit</span>
              </button>

              <button
                type="button"
                onClick={() => openAction("enquire")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50 active:scale-98"
              >
                <Sparkles size={16} className="text-emerald-700" />
                <span>Enquire Now</span>
              </button>
            </div>

            {/* Hub Location Details */}
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-900">{vehicle.seller_name || "Evplse Assured Hub"}</p>
                  <p className="mt-0.5 text-slate-600">{vehicle.seller_location || `Sector 4 Hub, ${vehicle.city}`}</p>
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                    ✓ Open 7 days a week: 10:00 AM - 08:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive EMI Calculator Widget */}
            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Calculator size={14} className="text-emerald-700" /> EMI Calculator
                </span>
                <span className="text-emerald-700 font-extrabold">₹{calculatedEmi.toLocaleString()} / month</span>
              </div>

              <div className="mt-3 space-y-2 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Down Payment ({downPaymentPercent}%):</span>
                  <span className="font-bold text-slate-700">₹{downPayment.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />

                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Loan Tenure ({loanTenureYears} Years):</span>
                  <span className="font-bold text-slate-700">{loanTenureYears * 12} Months</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  step={1}
                  value={loanTenureYears}
                  onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>5-Day Money Back Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>1-Year Free Pan-India Roadside Assistance</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>Guaranteed Free RC Transfer &amp; Documentation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Certified EVs Carousel */}
      {similarVehicles.length > 0 && (
        <div className="border-t border-slate-200/80 pt-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">More Options</span>
              <h3 className="text-2xl font-extrabold text-slate-900">Similar Used Electric Vehicles</h3>
            </div>
            <Link
              href="/used"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <span>View All Used EVs</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similarVehicles.slice(0, 3).map((v) => (
              <div key={v.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <Link href={`/used/${v.slug}`} className="block">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={v.photo || "/vehicles/tatanexonev.webp"}
                      alt={v.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h4 className="mt-3 font-extrabold text-slate-900 line-clamp-1">{v.title}</h4>
                  <p className="text-xs text-slate-500">{v.odometer_km.toLocaleString()} km • {v.city}</p>
                  <p className="mt-2 text-base font-black text-emerald-700">{formatUsedVehiclePrice(v.price)}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking / Enquiry Modal */}
      <UsedEnquiryModal
        vehicle={vehicle}
        initialType={modalType}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
