import React from "react";
import ForYouClient from "./ForYouClient";
import { fetchEvListingsFromSupabase } from "../lib/supabase";
import { fetchEvListings } from "../lib/wordpress";

export const revalidate = 300; // ISR - revalidate every 5 minutes

export const metadata = {
  title: "For You Recommendation | EVPULSE",
  description: "Get personalized EV product and financing recommendations in India.",
};

export default async function ForYouPage() {
  let listings: any[] = [];

  // Try Supabase first
  try {
    const sbListings = await fetchEvListingsFromSupabase(200);
    if (sbListings && sbListings.length) {
      listings = sbListings;
    }
  } catch (err) {
    console.warn("Supabase fetch failed in /foryou:", err);
  }

  // Fallback to WordPress
  if (!listings.length) {
    try {
      const wpListings = await fetchEvListings(200);
      if (wpListings && wpListings.length) {
        listings = wpListings;
      }
    } catch (err) {
      console.warn("WordPress fetch failed in /foryou:", err);
    }
  }

  // Map to a simplified structure for filtering client-side
  const items = listings.map((l) => {
    // Determine driving range (from variants or main field)
    let rangeVal = 0;
    if (l.batteryVariants && l.batteryVariants.length) {
      const ranges = l.batteryVariants.map((v: any) => parseFloat(v.range) || 0).filter((r: number) => r > 0);
      if (ranges.length) rangeVal = Math.max(...ranges);
    }
    if (rangeVal === 0 && l.realWorldRange) {
      rangeVal = parseFloat(l.realWorldRange) || 0;
    }

    // Determine charge time
    let chargeTime = 0;
    if (l.batteryVariants && l.batteryVariants.length) {
      const charges = l.batteryVariants.map((v: any) => parseFloat(v.charge) || 0).filter((c: number) => c > 0);
      if (charges.length) chargeTime = Math.min(...charges);
    }

    // Parse price
    // Typically prices are string arrays e.g., ["14.74", "19.94"] (Lakhs)
    let minPrice = 0;
    let maxPrice = 0;
    if (l.prices && l.prices.length) {
      const parsedPrices = l.prices.map((p: string) => parseFloat(p.replace(/[₹,a-zA-Z\s]/g, "")) || 0).filter(Boolean);
      if (parsedPrices.length) {
        minPrice = Math.min(...parsedPrices);
        maxPrice = Math.max(...parsedPrices);
      }
    }

    return {
      id: l.id || l.slug,
      name: l.title,
      brand: l.brand,
      type: l.types && l.types[0] ? l.types[0] : "",
      photo: l.photo,
      slug: l.slug,
      pricing: l.pricing || "",
      minPrice, // in Lakhs
      maxPrice, // in Lakhs
      drivingRange: rangeVal, // in km
      chargeTime, // in minutes
      commercial: !!l.commercial,
    };
  });

  return (
    <ForYouClient initialVehicles={items} />
  );
}
