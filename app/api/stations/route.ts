import { NextResponse } from "next/server";
import { supabase, supabaseEnabled } from "../../lib/supabase";

export const revalidate = 60;

export async function GET() {
  if (!supabaseEnabled()) {
    return NextResponse.json({ stations: [], dealers: [] });
  }
  const [{ data: stations, error: stationsError }, { data: dealers, error: dealersError }, { data: activeOffers, error: offersError }] = await Promise.all([
    supabase.from("ev_stations").select("*").eq("is_active", true),
    supabase.from("ev_dealers").select("*").eq("is_active", true),
    supabase.from("offers").select("id, text, is_active").eq("is_active", true),
  ]);

  if (stationsError) {
    return NextResponse.json({ stations: [], dealers: [], error: stationsError.message });
  }

  const offerTextById = new Map(
    (activeOffers ?? []).map((offer: any) => [String(offer.id), String(offer.text || "").trim()])
  );
  const resolvedDealers = (dealers ?? []).map((dealer: any) => {
    const linkedOffers = Array.isArray(dealer.offer_ids)
      ? dealer.offer_ids.map((offerId: string) => offerTextById.get(String(offerId))).filter(Boolean)
      : [];

    return {
      ...dealer,
      // Resolve current offer text at request time so Banners & Offers edits
      // are reflected on dealer pins without editing the dealer again.
      offers: linkedOffers.length > 0 ? linkedOffers : (dealer.offers ?? []),
    };
  });

  // Keep the map usable during rollout if the dealer migration or offers
  // linkage has not yet been applied in an environment.
  return NextResponse.json({
    stations: stations ?? [],
    dealers: dealersError ? [] : resolvedDealers,
    ...(dealersError ? { dealersError: dealersError.message } : {}),
    ...(offersError ? { offersError: offersError.message } : {}),
  });
}
