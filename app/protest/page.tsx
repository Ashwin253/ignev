import { Metadata } from "next";
import ProtestClient from "./ProtestClient";
import { supabase } from "../lib/supabase";

export const metadata: Metadata = {
  title: "Community Energy Support | EVPULSE",
  description: "Find nearby charged batteries, community charging locations, and internet hotspots supported by our volunteer network. Real-time availability updates.",
  keywords: "protest charging, community energy, community wifi, free charging, backup battery, EV charge, internet hotspot",
};

export const revalidate = 0; // Realtime page

export default async function ProtestPage() {
  let initialBatteries: any[] = [];
  let initialStations: any[] = [];

  if (supabase) {
    try {
      const { data: bData } = await supabase
        .from("batteries")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      initialBatteries = bData || [];

      const { data: sData } = await supabase
        .from("charging_stations")
        .select("*")
        .order("name", { ascending: true });
      initialStations = sData || [];
    } catch (err) {
      console.error("Error fetching initial protest data:", err);
    }
  }

  return (
    <ProtestClient
      initialBatteries={initialBatteries}
      initialStations={initialStations}
    />
  );
}
