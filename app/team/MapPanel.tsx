"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Pencil, X, Save, Loader2 } from "lucide-react";

type Station = { id?: string; name: string; type: string; lat: number; lng: number; city: string; address: string; connector_types: string[]; power_kw: number | null; network: string; is_active: boolean };

const emptyStation: Station = { name: "", type: "charging", lat: 0, lng: 0, city: "", address: "", connector_types: [], power_kw: null, network: "", is_active: true };

export default function MapPanel({ supabase, userEmail }: { supabase: any; userEmail: string }) {
  const [stations, setStations] = useState<(Station & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null); // id or "new"
  const [form, setForm] = useState<Station>(emptyStation);
  const [saving, setSaving] = useState(false);
  const [mapsLink, setMapsLink] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [bulkJson, setBulkJson] = useState("");

  const PREDEFINED_NETWORKS = ["Statiq", "Honda", "VinFast"];
  const isCustomNetwork = form.network !== "" && !PREDEFINED_NETWORKS.includes(form.network);
  const selectNetworkValue = isCustomNetwork ? "other" : form.network;

  useEffect(() => { fetchStations(); }, []);

  const fetchStations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("ev_stations").select("*").order("city");
    if (error) console.warn("Fetch stations error:", error.message);
    setStations((data ?? []) as any);
    setLoading(false);
  };

  const startNew = () => { setEditing("new"); setForm(emptyStation); setMapsLink(""); };
  const startEdit = (s: Station & { id: string }) => { setEditing(s.id); setForm(s); setMapsLink(""); };

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

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, added_by_email: userEmail };
    delete (payload as any).id;
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

  const filtered = stations.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.network || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">{stations.length}</span> charging stations</p>
        <div className="flex gap-2">
          <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700">
            <Plus size={12} /> Add Station
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
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-sky-700">{editing === "new" ? "New Station" : "Edit Station"}</p>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="block sm:col-span-2 lg:col-span-3 bg-slate-100 p-3 rounded-lg border border-slate-200 mb-4">
            <span className="text-xs font-bold text-slate-600 block mb-1">Auto-fill from Google Maps Link</span>
            <div className="flex gap-2">
              <input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
              <button onClick={handleAutoFill} disabled={extracting || !mapsLink} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-50 shrink-0">
                {extracting ? <Loader2 size={12} className="animate-spin" /> : "Extract"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="block"><span className="text-xs font-bold text-slate-600">Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Type</span>
              <select value={form.type || "charging"} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none bg-white">
                <option value="charging">Charging Station</option>
                <option value="spare">Repair / Spare</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Network</span>
              <select
                value={selectNetworkValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "other") {
                    setForm({ ...form, network: "Custom" });
                  } else {
                    setForm({ ...form, network: val });
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none bg-white cursor-pointer"
              >
                <option value="">Unknown / None</option>
                <option value="Statiq">Statiq</option>
                <option value="Honda">Honda</option>
                <option value="VinFast">VinFast</option>
                <option value="other">Other (Specify...)</option>
              </select>
              {selectNetworkValue === "other" && (
                <input
                  value={form.network}
                  onChange={(e) => setForm({ ...form, network: e.target.value })}
                  placeholder="Enter custom network name"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  autoFocus
                />
              )}
            </label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Latitude</span><input type="number" step="any" value={form.lat || ""} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Longitude</span><input type="number" step="any" value={form.lng || ""} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block sm:col-span-2 lg:col-span-3"><span className="text-xs font-bold text-slate-600">Connectors & Power (comma-sep)</span><input value={form.connector_types.join(", ")} onChange={(e) => setForm({ ...form, connector_types: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="CCS2 60kW, Type2 22kW" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
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
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-sky-700">Bulk Import Stations (JSON)</p>
              <p className="text-xs text-slate-500 mt-1">Paste a JSON array of station objects generated by Gemini or any source.</p>
            </div>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <textarea
              placeholder={`[\n  {\n    "name": "Tata Power Charging Station",\n    "lat": 28.6139,\n    "lng": 77.2090,\n    "network": "Tata Power",\n    "city": "New Delhi",\n    "address": "Connaught Place"\n  }\n]`}
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              className="w-full h-48 rounded-lg border border-slate-200 p-3 text-xs font-mono outline-none bg-white focus:border-sky-400"
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] text-slate-500 font-medium">
                  Required fields: <code>name</code>, <code>lat</code>, <code>lng</code>
                </span>
                <button
                  onClick={() => {
                    const template = `[\n  {\n    "name": "Tata Power Charging Station",\n    "lat": 28.6139,\n    "lng": 77.2090,\n    "network": "Tata Power",\n    "city": "New Delhi",\n    "address": "Connaught Place",\n    "type": "charging",\n    "connector_types": ["CCS2 60kW", "Type2 22kW"],\n    "power_kw": 60,\n    "is_active": true\n  }\n]`;
                    navigator.clipboard.writeText(template);
                    alert("Template JSON copied to clipboard!");
                  }}
                  type="button"
                  className="text-[10px] text-sky-600 hover:text-sky-800 font-bold underline transition-colors focus:outline-none"
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

      {/* Search */}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or network..."
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />

      {/* Station list */}
      {loading ? <p className="text-slate-400 text-sm text-center py-8">Loading...</p> : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden max-h-[500px] overflow-y-auto">
          {filtered.map((s) => (
            <div key={s.id} className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 ${!s.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-sky-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{s.name}</p>
                  <p className="text-[10px] text-slate-500">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] mr-1 ${s.type === 'spare' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {s.type === 'spare' ? 'Repair' : 'Charger'}
                    </span>
                    {s.network ? s.network : "Unknown Network"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-600 font-bold">Map</a>
                <button onClick={() => startEdit(s)} className="text-[10px] text-slate-500 font-bold hover:text-sky-600"><Pencil size={12} /></button>
                <button onClick={() => handleDelete(s.id)} className="text-[10px] text-slate-500 font-bold hover:text-rose-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No stations found</p>}
        </div>
      )}
    </div>
  );
}
