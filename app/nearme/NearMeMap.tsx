"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Zap, Wrench, MapPin, Navigation, Share2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Map, { Marker, Source, Layer, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import digipin from "digipinjs-lib";
import { supabase, supabaseEnabled } from "../lib/supabase";

// ── Location data ─────────────────────────────────────────────────────────────
import statiqStationsData from "../../statiq_stations.json";

const statiqLocations = statiqStationsData.map((s: { lat: number; lng: number; name: string }, idx: number) => ({
  id: `statiq-${idx}`,
  type: "charging",
  lat: s.lat,
  lng: s.lng,
  name: s.name,
  address: "Statiq EV Station",
  network: "Statiq",
}));

const allLocations = [
  { id: "1", type: "charging", lat: 28.638807, lng: 77.085715, name: "EV Fast Charger",       address: "West Delhi", network: "Honda" },
  { id: "3", type: "charging", lat: 28.600843, lng: 77.087613, name: "Supercharger IndianOil", address: "North Delhi", network: "Statiq" },
  { id: "4", type: "spare",    lat: 28.627204, lng: 77.071554, name: "EV Repair and Spare",    address: "West Delhi", network: "VinFast" },
  ...statiqLocations,
];

type Location = typeof allLocations[0] & { network?: string };

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

// ── Main component ────────────────────────────────────────────────────────────

const defaultCenter = { lat: 28.615, lng: 77.079 };

export default function NearMeMap() {
  const mapRef = useRef<MapRef>(null);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [centerPoint, setCenterPoint] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"charging" | "spare">("charging");
  const [isMinimized, setIsMinimized] = useState(false);
  const [dbLocations, setDbLocations] = useState<Location[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");

  useEffect(() => {
    async function loadStations() {
      if (!supabaseEnabled()) return;
      try {
        const { data, error } = await supabase.from("ev_stations").select("*");
        if (error) {
          console.warn("Error fetching stations:", error.message);
          return;
        }
        if (data) {
          const formatted = data.map((s: any) => ({
            id: String(s.id),
            type: s.type || "charging",
            lat: Number(s.lat),
            lng: Number(s.lng),
            name: s.name,
            address: s.address || `${s.city || 'EV'} Station`,
            network: s.network || "",
          }));
          setDbLocations(formatted);
        }
      } catch (e) {
        console.warn("Could not fetch stations from DB", e);
      }
    }
    loadStations();
  }, []);

  useEffect(() => {
    setSelectedNetwork("all");
  }, [activeTab]);

  const locations = useMemo(() => {
    if (supabaseEnabled() && dbLocations.length > 0) {
      return dbLocations;
    }
    return allLocations;
  }, [dbLocations]);

  const networks = useMemo(() => {
    const netSet = new Set<string>();
    const seen = new Set<string>();
    locations.forEach(loc => {
      if (loc.network) {
        const net = loc.network.trim();
        const lower = net.toLowerCase();
        
        let displayNet = net;
        if (lower === "vinfast") displayNet = "VinFast";
        else if (lower === "statiq") displayNet = "Statiq";
        else if (lower === "honda") displayNet = "Honda";

        if (!seen.has(displayNet.toLowerCase())) {
          seen.add(displayNet.toLowerCase());
          netSet.add(displayNet);
        }
      }
    });
    return ["all", ...Array.from(netSet).sort()];
  }, [locations]);

  const radiusKm = 5; // 5 km radius

  const activeCenter: [number, number] = useMemo(() => centerPoint || [defaultCenter.lat, defaultCenter.lng], [centerPoint]);

  // Filter locations by radius, active tab, and network filter
  const displayedLocations = useMemo(() => {
    return locations.filter((l) => {
      if (l.type !== activeTab) return false;
      if (selectedNetwork !== "all" && l.network?.toLowerCase() !== selectedNetwork.toLowerCase()) return false;
      const dist = getDistanceFromLatLonInKm(activeCenter[0], activeCenter[1], l.lat, l.lng);
      return dist <= radiusKm;
    });
  }, [activeCenter, activeTab, locations, selectedNetwork]);

  const panTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
  }, []);

  const handleMapClick = (e: { lngLat: { lat: number; lng: number } }) => {
    if (e.lngLat) {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      setCenterPoint([lat, lng]);
      setErrorMsg("");
      panTo(lat, lng);
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
                setIsMinimized(false);
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

      {/* Bottom Panel */}
      <div className={`z-10 w-full md:w-[600px] md:mx-auto md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2 bg-white/95 backdrop-blur-md rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-t md:border border-slate-200 ${
        isMinimized 
          ? "h-[80px] md:h-[80px] overflow-hidden" 
          : "h-[45vh] md:h-auto md:max-h-[80vh]"
      }`}>
        
        {/* Header and Tabs */}
        <div className={`p-4 bg-white/50 shrink-0 rounded-t-3xl transition-all duration-300 ${
          isMinimized 
            ? "opacity-0 pointer-events-none h-0 p-0 border-none overflow-hidden" 
            : "border-b border-slate-200/60"
        }`}>
          <div className="mb-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="text-emerald-500" /> Near Me
            </h2>
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
        <div className={`relative flex-1 overflow-y-auto overscroll-contain p-4 pb-24 md:pb-24 transition-all duration-300 ${
          isMinimized ? "opacity-0 pointer-events-none h-0 p-0 overflow-hidden" : ""
        }`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {displayedLocations.length} {activeTab === "charging" ? "Charger" : "Repair"} station{displayedLocations.length !== 1 ? "s" : ""} within 5km
            </p>
            {/* Tiny Dropdown Filter */}
            <div className="relative flex items-center shrink-0">
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="bg-slate-100 hover:bg-slate-200/85 text-[10px] font-bold uppercase tracking-wider text-slate-600 rounded-lg px-2.5 py-1.5 outline-none border border-slate-200 cursor-pointer appearance-none pr-6 text-right"
              >
                <option value="all">All Networks</option>
                {networks.filter(n => n !== "all").map((net) => (
                  <option key={net} value={net}>{net}</option>
                ))}
              </select>
              <ChevronDown size={10} className="text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>
          
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
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-white via-white to-transparent md:rounded-b-3xl flex items-center gap-3">
          <button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] transition-all active:scale-95 flex items-center justify-center gap-2">
            Pick Me UP
          </button>
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all active:scale-95 flex items-center justify-center gap-2"
            title="Share my exact location"
          >
            <Share2 size={16} /> Share DIGIPIN
          </button>
          <button 
            onClick={handleGetLocation}
            disabled={isLocating}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-3.5 rounded-xl transition-colors flex items-center justify-center shadow-sm active:scale-95 shrink-0"
            title="Use My Location"
          >
            {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-3.5 rounded-xl transition-colors flex items-center justify-center shadow-sm active:scale-95 shrink-0"
            title={isMinimized ? "Maximize Panel" : "Minimize Panel"}
          >
            {isMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

      </div>
    </div>
  );
}
