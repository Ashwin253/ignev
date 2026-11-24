import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, BatteryCharging, RotateCw, Award, ArrowRight, Sparkles } from "lucide-react";
import { getUsedVehicles } from "../lib/used-vehicles";
import UsedCatalogClient from "./UsedCatalogClient";
import { Container } from "../components/ui/kit";
import AutoLoadOfferModal from "../components/AutoLoadOfferModal";
import LogoLoader from "../components/LogoLoader";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Used Electric Vehicles | Certified Pre-Owned EVs | EVPLSE",
  description: "Browse verified second-hand electric cars, scooters and commercial EVs. Spinny-inspired 200-point inspection, certified battery health (SoH), 360° virtual tour, and doorstep test drives.",
  keywords: "used ev, second hand electric car, used nexon ev, pre-owned electric vehicles, used ev noida, used ev delhi ncr",
  openGraph: {
    title: "Buy Certified Used EVs | 360° Virtual Tour & Inspected Battery Health",
    description: "Browse pre-owned electric cars with 360° interactive photos, verified battery state of health, and instant test drive bookings.",
  },
};

export default async function UsedVehiclesPage() {
  const vehicles = await getUsedVehicles();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_40%),linear-gradient(180deg,#fafafa_0%,#f4fbf7_100%)] pt-24 pb-20">
      {/* Hero Header */}
      <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur-md pb-10 pt-6">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>Certified Pre-Owned EVs</span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Buy Used Electric Vehicles
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-600">
                Drive home an inspected electric car or scooter with complete transparency: 360° virtual tours, verified battery health (SoH), and doorstep test drives.
              </p>
            </div>

            {/* Direct Link to Sell EV */}
            <Link
              href="/sell-ev"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-extrabold text-slate-800 shadow-xs transition hover:border-emerald-600 hover:text-emerald-700"
            >
              <span>Have an EV to Sell?</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 4 Trust Badges (Spinny standard) */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "200-Point Inspected",
                desc: "Motor, battery & chassis tested",
              },
              {
                icon: BatteryCharging,
                title: "Certified Battery SoH",
                desc: "Real capacity & cell balancing",
              },
              {
                icon: RotateCw,
                title: "360° Virtual Tour",
                desc: "Inspect 8 angles before visiting",
              },
              {
                icon: Award,
                title: "Doorstep Test Drive",
                desc: "Try it at your home or visit hub",
              },
            ].map((badge, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-xs"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <badge.icon size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-slate-800">{badge.title}</h2>
                  <p className="text-[11px] text-slate-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Main Catalog Section */}
      <Container className="pt-8">
        <Suspense fallback={<LogoLoader fullscreen={false} message="Loading certified EVs..." />}>
          <UsedCatalogClient initialVehicles={vehicles} />
        </Suspense>
      </Container>

      <AutoLoadOfferModal />
    </main>
  );
}
