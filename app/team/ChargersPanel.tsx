"use client";

import { useState, useEffect } from "react";
import { Zap, Plus, Trash2, Pencil, X, Save, Loader2, ShieldCheck } from "lucide-react";

type Charger = {
  id?: string;
  name: string;
  network: string;
  connector_type: string;
  power_output: string;
  compatible_vehicles: string; // Comma-separated brands/models e.g. "Ather, TVS, Honda"
  is_active: boolean;
};

const emptyCharger: Charger = {
  name: "",
  network: "",
  connector_type: "",
  power_output: "",
  compatible_vehicles: "",
  is_active: true,
};

export default function ChargersPanel({ supabase, userEmail, listings = [] }: { supabase: any; userEmail: string; listings?: any[] }) {
  const [chargers, setChargers] = useState<(Charger & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null); // id or "new"
  const [form, setForm] = useState<Charger>(emptyCharger);
  const [saving, setSaving] = useState(false);
  const [stationNetworks, setStationNetworks] = useState<string[]>([]);

  const PREDEFINED_NETWORKS = ["Statiq", "Honda", "VinFast"];
  const dynamicNetworks = Array.from(new Set([
    ...PREDEFINED_NETWORKS,
    ...stationNetworks
  ].filter(Boolean)));
  const isCustomNetwork = form.network !== "" && !dynamicNetworks.includes(form.network);
  const selectNetworkValue = isCustomNetwork ? "other" : form.network;

  const selectedVehicles = form.compatible_vehicles 
    ? form.compatible_vehicles.split(",").map(v => v.trim()).filter(Boolean) 
    : [];

  useEffect(() => {
    fetchChargers();
    fetchStationNetworks();
  }, []);

  const fetchStationNetworks = async () => {
    try {
      const { data } = await supabase.from("ev_stations").select("network");
      if (data) {
        const unique = Array.from(new Set(data.map((d: any) => d.network).filter(Boolean))) as string[];
        setStationNetworks(unique);
      }
    } catch (e) {
      console.warn("Could not fetch station networks for chargers mapping:", e);
    }
  };

  const fetchChargers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("ev_chargers").select("*").order("name");
      if (error) {
        console.warn("Fetch chargers error:", error.message);
      }
      setChargers((data ?? []) as any);
    } catch (e) {
      console.warn("Could not fetch chargers from Supabase:", e);
    }
    setLoading(false);
  };

  const startNew = () => {
    setEditing("new");
    setForm(emptyCharger);
  };

  const startEdit = (c: Charger & { id: string }) => {
    setEditing(c.id);
    setForm(c);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, added_by_email: userEmail };
    delete (payload as any).id;
    try {
      if (editing === "new") {
        const { error } = await supabase.from("ev_chargers").insert(payload);
        if (error) {
          alert(`Save failed: ${error.message}`);
          setSaving(false);
          return;
        }
      } else {
        const { error } = await supabase.from("ev_chargers").update(payload).eq("id", editing);
        if (error) {
          alert(`Update failed: ${error.message}`);
          setSaving(false);
          return;
        }
      }
      setEditing(null);
      fetchChargers();
    } catch (e: any) {
      alert("Error saving: " + e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this charger configuration?")) return;
    try {
      const { error } = await supabase.from("ev_chargers").delete().eq("id", id);
      if (error) {
        alert("Delete failed: " + error.message);
      } else {
        fetchChargers();
      }
    } catch (e: any) {
      alert("Delete error: " + e.message);
    }
  };

  const filtered = chargers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.network.toLowerCase().includes(search.toLowerCase()) ||
    c.connector_type.toLowerCase().includes(search.toLowerCase()) ||
    c.compatible_vehicles.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Zap size={22} className="text-sky-500" />
            Chargers &amp; Adaptability Management
          </h2>
          <p className="text-xs text-slate-500">Connect chargers, power levels, and networks with supported vehicle types</p>
        </div>
        {!editing && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus size={16} /> Add Charger Link
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              {editing === "new" ? "Create Charger Connection" : "Edit Charger Connection"}
            </h3>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-500">Charger / Station Name</span>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Statiq Fast DC Charger"
                className="mt-1 w-full rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-500">Network Name</span>
              <select
                value={selectNetworkValue}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "other") {
                    setForm({ ...form, network: "Custom" });
                  } else {
                    setForm({ ...form, network: val });
                  }
                }}
                className="mt-1 w-full rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">-- Select Network --</option>
                {dynamicNetworks.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value="other">Other (Specify...)</option>
              </select>
              {selectNetworkValue === "other" && (
                <input
                  type="text"
                  value={form.network}
                  onChange={e => setForm({ ...form, network: e.target.value })}
                  placeholder="Enter custom network name"
                  className="mt-2 w-full rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500"
                  autoFocus
                />
              )}
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-500">Connector Type(s)</span>
              <input
                type="text"
                value={form.connector_type}
                onChange={e => setForm({ ...form, connector_type: e.target.value })}
                placeholder="e.g. CCS2, Type 2, Swappable Pack"
                className="mt-1 w-full rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase text-slate-500">Power Output</span>
              <input
                type="text"
                value={form.power_output}
                onChange={e => setForm({ ...form, power_output: e.target.value })}
                placeholder="e.g. 50 kW, 22 kW AC, 3.3 kW"
                className="mt-1 w-full rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500"
              />
            </label>

            <div className="block sm:col-span-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">Compatible Vehicles</span>
              <div className="mt-1.5 border border-slate-250 bg-white rounded-xl p-3.5 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                {listings.map((l) => {
                  const name = `${l.brand} ${l.title}`;
                  const isChecked = selectedVehicles.includes(name);
                  return (
                    <label key={l.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const updated = isChecked 
                            ? selectedVehicles.filter(v => v !== name)
                            : [...selectedVehicles, name];
                          setForm({ ...form, compatible_vehicles: updated.join(", ") });
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-sky-650 focus:ring-sky-500 cursor-pointer"
                      />
                      {name}
                    </label>
                  );
                })}
                {listings.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No vehicles available in the database.</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-550"
              />
              <label htmlFor="is_active" className="text-xs font-bold uppercase text-slate-650 cursor-pointer">Active Connection</label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              onClick={() => setEditing(null)}
              className="rounded-xl border border-slate-350 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-sky-600 px-5 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Connection
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search charger name, network, connectors..."
          className="flex-1 rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            <tr>
              <th className="px-6 py-4">Charger Name</th>
              <th className="px-6 py-4">Network</th>
              <th className="px-6 py-4">Connector Type</th>
              <th className="px-6 py-4">Power</th>
              <th className="px-6 py-4">Compatible Brands</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                <td className="px-6 py-4 text-slate-600">{c.network}</td>
                <td className="px-6 py-4 font-mono text-xs">{c.connector_type}</td>
                <td className="px-6 py-4">{c.power_output}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {c.compatible_vehicles.split(",").map(v => v.trim()).filter(Boolean).map(v => (
                      <span key={v} className="inline-flex rounded bg-slate-100 dark:bg-zinc-800 text-[10px] px-1.5 py-0.5 font-bold text-slate-600 dark:text-zinc-400">
                        {v}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                    c.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1.5 shrink-0">
                  <button onClick={() => startEdit(c)} className="p-2 text-slate-400 hover:text-sky-600"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 italic">No charger linkages configured yet.</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Loading configurations...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
