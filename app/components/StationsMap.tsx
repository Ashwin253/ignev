"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Wrench, MapPin, Navigation, Share2 } from "lucide-react";

const locations = [
  { id: "1", type: "charging", lat: 28.638807, lng: 77.085715, name: "EV Fast Charger",        address: "West Delhi" },
  { id: "3", type: "charging", lat: 28.600843, lng: 77.087613, name: "Supercharger IndianOil", address: "North Delhi" },
  { id: "4", type: "spare",    lat: 28.627204, lng: 77.071554, name: "EV Repair and Spare",    address: "West Delhi" },
];

type Loc = typeof locations[0];

export default function StationsMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import("leaflet").Map | null>(null);
  const [selected, setSelected] = useState<Loc | null>(null);
  const [filter, setFilter]     = useState<"all" | "charging" | "spare">("all");

  const filtered = locations.filter((l) => filter === "all" || l.type === filter);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const container = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    import("leaflet").then((L) => {
      if (mapRef.current || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [28.615, 77.079],
        zoom: 13,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      locations.forEach((loc) => {
        const color = loc.type === "charging" ? "#10b981" : "#f59e0b";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });
        L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .on("click", () => setSelected(loc));
      });

      mapRef.current = map;
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  const handleShare = async (loc: Loc) => {
    const url = `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}&zoom=16`;
    if (navigator.share) await navigator.share({ title: loc.name, text: loc.address, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-[#1a1d24] to-[#0f1115] text-white relative overflow-hidden" id="locations-map">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 text-sm font-medium mb-5">
            <MapPin size={16} /> Interactive Map
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-4">
            Charging &amp; <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">Spare Parts</span>
          </motion.h2>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-6">
          {/* List */}
          <div className="w-full lg:w-1/3">
            <div className="bg-[#1e222b]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Explore Locations</h3>
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 mb-5">
                {(["all", "charging", "spare"] as const).map((f) => (
                  <button key={f} onClick={() => { setFilter(f); setSelected(null); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                      filter === f
                        ? f === "charging" ? "bg-emerald-500 text-white shadow"
                          : f === "spare"  ? "bg-amber-500 text-white shadow"
                          : "bg-white text-black shadow"
                        : "text-gray-400 hover:text-white"
                    }`}>
                    {f === "charging" && <Zap size={12} />}
                    {f === "spare"    && <Wrench size={12} />}
                    {f === "all" ? "All" : f === "charging" ? "Charging" : "Spares"}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filtered.map((loc) => (
                  <div key={loc.id} onClick={() => setSelected(selected?.id === loc.id ? null : loc)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      selected?.id === loc.id ? "bg-white/10 border-white/20" : "bg-black/20 border-transparent hover:bg-white/5"
                    }`}>
                    <div className="flex items-center gap-2 font-medium text-white text-sm mb-1">
                      {loc.type === "charging" ? <Zap size={14} className="text-emerald-400" /> : <Wrench size={14} className="text-amber-400" />}
                      {loc.name}
                    </div>
                    <p className="text-xs text-gray-400 ml-5">{loc.address}</p>
                    {selected?.id === loc.id && (
                      <div className="flex gap-2 mt-3 ml-5">
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                          <Navigation size={12} /> Directions
                        </a>
                        <button onClick={() => handleShare(loc)}
                          className="px-3 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg transition-colors">
                          <Share2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="w-full lg:w-2/3 h-[400px] lg:h-[500px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
            <div ref={containerRef} className="absolute inset-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
