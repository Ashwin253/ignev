"use client";

import { useEffect, useRef, useState } from "react";
import facts from "./facts.json";

interface LogoLoaderProps {
  fullscreen?: boolean;
  message?: string;
}

export default function LogoLoader({ fullscreen = true, message = "Loading..." }: LogoLoaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fact] = useState<string>(() => facts[Math.floor(Math.random() * facts.length)].fact);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay was interrupted/blocked: ", err);
      });
    }

  }, []);

  const containerClasses = fullscreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#daeff2] transition-colors duration-300"
    : "w-full min-h-[300px] flex flex-col items-center justify-center bg-[#0f1115] rounded-3xl p-8 border border-white/5 transition-colors duration-300";

  const videoSizeClasses = fullscreen
    ? "w-64 h-64 md:w-[420px] md:h-[420px] lg:w-[500px] lg:h-[500px] max-w-[90vw] aspect-square"
    : "h-[30vh] max-h-[160px] aspect-square";

  return (
    <div className={containerClasses}>
      <div className={`relative ${videoSizeClasses} flex items-center justify-center`}>
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 bg-[#007BFF]/20 rounded-full blur-[100px] animate-pulse" />
        
        <video
          ref={videoRef}
          src="/evplsenextconcept.mp4"
          className="w-full h-full object-contain rounded-full relative z-10"
          autoPlay
          loop
          muted
          playsInline
          controls={false}
        />
      </div>
      
      {/* Loading message & Progress bar */}
      <div className="mt-6 flex flex-col items-center gap-3 relative z-10 max-w-md px-6 text-center">
        <span className="text-xs md:text-sm font-semibold tracking-widest text-slate-300 uppercase animate-pulse">
          {message}
        </span>
        <div className="w-24 h-[2px] bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#007BFF] via-[#A3FF12] to-[#007BFF] w-1/2 rounded-full animate-loader-slide" />
        </div>

        {fact && (
          <div className="mt-4 max-w-xs md:max-w-sm bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-2xl transition-all duration-300">
            <span className="text-[10px] md:text-xs font-bold tracking-wider text-[#A3FF12] uppercase block mb-1">
              ⚡ EV Fact
            </span>
            <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed font-medium">
              {fact}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
