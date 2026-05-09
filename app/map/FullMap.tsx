"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Wrench, Navigation, MapPin, Search, Filter,
  Share2, X, Loader2, SlidersHorizontal, ChevronDown,
  IndianRupee, Fuel,
} from "lucide-react";

// ── Location data ─────────────────────────────────────────────────────────────

const allLocations = [
  { id: "1", type: "charging", lat: 28.638807, lng: 77.085715, name: "EV Fast Charger",       address: "West Delhi" },
  { id: "3", type: "charging", lat: 28.600843, lng: 77.087613, name: "Supercharger IndianOil", address: "North Delhi" },
  { id: "4", type: "spare",    lat: 28.627204, lng: 77.071554, name: "EV Repair and Spare",    address: "West Delhi" },
];

type Location = typeof allLocations[0];

// ── Leaflet hook ──────────────────────────────────────────────────────────────

function useLeafletMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef     = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const routeRef   = useRef<import("leaflet").Polyline | null>(null);
  const onClickRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const container = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (container._leaflet_id) delete container._leaflet_id;

    import("leaflet").then((L) => {
      if (mapRef.current || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const map = L.map(containerRef.current!, { center: [28.615, 77.079], zoom: 13, zoomControl: false });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      map.on("click", (e) => onClickRef.current?.(e.latlng.lat, e.latlng.lng));
      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
      routeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncMarkers = useCallback((locations: Location[], selectedId: string | null, onSelect: (loc: Location) => void) => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      const map = mapRef.current!;
      markersRef.current.forEach((m, id) => {
        if (!locations.find((l) => l.id === id)) { m.remove(); markersRef.current.delete(id); }
      });
      locations.forEach((loc) => {
        const isSelected = loc.id === selectedId;
        const color = loc.type === "charging" ? "#10b981" : "#f59e0b";
        const size  = isSelected ? 38 : 30;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.4);transition:all 0.2s"></div>`,
          iconSize: [size, size], iconAnchor: [size / 2, size],
        });
        const existing = markersRef.current.get(loc.id);
        if (existing) { existing.setIcon(icon); }
        else {
          const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map).on("click", () => onSelect(loc));
          markersRef.current.set(loc.id, marker);
        }
      });
    });
  }, []);

  const panTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.panTo([lat, lng], { animate: true });
  }, []);

  const drawRoute = useCallback(async (originStr: string, destStr: string): Promise<{ ok: boolean; distanceKm?: number }> => {
    if (!mapRef.current) return { ok: false };
    const L = await import("leaflet");
    const geocode = async (s: string): Promise<[number, number] | null> => {
      const m = s.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (m) return [parseFloat(m[1]), parseFloat(m[2])];
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(s)}&format=json&limit=1&countrycodes=in`,
          { headers: { "Accept-Language": "en", "User-Agent": "EVPULSE/1.0" } }
        );
        const data = await r.json() as { lat: string; lon: string }[];
        return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
      } catch { return null; }
    };
    const [origin, dest] = await Promise.all([geocode(originStr), geocode(destStr)]);
    if (!origin || !dest) return { ok: false };
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json() as { routes?: { geometry: { coordinates: [number, number][] }, distance?: number }[] };
      if (!data.routes?.[0]) return { ok: false };
      routeRef.current?.remove();
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      routeRef.current = L.polyline(coords, { color: "#3b82f6", weight: 5, opacity: 0.85 }).addTo(mapRef.current!);
      mapRef.current!.fitBounds(routeRef.current.getBounds(), { padding: [60, 60] });
      return { ok: true, distanceKm: (data.routes[0].distance ?? 0) / 1000 };
    } catch { return { ok: false }; }
  }, []);

  const clearRoute = useCallback(() => { routeRef.current?.remove(); routeRef.current = null; }, []);

  const syncUserMarker = useCallback((lat: number | null, lng: number | null) => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (lat !== null && lng !== null) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.6);animation:user-pulse 2s infinite"></div>
                 <style>@keyframes user-pulse { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.7); } 70% { box-shadow: 0 0 0 10px rgba(59,130,246,0); } 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } }</style>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        userMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(mapRef.current!);
      }
    });
  }, []);

  return { onClickRef, syncMarkers, panTo, drawRoute, clearRoute, syncUserMarker };
}

async function geocodeLocation(query: string): Promise<[number, number] | null> {
  const m = query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
      { headers: { "Accept-Language": "en", "User-Agent": "EVPULSE/1.0" } }
    );
    const data = await r.json() as { lat: string; lon: string }[];
    return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
  } catch {
    return null;
  }
}

function findLocalLocationMatches(query: string) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  return allLocations
    .filter((loc) =>
      loc.name.toLowerCase().includes(normalized) ||
      loc.address.toLowerCase().includes(normalized)
    )
    .slice(0, 4);
}

type MapSearchSuggestion = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

function getMapSearchSuggestions(query: string) {
  return findLocalLocationMatches(query).map((loc) => ({
    id: loc.id,
    name: loc.name,
    address: loc.address,
    lat: loc.lat,
    lng: loc.lng,
  }));
}

function CostCalculator({ routeDistanceKm }: { routeDistanceKm: number | null }) {
  const distanceKm = routeDistanceKm ?? 10;
  const [customPricesEnabled, setCustomPricesEnabled] = useState(false);
  const [evRatePerKwh, setEvRatePerKwh] = useState("9");
  const [petrolPricePerL, setPetrolPricePerL] = useState("104");
  const [dieselPricePerL, setDieselPricePerL] = useState("92");
  const evEfficiencyKwhPer100Km = 14;
  const petrolMileageKmpl = 18;
  const dieselMileageKmpl = 22;

  const safeRate = (value: string, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  const activeEvRate = customPricesEnabled ? safeRate(evRatePerKwh, 9) : 9;
  const activePetrolPrice = customPricesEnabled ? safeRate(petrolPricePerL, 104) : 104;
  const activeDieselPrice = customPricesEnabled ? safeRate(dieselPricePerL, 92) : 92;

  const evCost = (distanceKm * evEfficiencyKwhPer100Km * activeEvRate) / 100;
  const petrolCost = (distanceKm / petrolMileageKmpl) * activePetrolPrice;
  const dieselCost = (distanceKm / dieselMileageKmpl) * activeDieselPrice;
  const bestFossil = Math.min(petrolCost, dieselCost);
  const savingsVsFossil = Math.max(0, bestFossil - evCost);

  const fmt = (value: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));

  return (
    <div className="p-5 space-y-4">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
        <div className="flex items-center gap-2 text-amber-300 mb-2">
          <IndianRupee size={16} />
          <p className="text-sm font-semibold">Trip cost estimate</p>
        </div>
        <p className="text-xs text-amber-100/80 leading-5">
          Currently showing a default 10km estimate. Update the route to compare actual EV charging costs with petrol or diesel for your specific trip.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Use my prices</p>
            <p className="text-xs text-gray-500 mt-1">Override the default rates with your own values.</p>
          </div>
          <button
            onClick={() => setCustomPricesEnabled((prev) => !prev)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
              customPricesEnabled ? "bg-emerald-500 border-emerald-400/40" : "bg-white/10 border-white/10"
            }`}
            aria-pressed={customPricesEnabled}
            aria-label="Toggle custom prices"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                customPricesEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {customPricesEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-gray-500">EV price / kWh</span>
              <input
                value={evRatePerKwh}
                onChange={(e) => setEvRatePerKwh(e.target.value)}
                inputMode="decimal"
                placeholder="9"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/60"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-gray-500">Petrol price / L</span>
              <input
                value={petrolPricePerL}
                onChange={(e) => setPetrolPricePerL(e.target.value)}
                inputMode="decimal"
                placeholder="104"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/60"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-gray-500">Diesel price / L</span>
              <input
                value={dieselPricePerL}
                onChange={(e) => setDieselPricePerL(e.target.value)}
                inputMode="decimal"
                placeholder="92"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/60"
              />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs text-gray-400 mb-1">{routeDistanceKm !== null ? "Route distance" : "Default estimate"}</p>
          <p className="text-2xl font-semibold text-white">{distanceKm.toFixed(1)} km</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs text-emerald-100/70 mb-1">EV savings</p>
          <p className="text-2xl font-semibold text-emerald-300">Rs {fmt(savingsVsFossil)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">EV charging</p>
            <p className="text-xs text-gray-500 mt-1">{evEfficiencyKwhPer100Km} kWh / 100 km at Rs {activeEvRate} per kWh</p>
          </div>
          <p className="text-lg font-semibold text-emerald-300">Rs {fmt(evCost)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Petrol</p>
            <p className="text-xs text-gray-500 mt-1">{petrolMileageKmpl} km/l at Rs {activePetrolPrice} per litre</p>
          </div>
          <p className="text-lg font-semibold text-rose-300">Rs {fmt(petrolCost)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Diesel</p>
            <p className="text-xs text-gray-500 mt-1">{dieselMileageKmpl} km/l at Rs {activeDieselPrice} per litre</p>
          </div>
          <p className="text-lg font-semibold text-sky-300">Rs {fmt(dieselCost)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start gap-3">
        <Fuel size={18} className="text-sky-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-400 leading-5">
          This uses a simple distance-based estimate for quick comparison. If you want, we can later tune it with vehicle-specific mileage, battery size, and current fuel or electricity prices.
        </p>
      </div>
    </div>
  );
}

// ── Sidebar panel (shared between desktop sidebar and mobile sheet) ───────────

function SidebarContent({
  activeTab, setActiveTab,
  originInput, setOriginInput,
  destInput, setDestInput,
  selectingPoint, setSelectingPoint,
  routeActive, routeLoading, routeError,
  routeDistanceKm,
  onFindRoute, onClearRoute,
  filterType, setFilterType,
  selectedId, setSelectedId,
  displayedLocations,
  onRouteHere, onRouteAndCost, onShare,
  onPickMyLocation,
  onClose,
}: {
  activeTab: "route" | "filters" | "cost";
  setActiveTab: (t: "route" | "filters" | "cost") => void;
  originInput: string; setOriginInput: (v: string) => void;
  destInput: string;   setDestInput:   (v: string) => void;
  selectingPoint: "origin" | "dest" | null;
  setSelectingPoint: (v: "origin" | "dest" | null) => void;
  routeActive: boolean; routeLoading: boolean; routeError: string;
  routeDistanceKm: number | null;
  onFindRoute: () => void; onClearRoute: () => void;
  filterType: "all" | "charging" | "spare";
  setFilterType: (v: "all" | "charging" | "spare") => void;
  selectedId: string | null;
  setSelectedId: (v: string | null) => void;
  displayedLocations: Location[];
  onRouteHere: (loc: Location) => void;
  onRouteAndCost: (loc: Location) => void;
  onShare: (loc: Location) => void;
  onPickMyLocation: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header with optional close */}
      <div className="flex items-center border-b border-white/10 shrink-0">
        {(["route", "filters", "cost"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === tab
                ? tab === "route"   ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                  : tab === "cost"  ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/5"
                  : "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}>
            {tab === "route"   && <><Navigation size={13} /> Filter</>}
            {tab === "filters" && <><Filter size={13} /> Points</>}
            {tab === "cost"    && <><IndianRupee size={13} /> Cost</>}
          </button>
        ))}
        {onClose && (
          <button onClick={onClose} className="px-4 text-gray-400 hover:text-white transition-colors">
            <ChevronDown size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Route planner */}
        {activeTab === "route" && (
          <div className="p-5 border-b border-white/10 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-gray-400">Starting point</label>
                <div className="flex gap-1.5">
                  <button onClick={onPickMyLocation} className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-400 hover:text-white transition-colors">
                    Pick my location
                  </button>
                  <button onClick={() => setSelectingPoint(selectingPoint === "origin" ? null : "origin")}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${selectingPoint === "origin" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                    {selectingPoint === "origin" ? "Click map…" : "Pick on map"}
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${selectingPoint === "origin" ? "bg-blue-400 animate-pulse" : "bg-blue-500"}`} />
                <input value={originInput} onChange={(e) => setOriginInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onFindRoute()}
                  placeholder="e.g. Connaught Place, Delhi"
                  className={`w-full bg-black/30 border rounded-xl py-3 pl-8 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors ${selectingPoint === "origin" ? "border-blue-500" : "border-white/10 focus:border-blue-500/50"}`} />
              </div>
            </div>

            <div className="flex justify-center -my-1">
              <button onClick={() => { setOriginInput(destInput); setDestInput(originInput); }}
                className="text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors" title="Swap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-gray-400">Destination</label>
                <button onClick={() => setSelectingPoint(selectingPoint === "dest" ? null : "dest")}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${selectingPoint === "dest" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                  {selectingPoint === "dest" ? "Click map…" : "Pick on map"}
                </button>
              </div>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${selectingPoint === "dest" ? "bg-emerald-400 animate-pulse" : "bg-emerald-500"}`} />
                <input value={destInput} onChange={(e) => setDestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onFindRoute()}
                  placeholder="e.g. Noida Sector 18"
                  className={`w-full bg-black/30 border rounded-xl py-3 pl-8 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors ${selectingPoint === "dest" ? "border-emerald-500" : "border-white/10 focus:border-emerald-500/50"}`} />
              </div>
            </div>

            {routeError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{routeError}</p>
            )}

            <div className="flex gap-2">
              <button onClick={onFindRoute} disabled={routeLoading || !originInput.trim() || !destInput.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                {routeLoading ? <><Loader2 size={16} className="animate-spin" /> Finding…</> : <><Search size={16} /> Find Route</>}
              </button>
              {routeActive && (
                <button onClick={onClearRoute} className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Points */}
        {activeTab === "filters" && (
          <div className="p-5 border-b border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Place type</p>
            <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
              {(["all", "charging", "spare"] as const).map((t) => (
                <button key={t} onClick={() => { setFilterType(t); setSelectedId(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    filterType === t
                      ? t === "charging" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : t === "spare"  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}>
                  {t === "charging" && <Zap size={12} />}
                  {t === "spare"    && <Wrench size={12} />}
                  {t === "all" ? "All" : t === "charging" ? "Charging" : "Spare Parts"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Cost comparison tab ── */}
        {activeTab === "cost" && <CostCalculator routeDistanceKm={routeDistanceKm} />}

        {/* Location list — shown only on the dedicated 'Points' tab */}
        {activeTab === "filters" && (
        <div className="p-5 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            {displayedLocations.length} point{displayedLocations.length !== 1 ? "s" : ""}
          </p>
          {displayedLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <MapPin className="mx-auto h-7 w-7 mb-2 opacity-30" />
              <p className="text-sm">No points match.</p>
            </div>
          ) : displayedLocations.map((loc) => (
            <div key={loc.id} onClick={() => setSelectedId(selectedId === loc.id ? null : loc.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedId === loc.id ? "bg-white/10 border-white/20 shadow-lg" : "bg-white/5 border-transparent hover:bg-white/8"}`}>
              <div className="flex items-center gap-2 font-medium text-white mb-1">
                {loc.type === "charging" ? <Zap size={15} className="text-emerald-400 shrink-0" /> : <Wrench size={15} className="text-amber-400 shrink-0" />}
                <span className="truncate text-sm">{loc.name}</span>
              </div>
              <p className="text-xs text-gray-400 ml-5">{loc.address}</p>
              {selectedId === loc.id && (
                <div className="flex gap-2 mt-3 ml-5">
                  <button onClick={(e) => { e.stopPropagation(); onRouteHere(loc); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                    <Navigation size={13} /> Route
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onRouteAndCost(loc); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-semibold py-2 rounded-lg border border-amber-500/20 transition-colors">
                    <IndianRupee size={13} /> Cost
                  </button>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                    target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1 bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                    <Navigation size={13} /> GMaps
                  </a>
                  <button onClick={(e) => { e.stopPropagation(); onShare(loc); }}
                    className="px-3 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg transition-colors">
                    <Share2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-white/5 text-[10px] text-gray-600 shrink-0">
        Map © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 underline">OpenStreetMap</a> · Routing by <a href="https://project-osrm.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 underline">OSRM</a>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FullMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab]           = useState<"route" | "filters" | "cost">("route");
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [filterType, setFilterType]         = useState<"all" | "charging" | "spare">("all");
  const [originInput, setOriginInput]       = useState("");
  const [destInput, setDestInput]           = useState("");
  const [selectingPoint, setSelectingPoint] = useState<"origin" | "dest" | null>(null);
  const [routeActive, setRouteActive]       = useState(false);
  const [routeLoading, setRouteLoading]     = useState(false);
  const [routeError, setRouteError]         = useState("");
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [mapSearchQuery, setMapSearchQuery]  = useState("");
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchError, setMapSearchError]  = useState("");
  const [sheetOpen, setSheetOpen]           = useState(false); // mobile bottom sheet
  const [userLocation, setUserLocation]     = useState<[number, number] | null>(null);

  const mapSearchSuggestions = mapSearchQuery.trim()
    ? getMapSearchSuggestions(mapSearchQuery)
    : [];

  const displayedLocations = allLocations.filter(
    (l) => filterType === "all" || l.type === filterType
  );
  
  const { onClickRef, syncMarkers, panTo, drawRoute, clearRoute, syncUserMarker } = useLeafletMap(containerRef);

  // Sync user marker
  useEffect(() => {
    syncUserMarker(userLocation?.[0] ?? null, userLocation?.[1] ?? null);
  }, [userLocation, syncUserMarker]);

  // Keep click handler ref current
  useEffect(() => {
    onClickRef.current = (lat, lng) => {
      if (!selectingPoint) return;
      const coord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (selectingPoint === "origin") setOriginInput(coord);
      else setDestInput(coord);
      setSelectingPoint(null);
      setSheetOpen(false); // close sheet after picking
    };
  }, [selectingPoint, onClickRef]);

  // Sync markers
  useEffect(() => {
    syncMarkers(displayedLocations, selectedId, (loc) => {
      setSelectedId((prev) => prev === loc.id ? null : loc.id);
      setActiveTab("filters"); // Switch to points tab to show details
      setSheetOpen(true); // open sheet to show location details on mobile
    });
  }, [displayedLocations, selectedId, syncMarkers]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [sheetOpen]);

  // Auto-fetch location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setOriginInput(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          setUserLocation([lat, lng]);
          panTo(lat, lng);
        },
        () => {} // Ignore errors on auto-fetch
      );
    }
  }, [panTo]);

  // Pan to selected
  useEffect(() => {
    if (!selectedId) return;
    const loc = allLocations.find((l) => l.id === selectedId);
    if (loc) panTo(loc.lat, loc.lng);
  }, [selectedId, panTo]);

  const handleFindRoute = async () => {
    if (!originInput.trim() || !destInput.trim()) return;
    setRouteError("");
    setRouteLoading(true);
    const result = await drawRoute(originInput.trim(), destInput.trim());
    setRouteLoading(false);
    if (result.ok) {
      setRouteActive(true);
      setRouteDistanceKm(result.distanceKm ?? null);
      setActiveTab("cost");
      setSheetOpen(false);
    }
    else setRouteError("Could not find a route. Try more specific addresses.");
  };

  const handleClearRoute = () => {
    clearRoute();
    setRouteActive(false);
    setRouteDistanceKm(null);
    setOriginInput("");
    setDestInput("");
    setRouteError("");
  };

  const handleRouteHere = (loc: Location) => {
    setDestInput(`${loc.lat}, ${loc.lng}`);
    setActiveTab("route");
    if (originInput.trim()) {
      setTimeout(() => handleFindRoute(), 100);
    }
  };

  const handleRouteAndCost = async (loc: Location) => {
    setDestInput(`${loc.lat}, ${loc.lng}`);
    if (!originInput.trim()) {
      setActiveTab("route");
      return;
    }
    setRouteError("");
    setRouteLoading(true);
    const result = await drawRoute(originInput.trim(), `${loc.lat}, ${loc.lng}`);
    setRouteLoading(false);
    if (result.ok) {
      setRouteActive(true);
      setRouteDistanceKm(result.distanceKm ?? null);
      setActiveTab("cost");
      setSheetOpen(false);
    } else {
      setActiveTab("route");
      setRouteError("Could not find route to this location.");
    }
  };

  const handleShare = async (loc: Location) => {
    const url = `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}&zoom=16`;
    if (navigator.share) await navigator.share({ title: loc.name, text: loc.address, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  const handleMapSearch = async () => {
    const query = mapSearchQuery.trim();
    if (!query) return;
    const localMatch = findLocalLocationMatches(query)[0];
    if (localMatch) {
      panTo(localMatch.lat, localMatch.lng);
      setMapSearchError("");
      setSheetOpen(false);
      return;
    }
    setMapSearchLoading(true);
    setMapSearchError("");
    const coords = await geocodeLocation(query);
    setMapSearchLoading(false);
    if (!coords) {
      setMapSearchError("Location not found.");
      return;
    }
    panTo(coords[0], coords[1]);
    setSheetOpen(false);
  };

  const handleSuggestionPick = (loc: MapSearchSuggestion) => {
    setMapSearchQuery(loc.name);
    panTo(loc.lat, loc.lng);
    setMapSearchError("");
    setSheetOpen(false);
  };

  const applySearchToRoute = (loc: MapSearchSuggestion, target: "origin" | "dest") => {
    const value = `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
    if (target === "origin") setOriginInput(value);
    else setDestInput(value);
    setMapSearchQuery(loc.name);
    setActiveTab("route");
    setSheetOpen(true);
    setMapSearchError("");
    panTo(loc.lat, loc.lng);
  };

  const handlePickMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setOriginInput(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setUserLocation([lat, lng]);
      panTo(lat, lng);
    });
  };

  const sidebarProps = {
    activeTab, setActiveTab,
    originInput, setOriginInput,
    destInput, setDestInput,
    selectingPoint, setSelectingPoint,
    routeActive, routeLoading, routeError,
    routeDistanceKm,
    onFindRoute: handleFindRoute,
    onClearRoute: handleClearRoute,
    filterType, setFilterType,
    selectedId, setSelectedId,
    displayedLocations,
    onRouteHere: handleRouteHere,
    onRouteAndCost: handleRouteAndCost,
    onShare: handleShare,
    onPickMyLocation: handlePickMyLocation,
  };

  return (
    <div className="flex flex-row flex-grow h-[calc(100vh-80px)] bg-[#0f1115] overflow-hidden relative">

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex w-[380px] bg-[#1a1d24] border-r border-white/10 flex-col z-20 shadow-2xl shrink-0">
        <SidebarContent {...sidebarProps} />
      </div>

      {/* ── Map (full screen on mobile) ── */}
        <div className="flex-1 relative">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <div ref={containerRef} className="absolute inset-0 z-0" />

        {/* Quick map search */}
        <div className="absolute top-4 left-4 z-20 md:left-6 md:top-6">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.35)] px-3 py-2">
              <MapPin size={16} className="text-sky-300 shrink-0" />
              <input
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMapSearch()}
                placeholder="Search location"
                className="w-36 sm:w-52 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />
              <button
                onClick={handleMapSearch}
                disabled={mapSearchLoading || !mapSearchQuery.trim()}
                className="inline-flex items-center justify-center rounded-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 transition-colors"
                aria-label="Search location"
              >
                {mapSearchLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              </button>
            </div>
            {mapSearchSuggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-md shadow-2xl">
                {mapSearchSuggestions.map((loc) => (
                  <div key={loc.id} className="border-b border-white/5 last:border-b-0">
                    <button
                      onClick={() => handleSuggestionPick(loc)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  >
                      <p className="text-sm font-medium text-white">{loc.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{loc.address}</p>
                    </button>
                    <div className="flex gap-2 px-4 pb-3">
                      <button
                        onClick={() => applySearchToRoute(loc, "origin")}
                        className="flex-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/20 transition-colors"
                      >
                        Set as start
                      </button>
                      <button
                        onClick={() => applySearchToRoute(loc, "dest")}
                        className="flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                      >
                        Set as destination
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {mapSearchError && (
            <p className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-3 py-1.5 w-fit">
              {mapSearchError}
            </p>
          )}
        </div>

        {/* Pick-point hint */}
        {selectingPoint && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/20 shadow-xl pointer-events-none">
            Tap map to set {selectingPoint === "origin" ? "starting point" : "destination"}
          </motion.div>
        )}

        {/* Route loading overlay */}
        {routeLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none">
            <div className="bg-slate-900/90 text-white text-sm font-medium px-5 py-3 rounded-full flex items-center gap-2 border border-white/10">
              <Loader2 size={16} className="animate-spin text-blue-400" /> Finding route…
            </div>
          </div>
        )}

        {/* ── Mobile FAB ── */}
        <div className="md:hidden absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-full shadow-[0_4px_20px_rgba(59,130,246,0.5)] transition-all active:scale-95"
          >
            <SlidersHorizontal size={17} />
            <span className="text-sm">Filter</span>
            {routeActive && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>
        </div>
      </div>

      {/* ── Mobile bottom sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-30 bg-black/50"
              onClick={() => setSheetOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1a1d24] rounded-t-3xl shadow-2xl border-t border-white/10 flex flex-col overflow-hidden"
              style={{ height: "80vh" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <SidebarContent {...sidebarProps} onClose={() => setSheetOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

