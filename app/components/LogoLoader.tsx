"use client";

import { useState } from "react";
import facts from "./facts.json";

interface LogoLoaderProps {
  fullscreen?: boolean;
  message?: string;
}

export default function LogoLoader({ fullscreen = true, message = "Loading..." }: LogoLoaderProps) {
  const [fact] = useState<string>(() => facts[Math.floor(Math.random() * facts.length)].fact);

  const containerClasses = fullscreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#e3f6ec] transition-colors duration-300"
    : "w-full min-h-[300px] flex flex-col items-center justify-center bg-[#0a4a30] rounded-3xl p-8 border border-white/5 transition-colors duration-300";

  return (
    <div className={containerClasses}>
      <div className="flex max-w-md flex-col items-center gap-3 px-6 text-center">
        <span aria-hidden="true" className={`text-5xl ${fullscreen ? "text-brand" : "text-[#8df0b0]"}`}>⚡</span>
        <span className={`text-xs md:text-sm font-semibold tracking-widest uppercase animate-pulse ${fullscreen ? "text-slate-800" : "text-slate-300"}`}>
          {message}
        </span>
        <div className={`w-24 h-[2px] rounded-full overflow-hidden ${fullscreen ? "bg-slate-300" : "bg-slate-800"}`}>
          <div className="h-full bg-gradient-to-r from-[#0f8f56] via-[#8df0b0] to-[#0f8f56] w-1/2 rounded-full animate-loader-slide" />
        </div>

        {fact && (
          <div className={`mt-4 max-w-xs md:max-w-sm rounded-2xl p-4 backdrop-blur-md transition-all duration-300 ${fullscreen ? "bg-white/70 border border-slate-200 shadow-lg" : "bg-white/5 border border-white/10 shadow-2xl"}`}>
            <span className={`text-[10px] md:text-xs font-bold tracking-wider uppercase block mb-1 ${fullscreen ? "text-emerald-700" : "text-[#8df0b0]"}`}>
              ⚡ EV Fact
            </span>
            <p className={`text-[11px] md:text-xs leading-relaxed font-medium ${fullscreen ? "text-slate-700" : "text-slate-300"}`}>
              {fact}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
