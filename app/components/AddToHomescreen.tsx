"use client";

import React, { useState, useEffect } from "react";
import { X, Download, MonitorSmartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function AddToHomescreen() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isAppStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      ("standalone" in window.navigator && Boolean(window.navigator.standalone));
    const frame = window.requestAnimationFrame(() => setIsStandalone(isAppStandalone));

    if (isAppStandalone) return () => window.cancelAnimationFrame(frame);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const iosFrame = window.requestAnimationFrame(() => setIsIOS(isIosDevice));

    if (isIosDevice) {
      // Show iOS prompt after a delay if not dismissed
      const hasDismissed = localStorage.getItem("a2hs-dismissed");
      if (!hasDismissed) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const hasDismissed = localStorage.getItem("a2hs-dismissed");
      if (!hasDismissed) {
        setTimeout(() => setIsVisible(true), 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleInstallRequest = () => {
      if (isStandalone) return;
      if (isIOS) {
        setIsVisible(true);
        return;
      }
      if (deferredPrompt) {
        setIsVisible(true);
        deferredPrompt.prompt();
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener("install-request", handleInstallRequest as EventListener);

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(iosFrame);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("install-request", handleInstallRequest as EventListener);
    };
  }, [deferredPrompt, isIOS, isStandalone]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("a2hs-dismissed", "true");
  };

  if (isStandalone || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center gap-4 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icon */}
            <div className="relative flex-shrink-0 bg-gradient-to-br from-emerald-400 to-emerald-600 p-3 rounded-xl shadow-lg">
              <MonitorSmartphone className="w-6 h-6 text-white" />
            </div>
            
            {/* Content */}
            <div className="flex-1 relative z-10">
              <h3 className="text-white font-semibold text-sm tracking-wide">
                Install EVPULSE App
              </h3>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                {isIOS 
                  ? "Tap the share icon below and select 'Add to Home Screen'."
                  : "Get the best experience by installing our app on your device."}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 relative z-10">
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="bg-white text-black hover:bg-emerald-500 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-300 shadow-md flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-full p-1 border border-white/10 transition-colors shadow-sm z-20 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
