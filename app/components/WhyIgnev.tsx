"use client";

import { motion } from "framer-motion";
import {
  ShoppingCart,
  Banknote,
  ShieldCheck,
  PlugZap,
  Wrench,
  Package,
  ArrowLeftRight,
  ArrowRight,
  CarFront,
} from "lucide-react";

const lifecycle = [
  { title: "Buy",         short: "New & used EVs",       icon: ShoppingCart,  accent: "bg-sky-500",     ring: "ring-sky-200",    text: "text-sky-600"    },
  { title: "Rent",        short: "Flexible rental",      icon: CarFront,      accent: "bg-teal-500",    ring: "ring-teal-200",   text: "text-teal-600"   },
  { title: "Finance",     short: "Easy EMIs",            icon: Banknote,      accent: "bg-emerald-500", ring: "ring-emerald-200",text: "text-emerald-600"},
  { title: "Insure",      short: "EV-specific cover",    icon: ShieldCheck,   accent: "bg-violet-500",  ring: "ring-violet-200", text: "text-violet-600" },
  { title: "Charge",      short: "Find stations",        icon: PlugZap,       accent: "bg-amber-500",   ring: "ring-amber-200",  text: "text-amber-600"  },
  { title: "Service",     short: "Expert care",          icon: Wrench,        accent: "bg-rose-500",    ring: "ring-rose-200",   text: "text-rose-600"   },
  { title: "Spare Parts", short: "Genuine OEM",          icon: Package,       accent: "bg-orange-500",  ring: "ring-orange-200", text: "text-orange-600" },
  { title: "Sell",        short: "Best resale value",    icon: ArrowLeftRight, accent: "bg-indigo-500", ring: "ring-indigo-200", text: "text-indigo-600" },
];

export default function WhyEVPULSE() {
  return (
    <section className="py-20 bg-transparent relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm mb-5">
            Full Lifecycle
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
            One platform, <span className="text-gradient">every step</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base">
            From buying to selling — EVPULSE covers every stage of EV ownership.
          </p>
        </div>

        {/* Icon grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
          {lifecycle.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              viewport={{ once: true }}
              className="group flex flex-col items-center gap-3 cursor-pointer"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.accent} text-white shadow-md ring-4 ring-transparent group-hover:${item.ring} group-hover:scale-110 transition-all duration-300`}
              >
                <item.icon size={22} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-semibold ${item.text}`}>{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{item.short}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Connector line — desktop */}
        <div className="hidden lg:block relative -mt-[4.5rem] mb-[4.5rem] pointer-events-none">
          <div className="h-px bg-linear-to-r from-transparent via-slate-200 to-transparent mx-7" />
        </div>

        {/* CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-center justify-between gap-5"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900">Ready to start your EV journey?</h3>
            <p className="mt-0.5 text-sm text-slate-500">Join thousands of EV owners who trust EVPULSE at every stage.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
            >
              Browse EVs <ArrowRight size={15} />
            </a>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-assist"))}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Talk to an expert
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
