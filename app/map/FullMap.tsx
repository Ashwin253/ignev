"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Wrench, Navigation, MapPin, Search, Filter,
  Share2, X, Loader2, SlidersHorizontal, ChevronDown,
  IndianRupee, Fuel,
} from "lucide-react";

// ── Location data ─────────────────────────────────────────────────────────────
import statiqStationsData from "../../public/statiq_stations.json";

const statiqLocations = statiqStationsData.map((s, idx) => ({
  id: `statiq-${idx}`,
  type: "charging",
  lat: s.lat,
  lng: s.lng,
  name: s.name,
  address: "Statiq EV Station",
}));

const allLocations = [
  { id: "1", type: "charging", lat: 28.638807, lng: 77.085715, name: "EV Fast Charger",       address: "West Delhi" },
  { id: "3", type: "charging", lat: 28.600843, lng: 77.087613, name: "Supercharger IndianOil", address: "North Delhi" },
  { id: "4", type: "spare",    lat: 28.627204, lng: 77.071554, name: "EV Repair and Spare",    address: "West Delhi" },
  ...statiqLocations,
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

  const drawRoute = useCallback(async (originStr: string, destStr: string): Promise<{ ok: boolean; distanceKm?: number; coords?: [number, number][] }> => {
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
      return { ok: true, distanceKm: (data.routes[0].distance ?? 0) / 1000, coords };
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
    <div className="p-4 space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <div className="flex items-center gap-2 text-amber-700 mb-1.5">
          <IndianRupee size={15} />
          <p className="text-sm font-semibold">Estimate Details</p>
        </div>
        <p className="text-xs text-amber-900/80 leading-relaxed">
          {routeDistanceKm === null ? "Currently showing a default 10km estimate. Update the route to compare actual EV charging costs." : "Calculated based on your specific route distance."}
        </p>
      </div>

      {/* <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Use my prices</p>
            <p className="text-xs text-slate-500 mt-0.5">Override default rates.</p>
          </div>
          <button
            onClick={() => setCustomPricesEnabled((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              customPricesEnabled ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                customPricesEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {customPricesEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">EV (Rs/kWh)</span>
              <input value={evRatePerKwh} onChange={(e) => setEvRatePerKwh(e.target.value)} inputMode="decimal"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Petrol (Rs/L)</span>
              <input value={petrolPricePerL} onChange={(e) => setPetrolPricePerL(e.target.value)} inputMode="decimal"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel (Rs/L)</span>
              <input value={dieselPricePerL} onChange={(e) => setDieselPricePerL(e.target.value)} inputMode="decimal"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </label>
          </div>
        )}
      </div> */}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Distance</p>
          <p className="text-2xl font-bold text-slate-900">{distanceKm.toFixed(1)} km</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 shadow-sm">
          <p className="text-xs font-medium text-emerald-700 mb-1">EV Savings</p>
          <p className="text-2xl font-bold text-emerald-600">Rs {fmt(savingsVsFossil)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-bold text-slate-900">EV</p>
            <p className="text-xs text-slate-500 mt-0.5">Rs {activeEvRate}/kWh</p>
          </div>
          <p className="text-lg font-bold text-emerald-600">Rs {fmt(evCost)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-bold text-slate-900">Petrol</p>
            <p className="text-xs text-slate-500 mt-0.5">Rs {activePetrolPrice}/L</p>
          </div>
          <p className="text-lg font-bold text-rose-600">Rs {fmt(petrolCost)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-bold text-slate-900">Diesel</p>
            <p className="text-xs text-slate-500 mt-0.5">Rs {activeDieselPrice}/L</p>
          </div>
          <p className="text-lg font-bold text-slate-600">Rs {fmt(dieselCost)}</p>
        </div>
      </div>
    </div>
  );
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isLocationNearRoute(locLat: number, locLng: number, routeCoords: [number, number][], maxDistKm = 5) {
  if (!routeCoords || routeCoords.length === 0) return true;
  for (const [lat, lng] of routeCoords) {
    if (getDistanceFromLatLonInKm(locLat, locLng, lat, lng) <= maxDistKm) return true;
  }
  return false;
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
  const [routeSubTab, setRouteSubTab] = useState<"points" | "cost">("points");

  const placeTypeFilter = (
    <>
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
        {(["all", "charging", "spare"] as const).map((t) => (
          <button key={t} onClick={() => { setFilterType(t); setSelectedId(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              filterType === t
                ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}>
            {t === "charging" && <Zap size={13} className={filterType === t ? "text-emerald-500" : ""} />}
            {t === "spare"    && <Wrench size={13} className={filterType === t ? "text-amber-500" : ""} />}
            {t === "all" ? "All Points" : t === "charging" ? "Charging" : "Services"}
          </button>
        ))}
      </div>
    </>
  );

  const locationList = (
    <>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
        {displayedLocations.length} match{displayedLocations.length !== 1 ? "es" : ""} found
      </p>
      {displayedLocations.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <MapPin className="mx-auto h-8 w-8 mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No locations found.</p>
        </div>
      ) : displayedLocations.map((loc) => (
        <div key={loc.id} onClick={() => setSelectedId(selectedId === loc.id ? null : loc.id)}
          className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedId === loc.id ? "bg-blue-50 border-blue-200 shadow-md" : "bg-white border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${loc.type === "charging" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
              {loc.type === "charging" ? <Zap size={16} /> : <Wrench size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 truncate">{loc.name}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{loc.address}</p>
            </div>
          </div>
          {selectedId === loc.id && (
            <div className="flex gap-2 mt-4 ml-11">
              <button onClick={(e) => { e.stopPropagation(); onRouteHere(loc); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg shadow-sm transition-all active:scale-95">
                <Navigation size={14} /> Route
              </button>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 rounded-lg shadow-sm transition-all active:scale-95">
                <MapPin size={14} /> Maps
              </a>
              <button onClick={(e) => { e.stopPropagation(); onShare(loc); }}
                className="px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg shadow-sm transition-all active:scale-95">
                <Share2 size={15} />
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-white">
      {/* Header with optional close */}
      <div className="flex items-center border-b border-slate-200 shrink-0 bg-white">
        {(["route", "filters"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors relative ${
              activeTab === tab
                ? "text-blue-600"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}>
            {tab === "route"   && <><Navigation size={14} /> Filter</>}
            {tab === "filters" && <><Filter size={14} /> Points</>}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
        ))}
        {onClose && (
          <button onClick={onClose} className="px-5 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronDown size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-50/50">
        {/* Route planner */}
        {activeTab === "route" && (
          <>
            <div className="p-5 bg-white border-b border-slate-200 space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Starting point</label>
                  <div className="flex gap-2">
                    <button onClick={onPickMyLocation} className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                      My Location
                    </button>
                    <button onClick={() => setSelectingPoint(selectingPoint === "origin" ? null : "origin")}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${selectingPoint === "origin" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {selectingPoint === "origin" ? "Click map…" : "Pick on map"}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${selectingPoint === "origin" ? "bg-blue-400 animate-pulse" : "bg-blue-500"}`} />
                  <input value={originInput} onChange={(e) => setOriginInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onFindRoute()}
                    placeholder="e.g. Connaught Place, Delhi"
                    className={`w-full bg-slate-50 border rounded-xl py-3 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-colors shadow-inner ${selectingPoint === "origin" ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"}`} />
                </div>
              </div>

              <div className="flex justify-center -my-3 relative z-10">
                <button onClick={() => { setOriginInput(destInput); setDestInput(originInput); }}
                  className="text-slate-500 hover:text-blue-600 bg-white border border-slate-200 shadow-sm hover:shadow rounded-full p-2 transition-all active:scale-95" title="Swap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
                  </svg>
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Destination</label>
                  <button onClick={() => setSelectingPoint(selectingPoint === "dest" ? null : "dest")}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${selectingPoint === "dest" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {selectingPoint === "dest" ? "Click map…" : "Pick on map"}
                  </button>
                </div>
                <div className="relative">
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${selectingPoint === "dest" ? "bg-emerald-400 animate-pulse" : "bg-emerald-500"}`} />
                  <input value={destInput} onChange={(e) => setDestInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onFindRoute()}
                    placeholder="e.g. Noida Sector 18"
                    className={`w-full bg-slate-50 border rounded-xl py-3 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-colors shadow-inner ${selectingPoint === "dest" ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"}`} />
                </div>
              </div>

              {routeError && (
                <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">{routeError}</p>
              )}

              <div className="flex gap-2 pt-1">
                {!routeActive ? (
                  <button onClick={onFindRoute} disabled={routeLoading || !originInput.trim() || !destInput.trim()}
                    className="flex-1 bg-slate-900 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
                    {routeLoading ? <><Loader2 size={18} className="animate-spin" /> Finding…</> : <><Search size={18} /> Find Route</>}
                  </button>
                ) : (
                  <button onClick={onClearRoute} className="flex-1 bg-white hover:bg-rose-50 text-rose-500 text-sm font-bold py-3.5 rounded-xl border border-slate-200 hover:border-rose-200 shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                    <X size={18} /> Cancel Route
                  </button>
                )}
              </div>
            </div>
            {routeActive && (
              <div className="bg-white border-t border-slate-200">
                <div className="flex border-b border-slate-100 shrink-0">
                  <button onClick={() => setRouteSubTab("points")} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${routeSubTab === "points" ? "border-emerald-600 text-emerald-600 bg-emerald-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                    <MapPin size={16} className="inline mr-1 -mt-0.5" /> Route Details
                  </button>
                  {/* HIDDEN TEMPORARILY
                  <button onClick={() => setRouteSubTab("cost")} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors relative flex items-center justify-center gap-2 ${routeSubTab === "cost" ? "border-emerald-600 text-emerald-600 bg-emerald-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}>
                    <IndianRupee size={16} /> Trip Cost
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </button>
                  */}
                </div>
                <div className="p-4 bg-slate-50/50 min-h-[300px]">
                  {routeSubTab === "points" && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden pb-2">
                      <div className="px-4 py-3 mb-1">
                        {placeTypeFilter}
                      </div>
                      <div className="px-4 space-y-2 pb-2">
                        {locationList}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Points */}
        {activeTab === "filters" && (
          <div className="p-4 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              {placeTypeFilter}
            </div>
            <div className="space-y-2">
              {locationList}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-400 shrink-0 text-center">
        Map © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline decoration-slate-300">OpenStreetMap</a> · Routing by <a href="https://project-osrm.org" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline decoration-slate-300">OSRM</a>
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
  const [routeCoords, setRouteCoords]        = useState<[number, number][] | null>(null);
  const [mapSearchQuery, setMapSearchQuery]  = useState("");
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchError, setMapSearchError]  = useState("");
  const [sheetOpen, setSheetOpen]           = useState(false); // mobile bottom sheet
  const [userLocation, setUserLocation]     = useState<[number, number] | null>(null);

  const mapSearchSuggestions = mapSearchQuery.trim()
    ? getMapSearchSuggestions(mapSearchQuery)
    : [];

  const displayedLocations = allLocations.filter((l) => {
    if (filterType !== "all" && l.type !== filterType) return false;
    if (routeActive && routeCoords) {
      return isLocationNearRoute(l.lat, l.lng, routeCoords, 1); // 1km radius
    }
    return true;
  });
  
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
      if (result.coords) setRouteCoords(result.coords);
      setActiveTab("route");
      setSheetOpen(false);
    }
    else setRouteError("Could not find a route. Try more specific addresses.");
  };

  const handleClearRoute = () => {
    clearRoute();
    setRouteActive(false);
    setRouteDistanceKm(null);
    setRouteCoords(null);
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
      if (result.coords) setRouteCoords(result.coords);
      setActiveTab("route");
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
    <div className="flex flex-row flex-grow h-[calc(100vh-80px)] bg-slate-100 overflow-hidden relative">

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex w-[400px] bg-white border-r border-slate-200 flex-col z-20 shadow-xl shrink-0">
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
            onClick={() => { setActiveTab("route"); setSheetOpen(true); }}
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
              className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-slate-200 flex flex-col overflow-hidden"
              style={{ height: "85vh" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-4 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none bg-white">
                <div className="w-12 h-1.5 rounded-full bg-slate-200" />
              </div>

              <SidebarContent {...sidebarProps} onClose={() => setSheetOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

