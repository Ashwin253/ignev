"use client";

import { useEffect, useState } from "react";
import { PackageCheck, X } from "lucide-react";

export type CurrentOrder = {
  id: string;
  productName: string;
  price: string;
  paymentMethod: "cod" | "online";
  status?: "placed" | "confirmed" | "packed" | "shipped" | "delivered";
};

const STORAGE_KEY = "evezy_current_order";

export default function CurrentOrderPopup() {
  const [order, setOrder] = useState<CurrentOrder | null>(null);

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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrder));
    };

    window.addEventListener("evezy:order-placed", handleOrderPlaced);
    return () => window.removeEventListener("evezy:order-placed", handleOrderPlaced);
  }, []);

  if (!order) return null;

  const status = order.status ?? "placed";
  const statusLabels = {
    placed: "Order placed",
    confirmed: "Order confirmed",
    packed: "Packed",
    shipped: "Out for delivery",
    delivered: "Delivered",
  } as const;
  const statusProgress = {
    placed: 20,
    confirmed: 40,
    packed: 60,
    shipped: 80,
    delivered: 100,
  } as const;

  return (
    <aside className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl border border-emerald-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] sm:max-w-md">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <PackageCheck size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Current order</p>
          <p className="truncate text-sm font-semibold text-slate-900">{order.productName}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-slate-900">{order.price}</span>
        <button
          type="button"
          onClick={() => { setOrder(null); window.localStorage.removeItem(STORAGE_KEY); }}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss current order"
        >
          <X size={16} />
        </button>
      </div>
      <div className="border-t border-slate-100 px-4 pb-3 pt-2">
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{statusLabels[status]}</span>
          <span>{statusProgress[status]}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={statusProgress[status]} aria-valuemin={0} aria-valuemax={100} aria-label={`Order status: ${statusLabels[status]}`}>
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${statusProgress[status]}%` }} />
        </div>
        <p className="mt-2 truncate text-[10px] text-slate-400">
          {order.paymentMethod === "cod" ? "Cash on delivery" : "Payment received"} · Order ID: {order.id}
        </p>
      </div>
    </aside>
  );
}
