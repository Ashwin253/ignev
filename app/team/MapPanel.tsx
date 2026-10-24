"use client";

import { useState, useEffect } from "react";
import { Building2, MapPin, Wrench, Plus, Trash2, Pencil, X, Save, Loader2, IndianRupee } from "lucide-react";

type PricingEntry = {
  connector_type: string;  // e.g. "CCS2 DC", "Type2 AC"
  price_per_unit: string;  // e.g. "18"
  unit: "kWh" | "min" | "session" | "swap"; // billing unit
  notes: string;           // e.g. "Peak hours only"
};

type Station = {
  id?: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  city: string;
  address: string;
  connector_types: string[];
  power_kw: number | null;
  network: string;
  is_active: boolean;
  pricing: PricingEntry[];
};

type Dealer = {
  id?: string;
  name: string;
  brands: string[];
  lat: number;
  lng: number;
  pincode: string;
  city: string;
  address: string;
  offers: string[];
  offer_ids: string[];
  is_active: boolean;
};

type ManagedOffer = {
  id: string;
  brand: string | null;
  text: string;
  cities: string | null;
  product_slug: string | null;
  is_active: boolean;
  valid_until?: string | null;
};

const emptyPricingEntry = (): PricingEntry => ({
  connector_type: "",
  price_per_unit: "",
  unit: "kWh",
  notes: "",
});

const emptyStation: Station = {
  name: "", type: "charging", lat: 0, lng: 0, city: "", address: "",
  connector_types: [], power_kw: null, network: "", is_active: true,
  pricing: [],
};

const emptyDealer: Dealer = {
  name: "", brands: [], lat: 0, lng: 0, pincode: "", city: "", address: "",
  offers: [], offer_ids: [], is_active: true,
};

