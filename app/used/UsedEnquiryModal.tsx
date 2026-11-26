"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, Car, Phone, User, Send, Sparkles } from "lucide-react";
import type { UsedVehicle } from "../lib/used-vehicles";
import { formatUsedVehiclePrice } from "../lib/used-vehicles";

interface UsedEnquiryModalProps {
  vehicle: UsedVehicle;
  initialType?: "test_drive" | "enquire";
  isOpen: boolean;
  onClose: () => void;
}

export default function UsedEnquiryModal({
  vehicle,
  initialType = "test_drive",
  isOpen,
  onClose,
}: UsedEnquiryModalProps) {
  const [tab, setTab] = useState<"test_drive" | "enquire">(initialType);
  const [testDriveMode, setTestDriveMode] = useState<"hub" | "home">("hub");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("11:00 AM - 01:00 PM");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/used/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          vehicleTitle: vehicle.title,
          customerName: name,
          customerPhone: phone,
          customerPincode: pincode,
          customerCity: vehicle.city,
          enquiryType: tab,
          testDriveMode: tab === "test_drive" ? testDriveMode : undefined,
          preferredDate: tab === "test_drive" ? date : undefined,
          preferredTime: tab === "test_drive" ? time : undefined,
          message: message,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || "Failed to submit request. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="relative border-b border-slate-100 bg-slate-50/70 p-5 pr-12">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 rounded-full bg-white p-2 text-slate-400 hover:text-slate-700 shadow-xs transition"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <ShieldCheck size={16} />
            <span>{vehicle.source_type === "direct" ? "Evplse Assured Vehicle" : vehicle.source_type === "dealer" ? "Verified Dealer Partner" : "Individual Seller"}</span>
          </div>

          <h3 className="mt-1 text-lg font-extrabold text-slate-900">{vehicle.title}</h3>
          <p className="text-xs font-semibold text-slate-500">
            {formatUsedVehiclePrice(vehicle.price)} • {vehicle.listing_type === "inventory" ? `${vehicle.stock_left} ${vehicle.stock_left === 1 ? "unit" : "units"} left` : `${vehicle.odometer_km.toLocaleString()} km`} • {vehicle.city}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                {tab === "test_drive" ? "Test Drive Requested!" : "Enquiry Received!"}
              </h4>
              <p className="mt-2 text-sm text-slate-600">
                Thank you, <strong>{name}</strong>. Our EV specialist will call you at <strong>{phone}</strong> within 30 minutes to confirm your slot and details.
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left text-xs text-slate-600 border border-slate-200">
                <p className="font-bold text-slate-800">Vehicle location:</p>
                <p className="mt-0.5">{vehicle.seller_location || `${vehicle.seller_name || "Evezy Hub"}, ${vehicle.city}`}</p>
                {vehicle.seller_phone && (
                  <p className="mt-1 text-slate-500">Direct Hub Contact: {vehicle.seller_phone}</p>
                )}
              </div>

              <button
                onClick={onClose}
                className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-black"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tab Switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setTab("test_drive")}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                    tab === "test_drive"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Car size={14} /> Book Test Drive / Visit
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("enquire")}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                    tab === "enquire"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Sparkles size={14} /> Enquire Now
                  </span>
                </button>
              </div>

              {tab === "test_drive" && (
                <div className="space-y-3">
                  {/* Mode selector: Hub vs Home */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Test Drive Preference
                    </label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTestDriveMode("hub")}
                        className={`rounded-xl border p-2.5 text-left text-xs transition ${
                          testDriveMode === "hub"
                            ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold"
                            : "border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-bold">
                          <MapPin size={13} className="text-emerald-700" /> Visit Hub / Dealer
                        </span>
                        <p className="mt-0.5 text-[10px] text-slate-500">Inspect car &amp; 360 test drive</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestDriveMode("home")}
                        className={`rounded-xl border p-2.5 text-left text-xs transition ${
                          testDriveMode === "home"
                            ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold"
                            : "border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-bold">
                          <Car size={13} className="text-emerald-700" /> Doorstep Test Drive
                        </span>
                        <p className="mt-0.5 text-[10px] text-slate-500">We bring car to your address</p>
                      </button>
                    </div>
                  </div>

                  {/* Date & Time Slot */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Preferred Date
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Time Slot
                      </label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
                      >
                        <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                        <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                        <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                        <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                        <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your Full Name</label>
                  <div className="relative mt-1">
                    <User size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Verma"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mobile Phone</label>
                    <div className="relative mt-1">
                      <Phone size={14} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="10-digit number"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pincode</label>
                    <input
                      type="text"
                      placeholder="e.g. 201301"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Questions or Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Can I inspect battery health live or discuss exchange bonus?"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-bold text-rose-600">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700 active:scale-98 disabled:opacity-50"
              >
                {submitting ? (
                  "Sending Request..."
                ) : (
                  <>
                    <Send size={15} />
                    {tab === "test_drive" ? "Confirm Test Drive Booking" : "Send Enquiry"}
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-400">
                🔒 No spam guaranteed. Instant confirmation via SMS &amp; WhatsApp.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
