import { Suspense } from "react";
import FullMap from "../map/FullMap";

export const metadata = {
  title: "EV Charging Stations Map | EVPULSE",
  description: "Find nearby electric vehicle charging stations. View real-time availability, connector types, and navigation.",
};

export default function ChargingStationPage() {
  return (
    <main className="flex-grow pt-[80px] flex flex-col h-screen bg-slate-900">
      <Suspense fallback={
        <div className="flex-grow flex items-center justify-center bg-slate-900 text-slate-400 font-medium">
          Loading Live Charging Stations Map...
        </div>
      }>
        <FullMap />
      </Suspense>
    </main>
  );
}