export default function MapPanel({ supabase, userEmail }: { supabase: any; userEmail: string }) {
  const [stations, setStations] = useState<(Station & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterNetwork, setFilterNetwork] = useState<string>("all");
  const [editing, setEditing] = useState<string | null>(null); // id or "new"
  const [form, setForm] = useState<Station>(emptyStation);
  const [saving, setSaving] = useState(false);
  const [mapsLink, setMapsLink] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [chargers, setChargers] = useState<any[]>([]);
  const [dealers, setDealers] = useState<(Dealer & { id: string })[]>([]);
  const [dealerLoading, setDealerLoading] = useState(true);
  const [dealerSearch, setDealerSearch] = useState("");
  const [dealerEditing, setDealerEditing] = useState<string | null>(null);
  const [dealerForm, setDealerForm] = useState<Dealer>(emptyDealer);
  const [dealerSaving, setDealerSaving] = useState(false);
  const [dealerMapsLink, setDealerMapsLink] = useState("");
  const [dealerExtracting, setDealerExtracting] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<ManagedOffer[]>([]);
  const [offerLoading, setOfferLoading] = useState(true);
  const [offerSearch, setOfferSearch] = useState("");
  const [mapTab, setMapTab] = useState<"stations" | "spare" | "dealers">("stations");

  const PREDEFINED_NETWORKS = ["Statiq", "Honda", "VinFast"];
  const dynamicNetworks = Array.from(new Set([
    ...PREDEFINED_NETWORKS,
    ...chargers.map(c => c.network)
  ].filter(Boolean)));
  const isCustomNetwork = form.network !== "" && !dynamicNetworks.includes(form.network);
  const selectNetworkValue = isCustomNetwork ? "other" : form.network;

  useEffect(() => { 
    fetchStations(); 
    fetchChargers();
    fetchDealers();
    fetchOffers();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("ev_stations").select("*").order("city");
    if (error) console.warn("Fetch stations error:", error.message);
    setStations((data ?? []) as any);
    setLoading(false);
  };

  const fetchChargers = async () => {
    try {
      const { data } = await supabase.from("ev_chargers").select("*").order("name");
      setChargers(data ?? []);
    } catch (e) {
      console.warn("Could not fetch chargers:", e);
    }
  };

  const fetchDealers = async () => {
    setDealerLoading(true);
    const { data, error } = await supabase.from("ev_dealers").select("*").order("city").order("name");
    if (error) console.warn("Fetch dealers error:", error.message);
    setDealers((data ?? []) as any);
    setDealerLoading(false);
  };

  const fetchOffers = async () => {
    setOfferLoading(true);
    const { data, error } = await supabase
      .from("offers")
      .select("id, brand, text, cities, product_slug, is_active, valid_until")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) console.warn("Fetch offers for dealers error:", error.message);
    setAvailableOffers((data ?? []) as ManagedOffer[]);
    setOfferLoading(false);
  };

  const selectMapTab = (tab: "stations" | "spare" | "dealers") => {
    setMapTab(tab);
    if (tab === "dealers") setEditing(null);
    else setDealerEditing(null);
  };

  const startNew = () => {
    setEditing("new");
    setForm({ ...emptyStation, type: mapTab === "spare" ? "spare" : "charging" });
    setMapsLink("");
  };
  const startEdit = (s: Station & { id: string }) => {
    selectMapTab(s.type === "spare" ? "spare" : "stations");
    setEditing(s.id);
    setForm({ ...s, pricing: Array.isArray(s.pricing) ? s.pricing : [] });
    setMapsLink("");
  };

  const handleAutoFill = async () => {
    if (!mapsLink) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/expand-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: mapsLink })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setForm(prev => ({
        ...prev,
        name: prev.name || data.name || "",
        lat: data.lat || prev.lat,
        lng: data.lng || prev.lng
      }));
    } catch (e: any) {
      alert("Could not extract data: " + e.message);
    } finally {
      setExtracting(false);
    }
  };

  const startNewDealer = () => {
    selectMapTab("dealers");
    setDealerEditing("new");
    setDealerForm({ ...emptyDealer, offers: [], offer_ids: [] });
    setDealerMapsLink("");
  };

  const startEditDealer = (dealer: Dealer & { id: string }) => {
    selectMapTab("dealers");
    setDealerEditing(dealer.id);
    setDealerForm({
      ...dealer,
      brands: Array.isArray(dealer.brands) ? dealer.brands : [],
      offers: Array.isArray(dealer.offers) ? dealer.offers : [],
      offer_ids: Array.isArray(dealer.offer_ids) ? dealer.offer_ids.map(String) : [],
    });
    setDealerMapsLink("");
  };

  const handleDealerAutoFill = async () => {
    if (!dealerMapsLink) return;
    setDealerExtracting(true);
    try {
      const res = await fetch("/api/expand-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: dealerMapsLink }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDealerForm((prev) => ({
        ...prev,
        name: prev.name || data.name || "",
        lat: data.lat ?? prev.lat,
        lng: data.lng ?? prev.lng,
      }));
    } catch (e: any) {
      alert("Could not extract dealer location: " + e.message);
    } finally {
      setDealerExtracting(false);
    }
  };

  const handleSaveDealer = async () => {
    if (!dealerForm.name.trim()) {
      alert("Dealer name is required.");
      return;
    }
    if (!Number.isFinite(dealerForm.lat) || !Number.isFinite(dealerForm.lng) || dealerForm.lat === 0 && dealerForm.lng === 0) {
      alert("Enter a valid latitude and longitude, or use the Google Maps autofill.");
      return;
    }

    setDealerSaving(true);
    const { id, ...rest } = dealerForm as any;
    const linkedOfferIds = Array.from(new Set((rest.offer_ids || []).map((offerId: string) => String(offerId))));
    const linkedOfferTexts = availableOffers
      .filter((offer) => linkedOfferIds.includes(String(offer.id)))
      .map((offer) => offer.text.trim())
      .filter(Boolean);
    const payload = {
      name: rest.name.trim(),
      brands: (rest.brands || []).map((brand: string) => brand.trim()).filter(Boolean),
      lat: Number(rest.lat),
      lng: Number(rest.lng),
      pincode: String(rest.pincode || "").trim(),
      city: String(rest.city || "").trim(),
      address: String(rest.address || "").trim(),
      // Keep the text array as a backwards-compatible snapshot. Public map reads
      // offer_ids first, so edits in Banners & Offers stay live automatically.
      offers: linkedOfferTexts.length > 0
        ? linkedOfferTexts
        : (rest.offers || []).map((offer: string) => offer.trim()).filter(Boolean),
      offer_ids: linkedOfferIds,
      is_active: rest.is_active ?? true,
      added_by_email: userEmail,
      updated_at: new Date().toISOString(),
    };

    const query = dealerEditing === "new"
      ? supabase.from("ev_dealers").insert(payload)
      : supabase.from("ev_dealers").update(payload).eq("id", dealerEditing);
    const { error } = await query;
    if (error) {
      alert(`Dealer save failed: ${error.message}`);
      setDealerSaving(false);
      return;
    }
    setDealerSaving(false);
    setDealerEditing(null);
    fetchDealers();
  };

  const handleDeleteDealer = async (id: string) => {
    if (!confirm("Delete this dealer?")) return;
    const { error } = await supabase.from("ev_dealers").delete().eq("id", id);
    if (error) alert(`Delete failed: ${error.message}`);
    fetchDealers();
  };

  const handleSave = async () => {
    setSaving(true);
    const { id, ...rest } = form as any;
    const payload = { 
      name: rest.name || "",
      type: rest.type || "charging",
      lat: rest.lat,
      lng: rest.lng,
      city: rest.city || "",
      address: rest.address || "",
      connector_types: rest.connector_types || [],
      power_kw: rest.power_kw || null,
      network: rest.network || "",
      is_active: rest.is_active ?? true,
      added_by_email: userEmail,
      pricing: rest.pricing || [],
    };
    if (editing === "new") {
      const { error } = await supabase.from("ev_stations").insert(payload);
      if (error) { alert(`Save failed: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("ev_stations").update(payload).eq("id", editing);
      if (error) { alert(`Update failed: ${error.message}`); setSaving(false); return; }
    }
    setSaving(false); setEditing(null); fetchStations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this station?")) return;
    await supabase.from("ev_stations").delete().eq("id", id);
    fetchStations();
  };

  const importFromJson = async () => {
    try {
      const res = await fetch("/statiq_stations.json");
      const data = await res.json();
      if (!data.length) { alert("No stations in JSON file"); return; }
      
      // Batch insert all at once
      const payload = data.map((s: any) => ({ 
        name: s.name, 
        lat: s.lat, 
        lng: s.lng, 
        city: "",
        address: "",
        network: "Statiq", 
        type: "charging",
        is_active: true,
        added_by_email: userEmail 
      }));
      
      const { error, data: inserted } = await supabase.from("ev_stations").insert(payload).select();
      if (error) { 
        alert(`Import failed: ${error.message}`); 
        return; 
      }
      alert(`Imported ${inserted?.length || 0} stations`);
      fetchStations();
    } catch (e) { alert(`Import failed: ${e}`); }
  };

  const handleBulkImport = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(bulkJson.trim());
    } catch (e: any) {
      alert("Invalid JSON format: " + e.message);
      return;
    }

    if (!Array.isArray(parsed)) {
      alert("JSON must be an array of station objects.");
      return;
    }

    if (parsed.length === 0) {
      alert("JSON array is empty.");
      return;
    }

    // Validate and format each item
    const payload: any[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item.name || typeof item.name !== "string") {
        alert(`Item at index ${i} is missing a valid 'name' field.`);
        return;
      }
      if (item.lat === undefined || isNaN(Number(item.lat))) {
        alert(`Item at index ${i} ('${item.name}') is missing a valid 'lat' coordinate.`);
        return;
      }
      if (item.lng === undefined || isNaN(Number(item.lng))) {
        alert(`Item at index ${i} ('${item.name}') is missing a valid 'lng' coordinate.`);
        return;
      }

      // Convert connector_types if it's string
      let connectors: string[] = [];
      if (Array.isArray(item.connector_types)) {
        connectors = item.connector_types;
      } else if (typeof item.connector_types === "string") {
        connectors = item.connector_types.split(",").map((s: string) => s.trim()).filter(Boolean);
      }

      payload.push({
        name: item.name,
        lat: Number(item.lat),
        lng: Number(item.lng),
        type: item.type || "charging",
        network: item.network || "",
        city: item.city || "",
        address: item.address || "",
        connector_types: connectors,
        power_kw: item.power_kw !== undefined ? (item.power_kw ? Number(item.power_kw) : null) : null,
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
        added_by_email: userEmail
      });
    }

    setSaving(true);
    try {
      const { error, data: inserted } = await supabase.from("ev_stations").insert(payload).select();
      if (error) {
        alert(`Bulk Import failed: ${error.message}`);
      } else {
        alert(`Successfully imported ${inserted?.length || payload.length} stations!`);
        setBulkJson("");
        setEditing(null);
        fetchStations();
      }
    } catch (e: any) {
      alert("Bulk Import failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = stations.filter((s) => {
    const matchesTab = mapTab === "spare" ? s.type === "spare" : mapTab === "stations" && s.type !== "spare";
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.network || "").toLowerCase().includes(search.toLowerCase());
    
    let matchesNetwork = true;
    if (filterNetwork !== "all") {
      if (filterNetwork === "none") {
        matchesNetwork = !s.network;
      } else {
        matchesNetwork = s.network === filterNetwork;
      }
    }
    
    return matchesTab && matchesSearch && matchesNetwork;
  });

  const filteredDealers = dealers.filter((dealer) => {
    const query = dealerSearch.toLowerCase().trim();
    if (!query) return true;
    return [dealer.name, dealer.city, dealer.pincode, ...(dealer.brands || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const filteredAvailableOffers = availableOffers.filter((offer) => {
    const query = offerSearch.toLowerCase().trim();
    if (!query) return true;
    return [offer.text, offer.brand, offer.cities, offer.product_slug]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const getDealerOfferTexts = (dealer: Dealer & { id: string }) => {
    const linkedTexts = (dealer.offer_ids || [])
      .map((offerId) => availableOffers.find((offer) => String(offer.id) === String(offerId))?.text)
      .filter(Boolean) as string[];
    return linkedTexts.length > 0 ? linkedTexts : (dealer.offers || []);
  };

  return (
    <div className="space-y-6">
      {/* Map management tabs */}
      <div role="tablist" aria-label="Map locations" className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
        <button
          role="tab"
          aria-selected={mapTab === "dealers"}
          onClick={() => selectMapTab("dealers")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition-colors ${mapTab === "dealers" ? "bg-white text-emerald-700 shadow-sm" : "text-ink-mute hover:bg-white/70"}`}
        >
          <Building2 size={15} /> Dealers <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px]">{dealers.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={mapTab === "stations"}
          onClick={() => selectMapTab("stations")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition-colors ${mapTab === "stations" ? "bg-white text-emerald-700 shadow-sm" : "text-ink-mute hover:bg-white/70"}`}
        >
          <MapPin size={15} /> Stations <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px]">{stations.filter((s) => s.type !== "spare").length}</span>
        </button>
        <button
          role="tab"
          aria-selected={mapTab === "spare"}
          onClick={() => selectMapTab("spare")}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition-colors ${mapTab === "spare" ? "bg-white text-amber-700 shadow-sm" : "text-ink-mute hover:bg-white/70"}`}
        >
          <Wrench size={15} /> Spare / Repair <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px]">{stations.filter((s) => s.type === "spare").length}</span>
        </button>
      </div>

      {mapTab !== "dealers" && (
        <>
      {/* Header + actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">{mapTab === "spare" ? stations.filter((s) => s.type === "spare").length : stations.filter((s) => s.type !== "spare").length}</span> {mapTab === "spare" ? "spare / repair locations" : "charging stations"}</p>
        <div className="flex gap-2">
          <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            <Plus size={12} /> Add {mapTab === "spare" ? "Spare Point" : "Station"}
          </button>
          <button onClick={() => { setEditing("bulk"); setBulkJson(""); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            Bulk Import (JSON)
          </button>
          {stations.length === 0 && (
            <button onClick={importFromJson} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Import from JSON
            </button>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && editing !== "bulk" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-emerald-700">{editing === "new" ? "New Station" : "Edit Station"}</p>
            <button onClick={() => setEditing(null)} className="text-ink-mute hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="block sm:col-span-2 lg:col-span-3 bg-slate-100 p-3 rounded-lg border border-slate-200 mb-4">
            <span className="text-xs font-bold text-slate-600 block mb-1">Auto-fill from Google Maps Link</span>
            <div className="flex gap-2">
              <input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
              <button onClick={handleAutoFill} disabled={extracting || !mapsLink} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-white disabled:opacity-50 shrink-0">
                {extracting ? <Loader2 size={12} className="animate-spin" /> : "Extract"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="block"><span className="text-xs font-bold text-slate-650">Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Type</span>
              <select value={form.type || "charging"} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none bg-white">
                <option value="charging">Charging Station</option>
                <option value="spare">Repair / Spare</option>
              </select>
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-bold text-slate-650">Supported Networks</span>
              <div className="mt-1 border border-slate-200 bg-white rounded-xl p-3 max-h-32 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dynamicNetworks.map((netName) => {
                  const isChecked = form.network ? form.network.split(",").map(n => n.trim()).includes(netName) : false;
                  return (
                    <label key={netName} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const currentNetworks = form.network ? form.network.split(",").map(n => n.trim()).filter(Boolean) : [];
                          const updated = isChecked 
                            ? currentNetworks.filter(n => n !== netName)
                            : [...currentNetworks, netName];
                          
                          // Merge connectors and power for all checked networks
                          const matchedChargers = chargers.filter(c => updated.includes(c.network));
                          const mergedConnectors = Array.from(new Set(
                            matchedChargers.flatMap(c => c.connector_type.split(",").map((t: string) => t.trim()))
                          )).filter(Boolean) as string[];
                          const maxPower = matchedChargers.reduce((max, c) => {
                            const p = parseFloat(c.power_output) || 0;
                            return p > max ? p : max;
                          }, 0);

                          setForm(prev => ({
                            ...prev,
                            network: updated.join(", "),
                            connector_types: mergedConnectors.length > 0 ? mergedConnectors : prev.connector_types,
                            power_kw: maxPower > 0 ? maxPower : prev.power_kw
                          }));
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-650 focus:ring-emerald-500 cursor-pointer"
                      />
                      {netName}
                    </label>
                  );
                })}
              </div>
              <input
                type="text"
                value={form.network || ""}
                onChange={e => setForm({ ...form, network: e.target.value })}
                placeholder="Custom/Unlisted Networks (comma-separated)"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Latitude</span><input type="number" step="any" value={form.lat || ""} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Longitude</span><input type="number" step="any" value={form.lng || ""} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block sm:col-span-2 lg:col-span-3"><span className="text-xs font-bold text-slate-600">Connectors & Power (comma-sep)</span><input value={form.connector_types.join(", ")} onChange={(e) => setForm({ ...form, connector_types: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="CCS2 60kW, Type2 22kW" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
          </div>

          {/* ── Charger Pricing ── */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <IndianRupee size={13} className="text-emerald-600" />
                Charger Pricing
              </span>
              <button
                type="button"
                onClick={() => setForm({ ...form, pricing: [...(form.pricing || []), emptyPricingEntry()] })}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded-lg px-2.5 py-1 bg-white hover:bg-emerald-50 transition-colors"
              >
                <Plus size={10} /> Add Connector Pricing
              </button>
            </div>

            {(form.pricing || []).length === 0 && (
              <p className="text-[10px] text-ink-mute italic bg-slate-50 rounded-lg px-3 py-2 border border-dashed border-slate-200">
                No pricing set. Visitors will see "Pricing unavailable". Add at least one entry to show costs.
              </p>
            )}

            {(form.pricing || []).map((entry, idx) => (
              <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end bg-white border border-slate-200 rounded-xl p-3 relative">
                {/* Connector Type */}
                <label className="block">
                  <span className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Connector / Port</span>
                  <input
                    type="text"
                    value={entry.connector_type}
                    onChange={(e) => {
                      const updated = [...form.pricing];
                      updated[idx] = { ...updated[idx], connector_type: e.target.value };
                      setForm({ ...form, pricing: updated });
                    }}
                    placeholder="e.g. CCS2 DC"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                  />
                </label>

                {/* Price */}
                <label className="block">
                  <span className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Price (₹)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={entry.price_per_unit}
                    onChange={(e) => {
                      const updated = [...form.pricing];
                      updated[idx] = { ...updated[idx], price_per_unit: e.target.value };
                      setForm({ ...form, pricing: updated });
                    }}
                    placeholder="18"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                  />
                </label>

                {/* Unit */}
                <label className="block">
                  <span className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Per Unit</span>
                  <select
                    value={entry.unit}
                    onChange={(e) => {
                      const updated = [...form.pricing];
                      updated[idx] = { ...updated[idx], unit: e.target.value as PricingEntry["unit"] };
                      setForm({ ...form, pricing: updated });
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none bg-white focus:border-brand cursor-pointer"
                  >
                    <option value="kWh">kWh (energy)</option>
                    <option value="min">Minute (time)</option>
                    <option value="session">Session (flat)</option>
                    <option value="swap">Swap</option>
                  </select>
                </label>

                {/* Notes */}
                <label className="block">
                  <span className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Notes</span>
                  <input
                    type="text"
                    value={entry.notes}
                    onChange={(e) => {
                      const updated = [...form.pricing];
                      updated[idx] = { ...updated[idx], notes: e.target.value };
                      setForm({ ...form, pricing: updated });
                    }}
                    placeholder="e.g. Peak hours"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                  />
                </label>

                {/* Remove row */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = form.pricing.filter((_, i) => i !== idx);
                    setForm({ ...form, pricing: updated });
                  }}
                  className="absolute top-2 right-2 text-ink-soft hover:text-rose-500 transition-colors"
                  title="Remove pricing row"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        </div>
      )}

      {editing === "bulk" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-emerald-700">Bulk Import Stations (JSON)</p>
              <p className="text-xs text-ink-mute mt-1">Paste a JSON array of station objects generated by Gemini or any source.</p>
            </div>
            <button onClick={() => setEditing(null)} className="text-ink-mute hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <textarea
              placeholder={`[\n  {\n    "name": "Tata Power Charging Station",\n    "lat": 28.6139,\n    "lng": 77.2090,\n    "network": "Tata Power",\n    "city": "New Delhi",\n    "address": "Connaught Place"\n  }\n]`}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              className="w-full h-48 rounded-lg border border-slate-200 p-3 text-xs font-mono outline-none bg-white focus:border-brand"
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] text-ink-mute font-medium">
                  Required fields: <code>name</code>, <code>lat</code>, <code>lng</code>
                </span>
                <button
                  onClick={() => {
                    const template = `[\n  {\n    "name": "Tata Power Charging Station",\n    "lat": 28.6139,\n    "lng": 77.2090,\n    "network": "Tata Power",\n    "city": "New Delhi",\n    "address": "Connaught Place",\n    "type": "charging",\n    "connector_types": ["CCS2 60kW", "Type2 22kW"],\n    "power_kw": 60,\n    "is_active": true\n  }\n]`;
                    navigator.clipboard.writeText(template);
                    alert("Template JSON copied to clipboard!");
                  }}
                  type="button"
                  className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold underline transition-colors focus:outline-none"
                >
                  Copy Template JSON
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={saving || !bulkJson.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Import Stations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Network Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search by name or network..."
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand" 
        />
        <select
          value={filterNetwork}
          onChange={(e) => setFilterNetwork(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand cursor-pointer"
        >
          <option value="all">All Networks</option>
          {Array.from(new Set(stations.map(s => s.network).filter(Boolean))).map(net => (
            <option key={net} value={net}>{net}</option>
          ))}
          <option value="none">Unknown / Unspecified Network</option>
        </select>
      </div>

      {/* Station list */}
      {loading ? <p className="text-ink-mute text-sm text-center py-8">Loading...</p> : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden max-h-[500px] overflow-y-auto">
          {filtered.map((s) => (
            <div key={s.id} className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 ${!s.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{s.name}</p>
                  <p className="text-[10px] text-ink-mute">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] mr-1 ${s.type === 'spare' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {s.type === 'spare' ? 'Repair' : 'Charger'}
                    </span>
                    {s.network ? s.network : "Unknown Network"}
                  </p>
                  {Array.isArray((s as any).pricing) && (s as any).pricing.length > 0 && (
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      ₹{(s as any).pricing[0].price_per_unit}/{(s as any).pricing[0].unit}
                      {(s as any).pricing.length > 1 && ` +${(s as any).pricing.length - 1} more`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 font-bold">Map</a>
                <button onClick={() => startEdit(s)} className="text-[10px] text-ink-mute font-bold hover:text-emerald-600"><Pencil size={12} /></button>
                <button onClick={() => handleDelete(s.id)} className="text-[10px] text-ink-mute font-bold hover:text-rose-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-ink-mute text-center py-8">No stations found</p>}
        </div>
      )}
        </>
      )}

      {/* Dealer management */}
      {mapTab === "dealers" && (
      <section id="dealer-management" className="scroll-mt-24 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-emerald-800 flex items-center gap-2"><Building2 size={16} /> Dealers</p>
            <p className="text-xs text-ink-mute mt-1">Add showroom/dealer pins with supported brands, pincode, and live offers.</p>
          </div>
          <button onClick={startNewDealer} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            <Plus size={12} /> Add Dealer
          </button>
        </div>

        {dealerEditing && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-700">{dealerEditing === "new" ? "New Dealer" : "Edit Dealer"}</p>
              <button onClick={() => setDealerEditing(null)} className="text-ink-mute hover:text-slate-600"><X size={16} /></button>
            </div>

            <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-600 block mb-1">Auto-fill pin from Google Maps link</span>
              <div className="flex gap-2">
                <input value={dealerMapsLink} onChange={(e) => setDealerMapsLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                <button onClick={handleDealerAutoFill} disabled={dealerExtracting || !dealerMapsLink} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-white disabled:opacity-50 shrink-0">
                  {dealerExtracting ? <Loader2 size={12} className="animate-spin" /> : "Extract"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Dealer / showroom name *</span><input value={dealerForm.name} onChange={(e) => setDealerForm({ ...dealerForm, name: e.target.value })} placeholder="e.g. EVPLSE Mahindra Bengaluru" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-600">Pincode *</span><input value={dealerForm.pincode} onChange={(e) => setDealerForm({ ...dealerForm, pincode: e.target.value })} inputMode="numeric" placeholder="560001" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
              <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Brands (comma-separated) *</span><input value={dealerForm.brands.join(", ")} onChange={(e) => setDealerForm({ ...dealerForm, brands: e.target.value.split(",").map((brand) => brand.trim()).filter(Boolean) })} placeholder="Mahindra, Tata Motors" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-600">City</span><input value={dealerForm.city} onChange={(e) => setDealerForm({ ...dealerForm, city: e.target.value })} placeholder="Bengaluru" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-600">Latitude *</span><input type="number" step="any" value={dealerForm.lat || ""} onChange={(e) => setDealerForm({ ...dealerForm, lat: Number(e.target.value) })} placeholder="12.9716" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
              <label className="block"><span className="text-xs font-bold text-slate-600">Longitude *</span><input type="number" step="any" value={dealerForm.lng || ""} onChange={(e) => setDealerForm({ ...dealerForm, lng: Number(e.target.value) })} placeholder="77.5946" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
              <label className="block sm:col-span-2 lg:col-span-3"><span className="text-xs font-bold text-slate-600">Address</span><input value={dealerForm.address} onChange={(e) => setDealerForm({ ...dealerForm, address: e.target.value })} placeholder="Full showroom address" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
              <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700">Current offers</span>
                    <p className="text-[10px] text-ink-mute mt-0.5">Select offers managed in Team → Banners &amp; Offers. Changes there update this dealer pin automatically.</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700">{dealerForm.offer_ids.length} selected</span>
                </div>
                <input value={offerSearch} onChange={(e) => setOfferSearch(e.target.value)} placeholder="Search active offers..." className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-400" />
                <div className="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                  {offerLoading ? <p className="px-2 py-3 text-xs text-ink-mute">Loading Banners &amp; Offers...</p> : filteredAvailableOffers.length > 0 ? filteredAvailableOffers.map((offer) => {
                    const offerId = String(offer.id);
                    const checked = dealerForm.offer_ids.includes(offerId);
                    return (
                      <label key={offerId} className={`flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 text-xs ${checked ? "border-emerald-300 bg-emerald-50" : "border-transparent hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setDealerForm({
                            ...dealerForm,
                            offer_ids: checked
                              ? dealerForm.offer_ids.filter((id) => id !== offerId)
                              : [...dealerForm.offer_ids, offerId],
                          })}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-700">{offer.text}</span>
                          <span className="block text-[10px] text-ink-mute">{[offer.brand, offer.cities].filter(Boolean).join(" · ") || "All brands / cities"}</span>
                        </span>
                      </label>
                    );
                  }) : <p className="px-2 py-3 text-xs text-ink-mute">No active offers found. Create one in Banners &amp; Offers first.</p>}
                </div>
                {dealerForm.offer_ids.length === 0 && dealerForm.offers.length > 0 && (
                  <p className="mt-2 text-[10px] text-amber-700">This dealer has older text-only offers. Select a shared offer above to connect it to Banners &amp; Offers.</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dealerForm.is_active} onChange={(e) => setDealerForm({ ...dealerForm, is_active: e.target.checked })} /> Active on public map</label>
              <button onClick={handleSaveDealer} disabled={dealerSaving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                {dealerSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Dealer
              </button>
            </div>
          </div>
        )}

        <input value={dealerSearch} onChange={(e) => setDealerSearch(e.target.value)} placeholder="Search dealer, brand, city, or pincode..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400" />

        {dealerLoading ? <p className="text-ink-mute text-sm text-center py-8">Loading dealers...</p> : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden max-h-[500px] overflow-y-auto">
            {filteredDealers.map((dealer) => (
              <div key={dealer.id} className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 last:border-0 ${!dealer.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <Building2 size={17} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{dealer.name}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">{(dealer.brands || []).join(", ") || "Brand not specified"}</p>
                    <p className="text-[10px] text-ink-mute">{dealer.city || ""}{dealer.city && dealer.pincode ? " · " : ""}{dealer.pincode || "Pincode not specified"}</p>
                    {getDealerOfferTexts(dealer).length > 0 && <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">{getDealerOfferTexts(dealer).length} current offer{getDealerOfferTexts(dealer).length === 1 ? "" : "s"}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={`https://www.google.com/maps?q=${dealer.lat},${dealer.lng}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 font-bold">Map</a>
                  <button onClick={() => startEditDealer(dealer)} className="text-[10px] text-ink-mute font-bold hover:text-emerald-600"><Pencil size={12} /></button>
                  <button onClick={() => handleDeleteDealer(dealer.id)} className="text-[10px] text-ink-mute font-bold hover:text-rose-500"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            {filteredDealers.length === 0 && <p className="text-sm text-ink-mute text-center py-8">No dealers found</p>}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
