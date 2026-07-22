"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Wifi,
  Battery as BatteryIcon,
  Search,
  MapPin,
  User,
  Clock,
  Compass,
  Filter,
  Navigation,
  Info,
  Activity,
  Heart,
  Share2
} from "lucide-react";
import { supabaseClient } from "../lib/supabase-client";

// Haversine formula to compute distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type Battery = {
  id: string;
  name: string;
  location: string;
  status: "available" | "charging" | "reserved" | "unavailable";
  available_quantity: number;
  total_quantity: number;
  battery_percentage: number;
  estimated_ready_minutes: number;
  managed_by?: string;
  latitude: number;
  longitude: number;
  is_archived: boolean;
  is_portable?: boolean;
  updated_at: string;
};

type ChargingStation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  power_source: "battery" | "solar" | "grid" | "hybrid";
  available_ports: number;
  occupied_ports: number;
  waiting_minutes: number;
  status: "open" | "busy" | "offline";
  has_wifi: boolean;
  opening_time?: string;
  closing_time?: string;
  notes?: string;
  updated_at: string;
};

export default function ProtestClient({
  initialBatteries,
  initialStations,
}: {
  initialBatteries: Battery[];
  initialStations: ChargingStation[];
}) {
  const [batteries, setBatteries] = useState<Battery[]>(initialBatteries);
  const [stations, setStations] = useState<ChargingStation[]>(initialStations);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // 'available', 'charging', etc.
  const [powerSourceFilter, setPowerSourceFilter] = useState<string>("all"); // 'battery', 'solar', etc.
  const [wifiOnly, setWifiOnly] = useState(false);
  const [sortByNearest, setSortByNearest] = useState(false);

  // Geolocation state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locPermissionState, setLocPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");
  const [requestingLoc, setRequestingLoc] = useState(false);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markersGroupRef = useRef<import("leaflet").FeatureGroup | null>(null);
  const tempMarkerRef = useRef<import("leaflet").Marker | null>(null);

  // Real-time Supabase Subscription
  useEffect(() => {
    const batteriesChannel = supabaseClient
      .channel("batteries-protest-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "batteries" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as Battery;
            if (!row.is_archived) {
              setBatteries((prev) => [row, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as Battery;
            setBatteries((prev) => {
              if (row.is_archived) {
                return prev.filter((b) => b.id !== row.id);
              }
              const exists = prev.some((b) => b.id === row.id);
              if (exists) {
                return prev.map((b) => (b.id === row.id ? row : b));
              } else {
                return [row, ...prev];
              }
            });
          } else if (payload.eventType === "DELETE") {
            const oldId = payload.old.id;
            setBatteries((prev) => prev.filter((b) => b.id !== oldId));
          }
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    const stationsChannel = supabaseClient
      .channel("stations-protest-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "charging_stations" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as ChargingStation;
            setStations((prev) => [...prev, row]);
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as ChargingStation;
            setStations((prev) => prev.map((s) => (s.id === row.id ? row : s)));
          } else if (payload.eventType === "DELETE") {
            const oldId = payload.old.id;
            setStations((prev) => prev.filter((s) => s.id !== oldId));
          }
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(batteriesChannel);
      supabaseClient.removeChannel(stationsChannel);
    };
  }, []);

  // Request User Location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setRequestingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocPermissionState("granted");
        setRequestingLoc(false);
      },
      (err) => {
        console.warn("Location error:", err);
        setLocPermissionState("denied");
        setRequestingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Filtered/Sorted Batteries
  const filteredBatteries = useMemo(() => {
    return batteries
      .filter((b) => {
        const matchesStatus = statusFilter === "all" || b.status === statusFilter;
        return matchesStatus;
      })
      .sort((a, b) => {
        if (sortByNearest && userCoords) {
          const distA = getDistance(userCoords.lat, userCoords.lng, Number(a.latitude), Number(a.longitude));
          const distB = getDistance(userCoords.lat, userCoords.lng, Number(b.latitude), Number(b.longitude));
          return distA - distB;
        }
        return 0; // maintain original ordering
      });
  }, [batteries, statusFilter, sortByNearest, userCoords]);

  // Filtered/Sorted Charging Stations
  const filteredStations = useMemo(() => {
    return stations
      .filter((s) => {
        const matchesPower = powerSourceFilter === "all" || s.power_source === powerSourceFilter;
        const matchesWifi = !wifiOnly || s.has_wifi;
        return matchesPower && matchesWifi;
      })
      .sort((a, b) => {
        if (sortByNearest && userCoords) {
          const distA = getDistance(userCoords.lat, userCoords.lng, Number(a.latitude), Number(a.longitude));
          const distB = getDistance(userCoords.lat, userCoords.lng, Number(b.latitude), Number(b.longitude));
          return distA - distB;
        }
        return a.name.localeCompare(b.name);
      });
  }, [stations, powerSourceFilter, wifiOnly, sortByNearest, userCoords]);

  // Map Initialization & Updates
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const container = mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    import("leaflet").then((L) => {
      if (!mapContainerRef.current) return;

      // Leaflet Default Icon fix
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Default center: India or fallback
      const centerLat = 28.6139;
      const centerLng = 77.209;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.featureGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Station Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    // Clear existing markers
    group.clearLayers();

    import("leaflet").then((L) => {
      const bounds: any[] = [];

      filteredStations.forEach((s) => {
        const lat = Number(s.latitude);
        const lng = Number(s.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        // Open: green, Busy: orange, Offline: gray
        const color = s.status === "open" ? "#10b981" : s.status === "busy" ? "#f59e0b" : "#94a3b8";
        const iconHtml = `
          <div style="width:34px;height:34px;position:relative;display:flex;align-items:center;justify-content:center;">
            <div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:2px solid white;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
              <div style="transform:rotate(45deg);color:white;font-size:11px;font-weight:extrabold;">
                ${s.has_wifi ? "📶" : "⚡"}
              </div>
            </div>
            ${s.status === "open" ? `<span style="position:absolute;top:0;right:0;width:10px;height:10px;border-radius:50%;background:#10b981;border:1.5px solid white;animation:ping 2s infinite;"></span>` : ""}
          </div>
        `;

        const customIcon = L.divIcon({
          className: "",
          html: iconHtml,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -32],
        });

        const popupContent = `
          <div style="font-family:inherit;min-width:180px;padding:2px;">
            <h4 style="margin:0 0 4px;font-weight:bold;font-size:14px;color:#1e293b;">${s.name}</h4>
            <p style="margin:0 0 8px;font-size:11px;color:#64748b;line-height:1.3;">${s.address}</p>
            <div style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:#334155;margin-bottom:8px;">
              <div>Ports: <strong>${s.available_ports} available</strong> (${s.occupied_ports} occupied)</div>
              <div>Waiting Time: <strong>${s.waiting_minutes} min</strong></div>
              <div>Hours: <strong>${s.opening_time || "24/7"} - ${s.closing_time || ""}</strong></div>
              <div style="display:flex;gap:4px;margin-top:4px;">
                <span style="background:${s.status === "open" ? "#e6f4ea" : s.status === "busy" ? "#fef7e0" : "#f1f3f4"};color:${s.status === "open" ? "#137333" : s.status === "busy" ? "#b06000" : "#3c4043"};padding:2px 6px;border-radius:4px;font-weight:bold;font-size:10px;text-transform:uppercase;">
                  ${s.status}
                </span>
                <span style="background:#e8f0fe;color:#1a73e8;padding:2px 6px;border-radius:4px;font-weight:bold;font-size:10px;text-transform:uppercase;">
                  ${s.power_source}
                </span>
                ${s.has_wifi ? `<span style="background:#f3e8ff;color:#6b21a8;padding:2px 6px;border-radius:4px;font-weight:bold;font-size:10px;">WiFi Available</span>` : ""}
              </div>
            </div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" style="display:block;text-align:center;background:#0f172a;color:white;text-decoration:none;padding:6px;border-radius:6px;font-size:11px;font-weight:bold;">
              Get Directions
            </a>
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(group)
          .bindPopup(popupContent);

        bounds.push([lat, lng]);
      });

      // Fit map bounds if markers exist
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  }, [filteredStations]);

  // Handle viewing specific battery or station coordinates
  const handleViewLocation = (lat: number, lng: number, name: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Scroll to map
    const mapSection = document.getElementById("charging-stations-map");
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "smooth" });
    }

    import("leaflet").then((L) => {
      map.setView([lat, lng], 16);

      // Clean up previous temp marker
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
      }

      // Add temporary marker
      const tempIcon = L.divIcon({
        className: "relative animate-bounce",
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-75 animate-ping"></span>
            <div class="h-6 w-6 rounded-full bg-sky-500 border-2 border-white shadow flex items-center justify-center text-white">📍</div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const tempMarker = L.marker([lat, lng], { icon: tempIcon })
        .addTo(map)
        .bindPopup(`<strong>${name}</strong><br/>Battery Location`)
        .openPopup();

      tempMarkerRef.current = tempMarker;
    });
  };

  return (
    <div className="bg-zinc-50 text-zinc-900 dark:bg-[#0f1115] dark:text-white transition-colors duration-300 min-h-screen pb-16">
      {/* Include Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      {/* --- Section 1: Hero --- */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-zinc-200/80 dark:border-zinc-800/50 bg-gradient-to-b from-emerald-500/5 to-transparent dark:from-emerald-500/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-extrabold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              Live updates
            </span>
            <span className="text-xs font-extrabold tracking-wider uppercase text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full">
              Community Supported
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Community Energy Support
          </h1>
          <p className="text-xl md:text-2xl font-bold text-zinc-600 dark:text-zinc-400 max-w-3xl mb-3">
            Keeping people connected with clean energy.
          </p>
          <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-500 max-w-2xl leading-relaxed">
            Find nearby charged batteries and community charging locations supported by our volunteer network. Availability updates in real time.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-xs">
              <Activity size={12} className="text-emerald-500" />
              Last Update: {lastUpdated.toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Heart size={12} className="text-rose-500" />
              Neutral public service for gatherers
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* --- Filters (Sticky) --- */}
        <div className="sticky top-[72px] z-40 bg-zinc-50/95 dark:bg-[#0f1115]/95 backdrop-blur-md py-4 border-b border-zinc-200 dark:border-zinc-800 mb-8 transition-colors">
          <div className="flex flex-wrap gap-2 items-center justify-start">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-4 py-3 text-sm font-extrabold text-zinc-700 dark:text-zinc-300 cursor-pointer outline-hidden hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <option value="all">🔋 All Battery Status</option>
                <option value="available">Available Only</option>
                <option value="charging">Charging Only</option>
                <option value="reserved">Reserved Only</option>
              </select>

              <select
                value={powerSourceFilter}
                onChange={(e) => setPowerSourceFilter(e.target.value)}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-4 py-3 text-sm font-extrabold text-zinc-700 dark:text-zinc-300 cursor-pointer outline-hidden hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <option value="all">🔌 All Power Sources</option>
                <option value="battery">Battery Powered</option>
                <option value="solar">Solar Powered</option>
                <option value="grid">Grid Powered</option>
                <option value="hybrid">Hybrid</option>
              </select>

              <button
                onClick={() => setWifiOnly(!wifiOnly)}
                className={`inline-flex items-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-extrabold transition-all cursor-pointer ${
                  wifiOnly
                    ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300"
                }`}
              >
                <Wifi size={14} />
                Wifi Hotspot
              </button>

              <button
                onClick={sortByNearest ? () => setSortByNearest(false) : requestLocation}
                disabled={requestingLoc}
                className={`inline-flex items-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-extrabold transition-all cursor-pointer ${
                  sortByNearest
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300"
                }`}
              >
                <Compass size={14} className={requestingLoc ? "animate-spin" : ""} />
                {sortByNearest ? "Sorted by Proximity" : "Nearest Stations"}
              </button>
            </div>
          </div>

        {/* --- Section 2: Battery Inventory --- */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                <BatteryIcon className="text-emerald-500" />
                Battery Availability
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Take-away charged swap packs provided by volunteers
              </p>
            </div>
            <span className="text-xs font-bold text-zinc-500">
              Showing {filteredBatteries.length} batteries
            </span>
          </div>

          {filteredBatteries.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-12 text-center">
              <BatteryIcon size={40} className="mx-auto text-zinc-400/80 mb-3" />
              <p className="font-extrabold text-zinc-800 dark:text-zinc-200 text-base">No batteries available matching your filters.</p>
              <p className="text-xs text-zinc-450 mt-1">Check back later or try clearing status filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredBatteries.map((b) => {
                  const statusColors = {
                    available: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    charging: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    reserved: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                    unavailable: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  };
                  const isPortable = b.is_portable || (Number(b.latitude) === 0 && Number(b.longitude) === 0);
                  return (
                    <motion.div
                      layout
                      key={b.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ y: -3 }}
                      className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#15181e] p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Status + Name */}
                        <div className="flex flex-wrap items-center gap-1 mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusColors[b.status]}`}>
                            {b.status}
                          </span>
                          {isPortable && (
                            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                              Portable &amp; Mobile
                            </span>
                          )}
                          <span className="text-xs font-bold text-zinc-500 ml-auto">
                            {b.location}
                          </span>
                        </div>

                        <h3 className="font-black text-lg text-zinc-850 dark:text-white leading-tight mb-2 truncate">
                          {b.name}
                        </h3>

                        {/* Battery Capacity / Quantities */}
                        <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 mb-4 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                          <div>
                            Qty: <strong className="text-zinc-800 dark:text-zinc-200">{b.available_quantity} Avail</strong>
                          </div>
                          <div>
                            Total: <strong className="text-zinc-800 dark:text-zinc-200">{b.total_quantity}</strong>
                          </div>
                        </div>

                        {/* Battery Charge */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                            <span className="text-zinc-650 dark:text-zinc-400">Charge Level</span>
                            <span className="text-emerald-500">{b.battery_percentage}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${b.battery_percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Estimated time */}
                        {b.status === "charging" && b.estimated_ready_minutes > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold mb-4">
                            <Clock size={12} />
                            Ready in {b.estimated_ready_minutes} min
                          </div>
                        )}
                      </div>

                      <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-4 flex flex-col gap-2">
                        {b.managed_by && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                            <User size={10} />
                            Managed by {b.managed_by}
                          </div>
                        )}
                        {!isPortable ? (
                          <button
                            onClick={() => handleViewLocation(Number(b.latitude), Number(b.longitude), b.name)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 py-2.5 text-xs font-extrabold transition-colors cursor-pointer"
                          >
                            <MapPin size={12} />
                            View Location
                          </button>
                        ) : (
                          <div className="w-full text-center text-xs font-bold text-zinc-450 dark:text-zinc-500 py-2.5 bg-zinc-100/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/60">
                            📍 Mobile (No Fixed Location)
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* --- Section 3: Charging Station Map --- */}
        <section className="mb-16 scroll-mt-24" id="charging-stations-map">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                <MapPin className="text-emerald-500" />
                Charging Stations Map
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Visual interactive locator for EV ports and community hotspots
              </p>
            </div>
            {userCoords && (
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                <Compass size={12} className="animate-spin" style={{ animationDuration: "10s" }} />
                Your coordinates: {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
              </span>
            )}
          </div>

          <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs relative bg-zinc-100 dark:bg-zinc-900">
            <div ref={mapContainerRef} className="absolute inset-0 z-10" />
          </div>
        </section>

        {/* --- Section 4: Charging Station List --- */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Zap className="text-emerald-500" />
                Charging Stations
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Detailed listings of power sources, port counts, and waiting times
              </p>
            </div>
            <span className="text-xs font-bold text-zinc-500">
              Showing {filteredStations.length} stations
            </span>
          </div>

          {filteredStations.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-12 text-center">
              <Zap size={40} className="mx-auto text-zinc-400/80 mb-3" />
              <p className="font-extrabold text-zinc-800 dark:text-zinc-200 text-base">No charging stations match your criteria.</p>
              <p className="text-xs text-zinc-450 mt-1">Try broadening your filters or resetting the search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredStations.map((s) => {
                  const statusStyles = {
                    open: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
                    busy: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
                    offline: "border-zinc-500/30 bg-zinc-500/5 text-zinc-650 dark:text-zinc-450",
                  };

                  const powerStyles = {
                    battery: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
                    solar: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
                    grid: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350",
                    hybrid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-350",
                  };

                  const distance =
                    userCoords && s.latitude && s.longitude
                      ? getDistance(userCoords.lat, userCoords.lng, Number(s.latitude), Number(s.longitude))
                      : null;

                  return (
                    <motion.div
                      layout
                      key={s.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-3xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-[#15181e] p-6 shadow-xs hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Name, Status & Distance */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-black text-lg text-zinc-800 dark:text-white leading-tight">
                            {s.name}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${
                              statusStyles[s.status]
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>

                        {/* Address */}
                        <p className="text-xs text-zinc-450 mb-4 flex items-start gap-1">
                          <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                          <span>{s.address}</span>
                        </p>

                        {/* Badges: WiFi & Power Source & Distance */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${powerStyles[s.power_source]}`}>
                            {s.power_source} Power
                          </span>
                          {s.has_wifi && (
                            <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 px-2.5 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
                              <Wifi size={10} />
                              WiFi Available
                            </span>
                          )}
                          {distance !== null && (
                            <span className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
                              <Navigation size={10} />
                              {distance.toFixed(1)} km away
                            </span>
                          )}
                        </div>

                        {/* Ports status */}
                        <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-semibold border-t border-zinc-150 dark:border-zinc-800/80 pt-4">
                          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <span className="block text-[10px] text-zinc-400 uppercase font-bold">Ports Available</span>
                            <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                              {s.available_ports} <span className="text-xs font-bold text-zinc-400">ports</span>
                            </span>
                          </div>
                          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <span className="block text-[10px] text-zinc-400 uppercase font-bold">Ports Occupied</span>
                            <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">
                              {s.occupied_ports} <span className="text-xs font-bold text-zinc-400">ports</span>
                            </span>
                          </div>
                        </div>

                        {/* Waiting Time & Operating Hours */}
                        <div className="flex flex-col gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-4 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                          {s.waiting_minutes > 0 ? (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                              <Clock size={12} />
                              Estimated Wait: ~{s.waiting_minutes} mins
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450">
                              <Clock size={12} />
                              No wait time
                            </div>
                          )}
                          {(s.opening_time || s.closing_time) && (
                            <div className="text-[11px] text-zinc-400 font-bold">
                              Hours: {s.opening_time || "12:00 AM"} - {s.closing_time || "12:00 PM"}
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {s.notes && (
                          <p className="text-[11px] italic text-zinc-400 bg-zinc-50 dark:bg-zinc-900/20 p-2 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 mb-4">
                            Note: {s.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex gap-2">
                        <button
                          onClick={() => handleViewLocation(Number(s.latitude), Number(s.longitude), s.name)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-slate-950 py-2.5 text-xs font-extrabold transition-colors cursor-pointer"
                        >
                          <Navigation size={12} />
                          Map Direction
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* --- Section 5: Information Banner --- */}
        <section className="mb-16">
          <div className="rounded-3xl bg-zinc-100 dark:bg-zinc-900/60 p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Info size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-black text-zinc-800 dark:text-white mb-1">
                Community Support Info
              </h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-450 leading-relaxed">
                This page provides volunteer-managed information about temporary battery availability and charging locations. Availability may change throughout the day.
              </p>
            </div>
          </div>
        </section>

        {/* --- Footer Banner --- */}
        <section className="border-t border-zinc-200 dark:border-zinc-850 pt-16 pb-8 text-center flex flex-col items-center">
          <p className="text-lg md:text-2xl font-black text-zinc-500 dark:text-zinc-400 tracking-tight mb-6">
            Keeping people connected with clean energy.
          </p>
          <Image
            src="/evplsenewlogo.png"
            alt="logo"
            width={176}
            height={44}
            className="h-9 w-auto object-contain opacity-80"
          />
        </section>
      </div>
    </div>
  );
}
