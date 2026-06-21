"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Zap, Wrench, MapPin, Search, Navigation, Share2, Loader2, X } from "lucide-react";

// ── Location data ─────────────────────────────────────────────────────────────
import statiqStationsData from "../../statiq_stations.json";

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

// ── Distance calculations ─────────────────────────────────────────────────────

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

// ── Leaflet hook ──────────────────────────────────────────────────────────────

function useLeafletMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef     = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const centerMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const circleRef = useRef<import("leaflet").Circle | null>(null);
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
      centerMarkerRef.current = null;
      circleRef.current = null;
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

  const syncCenter = useCallback((lat: number | null, lng: number | null, radiusKm: number = 5) => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      const map = mapRef.current!;
      if (centerMarkerRef.current) {
        centerMarkerRef.current.remove();
        centerMarkerRef.current = null;
      }
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
      
      if (lat !== null && lng !== null) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 15px rgba(59,130,246,0.8);animation:user-pulse 2s infinite"></div>
                 <style>@keyframes user-pulse { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.7); } 70% { box-shadow: 0 0 0 15px rgba(59,130,246,0); } 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } }</style>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        centerMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
        circleRef.current = L.circle([lat, lng], {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          radius: radiusKm * 1000,
          weight: 2,
          dashArray: '5, 5'
        }).addTo(map);
        
        // Fit bounds to circle
        map.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
      }
    });
  }, []);

  const panTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.panTo([lat, lng], { animate: true });
  }, []);

  return { onClickRef, syncMarkers, syncCenter, panTo };
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

async function geocodeLocation(query: string): Promise<[number, number] | null> {
  const m = query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
      { headers: { "Accept-Language": "en", "User-Agent": "EVPULSE/1.0" } }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await r.json() as any[];
    return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
  } catch {
    return null;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NearMeMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [centerPoint, setCenterPoint] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const radiusKm = 5; // 5 km radius

  // Filter locations within 5km of centerPoint
  const displayedLocations = allLocations.filter((l) => {
    if (!centerPoint) return false;
    const dist = getDistanceFromLatLonInKm(centerPoint[0], centerPoint[1], l.lat, l.lng);
    return dist <= radiusKm;
  });

  const { onClickRef, syncMarkers, syncCenter, panTo } = useLeafletMap(containerRef);

  // Sync markers and center circle
  useEffect(() => {
    syncCenter(centerPoint?.[0] ?? null, centerPoint?.[1] ?? null, radiusKm);
    syncMarkers(displayedLocations, selectedId, (loc) => {
      setSelectedId((prev) => prev === loc.id ? null : loc.id);
      panTo(loc.lat, loc.lng);
    });
  }, [centerPoint, displayedLocations, selectedId, syncMarkers, syncCenter, panTo]);

  // Click on map to set center
  useEffect(() => {
    onClickRef.current = (lat, lng) => {
      const coord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSearchInput(coord);
      setCenterPoint([lat, lng]);
      setErrorMsg("");
    };
  }, [onClickRef]);

  // Handle Search / Coordinates Input
  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setErrorMsg("");
    setSearchLoading(true);
    const coords = await geocodeLocation(searchInput.trim());
    setSearchLoading(false);
    if (coords) {
      setCenterPoint(coords);
      setSearchInput(`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`);
    } else {
      setErrorMsg("Location or coordinates not found. Try 'lat, lng'.");
    }
  };

  // Get User Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }
    setErrorMsg("");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenterPoint([lat, lng]);
        setSearchInput(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      },
      () => {
        setIsLocating(false);
        setErrorMsg("Unable to retrieve your location");
      }
    );
  };

  const handleShare = async (loc: Location) => {
    const url = `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}&zoom=16`;
    if (navigator.share) await navigator.share({ title: loc.name, text: loc.address, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container taking full width and height */}
      <div ref={containerRef} className="absolute inset-0 z-0 bg-slate-100" />

      {/* Floating Center Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] sm:w-[420px] max-w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl flex flex-col max-h-[calc(100vh-140px)] border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200/60 bg-white/50 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <MapPin className="text-emerald-500" /> Stations Near Me
          </h2>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <input 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. 28.6139, 77.2090"
                className="flex-1 bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm"
              />
              <button 
                onClick={handleSearch}
                disabled={searchLoading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                {searchLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              </button>
            </div>
            
            <button 
              onClick={handleGetLocation}
              disabled={isLocating}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              {isLocating ? <><Loader2 size={18} className="animate-spin" /> Locating...</> : <><Navigation size={18} /> Use My Location</>}
            </button>

            {errorMsg && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50/80 border border-rose-200 rounded-lg px-4 py-3 mt-2">{errorMsg}</p>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {!centerPoint ? (
            <div className="text-center py-8">
              <Navigation className="mx-auto h-8 w-8 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Provide your location to see<br/>stations within 5km.</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                {displayedLocations.length} station{displayedLocations.length !== 1 ? "s" : ""} within 5km
              </p>
              
              {displayedLocations.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-8 w-8 mb-3 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No stations found nearby.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedLocations.map((loc) => {
                    const dist = getDistanceFromLatLonInKm(centerPoint[0], centerPoint[1], loc.lat, loc.lng);
                    return (
                      <div key={loc.id} onClick={() => { setSelectedId(selectedId === loc.id ? null : loc.id); panTo(loc.lat, loc.lng); }}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedId === loc.id ? "bg-emerald-50/80 border-emerald-300 shadow-md" : "bg-white border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md"}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${loc.type === "charging" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                            {loc.type === "charging" ? <Zap size={18} /> : <Wrench size={18} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-slate-900 truncate pr-2 text-[15px]">{loc.name}</p>
                              <span className="text-[11px] font-bold text-emerald-700 shrink-0 bg-emerald-100/80 px-2.5 py-1 rounded-full">{dist.toFixed(1)} km</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{loc.address}</p>
                          </div>
                        </div>
                        {selectedId === loc.id && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200/60">
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                              target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all active:scale-95">
                              <Navigation size={14} /> Directions
                            </a>
                            <button onClick={(e) => { e.stopPropagation(); handleShare(loc); }}
                              className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center">
                              <Share2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
