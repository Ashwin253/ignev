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
    <div className="min-h-screen pt-20 text-ink">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-brand">RIDE REQUEST</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">Outstation, rental, and book a ride</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft">
            Pick a location on the map or use your current location, choose instant or timed pickup, and send the request through Formspree.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className={`rounded-3xl border border-line bg-white p-5 shadow-card  ${mobileTab === "map" ? "hidden lg:block" : "block"}`}>
            <div className="mb-4 flex rounded-full border border-line bg-white p-1 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileTab("form")}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${mobileTab === "form" ? "bg-emerald-600 text-white" : "text-ink-soft"}`}
              >
                Form
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("map")}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${mobileTab === "map" ? "bg-emerald-600 text-white" : "text-ink-soft"}`}
              >
                Map & time
              </button>
            </div>

            <div className="flex items-center gap-2 text-brand">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formState.submitting ? <Sparkles size={16} className="animate-pulse" /> : <CarFront size={16} />}
                {formState.submitting ? "Sending request..." : "Send ride request"}
              </button>

              {formState.succeeded && (
                <p className="rounded-2xl border border-brand bg-brand-soft px-4 py-3 text-xs text-brand-deep">
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

          <section className={`rounded-3xl border border-line bg-white p-5 shadow-card ${mobileTab === "form" ? "hidden lg:block" : "block"}`}>
            <div className="flex items-center gap-2 text-brand-deep">
              <MapPin size={18} />
              <h2 className="text-lg font-semibold">Map picker & preferred time</h2>
            </div>

            <div className="mt-5 rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Map picker</p>
                  <p className="mt-1 text-xs text-ink-mute">Tap the map to choose pickup or dropoff.</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-line bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setActivePicker("pickup")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activePicker === "pickup" ? "bg-emerald-600 text-white" : "text-ink-soft hover:text-white"}`}
                  >
                    Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePicker("dropoff")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activePicker === "dropoff" ? "bg-emerald-600 text-white" : "text-ink-soft hover:text-white"}`}
                  >
                    Dropoff
                  </button>
                </div>
              </div>
              <div className="mt-4 h-72 overflow-hidden rounded-2xl border border-line bg-white">
                <RideMapPicker pickedPoint={pickedPoint} onPick={applyPickedPoint} onMapReady={(map) => { mapRef.current = map; }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-mute">Selected point</p>
                  <p className="mt-1 text-sm font-medium text-ink">{pickedPoint.address || "No point picked yet"}</p>
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
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-soft transition-colors hover:bg-white"
                >
                  <Target size={14} />
                  Use my location
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-line bg-paper p-4">
              <p className="text-xs uppercase tracking-wider text-ink-mute">Preferred time</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredMode("now")}
                  className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${preferredMode === "now" ? "border-brand bg-brand-soft text-brand-deep" : "border-line bg-white text-ink-soft hover:bg-white"}`}
                >
                  Instant
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredMode("schedule")}
                  className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${preferredMode === "schedule" ? "border-brand bg-brand-soft text-emerald-100" : "border-line bg-white text-ink-soft hover:bg-white"}`}
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
                    className="w-full rounded-2xl border border-line bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand"
                  />
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full rounded-2xl border border-line bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand"
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
      <span className="text-xs uppercase tracking-wider text-ink-mute">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-mute focus:border-brand"
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
        active ? "border-brand bg-emerald-500/15 text-emerald-100" : "border-line bg-white text-ink-soft hover:bg-white"
      }`}
    >
      <IconComponent size={16} />
      {label}
    </button>
  );
}
