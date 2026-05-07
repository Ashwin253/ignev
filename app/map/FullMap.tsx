"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Wrench, Navigation, MapPin, Search, Filter,
  Share2, X, Loader2, SlidersHorizontal, ChevronDown,
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

  const drawRoute = useCallback(async (originStr: string, destStr: string): Promise<boolean> => {
    if (!mapRef.current) return false;
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
    if (!origin || !dest) return false;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json() as { routes?: { geometry: { coordinates: [number, number][] } }[] };
      if (!data.routes?.[0]) return false;
      routeRef.current?.remove();
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      routeRef.current = L.polyline(coords, { color: "#3b82f6", weight: 5, opacity: 0.85 }).addTo(mapRef.current!);
      mapRef.current!.fitBounds(routeRef.current.getBounds(), { padding: [60, 60] });
      return true;
    } catch { return false; }
  }, []);

  const clearRoute = useCallback(() => { routeRef.current?.remove(); routeRef.current = null; }, []);

  return { onClickRef, syncMarkers, panTo, drawRoute, clearRoute };
}

// ── Sidebar panel (shared between desktop sidebar and mobile sheet) ───────────

function SidebarContent({
  activeTab, setActiveTab,
  originInput, setOriginInput,
  destInput, setDestInput,
  selectingPoint, setSelectingPoint,
  routeActive, routeLoading, routeError,
  onFindRoute, onClearRoute,
  filterType, setFilterType,
  selectedId, setSelectedId,
  displayedLocations,
  onRouteHere, onShare,
  onClose,
}: {
  activeTab: "route" | "filters";
  setActiveTab: (t: "route" | "filters") => void;
  originInput: string; setOriginInput: (v: string) => void;
  destInput: string;   setDestInput:   (v: string) => void;
  selectingPoint: "origin" | "dest" | null;
  setSelectingPoint: (v: "origin" | "dest" | null) => void;
  routeActive: boolean; routeLoading: boolean; routeError: string;
  onFindRoute: () => void; onClearRoute: () => void;
  filterType: "all" | "charging" | "spare";
  setFilterType: (v: "all" | "charging" | "spare") => void;
  selectedId: string | null;
  setSelectedId: (v: string | null) => void;
  displayedLocations: Location[];
  onRouteHere: (loc: Location) => void;
  onShare: (loc: Location) => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with optional close */}
      <div className="flex items-center border-b border-white/10 shrink-0">
        {(["route", "filters"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === tab
                ? tab === "route" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                  : "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}>
            {tab === "route" ? <><Navigation size={15} /> Route</> : <><Filter size={15} /> Filters</>}
          </button>
        ))}
        {onClose && (
          <button onClick={onClose} className="px-4 text-gray-400 hover:text-white transition-colors">
            <ChevronDown size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Route planner */}
        {activeTab === "route" && (
          <div className="p-5 border-b border-white/10 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-gray-400">Starting point</label>
                <button onClick={() => setSelectingPoint(selectingPoint === "origin" ? null : "origin")}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${selectingPoint === "origin" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                  {selectingPoint === "origin" ? "Click map…" : "Pick on map"}
                </button>
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

        {/* Filters */}
        {activeTab === "filters" && (
          <div className="p-5 border-b border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Station type</p>
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

        {/* Location list */}
        <div className="p-5 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            {displayedLocations.length} location{displayedLocations.length !== 1 ? "s" : ""}
          </p>
          {displayedLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <MapPin className="mx-auto h-7 w-7 mb-2 opacity-30" />
              <p className="text-sm">No locations match.</p>
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
                    <Navigation size={13} /> Route here
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

  const [activeTab, setActiveTab]           = useState<"route" | "filters">("route");
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [filterType, setFilterType]         = useState<"all" | "charging" | "spare">("all");
  const [originInput, setOriginInput]       = useState("");
  const [destInput, setDestInput]           = useState("");
  const [selectingPoint, setSelectingPoint] = useState<"origin" | "dest" | null>(null);
  const [routeActive, setRouteActive]       = useState(false);
  const [routeLoading, setRouteLoading]     = useState(false);
  const [routeError, setRouteError]         = useState("");
  const [sheetOpen, setSheetOpen]           = useState(false); // mobile bottom sheet

  const displayedLocations = allLocations.filter(
    (l) => filterType === "all" || l.type === filterType
  );

  const { onClickRef, syncMarkers, panTo, drawRoute, clearRoute } = useLeafletMap(containerRef);

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
      setSheetOpen(true); // open sheet to show location details on mobile
    });
  }, [displayedLocations, selectedId, syncMarkers]);

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
    const ok = await drawRoute(originInput.trim(), destInput.trim());
    setRouteLoading(false);
    if (ok) { setRouteActive(true); setSheetOpen(false); }
    else setRouteError("Could not find a route. Try more specific addresses.");
  };

  const handleClearRoute = () => {
    clearRoute();
    setRouteActive(false);
    setOriginInput("");
    setDestInput("");
    setRouteError("");
  };

  const handleRouteHere = (loc: Location) => {
    setDestInput(`${loc.lat}, ${loc.lng}`);
    setActiveTab("route");
  };

  const handleShare = async (loc: Location) => {
    const url = `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}&zoom=16`;
    if (navigator.share) await navigator.share({ title: loc.name, text: loc.address, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  const sidebarProps = {
    activeTab, setActiveTab,
    originInput, setOriginInput,
    destInput, setDestInput,
    selectingPoint, setSelectingPoint,
    routeActive, routeLoading, routeError,
    onFindRoute: handleFindRoute,
    onClearRoute: handleClearRoute,
    filterType, setFilterType,
    selectedId, setSelectedId,
    displayedLocations,
    onRouteHere: handleRouteHere,
    onShare: handleShare,
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
        <button
          onClick={() => setSheetOpen(true)}
          className="md:hidden absolute bottom-6 left-4 z-20 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-full shadow-[0_4px_20px_rgba(59,130,246,0.5)] transition-all active:scale-95"
        >
          <SlidersHorizontal size={18} />
          <span className="text-sm">Route &amp; Filter</span>
          {routeActive && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
        </button>
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
              className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1a1d24] rounded-t-3xl shadow-2xl border-t border-white/10 flex flex-col"
              style={{ maxHeight: "80vh" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
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
