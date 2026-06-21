"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Zap, Wrench, MapPin, Search, Navigation, Share2, Loader2, PhoneCall, Download } from "lucide-react";
import Map, { Marker, Source, Layer, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import digipin from "digipinjs-lib";

// ── Location data ─────────────────────────────────────────────────────────────
import statiqStationsData from "../../statiq_stations.json";

const statiqLocations = statiqStationsData.map((s: { lat: number; lng: number; name: string }, idx: number) => ({
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

function createGeoJSONCircle(center: [number, number], radiusInKm: number, points: number = 64) {
  const coords = { latitude: center[0], longitude: center[1] };
  const km = radiusInKm;
  const ret = [];
  const distanceX = km / (111.320 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  let theta, x, y;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [ret],
        },
        properties: {},
      },
    ],
  };
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
    const data = await r.json() as Array<{ lat: string; lon: string }>;
    return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
  } catch {
    return null;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

const defaultCenter = { lat: 28.615, lng: 77.079 };

export default function NearMeMap() {
  const mapRef = useRef<MapRef>(null);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [centerPoint, setCenterPoint] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"charging" | "spare">("charging");

  // PWA Install State
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallTooltip, setShowInstallTooltip] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallTooltip(true);
      setTimeout(() => setShowInstallTooltip(false), 5000);
    }
  };

  const radiusKm = 5; // 5 km radius

  const activeCenter: [number, number] = useMemo(() => centerPoint || [defaultCenter.lat, defaultCenter.lng], [centerPoint]);

  // Filter locations by radius and active tab
  const displayedLocations = useMemo(() => {
    return allLocations.filter((l) => {
      if (l.type !== activeTab) return false;
      const dist = getDistanceFromLatLonInKm(activeCenter[0], activeCenter[1], l.lat, l.lng);
      return dist <= radiusKm;
    });
  }, [activeCenter, activeTab]);

  const panTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
  }, []);

  const handleMapClick = (e: { lngLat: { lat: number; lng: number } }) => {
    if (e.lngLat) {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      const coord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setSearchInput(coord);
      setCenterPoint([lat, lng]);
      setErrorMsg("");
      panTo(lat, lng);
    }
  };

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
      panTo(coords[0], coords[1]);
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
        panTo(lat, lng);
      },
      () => {
        setIsLocating(false);
        setErrorMsg("Unable to retrieve your location");
      }
    );
  };

  const handleShare = async (loc: Location) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
    if (navigator.share) await navigator.share({ title: loc.name, text: loc.address, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  const circleGeojson = centerPoint ? createGeoJSONCircle(centerPoint, radiusKm) : null;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Map Container taking the upper view */}
      <div className="flex-1 w-full relative z-0">
        <Map
          ref={mapRef}
          initialViewState={{
            latitude: centerPoint ? centerPoint[0] : defaultCenter.lat,
            longitude: centerPoint ? centerPoint[1] : defaultCenter.lng,
            zoom: 13,
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          onClick={handleMapClick}
          interactiveLayerIds={[]}
          style={{ width: "100%", height: "100%" }}
        >
          {centerPoint && circleGeojson && (
            <>
              <Source id="radius-source" type="geojson" data={circleGeojson}>
                <Layer
                  id="radius-layer-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#3b82f6",
                    "fill-opacity": 0.1,
                  }}
                />
                <Layer
                  id="radius-layer-stroke"
                  type="line"
                  paint={{
                    "line-color": "#3b82f6",
                    "line-width": 2,
                    "line-dasharray": [2, 2],
                  }}
                />
              </Source>
              
              <Marker latitude={centerPoint[0]} longitude={centerPoint[1]} anchor="center">
                <div className="w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
              </Marker>
            </>
          )}

          {displayedLocations.map((loc) => (
            <Marker
              key={loc.id}
              latitude={loc.lat}
              longitude={loc.lng}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedId(selectedId === loc.id ? null : loc.id);
                panTo(loc.lat, loc.lng);
              }}
            >
              <div 
                className={`flex items-center justify-center cursor-pointer transition-transform duration-300 ease-out drop-shadow-md ${selectedId === loc.id ? 'scale-110 z-50' : 'scale-100'} ${loc.type === "charging" ? "text-emerald-500" : "text-amber-500"}`}
                style={{ transformOrigin: "bottom center" }}
              >
                <MapPin size={selectedId === loc.id ? 38 : 32} fill="currentColor" className="text-white" />
                <div className="absolute top-[25%] left-1/2 -translate-x-1/2 text-white">
                  {loc.type === "charging" ? <Zap size={selectedId === loc.id ? 14 : 12} /> : <Wrench size={selectedId === loc.id ? 14 : 12} />}
                </div>
              </div>
            </Marker>
          ))}
        </Map>
      </div>

      {/* Floating Add to Home Screen Button (Right Side) */}
      <div className="absolute right-4 bottom-[calc(45vh+20px)] md:bottom-[420px] z-50 flex flex-col items-end group">
        <button 
          onClick={handleInstallClick}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-transform active:scale-95 flex flex-row-reverse items-center justify-center"
        >
          <Download size={24} />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:mr-2 transition-all duration-300 ease-in-out font-bold">Install App</span>
        </button>
        {showInstallTooltip && (
          <div className="mt-2 bg-slate-900 text-white text-xs font-bold p-3 rounded-xl shadow-lg w-48 relative animate-in fade-in zoom-in duration-200">
            <div className="absolute -top-2 right-5 w-4 h-4 bg-slate-900 transform rotate-45"></div>
            To install, tap Share and select &quot;Add to Home Screen&quot;.
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className="z-10 w-full md:w-[600px] md:mx-auto md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2 bg-white/95 backdrop-blur-md rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col h-[45vh] md:h-auto md:max-h-[80vh] border-t md:border border-slate-200">
        
        {/* Header and Tabs */}
        <div className="p-4 border-b border-slate-200/60 bg-white/50 shrink-0 rounded-t-3xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="text-emerald-500" /> Near Me
            </h2>
            <button
              onClick={() => {
                if (!centerPoint) {
                  setErrorMsg("Please locate yourself first!");
                  return;
                }
                const text = `I need assistance here! My DIGIPIN is: ${digipin.encode(centerPoint[0], centerPoint[1])}\n\nCoordinates: ${centerPoint[0].toFixed(5)}, ${centerPoint[1].toFixed(5)}\n\nVerify on IndiaPost portal: https://dac.indiapost.gov.in/mydigipin/home`;
                if (navigator.share) {
                  navigator.share({ title: 'My DIGIPIN Location', text }).catch(()=>{});
                } else {
                  navigator.clipboard.writeText(text);
                  alert("Copied location to share!");
                }
              }}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
              title="Share my exact location"
            >
              <Navigation size={14} /> Share DIGIPIN
            </button>
          </div>

          {/* Search Row */}
          <div className="flex gap-2 mb-3">
            <div className="flex flex-1 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
              <input 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search lat, lng..."
                className="flex-1 bg-transparent py-2 px-3 text-sm font-medium focus:outline-none"
              />
              <button 
                onClick={handleSearch}
                disabled={searchLoading}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-2 rounded-lg transition-colors"
              >
                {searchLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
              <button 
                onClick={handleGetLocation}
                disabled={isLocating}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 rounded-lg transition-colors"
                title="Use My Location"
              >
                {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
              </button>
            </div>
          </div>
          
          {errorMsg && (
            <p className="text-xs font-medium text-rose-600 bg-rose-50/80 border border-rose-200 rounded-lg px-4 py-2 mb-3">{errorMsg}</p>
          )}

          {/* Tabs */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("charging")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === "charging" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Zap size={16} /> Charger
            </button>
            <button
              onClick={() => setActiveTab("spare")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === "spare" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Wrench size={16} /> Repair
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="relative flex-1 overflow-y-auto overscroll-contain p-4 pb-24 md:pb-24">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
            {displayedLocations.length} {activeTab === "charging" ? "Charger" : "Repair"} station{displayedLocations.length !== 1 ? "s" : ""} within 5km
          </p>
          
          {displayedLocations.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="mx-auto h-8 w-8 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No {activeTab === "charging" ? "chargers" : "repair stations"} found nearby.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedLocations.map((loc) => {
                const dist = getDistanceFromLatLonInKm(activeCenter[0], activeCenter[1], loc.lat, loc.lng);
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
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-white via-white to-transparent md:rounded-b-3xl flex gap-3">
          <button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] transition-all active:scale-95 flex items-center justify-center gap-2">
            Pick Me UP
          </button>
          <a 
            href="tel:+919876543210" 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <PhoneCall size={20} /> Call Us
          </a>
        </div>

      </div>
    </div>
  );
}
