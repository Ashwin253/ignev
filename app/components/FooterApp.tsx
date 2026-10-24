"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Download, Share, Smartphone } from "lucide-react";
import { btn } from "./ui/kit";
import { toast } from "../lib/toast";

type Mode = "installed" | "ready" | "ios" | "manual";

export default function FooterApp() {
  const [mode, setMode] = useState<Mode>("manual");
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const compute = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator && Boolean((navigator as unknown as { standalone?: boolean }).standalone));
      if (standalone) return setMode("installed");
      if (window.__evplseInstallPrompt) return setMode("ready");
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return setMode("ios");
      setMode("manual");
    };
    compute();
    window.addEventListener("evplse-install-ready", compute);
    return () => window.removeEventListener("evplse-install-ready", compute);
  }, []);

  const install = async () => {
    const ev = window.__evplseInstallPrompt;
    if (ev) {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      window.__evplseInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("evplse-install-ready"));
      if (outcome === "accepted") toast("EVPLSE app installed");
      return;
    }
    setHelp((h) => !h);
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-gradient-to-br from-brand-soft/70 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Image src="/images/android-chrome-512x512.png" alt="EVPLSE app icon" width={56} height={56} className="h-14 w-14 rounded-2xl shadow-card ring-1 ring-line" />
        <div>
          <p className="flex items-center gap-1.5 font-extrabold text-ink"><Smartphone size={16} className="text-brand" /> Get the EVPLSE app</p>
          <p className="mt-0.5 text-sm text-ink-soft">Faster access, shortlist on your home screen, works like a native app.</p>
        </div>
      </div>
      <div className="sm:text-right">
        {mode === "installed" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand-deep"><Check size={16} /> App installed</span>
        ) : (
          <button onClick={install} className={btn("primary", "md")}>
            <Download size={16} /> Install app
          </button>
        )}
        {help && mode !== "installed" && (
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink-soft sm:ml-auto">
            {mode === "ios" ? (
              <>Tap <Share size={12} className="inline -mt-0.5" /> Share in Safari, then <b>Add to Home Screen</b>.</>
            ) : (
              <>In Chrome or Edge, open the browser menu (⋮) and choose <b>Install app</b> / <b>Add to Home screen</b>.</>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
