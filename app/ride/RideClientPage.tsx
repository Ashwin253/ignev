"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useForm, ValidationError } from "@formspree/react";
import { CarFront, CarTaxiFront, MapPin, Sparkles, Target } from "lucide-react";
import type { PickedPoint } from "./RideMapPicker";

const RideMapPicker = dynamic(() => import("./RideMapPicker"), { ssr: false });

export default function RideClientPage() {
  const [rideType, setRideType] = useState<"book" | "outstation" | "rental">("book");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredMode, setPreferredMode] = useState<"now" | "schedule">("now");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [pickedPoint, setPickedPoint] = useState<PickedPoint>({ label: null, lat: null, lng: null, address: "" });
  const [activePicker, setActivePicker] = useState<"pickup" | "dropoff">("pickup");
  const [mobileTab, setMobileTab] = useState<"form" | "map">("form");
  const [formState, handleSubmit] = useForm("xdablyzr");
  const mapRef = useRef<import("leaflet").Map | null>(null);

  const canSubmit = useMemo(() => pickup.trim() && dropoff.trim() && name.trim() && phone.trim(), [pickup, dropoff, name, phone]);

  const applyPickedPoint = async (lat: number, lng: number) => {
    const label = activePicker === "pickup" ? "Pickup" : "Dropoff";
    const geocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((r) => r.json())
      .catch(() => null);
    const address = geocodeResponse?.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setPickedPoint({ label, lat, lng, address });
    if (label === "Pickup") setPickup(address);
    else setDropoff(address);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_35%),linear-gradient(180deg,#07111f_0%,#0f172a_55%,#111827_100%)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">RIDE REQUEST</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">Outstation, rental, and book a ride</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Pick a location on the map or use your current location, choose instant or timed pickup, and send the request through Formspree.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className={`rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur ${mobileTab === "map" ? "hidden lg:block" : "block"}`}>
            <div className="mb-4 flex rounded-full border border-white/10 bg-white/5 p-1 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileTab("form")}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${mobileTab === "form" ? "bg-sky-600 text-white" : "text-slate-300"}`}
              >
                Form
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("map")}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${mobileTab === "map" ? "bg-sky-600 text-white" : "text-slate-300"}`}
              >
                Map & time
              </button>
            </div>

            <div className="flex items-center gap-2 text-sky-300">
              <MapPin size={18} />
              <h2 className="text-lg font-semibold">Trip details</h2>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <RideTypeButton active={rideType === "book"} onClick={() => setRideType("book")} icon={CarFront} label="Book a ride" />
              <RideTypeButton active={rideType === "outstation"} onClick={() => setRideType("outstation")} icon={CarTaxiFront} label="Outstation" />
              <RideTypeButton active={rideType === "rental"} onClick={() => setRideType("rental")} icon={CarFront} label="Rental" />
            </div>

            <div className="mt-5 grid gap-3">
              <Input label="Pickup" value={pickup} onChange={setPickup} placeholder="Enter pickup address" />
              <Input label="Dropoff" value={dropoff} onChange={setDropoff} placeholder="Enter dropoff address" />
              <Input label="Your name" value={name} onChange={setName} placeholder="Guest first and last name" />
              <Input label="Phone" value={phone} onChange={setPhone} placeholder="Phone number for updates" />
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <input type="hidden" name="rideType" value={rideType} />
              <input type="hidden" name="pickup" value={pickup} />
              <input type="hidden" name="dropoff" value={dropoff} />
              <input type="hidden" name="name" value={name} />
              <input type="hidden" name="phone" value={phone} />
              <input type="hidden" name="preferredMode" value={preferredMode} />
              <input type="hidden" name="preferredDate" value={preferredDate} />
              <input type="hidden" name="preferredTime" value={preferredTime} />
              <input type="hidden" name="location" value={pickedPoint.address} />

              <button
                type="submit"
                disabled={!canSubmit || formState.submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formState.submitting ? <Sparkles size={16} className="animate-pulse" /> : <CarFront size={16} />}
                {formState.submitting ? "Sending request..." : "Send ride request"}
              </button>

              {formState.succeeded && (
                <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                  Request sent. Our team will contact you shortly.
                </p>
              )}
              {Boolean(formState.errors) && (
                <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
                  Please check the form and try again.
                </p>
              )}
              <ValidationError prefix="Pickup" field="pickup" errors={formState.errors} />
              <ValidationError prefix="Dropoff" field="dropoff" errors={formState.errors} />
            </form>
          </section>

          <section className={`rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl ${mobileTab === "form" ? "hidden lg:block" : "block"}`}>
            <div className="flex items-center gap-2 text-emerald-300">
              <MapPin size={18} />
              <h2 className="text-lg font-semibold">Map picker & preferred time</h2>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Map picker</p>
                  <p className="mt-1 text-xs text-slate-400">Tap the map to choose pickup or dropoff.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                  <button
                    type="button"
                    onClick={() => setActivePicker("pickup")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activePicker === "pickup" ? "bg-sky-600 text-white" : "text-slate-300 hover:text-white"}`}
                  >
                    Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePicker("dropoff")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activePicker === "dropoff" ? "bg-emerald-600 text-white" : "text-slate-300 hover:text-white"}`}
                  >
                    Dropoff
                  </button>
                </div>
              </div>
              <div className="mt-4 h-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                <RideMapPicker pickedPoint={pickedPoint} onPick={applyPickedPoint} onMapReady={(map) => { mapRef.current = map; }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">Selected point</p>
                  <p className="mt-1 text-sm font-medium text-white">{pickedPoint.address || "No point picked yet"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition((pos) => {
                      void applyPickedPoint(pos.coords.latitude, pos.coords.longitude);
                      mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14);
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-white/15"
                >
                  <Target size={14} />
                  Use my location
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Preferred time</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredMode("now")}
                  className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${preferredMode === "now" ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-white/15 bg-white/10 text-slate-100 hover:bg-white/15"}`}
                >
                  Instant
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredMode("schedule")}
                  className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${preferredMode === "schedule" ? "border-sky-400 bg-sky-500/20 text-sky-100" : "border-white/15 bg-white/10 text-slate-100 hover:bg-white/15"}`}
                >
                  Timing
                </button>
              </div>
              {preferredMode === "schedule" && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400/60"
                  />
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400/60"
                  />
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400/60"
      />
    </label>
  );
}

function RideTypeButton({
  active,
  onClick,
  icon: IconComponent,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
        active ? "border-sky-400 bg-sky-500/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      }`}
    >
      <IconComponent size={16} />
      {label}
    </button>
  );
}
