"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, ValidationError } from "@formspree/react";
import { Bike, CheckCircle2, Clock3, MapPin, PhoneCall, ShieldCheck, Sparkles, Truck, WandSparkles } from "lucide-react";

const serviceTypes = [
  { id: "pickup", title: "Pickup & Drop", icon: Truck, detail: "We pick up your vehicle and drop it back after the service." },
  { id: "cleaning", title: "Quick Cleaning", icon: Sparkles, detail: "Exterior and interior basic cleaning at your location." },
  { id: "service", title: "Service Assist", icon: Bike, detail: "Minor on-site service check and quick assistance." },
] as const;

const vehicleTypes = [
  "Two-wheeler",
  "Three-wheeler",
  "Four-wheeler",
] as const;

type LocationState = {
  lat: number | null;
  lng: number | null;
  note: string;
};

export default function QuickClientPage() {
  const [selected, setSelected] = useState<(typeof serviceTypes)[number]["id"] | "">("");
  const [location, setLocation] = useState<LocationState>({ lat: null, lng: null, note: "" });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [status, setStatus] = useState("");
  const [vehicleType, setVehicleType] = useState<(typeof vehicleTypes)[number] | "">("");
  const [formState, handleSubmit] = useForm("mlgzwabg");
  const [preferredMode, setPreferredMode] = useState<"soon" | "schedule">("soon");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [pincode, setPincode] = useState("");
  const [usePincode, setUsePincode] = useState(false);
  const selectedService = useMemo(() => serviceTypes.find((s) => s.id === selected) ?? null, [selected]);

  const requestCurrentLocation = () => {
    setStatus("");
    if (!navigator.geolocation) {
      setStatus("Location access is not available on this device.");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          note: "Current location captured successfully.",
        });
        setLoadingLocation(false);
        setStatus("We captured your current location.");
      },
      () => {
        setLoadingLocation(false);
        setStatus("We could not read your current location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-fetch location on mount
  useEffect(() => {
    requestCurrentLocation();
  }, []);

  return (
    <div className="min-h-screen pt-20 text-ink">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-brand">QUICK SERVICE</p>
          {/* <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">Request pickup, cleaning, or service in under 30 minutes</h1> */}
          <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-soft">
            Tap your current location, choose a service, and send a quick request. We&apos;ll use your live location to help route the nearest team.
          </p>
        </div>

        <div className="grid gap-6">
          <section className="rounded-3xl border border-line bg-white p-4 sm:p-5 shadow-card ">
            <div className="flex items-center gap-2 text-brand">
              <Clock3 size={18} />
              <h2 className="text-lg font-semibold">Choose service</h2>
            </div>

            <div className="mt-5">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wider text-ink-mute">Service type</span>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value as (typeof serviceTypes)[number]["id"])}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand transition-all hover:bg-white"
                >
                  <option value="" className="bg-white">Select service</option>
                  {serviceTypes.map((service) => (
                    <option key={service.id} value={service.id} className="bg-white">
                      {service.title}
                    </option>
                  ))}
                </select>
              </label>
              {selectedService && <p className="mt-2 text-xs text-ink-mute">{selectedService.detail}</p>}
            </div>



            <div className="mt-6 rounded-2xl border border-line bg-paper p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Service Location</p>
                  <p className="mt-1 text-xs text-ink-mute">
                    {usePincode ? "Enter your area pincode for the service." : "We'll use your live location to route the nearest team."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!usePincode && !location.lat && (
                    <button
                      onClick={requestCurrentLocation}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      {loadingLocation ? <WandSparkles size={16} className="animate-pulse" /> : <MapPin size={16} />}
                      Use my location
                    </button>
                  )}
                  
                  {!usePincode && location.lat && (
                    <div className="flex items-center gap-2">
                      <p className="rounded-full border border-brand bg-brand-soft px-3 py-2 text-xs font-medium text-brand-deep">
                        Live location captured
                      </p>
                      <button 
                        onClick={() => {
                          setUsePincode(true);
                          setLocation({ lat: null, lng: null, note: "" });
                          setStatus("");
                        }}
                        className="text-xs text-brand hover:underline px-2"
                      >
                        Use Pincode instead?
                      </button>
                    </div>
                  )}

                  {usePincode && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative w-full sm:w-32">
                        <input 
                          type="text"
                          placeholder="Pincode"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          className="w-full rounded-xl border border-line bg-white px-4 py-2 text-sm text-ink outline-none focus:border-brand pr-10"
                          maxLength={6}
                        />
                        {pincode.length === 6 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-deep">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          setUsePincode(false);
                          setPincode("");
                        }}
                        className="text-xs text-ink-mute hover:text-ink px-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {!usePincode && !location.lat && !loadingLocation && (
                     <button 
                        onClick={() => setUsePincode(true)}
                        className="text-xs text-brand hover:underline px-2"
                      >
                        Or enter Pincode
                      </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-paper p-3 sm:p-4">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wider text-ink-mute">Vehicle type</span>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as (typeof vehicleTypes)[number])}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand transition-all hover:bg-white"
                >
                  <option value="" className="bg-white">Select vehicle type</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type} className="bg-white">
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-paper p-3 sm:p-5">
              <p className="text-xs uppercase tracking-wider text-ink-mute">Contact details</p>
              <div className="mt-3 rounded-2xl border border-line bg-white p-3 sm:p-4">
                <p className="text-sm font-semibold text-ink">Share contact details</p>
                <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand"
                  />
                  <ValidationError prefix="Name" field="name" errors={formState.errors} />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Mobile number"
                    className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand"
                  />
                  <ValidationError prefix="Phone" field="phone" errors={formState.errors} />
                  <div className="rounded-2xl border border-line bg-white p-3">
                    <p className="text-xs uppercase tracking-wider text-ink-mute">Preferred time</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setPreferredMode("soon")}
                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${preferredMode === "soon" ? "border-brand bg-brand-soft text-emerald-50" : "border-line-strong bg-white text-ink-soft hover:bg-ink/5"}`}
                      >
                        Under 1 hour
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreferredMode("schedule")}
                        className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${preferredMode === "schedule" ? "border-brand bg-brand-soft text-emerald-50" : "border-line-strong bg-white text-ink-soft hover:bg-ink/5"}`}
                      >
                        Date & time
                      </button>
                    </div>
                    {preferredMode === "schedule" && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          name="preferredDate"
                          type="date"
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand transition-all "
                        />
                        <input
                          name="preferredTime"
                          type="time"
                          value={preferredTime}
                          onChange={(e) => setPreferredTime(e.target.value)}
                          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand transition-all "
                        />
                      </div>
                    )}
                    <input name="preferredMode" type="hidden" value={preferredMode} />
                  </div>
                  <input name="service" type="hidden" value={selectedService?.title ?? ""} />
                  <input name="location" type="hidden" value={usePincode ? `Pincode: ${pincode}` : (location.lat && location.lng ? `${location.lat}, ${location.lng}` : "")} />
                  <input name="preferredDate" type="hidden" value={preferredDate} />
                    <button
                      type="submit"
                      disabled={formState.submitting}
                      className="mt-1 w-full rounded-full bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                    >
                      {formState.submitting ? "Sending..." : "Request service"}
                    </button>
                    {formState.succeeded && (
                      <p className="text-xs text-brand-deep">Request sent. Our team will contact you shortly.</p>
                    )}
                    {Boolean(formState.errors) && (
                      <p className="text-xs text-coral">Please check the form and try again.</p>
                    )}
                  </form>
                </div>
              </div>
            </section>
        </div>
      </div>
    </div>
  );
}


