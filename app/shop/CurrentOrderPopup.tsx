"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, PackageCheck, X } from "lucide-react";

export type CurrentOrder = {
  id: string;
  productName: string;
  price: string;
  paymentMethod: "cod" | "online";
};

const STORAGE_KEY = "evezy_current_order";

export default function CurrentOrderPopup() {
  const [order, setOrder] = useState<CurrentOrder | null>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      window.setTimeout(() => {
        try {
          setOrder(JSON.parse(saved) as CurrentOrder);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }, 0);
    }

    const handleOrderPlaced = (event: Event) => {
      const nextOrder = (event as CustomEvent<CurrentOrder>).detail;
      setOrder(nextOrder);
      setMinimized(false);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrder));
    };

    window.addEventListener("evezy:order-placed", handleOrderPlaced);
    return () => window.removeEventListener("evezy:order-placed", handleOrderPlaced);
  }, []);

  if (!order) return null;

  return (
    <aside className={`fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl border border-emerald-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] transition-all sm:max-w-md ${minimized ? "sm:max-w-xs" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <PackageCheck size={18} />
        </div>
        <button
          type="button"
          onClick={() => setMinimized((value) => !value)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={!minimized}
          aria-label={minimized ? "Expand current order" : "Minimize current order"}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Current order</p>
          <p className="truncate text-sm font-semibold text-slate-900">{order.productName}</p>
        </button>
        <span className="shrink-0 text-sm font-bold text-slate-900">{order.price}</span>
        <button
          type="button"
          onClick={() => setMinimized((value) => !value)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label={minimized ? "Expand current order" : "Minimize current order"}
        >
          {minimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          <span>{minimized ? "Expand" : "Minimize"}</span>
        </button>
        <button
          type="button"
          onClick={() => { setOrder(null); window.localStorage.removeItem(STORAGE_KEY); }}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss current order"
        >
          <X size={16} />
        </button>
      </div>
      {!minimized && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-2 text-xs text-slate-500">
          {order.paymentMethod === "cod" ? "Cash on delivery selected" : "Payment received"} · Order ID: {order.id}
        </div>
      )}
    </aside>
  );
}
