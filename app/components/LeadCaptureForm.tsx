"use client";

import React, { useState } from "react";
import { CheckCircle2, ChevronRight, Sparkles, User, Phone, MapPin, DollarSign, Calendar, ShieldCheck, HeartHandshake, Info, Recycle, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FormType = "sell" | "insurance" | "scrap";

interface LeadCaptureFormProps {
  formType: FormType;
  source: string; // e.g. "Valuation Request", "Insurance Request", "Scrap Request"
  themeColor?: "indigo" | "emerald" | "teal";
}

export default function LeadCaptureForm({
  formType,
  source,
  themeColor = "emerald",
}: LeadCaptureFormProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    // Sell fields
    brand: "",
    model: "",
    year: "",
    kms: "",
    expectedPrice: "",
    batteryHealth: "",
    notes: "",
    // Insurance fields
    vehicleModel: "",
    coverType: "comprehensive",
    // Scrap fields
    condition: "running",
    hasRc: "yes",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    let interest = "";
    let message = "";
    const pincode = formData.city; // City maps to pincode

    if (formType === "sell") {
      interest = `${formData.brand} ${formData.model} (${formData.year})`;
      message = `KMs Driven: ${formData.kms}. Expected Price: ₹${formData.expectedPrice}. Battery Health: ${formData.batteryHealth}%. Notes: ${formData.notes}`;
    } else if (formType === "insurance") {
      interest = formData.vehicleModel;
      message = `Email: ${formData.email}. Preferred Cover: ${formData.coverType}`;
    } else if (formType === "scrap") {
      interest = formData.vehicleModel;
      message = `Running Condition: ${formData.condition}. Has Original RC: ${formData.hasRc}`;
    }

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          pincode: pincode,
          interest: interest,
          message: message,
          source: source,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setSucceeded(true);
      } else {
        setErrorMsg(data.error || "Submission failed. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const colorStyles = {
    indigo: {
      accent: "indigo",
      btn: "bg-indigo-600 hover:bg-indigo-700 focus:border-indigo-500 focus:ring-indigo-500",
      ring: "ring-indigo-100",
      text: "text-indigo-600",
      border: "border-indigo-200",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    emerald: {
      accent: "emerald",
      btn: "bg-emerald-600 hover:bg-emerald-700 focus:border-emerald-500 focus:ring-emerald-500",
      ring: "ring-emerald-100",
      text: "text-emerald-600",
      border: "border-emerald-200",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    teal: {
      accent: "teal",
      btn: "bg-teal-600 hover:bg-teal-700 focus:border-teal-500 focus:ring-teal-500",
      ring: "ring-teal-100",
      text: "text-teal-600",
      border: "border-teal-200",
      badge: "bg-teal-50 text-teal-700 border-teal-100",
    },
  };

  const style = colorStyles[themeColor];

  if (succeeded) {
    return (
      <div className="rounded-3xl border border-zinc-200/60 bg-white/85 backdrop-blur-xl shadow-xl p-8 text-center max-w-xl mx-auto">
        <div className={`w-16 h-16 rounded-full ${style.badge} border flex items-center justify-center mx-auto mb-5`}>
          <CheckCircle2 size={32} className={style.text} />
        </div>
        <h2 className="text-2xl font-extrabold text-zinc-900">Request Submitted Successfully!</h2>
        <p className="text-sm text-zinc-500 mt-3 leading-relaxed">
          Thank you for reaching out. We have logged your request under <strong>{source}</strong>. A support executive will review the details and get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200/60 bg-white/85 backdrop-blur-xl shadow-xl shadow-zinc-200/50 p-6 md:p-8">
      {formType === "sell" && (
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-zinc-100 max-w-md mx-auto">
          {[
            { num: 1, label: "Seller Details" },
            { num: 2, label: "EV Specs" },
            { num: 3, label: "Valuation" },
          ].map((s) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s.num
                      ? `${style.btn.split(" ")[0]} text-white ring-4 ${style.ring}`
                      : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                  }`}
                >
                  {step > s.num ? <CheckCircle2 size={14} /> : s.num}
                </div>
                <span className="text-[10px] font-semibold text-zinc-500 mt-1.5">{s.label}</span>
              </div>
              {s.num < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-4 transition-all duration-300 ${
                    step > s.num ? style.btn.split(" ")[0] : "bg-zinc-100"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {formType === "sell" && (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-zinc-600">Full Name</span>
                    <input
                      required
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-zinc-600">Mobile Number</span>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your mobile number"
                      className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                    />
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold text-zinc-600">City / Location</span>
                  <input
                    required
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your city or location"
                    className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                  />
                </label>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.name || !formData.phone || !formData.city}
                  className={`mt-4 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition flex items-center justify-center gap-1.5 ${style.btn} disabled:opacity-50`}
                >
                  Continue to Vehicle Specs <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-zinc-600">Brand</span>
                    <input
                      required
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="Enter the brand name"
                      className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-zinc-600">Model Name</span>
                    <input
                      required
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="Enter the model name"
                      className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-zinc-600">Year of Purchase</span>
                    <input
                      required
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      placeholder="e.g. 2022"
                      className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-zinc-600">Kilometers Driven</span>
                    <input
                      required
                      type="number"
                      name="kms"
                      value={formData.kms}
                      onChange={handleChange}
                      placeholder="e.g. 15000"
                      className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                    />
                  </label>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 rounded-xl border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.brand || !formData.model || !formData.year || !formData.kms}
                    className={`flex-1 rounded-xl py-3.5 text-sm font-semibold text-white transition flex items-center justify-center gap-1.5 ${style.btn} disabled:opacity-50`}
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-zinc-600">Expected Price (₹)</span>
                    <input
                      required
                      type="number"
                      name="expectedPrice"
                      value={formData.expectedPrice}
                      onChange={handleChange}
                      placeholder="e.g. 850000"
                      className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold text-zinc-600">Battery Health (State of Health %)</span>
                    <input
                      required
                      type="number"
                      name="batteryHealth"
                      value={formData.batteryHealth}
                      onChange={handleChange}
                      placeholder="e.g. 92 (Leave blank if unknown)"
                      className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                    />
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold text-zinc-600">Additional Details (Condition, Accidental History)</span>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe any battery replacements, insurance claims, tyre conditions etc."
                    className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                  />
                </label>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 rounded-xl border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 rounded-xl py-3.5 text-sm font-semibold text-white transition shadow-md ${style.btn} disabled:opacity-50`}
                  >
                    {submitting ? "Submitting Request..." : "Submit Valuation Request"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {formType === "insurance" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">Full Name</span>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">Mobile Number</span>
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">Email Address</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">City of Registration</span>
                <input
                  required
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter your city of registration"
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">EV Model & Make</span>
                <input
                  required
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  placeholder="Enter your EV model and make"
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">Preferred Cover Type</span>
                <select
                  name="coverType"
                  value={formData.coverType}
                  onChange={handleChange}
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition bg-white focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                >
                  <option value="comprehensive">Comprehensive Package (Recommended)</option>
                  <option value="thirdparty">Third-Party Only</option>
                  <option value="addon">Own Damage + Battery Add-On</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`mt-2 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-60 shadow-md ${style.btn}`}
            >
              {submitting ? "Sending details..." : "Get Live Quotes"}
            </button>
          </div>
        )}

        {formType === "scrap" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">Full Name</span>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">Mobile Number</span>
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">Vehicle Model & Year</span>
                <input
                  required
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  placeholder="Enter your vehicle model and year"
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">City / Location</span>
                <input
                  required
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter your city or location"
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">Running Condition</span>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition bg-white focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                >
                  <option value="running">Vehicle is running</option>
                  <option value="accidental">Accidental / Broken</option>
                  <option value="scrap">Scrap / Component parts missing</option>
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-zinc-600">Do you have original RC book?</span>
                <select
                  name="hasRc"
                  value={formData.hasRc}
                  onChange={handleChange}
                  className={`rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition bg-white focus:ring-1 focus:border-${style.accent}-500 focus:ring-${style.accent}-500`}
                >
                  <option value="yes">Yes (Clear Title)</option>
                  <option value="no">No / Lost (Needs verification)</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`mt-2 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-60 shadow-md ${style.btn}`}
            >
              {submitting ? "Sending request..." : "Get Scrap Estimate"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
