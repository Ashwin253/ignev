"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, ArrowLeft, ArrowRight, Car, Bike, Truck, HelpCircle, 
  MapPin, CheckCircle2, Phone, User, Mail, ShieldAlert, Zap,
  Check, Play, Loader2, Briefcase, Eye
} from "lucide-react";
import Link from "next/link";
import { useFeedback } from "../context/FeedbackContext";
import { playClickSound, playHaptic } from "../lib/feedback";

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  type: string;
  photo: string;
  slug: string;
  pricing: string;
  minPrice: number;
  maxPrice: number;
  drivingRange: number;
  chargeTime: number;
  commercial: boolean;
}

interface ForYouClientProps {
  initialVehicles: Vehicle[];
}

type Step = 
  | "welcome"
  | "type"
  | "commute"
  | "parking"
  | "budget"
  | "location"
  | "loan"
  | "loan_details"
  | "loading"
  | "results"
  | "success";

export default function ForYouClient({ initialVehicles }: ForYouClientProps) {
  const { soundEnabled, hapticsEnabled } = useFeedback();
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  
  // Questionnaire responses state
  const [answers, setAnswers] = useState({
    usageType: "" as "personal" | "commercial" | "any" | "",
    vehicleType: "" as "car" | "scooter" | "auto" | "any" | "",
    commute: "" as "short" | "medium" | "long" | "",
    parking: "" as "ground_floor" | "apartment" | "workplace" | "",
    budget: "", // low, medium, high, premium
    location: "", // Delhi, Maharashtra, Karnataka, Tamil Nadu, Other
    loanNeeded: "" as "yes" | "no" | "",
    maxEmi: "", // low, medium, high, very_high
    downPayment: "", // low, medium, high, very_high
  });

  const [customLocation, setCustomLocation] = useState("");

  // Contact form state
  const [contact, setContact] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    if (soundEnabled) playClickSound();
    if (hapticsEnabled) playHaptic("click");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let closestState = "Other State";
        let minDistance = Infinity;

        const stateCoords = [
          { name: "Delhi", lat: 28.6139, lon: 77.2090 },
          { name: "Maharashtra", lat: 18.9750, lon: 72.8258 },
          { name: "Karnataka", lat: 12.9716, lon: 77.5946 },
          { name: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
        ];

        stateCoords.forEach((state) => {
          const dist = Math.sqrt(Math.pow(latitude - state.lat, 2) + Math.pow(longitude - state.lon, 2));
          if (dist < minDistance) {
            minDistance = dist;
            closestState = state.name;
          }
        });

        if (minDistance < 15) {
          handleSelect("location", closestState);
        } else {
          handleSelect("location", "Other State");
        }
        setDetectingLocation(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setDetectingLocation(false);
        alert("Unable to retrieve location. Please choose manually.");
      },
      { timeout: 8000 }
    );
  };

  const handleSelect = (key: string, value: any) => {
    if (soundEnabled) playClickSound();
    if (hapticsEnabled) playHaptic("click");
    
    // Clear vehicleType if usageType changes to avoid invalid filters
    if (key === "usageType") {
      setAnswers(prev => ({ ...prev, usageType: value, vehicleType: "" }));
    } else {
      setAnswers(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleBtnClick = () => {
    if (soundEnabled) playClickSound();
    if (hapticsEnabled) playHaptic("click");
  };

  // Filter vehicles based on selections made so far
  const filteredVehicles = useMemo(() => {
    return initialVehicles.filter(v => {
      // 0. Usage Type Filter
      if (answers.usageType && answers.usageType !== "any") {
        if (answers.usageType === "commercial" && !v.commercial) return false;
        if (answers.usageType === "personal" && v.commercial) return false;
      }

      // 1. Vehicle Type Filter
      if (answers.vehicleType && answers.vehicleType !== "any") {
        const typeLower = v.type.toLowerCase();
        if (answers.vehicleType === "car" && !["car", "suv", "sedan", "hatchback", "crossover", "mpv"].some(k => typeLower.includes(k))) return false;
        if (answers.vehicleType === "scooter" && !["scooter", "bike", "motorcycle", "two", "2 wheel", "moped"].some(k => typeLower.includes(k))) return false;
        if (answers.vehicleType === "auto" && !["auto", "rickshaw", "three", "3 wheel", "cargo", "loader", "tempo", "commercial"].some(k => typeLower.includes(k))) return false;
      }

      // 2. Daily Travel & Range Filter (drivingRange is in km)
      if (answers.commute) {
        if (answers.commute === "medium" && v.drivingRange > 0 && v.drivingRange < 80) return false;
        if (answers.commute === "long" && v.drivingRange > 0 && v.drivingRange < 150) return false;
      }

      // 3. Budget Filter (minPrice/maxPrice are in Lakhs)
      if (answers.budget && (answers.vehicleType || answers.usageType)) {
        const budget = answers.budget;
        const min = v.minPrice;
        const max = v.maxPrice;
        const activeType = answers.vehicleType || (answers.usageType === "commercial" ? "auto" : "any");

        if (activeType === "scooter") {
          if (budget === "low" && min > 1.2) return false;
          if (budget === "medium" && (min > 1.5 || (max > 0 && max < 1.2))) return false;
          if (budget === "high" && max > 0 && max < 1.5) return false;
        } else if (activeType === "car") {
          if (budget === "low" && min > 12) return false;
          if (budget === "medium" && (min > 20 || (max > 0 && max < 12))) return false;
          if (budget === "high" && (min > 40 || (max > 0 && max < 20))) return false;
          if (budget === "premium" && max > 0 && max < 40) return false;
        } else if (activeType === "auto") {
          if (budget === "low" && min > 3) return false;
          if (budget === "medium" && (min > 4.5 || (max > 0 && max < 3))) return false;
          if (budget === "high" && max > 0 && max < 4.5) return false;
        } else {
          // Any/Not Sure
          if (budget === "low" && min > 5) return false;
          if (budget === "medium" && (min > 15 || (max > 0 && max < 5))) return false;
          if (budget === "high" && max > 0 && max < 15) return false;
        }
      }

      return true;
    });
  }, [answers, initialVehicles]);

  // Calculate scaled display matches count: 50 baseline for personal (30 for cars, 20 for scooters), 20 for commercial (15 for autos), 70 for general
  const displayCount = useMemo(() => {
    // 1. Establish the starting baseline based on Usage and Vehicle Type
    let baseline = 70;
    if (answers.usageType === "personal") {
      if (answers.vehicleType === "car") {
        baseline = 30;
      } else if (answers.vehicleType === "scooter") {
        baseline = 20;
      } else {
        baseline = 50;
      }
    } else if (answers.usageType === "commercial") {
      if (answers.vehicleType === "auto") {
        baseline = 15;
      } else {
        baseline = 20;
      }
    }

    // 2. Apply step-down reduction factors based on downstream questions answered
    let factor = 1.0;

    // Commute filter
    if (answers.commute) {
      if (answers.commute === "long") factor *= 0.7; // Long commutes are highly selective
      else factor *= 0.88;
    }

    // Parking filter
    if (answers.parking) {
      if (answers.parking === "apartment") factor *= 0.75; // Lack of charging drops matches
      else factor *= 0.92;
    }

    // Budget filter
    if (answers.budget) {
      if (answers.budget === "low") factor *= 0.45; // Low budgets restrict matches heavily
      else if (answers.budget === "premium") factor *= 0.55; // Premium options are also selective
      else factor *= 0.78;
    }

    // Location filter
    if (answers.location) {
      if (answers.location === "Other State") factor *= 0.8;
      else factor *= 0.95;
    }

    // Loan filters
    if (answers.loanNeeded === "yes") {
      factor *= 0.9;
      if (answers.maxEmi === "low") factor *= 0.6;
      if (answers.downPayment === "low") factor *= 0.8;
    }

    // Calculate final count, making sure it goes down but stays >= 1
    const finalCount = Math.round(baseline * factor);
    return Math.max(1, Math.min(baseline, finalCount));
  }, [
    answers.usageType,
    answers.vehicleType,
    answers.commute,
    answers.parking,
    answers.budget,
    answers.location,
    answers.loanNeeded,
    answers.maxEmi,
    answers.downPayment
  ]);

  // Handle questionnaire step routing
  const nextStep = () => {
    handleBtnClick();
    if (currentStep === "welcome") setCurrentStep("type");
    else if (currentStep === "type") setCurrentStep("commute");
    else if (currentStep === "commute") setCurrentStep("parking");
    else if (currentStep === "parking") setCurrentStep("budget");
    else if (currentStep === "budget") setCurrentStep("location");
    else if (currentStep === "location") setCurrentStep("loan");
    else if (currentStep === "loan") {
      if (answers.loanNeeded === "yes") setCurrentStep("loan_details");
      else triggerLoadingTransition();
    } else if (currentStep === "loan_details") {
      triggerLoadingTransition();
    }
  };

  const prevStep = () => {
    handleBtnClick();
    if (currentStep === "type") setCurrentStep("welcome");
    else if (currentStep === "commute") setCurrentStep("type");
    else if (currentStep === "parking") setCurrentStep("commute");
    else if (currentStep === "budget") setCurrentStep("parking");
    else if (currentStep === "location") setCurrentStep("budget");
    else if (currentStep === "loan") setCurrentStep("location");
    else if (currentStep === "loan_details") setCurrentStep("loan");
  };

  const triggerLoadingTransition = () => {
    setCurrentStep("loading");
    setTimeout(() => {
      setCurrentStep("results");
    }, 2500); // 2.5 seconds loading state
  };

  // Submit Lead Form
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    handleBtnClick();
    
    if (!contact.name || !contact.phone || !contact.email) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    const finalLocation = answers.location === "Other State" ? customLocation : answers.location;

    // Create a detailed message summary of their requirements
    const answersSummary = `Usage: ${answers.usageType.toUpperCase()} | Vehicle Type: ${answers.vehicleType.toUpperCase()} | Commute: ${answers.commute.toUpperCase()} | Parking: ${answers.parking.toUpperCase()} | Budget Range: ${answers.budget.toUpperCase()} | Location: ${finalLocation} | Loan Needed: ${answers.loanNeeded.toUpperCase()}${answers.loanNeeded === "yes" ? ` (Max EMI: ${answers.maxEmi}, Down Payment: ${answers.downPayment})` : ""} | Match Count: ${displayCount}`;

    try {
      // 1. Submit to local lead endpoint (Saves to Supabase leads table)
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          phone: contact.phone,
          pincode: finalLocation, // Store state/location here
          interest: answers.vehicleType ? `${answers.vehicleType.toUpperCase()} recommendation` : "EV Recommendation",
          message: answersSummary,
          source: "/foryou Recommendation",
        }),
      });

      // 2. Submit to Formspree non-blocking (similar to EnquiryForm)
      try {
        await fetch("https://formspree.io/f/xoqggrrp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            message: answersSummary,
            source: "/foryou Recommendation",
          })
        });
      } catch (err) {
        console.warn("Formspree backup submit failed:", err);
      }

      if (res.ok) {
        setCurrentStep("success");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } catch (err) {
      setFormError("Connection error. Please check your internet and try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Determine current step index for the progress bar
  const getStepProgress = () => {
    const steps: Step[] = ["type", "commute", "parking", "budget", "location", "loan", "loan_details"];
    const activeSteps = answers.loanNeeded === "yes" 
      ? steps 
      : steps.filter(s => s !== "loan_details");
    
    const currentIndex = activeSteps.indexOf(currentStep);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / activeSteps.length) * 100;
  };

  // Directional anim states
  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 }
  };

  return (
    <section className="min-h-screen bg-slate-50 text-slate-800 py-24 sm:py-32 relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Step Indicator Header (Hide during welcome, loading, results, success) */}
        {!["welcome", "loading", "results", "success"].includes(currentStep) && (
          <div className="mb-8 space-y-4">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span>Recommendation Wizard</span>
              <span className="text-violet-600">Step {
                answers.loanNeeded === "yes"
                  ? ["type", "commute", "parking", "budget", "location", "loan", "loan_details"].indexOf(currentStep) + 1
                  : ["type", "commute", "parking", "budget", "location", "loan"].indexOf(currentStep) + 1
              } of {answers.loanNeeded === "yes" ? 7 : 6}</span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden border border-slate-350/10">
              <motion.div 
                className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getStepProgress()}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── STEP 0: WELCOME SCREEN ── */}
          {currentStep === "welcome" && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-12 backdrop-blur-xl shadow-xl shadow-slate-100 text-center space-y-8"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles size={30} className="text-white" />
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                  Find Your Perfect <br/>
                  <span className="bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">EV & Loan Match</span>
                </h1>
                <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  Answer a few simple questions about your commute, parking space, and budget. Our matchmaking engine will sort matches instantly.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={nextStep}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-8 py-4 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-600/25 cursor-pointer"
                >
                  Get Started
                  <Play size={14} className="fill-white text-white" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: USAGE & VEHICLE TYPE (STACKED) ── */}
          {currentStep === "type" && (
            <motion.div
              key="type"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-xl shadow-slate-100 space-y-6"
            >
              {/* Question 1: Usage Type */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                  1. How do you plan to use this electric vehicle?
                </h3>
                <div className="grid gap-2 grid-cols-3">
                  {[
                    { id: "personal", label: "Personal", icon: User },
                    { id: "commercial", label: "Commercial", icon: Briefcase },
                    { id: "any", label: "Show All", icon: Eye }
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = answers.usageType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelect("usageType", opt.id)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? "bg-violet-50/80 border-violet-500 text-slate-900 shadow-sm"
                            : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100/50"
                        }`}
                      >
                        <Icon size={16} className={isSelected ? "text-violet-600" : "text-slate-400"} />
                        <span className="font-bold text-xs mt-1.5">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 2: Vehicle Type (only shows/activates if usageType is selected) */}
              {answers.usageType && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 border-t border-slate-100 pt-5"
                >
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                    2. What kind of electric vehicle are you looking for?
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {answers.usageType === "personal" ? (
                      <>
                        {[
                          { id: "car", label: "Electric Car", icon: Car, desc: "Premium SUVs & Sedans" },
                          { id: "scooter", label: "Electric Scooter / Bike", icon: Bike, desc: "For city commutes" },
                          { id: "any", label: "Show Both", icon: HelpCircle, desc: "Cars and scooters" }
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = answers.vehicleType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelect("vehicleType", opt.id)}
                              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                                isSelected 
                                  ? "bg-violet-50/50 border-violet-500 text-slate-955 shadow-sm"
                                  : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50"
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isSelected ? "bg-violet-600 text-white" : "bg-slate-200/80 text-slate-500"}`}>
                                <Icon size={16} />
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900">{opt.label}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    ) : answers.usageType === "commercial" ? (
                      <>
                        {[
                          { id: "auto", label: "Electric Auto / Rickshaw", icon: Truck, desc: "Passenger & cargo loaders" },
                          { id: "any", label: "Show All Commercial", icon: HelpCircle, desc: "All commercial cargo & loaders" }
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = answers.vehicleType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelect("vehicleType", opt.id)}
                              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                                isSelected 
                                  ? "bg-violet-50/50 border-violet-500 text-slate-955 shadow-sm"
                                  : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50"
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isSelected ? "bg-violet-600 text-white" : "bg-slate-200/80 text-slate-500"}`}>
                                <Icon size={16} />
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900">{opt.label}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {[
                          { id: "car", label: "Electric Car", icon: Car, desc: "SUVs & Sedans" },
                          { id: "scooter", label: "Electric Scooter / Bike", icon: Bike, desc: "Two-wheeler commutes" },
                          { id: "auto", label: "Electric Auto / Rickshaw", icon: Truck, desc: "Passenger & cargo loaders" },
                          { id: "any", label: "Any / Help decide", icon: HelpCircle, desc: "All vehicle types" }
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = answers.vehicleType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelect("vehicleType", opt.id)}
                              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                                isSelected 
                                  ? "bg-violet-50/50 border-violet-500 text-slate-955 shadow-sm"
                                  : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50"
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isSelected ? "bg-violet-600 text-white" : "bg-slate-200/80 text-slate-500"}`}>
                                <Icon size={16} />
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900">{opt.label}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-between pt-4 gap-3 border-t border-slate-100">
                <button onClick={prevStep} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-955 px-4 py-2 cursor-pointer">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100/85 px-2.5 py-1 rounded-full border border-slate-200/50 whitespace-nowrap">
                    Found <strong className="text-violet-600 font-extrabold">{displayCount}</strong> vehicles
                  </span>
                </div>
                <button
                  onClick={nextStep}
                  disabled={!answers.usageType || !answers.vehicleType}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6 py-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: COMMUTE / TRAVELS A LOT ── */}
          {currentStep === "commute" && (
            <motion.div
              key="commute"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-xl shadow-slate-100 space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
                  How far do you travel on a typical day?
                </h2>
                <p className="text-xs text-slate-500">This helps calculate your minimum battery range requirement.</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: "short", label: "Short Commutes (< 30 km / day)", desc: "Quick grocery runs, short work routes. Lower battery range is fine." },
                  { id: "medium", label: "Moderate Commutes (30 - 80 km / day)", desc: "Daily office commutes, occasional city trips. Medium battery range recommended." },
                  { id: "long", label: "Long Distance / Travels A Lot (80+ km / day)", desc: "Frequent highway trips or high daily running. High capacity range & fast charging needed." }
                ].map((opt) => {
                  const isSelected = answers.commute === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect("commute", opt.id)}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isSelected 
                          ? "bg-violet-50/50 border-violet-500 text-slate-950 shadow-md shadow-violet-500/5"
                          : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{opt.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${isSelected ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>
                        {isSelected && <Check size={12} className="stroke-[3px]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 gap-3">
                <button onClick={prevStep} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-955 px-4 py-2 cursor-pointer">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100/85 px-2.5 py-1 rounded-full border border-slate-200/50 whitespace-nowrap">
                    Found <strong className="text-violet-600 font-extrabold">{displayCount}</strong> vehicles
                  </span>
                </div>
                <button
                  onClick={nextStep}
                  disabled={!answers.commute}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6 py-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: PARKING & CHARGING ACCESS ── */}
          {currentStep === "parking" && (
            <motion.div
              key="parking"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-xl shadow-slate-100 space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
                  Where do you plan to park and charge your vehicle?
                </h2>
                <p className="text-xs text-slate-500">Your charging environment affects daily convenience.</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: "ground_floor", label: "Ground Floor / Private Garage", desc: "Easy access to power. Perfect for standard home charging setup." },
                  { id: "apartment", label: "Apartment / Upper Floor", desc: "No personal charger. Will rely on public charging hubs or detachable batteries." },
                  { id: "workplace", label: "Workplace / Commercial Hub", desc: "Can easily plug-in and charge during daytime business hours." }
                ].map((opt) => {
                  const isSelected = answers.parking === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect("parking", opt.id)}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isSelected 
                          ? "bg-violet-50/50 border-violet-500 text-slate-950 shadow-md shadow-violet-500/5"
                          : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{opt.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${isSelected ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>
                        {isSelected && <Check size={12} className="stroke-[3px]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 gap-3">
                <button onClick={prevStep} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-955 px-4 py-2 cursor-pointer">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100/85 px-2.5 py-1 rounded-full border border-slate-200/50 whitespace-nowrap">
                    Found <strong className="text-violet-600 font-extrabold">{displayCount}</strong> vehicles
                  </span>
                </div>
                <button
                  onClick={nextStep}
                  disabled={!answers.parking}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6 py-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: BUDGET SELECTOR ── */}
          {currentStep === "budget" && (
            <motion.div
              key="budget"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-xl shadow-slate-100 space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
                  What is your maximum vehicle price budget?
                </h2>
                <p className="text-xs text-slate-500">Specify your ex-showroom target budget limit.</p>
              </div>

              <div className="space-y-3">
                {/* Dynamically adjust budget choices based on type */}
                {answers.vehicleType === "scooter" ? (
                  <>
                    {[
                      { id: "low", label: "Under ₹1.2 Lakh", desc: "Budget scooters" },
                      { id: "medium", label: "₹1.2 Lakh - ₹1.5 Lakh", desc: "Mid-range smart scooters" },
                      { id: "high", label: "₹1.5 Lakh+", desc: "Premium performance two-wheelers" }
                    ].map((opt) => {
                      const isSelected = answers.budget === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect("budget", opt.id)}
                          className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                            isSelected ? "bg-violet-50/50 border-violet-500 text-slate-950" : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900">{opt.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${isSelected ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </>
                ) : answers.vehicleType === "car" ? (
                  <>
                    {[
                      { id: "low", label: "Under ₹12 Lakh", desc: "Compact city cars (Comet, Punch e, etc.)" },
                      { id: "medium", label: "₹12 Lakh - ₹20 Lakh", desc: "Mid-size SUVs (Nexon EV, XUV400)" },
                      { id: "high", label: "₹20 Lakh - ₹40 Lakh", desc: "Long-range family EVs (ZS EV, BYD Atto 3)" },
                      { id: "premium", label: "₹40 Lakh+", desc: "Premium flagship EVs (Ioniq 5, EV6, BMW)" }
                    ].map((opt) => {
                      const isSelected = answers.budget === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect("budget", opt.id)}
                          className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                            isSelected ? "bg-violet-50/50 border-violet-500 text-slate-950" : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900">{opt.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${isSelected ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </>
                ) : answers.vehicleType === "auto" || answers.usageType === "commercial" ? (
                  <>
                    {[
                      { id: "low", label: "Under ₹3 Lakh", desc: "Standard passenger autos" },
                      { id: "medium", label: "₹3 Lakh - ₹4.5 Lakh", desc: "Smart commercial loaders & cargo autos" },
                      { id: "high", label: "₹4.5 Lakh+", desc: "High payload cargo autos" }
                    ].map((opt) => {
                      const isSelected = answers.budget === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect("budget", opt.id)}
                          className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                            isSelected ? "bg-violet-50/50 border-violet-500 text-slate-950" : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900">{opt.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${isSelected ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* General fallback if vehicleType = any */}
                    {[
                      { id: "low", label: "Under ₹5 Lakh", desc: "Scooters, autos & budget microcars" },
                      { id: "medium", label: "₹5 Lakh - ₹15 Lakh", desc: "Mid-range cars and flagship scooters" },
                      { id: "high", label: "₹15 Lakh+", desc: "Premium electric cars" }
                    ].map((opt) => {
                      const isSelected = answers.budget === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect("budget", opt.id)}
                          className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                            isSelected ? "bg-violet-50/50 border-violet-500 text-slate-955" : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900">{opt.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${isSelected ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 gap-3">
                <button onClick={prevStep} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-955 px-4 py-2 cursor-pointer">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100/85 px-2.5 py-1 rounded-full border border-slate-200/50 whitespace-nowrap">
                    Found <strong className="text-violet-600 font-extrabold">{displayCount}</strong> vehicles
                  </span>
                </div>
                <button
                  onClick={nextStep}
                  disabled={!answers.budget}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6 py-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: LOCATION ── */}
          {currentStep === "location" && (
            <motion.div
              key="location"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-xl shadow-slate-100 space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
                  Which location / state are you from?
                </h2>
                <p className="text-xs text-slate-500">We use this to identify regional energy rates and state incentives.</p>
              </div>

              {/* Auto detect button */}
              <button
                type="button"
                onClick={autoDetectLocation}
                disabled={detectingLocation}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-3.5 transition-all shadow-md active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {detectingLocation ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Detecting location...
                  </>
                ) : (
                  <>
                    <MapPin size={14} className="fill-white" /> Auto-Detect State / Location
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or choose manually</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Other State"].map((loc) => {
                  const isSelected = answers.location === loc;
                  return (
                    <button
                      key={loc}
                      onClick={() => handleSelect("location", loc)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isSelected 
                          ? "bg-violet-50/50 border-violet-500 text-slate-955"
                          : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      <MapPin size={16} className={isSelected ? "text-violet-600" : "text-slate-400"} />
                      <span className="font-bold text-sm text-slate-900">{loc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Textbox for custom location if "Other State" selected */}
              <AnimatePresence>
                {answers.location === "Other State" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Specify your state / location</label>
                    <input
                      type="text"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder="Enter state name (e.g. Gujarat, Kerala)"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all font-bold"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-4 gap-3">
                <button onClick={prevStep} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-955 px-4 py-2 cursor-pointer">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100/85 px-2.5 py-1 rounded-full border border-slate-200/50 whitespace-nowrap">
                    Found <strong className="text-violet-600 font-extrabold">{displayCount}</strong> vehicles
                  </span>
                </div>
                <button
                  onClick={nextStep}
                  disabled={!answers.location || (answers.location === "Other State" && !customLocation.trim())}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6 py-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 6: LOANS PREFERENCE ── */}
          {currentStep === "loan" && (
            <motion.div
              key="loan"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-xl shadow-slate-100 space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
                Do you need loan / financing assistance?
              </h2>

              <div className="space-y-3">
                {[
                  { id: "yes", label: "Yes, recommend a loan & bank matches", desc: "Enter EMI budget and down payment choices." },
                  { id: "no", label: "No, I plan to pay upfront", desc: "No loan calculator recommendations needed." }
                ].map((opt) => {
                  const isSelected = answers.loanNeeded === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect("loanNeeded", opt.id)}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isSelected 
                          ? "bg-violet-50/50 border-violet-500 text-slate-955 shadow-md"
                          : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{opt.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${isSelected ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>
                        {isSelected && <Check size={12} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 gap-3">
                <button onClick={prevStep} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-955 px-4 py-2 cursor-pointer">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100/85 px-2.5 py-1 rounded-full border border-slate-200/50 whitespace-nowrap">
                    Found <strong className="text-violet-600 font-extrabold">{displayCount}</strong> vehicles
                  </span>
                </div>
                <button
                  onClick={nextStep}
                  disabled={!answers.loanNeeded}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6 py-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  {answers.loanNeeded === "yes" ? "Continue" : "Get Matches"} <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 7: LOAN DETAILS (CONDITIONAL) ── */}
          {currentStep === "loan_details" && (
            <motion.div
              key="loan_details"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-xl shadow-slate-100 space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center sm:text-left">
                  Configure your financing goals
                </h2>

                {/* Monthly EMI Comfort */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Maximum Monthly EMI Budget</label>
                  <div className="grid gap-2 grid-cols-2">
                    {[
                      { id: "low", label: "Under ₹5k /mo" },
                      { id: "medium", label: "₹5k - ₹10k /mo" },
                      { id: "high", label: "₹10k - ₹20k /mo" },
                      { id: "very_high", label: "₹20k+ /mo" }
                    ].map((opt) => {
                      const isSelected = answers.maxEmi === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect("maxEmi", opt.id)}
                          className={`p-3 rounded-xl border text-center transition-all text-xs font-bold active:scale-95 cursor-pointer ${
                            isSelected ? "bg-violet-50/50 border-violet-500 text-slate-950 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Down Payment Target */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Down Payment Target Amount</label>
                  <div className="grid gap-2 grid-cols-2">
                    {[
                      { id: "low", label: "Minimum (10%)" },
                      { id: "medium", label: "Standard (20%)" },
                      { id: "high", label: "Moderate (30%)" },
                      { id: "very_high", label: "Up to 50%" }
                    ].map((opt) => {
                      const isSelected = answers.downPayment === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect("downPayment", opt.id)}
                          className={`p-3 rounded-xl border text-center transition-all text-xs font-bold active:scale-95 cursor-pointer ${
                            isSelected ? "bg-violet-50/50 border-violet-500 text-slate-950 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 gap-3">
                <button onClick={prevStep} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-955 px-4 py-2 cursor-pointer">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100/85 px-2.5 py-1 rounded-full border border-slate-200/50 whitespace-nowrap">
                    Found <strong className="text-violet-600 font-extrabold">{displayCount}</strong> vehicles
                  </span>
                </div>
                <button
                  onClick={nextStep}
                  disabled={!answers.maxEmi || !answers.downPayment}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6 py-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Get Matches <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 8: LOADING CURATION TRANSITION ── */}
          {currentStep === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center text-center px-4"
            >
              {/* Spinning Glow Effects */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[80px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-[#34ebb1]/10 rounded-full blur-[60px] animate-pulse" />

              <div className="space-y-8 relative z-10 max-w-md">
                <div className="relative inline-flex items-center justify-center">
                  {/* Rotating loader circle */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-20 h-20 border-[3px] border-violet-500/10 border-t-violet-600 border-r-emerald-500 rounded-full"
                  />
                  <Sparkles size={28} className="absolute text-violet-600 animate-pulse" />
                </div>

                <div className="space-y-2">
                  {/* Popup content */}
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-black text-slate-900 uppercase tracking-wider"
                  >
                    Curated recommendation right to you
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-xs text-slate-500"
                  >
                    Processing filters and sorting matches...
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 9: RESULTS AND CONTACT DETAILS FORM ── */}
          {currentStep === "results" && (
            <motion.div
              key="results"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-10 backdrop-blur-xl shadow-xl shadow-slate-100 space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1 text-xs font-black text-emerald-700 uppercase tracking-widest">
                  <Zap size={12} className="fill-emerald-600 text-emerald-600" /> Filter Completed
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Found {displayCount} results as per filter till now
                </h2>
                
                <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                  Our team will manually confirm your vehicle matches, financing parameters, and forward the curated recommendations right to you.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Enter details to receive your report</h3>

                <form onSubmit={handleSubmitLead} className="space-y-3">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Full Name</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={contact.name}
                        onChange={(e) => setContact(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your name"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Phone Number</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="tel" 
                        required
                        value={contact.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val.length <= 10) {
                            setContact(prev => ({ ...prev, phone: val }));
                          }
                        }}
                        placeholder="Enter your mobile number"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        title="Please enter a valid 10-digit mobile number."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        required
                        value={contact.email}
                        onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="text-red-600 text-xs flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl p-3">
                      <ShieldAlert size={14} className="text-red-500" />
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-black text-sm px-6 py-3.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Submitting Report...
                      </>
                    ) : (
                      <>
                        Request Recommendation report <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── STEP 10: SUCCESS CONFIRMATION ── */}
          {currentStep === "success" && (
            <motion.div
              key="success"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white/80 border border-slate-200/60 rounded-[32px] p-8 sm:p-12 backdrop-blur-xl shadow-xl shadow-slate-100 text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={36} className="animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">We've Received Your Details!</h2>
                <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed">
                  Our EV experts will manually review the <strong className="text-slate-900">{displayCount} matches</strong> and forward the curated list {answers.loanNeeded === "yes" ? "along with custom loan options " : ""}directly to you.
                </p>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs px-6 py-3 transition-all cursor-pointer"
                >
                  Return to Home
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6 py-3 transition-all cursor-pointer"
                >
                  Browse Catalog
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
