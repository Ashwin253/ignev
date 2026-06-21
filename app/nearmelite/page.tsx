"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Wrench, Zap, Car } from "lucide-react";

function NearMeLiteContent() {
  const searchParams = useSearchParams();

  // Compute directly from searchParams (no need for state/effect)
  const title = searchParams.get("title") || "";
  const text = searchParams.get("text") || "";
  const url = searchParams.get("url") || "";
  
  const sharedInfo = [title, text, url].filter(Boolean).join("\n");

  const handleSend = (type: string) => {
    const message = `I need: ${type}\n\nLocation Details:\n${sharedInfo || "Location not provided"}`;
    const encoded = encodeURIComponent(message);
    // SMS direct link to the requested number
    window.location.href = `sms:+919873762412?body=${encoded}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 pt-24 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-2xl font-black text-slate-900 mb-2 text-center">Quick Assistance</h1>
        <p className="text-slate-500 text-center text-sm mb-8">What do you need help with right now?</p>

        <div className="space-y-4">
          <button 
            onClick={() => handleSend("Fill my car")}
            className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl transition-all active:scale-95 border border-emerald-100"
          >
            <Zap size={20} /> Fill my car
          </button>
          
          <button 
            onClick={() => handleSend("Car towing")}
            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-2xl transition-all active:scale-95 border border-blue-100"
          >
            <Car size={20} /> Car towing
          </button>

          <button 
            onClick={() => handleSend("Car breakdown")}
            className="w-full flex items-center justify-center gap-3 py-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl transition-all active:scale-95 border border-rose-100"
          >
            <Wrench size={20} /> Car breakdown
          </button>
        </div>

        {sharedInfo && (
          <div className="mt-8 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-200">
            <span className="font-bold text-slate-700 mb-1 block">Location Attached:</span>
            <div className="truncate max-w-full">{sharedInfo}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NearMeLitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>}>
      <NearMeLiteContent />
    </Suspense>
  );
}
