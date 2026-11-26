"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MapPin, Gauge, BatteryCharging, Zap, RotateCw, Calendar, Sparkles, Car } from "lucide-react";
import type { UsedVehicle } from "../lib/used-vehicles";
import { formatUsedVehiclePrice } from "../lib/used-vehicles";
import UsedEnquiryModal from "./UsedEnquiryModal";

interface UsedVehicleCardProps {
  vehicle: UsedVehicle;
}

export default function UsedVehicleCard({ vehicle }: UsedVehicleCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"test_drive" | "enquire">("test_drive");

  const has360 = Array.isArray(vehicle.images_360) && vehicle.images_360.filter(Boolean).length >= 4;
  const isInventory = vehicle.listing_type === "inventory";
  const mainPhoto = vehicle.photo || (vehicle.gallery_images && vehicle.gallery_images[0]) || "/vehicles/tatanexonev.webp";

  const sourceConfig = {
    direct: {
      label: "Evplse Assured",
      tagline: "200-Point Inspected",
      badgeClass: "bg-emerald-600 text-white",
      borderClass: "border-emerald-200 hover:border-emerald-500",
    },
    dealer: {
      label: "Verified Dealer",
      tagline: vehicle.seller_name || "Certified Partner",
      badgeClass: "bg-blue-600 text-white",
      borderClass: "border-blue-200 hover:border-blue-500",
    },
    customer: {
      label: "Direct Owner",
      tagline: "Verified Individual",
      badgeClass: "bg-purple-600 text-white",
      borderClass: "border-purple-200 hover:border-purple-500",
    },
  }[vehicle.source_type] || {
    label: "Evplse Assured",
    tagline: "Certified EV",
    badgeClass: "bg-emerald-600 text-white",
    borderClass: "border-slate-200 hover:border-slate-400",
  };

  const openAction = (type: "test_drive" | "enquire", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${sourceConfig.borderClass}`}
      >
        <Link href={`/used/${vehicle.slug}`} className="block flex-1">
          {/* Media Container */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
            <Image
              src={mainPhoto}
              alt={vehicle.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />

            {/* Source Badge */}
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-tight shadow-md backdrop-blur-md">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${sourceConfig.badgeClass}`}>
                <ShieldCheck size={12} />
                {sourceConfig.label}
              </span>
            </div>

            {/* 360 Badge */}
            {has360 && (
              <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md backdrop-blur-md">
                <RotateCw size={12} className="animate-spin-slow text-volt" />
                360° View
              </div>
            )}

            {/* City & Hub location pill */}
            <div className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-xs backdrop-blur-xs">
              <MapPin size={11} className="text-emerald-600" />
              <span>{vehicle.city}</span>
              {vehicle.rto ? <span className="text-slate-400">({vehicle.rto})</span> : null}
            </div>
          </div>

          {/* Details Content */}
          <div className="p-4 sm:p-5">
            {/* Title & Variant */}
            <div className="mb-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                {vehicle.brand} • {vehicle.year}
              </p>
              <h3 className="line-clamp-1 text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                {vehicle.title}
              </h3>
            </div>

            {/* Key Specs Pills */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-600">
              {isInventory ? (
                <span className="rounded-md bg-violet-100 px-2 py-1 text-violet-800">{vehicle.stock_left} {vehicle.stock_left === 1 ? "unit" : "units"} left</span>
              ) : <>
                <span className="rounded-md bg-slate-100 px-2 py-1">{vehicle.odometer_km.toLocaleString()} km</span>
                <span className="rounded-md bg-slate-100 px-2 py-1">{vehicle.ownership}</span>
              </>}
              <span className="rounded-md bg-emerald-50 text-emerald-800 px-2 py-1 flex items-center gap-1">
                <Zap size={11} /> Pure EV
              </span>
            </div>

            {/* Battery Health & Range Highlight */}
            {(vehicle.battery_health_percentage || vehicle.real_range_km) && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs">
                {vehicle.battery_health_percentage && (
                  <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                    <BatteryCharging size={14} className="text-emerald-700" />
                    <span>{vehicle.battery_health_percentage}% Health</span>
                  </div>
                )}
                {vehicle.real_range_km && (
                  <div className="text-[11px] font-semibold text-slate-600">
                    ~{vehicle.real_range_km} km real range
                  </div>
                )}
              </div>
            )}

            {/* Pricing Row */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {formatUsedVehiclePrice(vehicle.price)}
                  </div>
                  {vehicle.original_price && vehicle.original_price > vehicle.price && (
                    <div className="text-[11px] text-slate-400 line-through">
                      New: {formatUsedVehiclePrice(vehicle.original_price)}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400">EMI starting</span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                    ₹{(vehicle.emi_starting || Math.round(vehicle.price * 0.0195)).toLocaleString()}/mo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Action Buttons (Test Drive / Enquire) */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/50 p-3">
          <button
            type="button"
            onClick={(e) => openAction("test_drive", e)}
            className="flex items-center justify-center gap-1 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800 active:scale-98"
          >
            <Car size={13} />
            <span>Test Drive / Visit</span>
          </button>

          <button
            type="button"
            onClick={(e) => openAction("enquire", e)}
            className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-98"
          >
            <Sparkles size={13} className="text-emerald-700" />
            <span>Enquire</span>
          </button>
        </div>
      </div>

      <UsedEnquiryModal
        vehicle={vehicle}
        initialType={modalType}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
