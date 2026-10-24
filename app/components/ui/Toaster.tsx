"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ToastTone } from "../../lib/toast";

type T = { id: number; message: string; tone: ToastTone };

export default function Toaster() {
  const [toasts, setToasts] = useState<T[]>([]);

  useEffect(() => {
    let id = 0;
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent).detail || {};
      if (!message) return;
      const t = { id: ++id, message: String(message), tone: (tone as ToastTone) || "success" };
      setToasts((prev) => [...prev.slice(-2), t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 2800);
    };
    window.addEventListener("evplse-toast", onToast);
    return () => window.removeEventListener("evplse-toast", onToast);
  }, []);

  const icon = (tone: ToastTone) =>
    tone === "success" ? <CheckCircle2 size={18} className="text-brand" /> :
    tone === "warn" ? <TriangleAlert size={18} className="text-sun" /> :
    <Info size={18} className="text-sky" />;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[400] flex flex-col items-center gap-2 px-4 md:bottom-8" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-lift"
          >
            {icon(t.tone)}
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
