"use client";

import { useEffect, useRef } from "react";

interface LogoLoaderProps {
  fullscreen?: boolean;
  message?: string;
}

export default function LogoLoader({ fullscreen = true, message = "Loading..." }: LogoLoaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay was interrupted/blocked: ", err);
      });
    }
  }, []);

  const containerClasses = fullscreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f1115]"
    : "w-full min-h-[300px] flex flex-col items-center justify-center bg-[#0f1115] rounded-3xl p-8 border border-white/5";

  const videoSizeClasses = fullscreen
    ? "w-48 h-48 md:w-64 md:h-64"
    : "w-32 h-32 md:w-40 md:h-40";

  // Hidden for now
  return null;

  return (
    <div className={containerClasses}>
      <div className={`relative ${videoSizeClasses} flex items-center justify-center`}>
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 bg-[#007BFF]/10 rounded-full blur-3xl animate-pulse" />
        
        <video
          ref={videoRef}
          src="/logoanimation.mp4"
          className="w-full h-full object-contain rounded-full relative z-10"
          autoPlay
          loop
          muted
          playsInline
          controls={false}
        />
      </div>
      
      {/* Loading message & Progress bar */}
      <div className="mt-6 flex flex-col items-center gap-3 relative z-10">
        <span className="text-xs md:text-sm font-semibold tracking-widest text-slate-400 uppercase animate-pulse">
          {message}
        </span>
        <div className="w-24 h-[2px] bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#007BFF] via-[#A3FF12] to-[#007BFF] w-1/2 rounded-full animate-loader-slide" />
        </div>
      </div>
    </div>
  );

}
