"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Zap, Wrench, Navigation, MapPin, Search, Filter, Share2, X,
} from "lucide-react";

// ── Location data ─────────────────────────────────────────────────────────────

const allLocations = [
  { id: "1", type: "charging", lat: 28.638807, lng: 77.085715, name: "EV Fast Charger",           address: "West Delhi" },
  { id: "3", type: "charging", lat: 28.600843, lng: 77.087613, name: "Supercharger IndianOil",     address: "North Delhi" },
  { id: "4", type: "spare",    lat: 28.627204, lng: 77.071554, name: "EV Repair and Spare",        address: "West Delhi" },
];

type Location = typeof allLocations[0];

// ── Leaflet map (loaded dynamically — SSR safe) ───────────────────────────────

function useLeaflet(
  containerRef: React.RefObject<HTMLDivElement | null>,
  locations: Location[],
  selectedId: string | null,
  onSelect: (loc: Location) => void,
  onMapClick: (lat: number, lng: number) => void,
) {
  const mapRef    = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const routeRef  = useRef<import("leaflet").Polyline | null>(null);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    // Guard against React strict-mode double-invoke: if Leaflet already
    // stamped this node, remove the old instance first.
    const container = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (container._leaflet_id) {
      // Previous instance wasn't cleaned up — remove it
      try { (window as Window & { L?: { map: (el: HTMLElement) => { remove: () => void } } }).L?.map(container).remove(); } catch { /* ignore */ }
      delete container._leaflet_id;
    }

    import("leaflet").then((L) => {
      if (mapRef.current) return; // another render beat us to it
      if (!containerRef.current) return;

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [28.603, 77.072],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OSM tiles — completely free, no key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e) => onMapClick(e.latlng.lat, e.latlng.lng));

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

  // Sync markers
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      const map = mapRef.current!;

      // Remove old markers not in current list
      markersRef.current.forEach((m, id) => {
        if (!locations.find((l) => l.id === id)) {
          m.remove();
          markersRef.current.delete(id);
        }
      });

      locations.forEach((loc) => {
        const isSelected = loc.id === selectedId;
        const color = loc.type === "charging" ? "#10b981" : "#f59e0b";
        const size  = isSelected ? 36 : 28;

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
            background:${color};border:3px solid white;
            transform:rotate(-45deg);
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
            transition:all 0.2s;
          "></div>`,
          iconSize:   [size, size],
          iconAnchor: [size / 2, size],
        });

        const existing = markersRef.current.get(loc.id);
        if (existing) {
          existing.setIcon(icon);
        } else {
          const marker = L.marker([loc.lat, loc.lng], { icon })
            .addTo(map)
            .on("click", () => onSelect(loc));
          markersRef.current.set(loc.id, marker);
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, selectedId]);

  // Pan to selected
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const loc = allLocations.find((l) => l.id === selectedId);
    if (loc) mapRef.current.panTo([loc.lat, loc.lng], { animate: true });
  }, [selectedId]);

  // Draw route polyline
  const drawRoute = useCallback(async (originStr: string, destStr: string) => {
    if (!mapRef.current) return false;
    const L = await import("leaflet");

    // Parse "lat, lng" strings or geocode via Nominatim
    const parseCoord = async (s: string): Promise<[number, number] | null> => {
      const m = s.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (m) return [parseFloat(m[1]), parseFloat(m[2])];
      // Nominatim geocoding (OSM, free)
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(s)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await r.json() as { lat: string; lon: string }[];
      if (!data[0]) return null;
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    };

    const [origin, dest] = await Promise.all([parseCoord(originStr), parseCoord(destStr)]);
    if (!origin || !dest) return false;

    // OSRM routing (free, no key)
    const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json() as { routes?: { geometry: { coordinates: [number, number][] } }[] };
    if (!data.routes?.[0]) return false;

    routeRef.current?.remove();
    const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    routeRef.current = L.polyline(coords, { color: "#3b82f6", weight: 5, opacity: 0.8 }).addTo(mapRef.current);
    mapRef.current.fitBounds(routeRef.current.getBounds(), { padding: [40, 40] });
    return true;
  }, []);

  const clearRoute = useCallback(() => {
    routeRef.current?.remove();
    routeRef.current = null;
  }, []);

  return { drawRoute, clearRoute };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FullMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab]           = useState<"route" | "filters">("route");
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [filterType, setFilterType]         = useState<"all" | "charging" | "spare">("all");
  const [originInput, setOriginInput]       = useState("");
  const [destInput, setDestInput]           = useState("");
  const [selectingPoint, setSelectingPoint] = useState<"origin" | "dest" | null>(null);
  const [routeActive, setRouteActive]       = useState(false);
  const [routeError, setRouteError]         = useState("");

  const selectedLoc = allLocations.find((l) => l.id === selectedId) ?? null;

  const displayedLocations = allLocations.filter(
    (l) => filterType === "all" || l.type === filterType
  );

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!selectingPoint) return;
    const coord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    if (selectingPoint === "origin") setOriginInput(coord);
    else setDestInput(coord);
    setSelectingPoint(null);
  }, [selectingPoint]);

  const { drawRoute, clearRoute } = useLeaflet(
    containerRef, displayedLocations, selectedId,
    (loc) => setSelectedId(loc.id),
    handleMapClick,
  );

  const handleFindRoute = async () => {
    if (!originInput || !destInput) return;
    setRouteError("");
    const ok = await drawRoute(originInput, destInput);
    if (ok) setRouteActive(true);
    else setRouteError("Could not find a route. Check your inputs.");
  };

  const handleClearRoute = () => {
    clearRoute();
    setRouteActive(false);
    setOriginInput("");
    setDestInput("");
    setRouteError("");
  };

  const handleShare = async (loc: Location) => {
    const url = `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}&zoom=16`;
    if (navigator.share) {
      await navigator.share({ title: loc.name, text: loc.address, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert("Location link copied!");
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-grow h-[calc(100vh-72px)] bg-[#0f1115] overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="w-full md:w-[380px] bg-[#1a1d24] md:border-r border-b md:border-b-0 border-white/10 flex flex-col z-20 shadow-2xl flex-shrink-0">
        {/* Tabs */}
        <div className="flex border-b border-white/10 shrink-0">
          {(["route", "filters"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab
                  ? tab === "route"
                    ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5"
                    : "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}>
              {tab === "route" ? <><Navigation size={15} /> Route</> : <><Filter size={15} /> Filters</>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Route planner */}
          {activeTab === "route" && (
            <div className="p-5 border-b border-white/10 space-y-4">
              {/* Origin */}
              <div>
                <label className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Starting point</span>
                  <button onClick={() => setSelectingPoint(selectingPoint === "origin" ? null : "origin")}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${selectingPoint === "origin" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                    {selectingPoint === "origin" ? "Click map…" : "Pick on map"}
                  </button>
                </label>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${selectingPoint === "origin" ? "bg-blue-400 animate-pulse" : "bg-blue-500"}`} />
                  <input value={originInput} onChange={(e) => setOriginInput(e.target.value)}
                    placeholder="e.g. Connaught Place, Delhi"
                    className={`w-full bg-black/30 border rounded-xl py-3 pl-8 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors ${selectingPoint === "origin" ? "border-blue-500" : "border-white/10 focus:border-blue-500/50"}`} />
                </div>
              </div>

              {/* Dest */}
              <div>
                <label className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Destination</span>
                  <button onClick={() => setSelectingPoint(selectingPoint === "dest" ? null : "dest")}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${selectingPoint === "dest" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                    {selectingPoint === "dest" ? "Click map…" : "Pick on map"}
                  </button>
                </label>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${selectingPoint === "dest" ? "bg-emerald-400 animate-pulse" : "bg-emerald-500"}`} />
                  <input value={destInput} onChange={(e) => setDestInput(e.target.value)}
                    placeholder="e.g. Noida Sector 18"
                    className={`w-full bg-black/30 border rounded-xl py-3 pl-8 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none transition-colors ${selectingPoint === "dest" ? "border-emerald-500" : "border-white/10 focus:border-emerald-500/50"}`} />
                </div>
              </div>

              {routeError && <p className="text-xs text-rose-400">{routeError}</p>}

              <div className="flex gap-2">
                <button onClick={handleFindRoute}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                  <Search size={16} /> Find Route
                </button>
                {routeActive && (
                  <button onClick={handleClearRoute}
                    className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filters */}
          {activeTab === "filters" && (
            <div className="p-5 border-b border-white/10">
              <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                {(["all", "charging", "spare"] as const).map((t) => (
                  <button key={t} onClick={() => { setFilterType(t); setSelectedId(null); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      filterType === t
                        ? t === "charging" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : t === "spare"   ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
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
              <div className="text-center py-10 text-gray-600">
                <MapPin className="mx-auto h-7 w-7 mb-2 opacity-30" />
                <p className="text-sm">No locations match.</p>
              </div>
            ) : displayedLocations.map((loc) => (
              <div key={loc.id} onClick={() => setSelectedId(loc.id === selectedId ? null : loc.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedId === loc.id
                    ? "bg-white/10 border-white/20 shadow-lg"
                    : "bg-white/5 border-transparent hover:bg-white/8"
                }`}>
                <div className="flex items-center gap-2 font-medium text-white mb-1">
                  {loc.type === "charging"
                    ? <Zap size={15} className="text-emerald-400 shrink-0" />
                    : <Wrench size={15} className="text-amber-400 shrink-0" />}
                  <span className="truncate text-sm">{loc.name}</span>
                </div>
                <p className="text-xs text-gray-400 ml-5">{loc.address}</p>

                {selectedId === loc.id && (
                  <div className="flex gap-2 mt-3 ml-5">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                      <Navigation size={13} /> Directions
                    </a>
                    <button onClick={() => handleShare(loc)}
                      className="px-3 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg transition-colors">
                      <Share2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* OSM attribution note */}
        <div className="px-5 py-3 border-t border-white/5 text-[10px] text-gray-600">
          Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 underline">OpenStreetMap</a> contributors · Routing by OSRM
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        {/* Leaflet CSS */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

        <div ref={containerRef} className="absolute inset-0 z-0" />

        {/* Selecting point overlay */}
        {selectingPoint && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/20 shadow-xl pointer-events-none">
            Click anywhere on the map to set {selectingPoint === "origin" ? "starting point" : "destination"}
          </motion.div>
        )}
      </div>
    </div>
  );
}
