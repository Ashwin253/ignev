import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { getUsedVehicleBySlug, getUsedVehicles, formatUsedVehiclePrice } from "../../lib/used-vehicles";
import UsedVehicleDetailsClient from "./UsedVehicleDetailsClient";
import { Container } from "../../components/ui/kit";
import AutoLoadOfferModal from "../../components/AutoLoadOfferModal";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getUsedVehicleBySlug(slug);

  if (!vehicle) {
    return {
      title: "Vehicle Not Found | EVPLSE Used EVs",
    };
  }

  const cleanTitle = `Used ${vehicle.title} (${vehicle.year}) in ${vehicle.city} | ${formatUsedVehiclePrice(vehicle.price)}`;
  const cleanDesc = vehicle.listing_type === "inventory"
    ? `Browse ${vehicle.stock_left} matching used ${vehicle.title} units currently available in ${vehicle.city}, with battery health and pricing details.`
    : `Buy pre-owned ${vehicle.title} with 360° virtual tour, ${vehicle.odometer_km.toLocaleString()} km driven, ${vehicle.battery_health_percentage || 94}% battery health (SoH). 200-point inspected in ${vehicle.city}.`;

  return {
    title: cleanTitle,
    description: cleanDesc,
    openGraph: {
      title: cleanTitle,
      description: cleanDesc,
      images: [
        {
          url: vehicle.photo || "/vehicles/tatanexonev.webp",
          width: 1200,
          height: 630,
          alt: vehicle.title,
        },
      ],
    },
  };
}

export default async function UsedVehiclePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await getUsedVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  // Fetch similar vehicles
  const allUsed = await getUsedVehicles();
  const similarVehicles = allUsed.filter((v) => v.id !== vehicle.id && v.slug !== vehicle.slug);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_40%),linear-gradient(180deg,#fafafa_0%,#f8fcf9_100%)] pt-24 pb-20">
      <Container>
        {/* Breadcrumb Navigation (Spinny Style) */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href="/" className="hover:text-emerald-700 transition">
              Home
            </Link>
            <ChevronRight size={13} className="text-slate-400" />
            <Link href="/used" className="hover:text-emerald-700 transition">
              Used EVs
            </Link>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="text-slate-600">{vehicle.city}</span>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="text-slate-600">{vehicle.brand}</span>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="font-bold text-slate-900 line-clamp-1">{vehicle.title}</span>
          </div>

          <Link
            href="/used"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <ArrowLeft size={13} /> Back to Used Catalog
          </Link>
        </nav>

        {/* Interactive Vehicle Details Component */}
        <UsedVehicleDetailsClient vehicle={vehicle} similarVehicles={similarVehicles} />
      </Container>

      <AutoLoadOfferModal />
    </main>
  );
}
