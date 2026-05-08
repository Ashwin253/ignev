"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { PickedPoint } from "./RideMapPicker.types";

export type { PickedPoint } from "./RideMapPicker.types";

export function createPointIcon(label: "Pickup" | "Dropoff") {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:34px;height:34px;border-radius:999px;
        background:${label === "Pickup" ? "#2563eb" : "#10b981"};
        border:3px solid white;box-shadow:0 8px 20px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;">
        ${label === "Pickup" ? "S" : "D"}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });
}

export default function RideMapPicker({
  pickedPoint,
  onPick,
  onMapReady,
}: {
  pickedPoint: PickedPoint;
  onPick: (lat: number, lng: number) => void;
  onMapReady?: (map: L.Map) => void;
}) {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const map = L.map(mapElRef.current, { center: [28.6139, 77.209], zoom: 11 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (event) => {
      void onPick(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;
    onMapReady?.(map);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.off();
      map.remove();
      mapRef.current = null;
    };
  }, [onMapReady, onPick]);

  useEffect(() => {
    if (!mapRef.current || !pickedPoint.lat || !pickedPoint.lng || !pickedPoint.label) return;
    markerRef.current?.remove();
    markerRef.current = L.marker([pickedPoint.lat, pickedPoint.lng], {
      icon: createPointIcon(pickedPoint.label),
    })
      .addTo(mapRef.current)
      .bindPopup(pickedPoint.address);
  }, [pickedPoint]);

  return <div ref={mapElRef} className="h-full w-full" />;
}
