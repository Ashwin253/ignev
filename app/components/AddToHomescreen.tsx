"use client";

import { useEffect } from "react";

/**
 * Headless: captures the browser's install prompt so the footer "Get the app" card can use it.
 * (The old floating "Install EVPLSE App" popup was removed.)
 */
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __evplseInstallPrompt?: InstallPromptEvent | null;
  }
}

export default function AddToHomescreen() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      window.__evplseInstallPrompt = e as InstallPromptEvent;
      window.dispatchEvent(new CustomEvent("evplse-install-ready"));
    };
    const onInstalled = () => {
      window.__evplseInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("evplse-install-ready"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
