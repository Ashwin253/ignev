"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Zap,
  Battery as BatteryIcon,
  Plus,
  Trash2,
  Pencil,
  X,
  Save,
  Loader2,
  Search,
  MapPin,
  Wifi,
  Archive,
  Grid,
  Filter,
  CheckSquare,
  Square,
  Navigation
} from "lucide-react";

type Battery = {
  id?: string;
  name: string;
  location: string;
  status: "available" | "charging" | "reserved" | "unavailable";
  available_quantity: number;
  total_quantity: number;
  battery_percentage: number;
  estimated_ready_minutes: number;
  managed_by: string;
  latitude: number;
  longitude: number;
  is_archived: boolean;
  is_portable: boolean;
};

type ChargingStation = {
  id?: string;
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
  opening_time: string;
  closing_time: string;
  notes: string;
};

const emptyBattery: Battery = {
  name: "",
  location: "",
  status: "available",
  available_quantity: 10,
  total_quantity: 10,
  battery_percentage: 100,
  estimated_ready_minutes: 0,
  managed_by: "",
  latitude: 28.6139,
  longitude: 77.209,
  is_archived: false,
  is_portable: false,
};

const emptyStation: ChargingStation = {
  name: "",
  address: "",
  latitude: 28.6139,
  longitude: 77.209,
  power_source: "grid",
  available_ports: 4,
  occupied_ports: 0,
  waiting_minutes: 0,
  status: "open",
  has_wifi: false,
  opening_time: "06:00 AM",
  closing_time: "10:00 PM",
  notes: "",
};

export default function EventsPanel({
  supabase,
  userEmail,
}: {
  supabase: any;
  userEmail: string;
}) {
  const [activeTab, setActiveTab] = useState<"batteries" | "stations">("batteries");

  // Batteries State
  const [batteries, setBatteries] = useState<(Battery & { id: string })[]>([]);
  const [batLoading, setBatLoading] = useState(true);
  const [batSearch, setBatSearch] = useState("");
  const [batStatusFilter, setBatStatusFilter] = useState<string>("all");
  const [batArchiveFilter, setBatArchiveFilter] = useState<string>("active"); // 'active', 'archived', 'all'
  const [editingBattery, setEditingBattery] = useState<string | null>(null); // id or 'new'
  const [batForm, setBatForm] = useState<Battery>(emptyBattery);
  const [batSaving, setBatSaving] = useState(false);
  const [selectedBatIds, setSelectedBatIds] = useState<string[]>([]);

  // Charging Stations State
  const [stations, setStations] = useState<(ChargingStation & { id: string })[]>([]);
  const [staLoading, setStaLoading] = useState(true);
  const [staSearch, setStaSearch] = useState("");
  const [staStatusFilter, setStaStatusFilter] = useState<string>("all");
  const [staWifiFilter, setStaWifiFilter] = useState<string>("all"); // 'all', 'wifi'
  const [editingStation, setEditingStation] = useState<string | null>(null); // id or 'new'
  const [staForm, setStaForm] = useState<ChargingStation>(emptyStation);
  const [staSaving, setStaSaving] = useState(false);

  // Map Picker State (for stations tab)
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [geocodeQuery, setGeocodeQuery] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    fetchBatteries();
    fetchStations();

    // Subscribe to realtime updates on batteries
    const batterySubscription = supabase
      .channel("team-batteries-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "batteries" },
        () => {
          fetchBatteries();
        }
      )
      .subscribe();

    // Subscribe to realtime updates on charging stations
    const stationSubscription = supabase
      .channel("team-stations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "charging_stations" },
        () => {
          fetchStations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(batterySubscription);
      supabase.removeChannel(stationSubscription);
    };
  }, []);

  // Fetch initial datasets
  const fetchBatteries = async () => {
    setBatLoading(true);
    const { data, error } = await supabase
      .from("batteries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.warn("Fetch batteries error:", error.message);
    else setBatteries(data || []);
    setBatLoading(false);
  };

  const fetchStations = async () => {
    setStaLoading(true);
    const { data, error } = await supabase
      .from("charging_stations")
      .select("*")
      .order("name", { ascending: true });
    if (error) console.warn("Fetch stations error:", error.message);
    else setStations(data || []);
    setStaLoading(false);
  };

  // --- Map Picker Init & Updates ---
  useEffect(() => {
    // Only initialize map when editing or adding a station
    if (!editingStation || activeTab !== "stations" || !mapContainerRef.current) {
      // Cleanup map instance if editing is closed
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const container = mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    import("leaflet").then((L) => {
      if (!mapContainerRef.current) return;

      const initLat = Number(staForm.latitude) || 28.6139;
      const initLng = Number(staForm.longitude) || 77.209;

      const map = L.map(mapContainerRef.current, {
        center: [initLat, initLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // Create draggable marker
      const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Click on map to place marker
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setStaForm((prev) => ({
          ...prev,
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
        }));
      });

      // Drag marker to update coordinates
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setStaForm((prev) => ({
          ...prev,
          latitude: parseFloat(pos.lat.toFixed(6)),
          longitude: parseFloat(pos.lng.toFixed(6)),
        }));
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [editingStation, activeTab]);

  // Sync map center when form coordinates change
  const syncMapMarker = (lat: number, lng: number) => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (map && marker && !isNaN(lat) && !isNaN(lng)) {
      marker.setLatLng([lat, lng]);
      map.panTo([lat, lng]);
    }
  };

  // Geocode address search
  const handleGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geocodeQuery.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          geocodeQuery
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lon);
        setStaForm((prev) => ({
          ...prev,
          latitude: parseFloat(parsedLat.toFixed(6)),
          longitude: parseFloat(parsedLng.toFixed(6)),
          address: prev.address || display_name,
        }));
        syncMapMarker(parsedLat, parsedLng);
      } else {
        alert("Location not found. Please try a different query.");
      }
    } catch (err) {
      console.warn("Geocoding error:", err);
      alert("Failed to search location.");
    } finally {
      setGeocoding(false);
    }
  };

  // --- Battery CRUD Handlers ---
  const startNewBattery = () => {
    setBatForm(emptyBattery);
    setEditingBattery("new");
  };

  const startEditBattery = (b: Battery & { id: string }) => {
    setBatForm({
      ...emptyBattery,
      ...b,
      is_portable: b.is_portable ?? (Number(b.latitude) === 0 && Number(b.longitude) === 0),
    });
    setEditingBattery(b.id);
  };

  const handleSaveBattery = async () => {
    if (!batForm.name.trim() || !batForm.location.trim()) {
      alert("Please fill in the Name and Location fields.");
      return;
    }
    setBatSaving(true);
    const { id, ...payload } = batForm as any;

    if (editingBattery === "new") {
      const { error } = await supabase.from("batteries").insert([payload]);
      if (error) alert(`Error inserting battery: ${error.message}`);
      else setEditingBattery(null);
    } else {
      const { error } = await supabase
        .from("batteries")
        .update(payload)
        .eq("id", editingBattery);
      if (error) alert(`Error updating battery: ${error.message}`);
      else setEditingBattery(null);
    }
    setBatSaving(false);
    fetchBatteries();
  };

  const handleDeleteBattery = async (id: string) => {
    if (!confirm("Are you sure you want to delete this battery variant?")) return;
    const { error } = await supabase.from("batteries").delete().eq("id", id);
    if (error) alert(`Delete failed: ${error.message}`);
    fetchBatteries();
  };

  const toggleArchiveBattery = async (b: Battery & { id: string }) => {
    const { error } = await supabase
      .from("batteries")
      .update({ is_archived: !b.is_archived })
      .eq("id", b.id);
    if (error) alert(`Archive update failed: ${error.message}`);
    fetchBatteries();
  };

  // --- Battery Bulk Actions ---
  const handleSelectBattery = (id: string) => {
    setSelectedBatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllBatteries = (filteredIds: string[]) => {
    const allSelected = filteredIds.every((id) => selectedBatIds.includes(id));
    if (allSelected) {
      setSelectedBatIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedBatIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBulkStatusChange = async (status: Battery["status"]) => {
    if (selectedBatIds.length === 0) return;
    if (!confirm(`Update status of ${selectedBatIds.length} batteries to ${status}?`)) return;

    setBatSaving(true);
    const { error } = await supabase
      .from("batteries")
      .update({ status })
      .in("id", selectedBatIds);

    if (error) alert(`Bulk status update failed: ${error.message}`);
    else setSelectedBatIds([]);
    setBatSaving(false);
    fetchBatteries();
  };

  const handleBulkArchiveChange = async (archive: boolean) => {
    if (selectedBatIds.length === 0) return;
    if (!confirm(`${archive ? "Archive" : "Unarchive"} ${selectedBatIds.length} batteries?`)) return;

    setBatSaving(true);
    const { error } = await supabase
      .from("batteries")
      .update({ is_archived: archive })
      .in("id", selectedBatIds);

    if (error) alert(`Bulk archive update failed: ${error.message}`);
    else setSelectedBatIds([]);
    setBatSaving(false);
    fetchBatteries();
  };

  const handleBulkDelete = async () => {
    if (selectedBatIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedBatIds.length} batteries? This action is irreversible.`)) return;

    setBatSaving(true);
    const { error } = await supabase
      .from("batteries")
      .delete()
      .in("id", selectedBatIds);

    if (error) alert(`Bulk delete failed: ${error.message}`);
    else setSelectedBatIds([]);
    setBatSaving(false);
    fetchBatteries();
  };

  // --- Station CRUD Handlers ---
  const startNewStation = () => {
    setStaForm(emptyStation);
    setGeocodeQuery("");
    setEditingStation("new");
  };

  const startEditStation = (s: ChargingStation & { id: string }) => {
    setStaForm(s);
    setGeocodeQuery("");
    setEditingStation(s.id);
  };

  const handleSaveStation = async () => {
    if (!staForm.name.trim() || !staForm.address.trim()) {
      alert("Please fill in the Name and Address fields.");
      return;
    }
    setStaSaving(true);
    const { id, ...payload } = staForm as any;

    if (editingStation === "new") {
      const { error } = await supabase.from("charging_stations").insert([payload]);
      if (error) alert(`Error inserting station: ${error.message}`);
      else setEditingStation(null);
    } else {
      const { error } = await supabase
        .from("charging_stations")
        .update(payload)
        .eq("id", editingStation);
      if (error) alert(`Error updating station: ${error.message}`);
      else setEditingStation(null);
    }
    setStaSaving(false);
    fetchStations();
  };

  const handleDeleteStation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this charging station?")) return;
    const { error } = await supabase.from("charging_stations").delete().eq("id", id);
    if (error) alert(`Delete failed: ${error.message}`);
    fetchStations();
  };

  // --- Filter Logic ---
  const filteredBatteries = useMemo(() => {
    return batteries.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(batSearch.toLowerCase()) ||
        b.location.toLowerCase().includes(batSearch.toLowerCase()) ||
        (b.managed_by || "").toLowerCase().includes(batSearch.toLowerCase());

      let matchesArchive = true;
      if (batArchiveFilter === "active") matchesArchive = !b.is_archived;
      else if (batArchiveFilter === "archived") matchesArchive = b.is_archived;

      const matchesStatus = batStatusFilter === "all" || b.status === batStatusFilter;

      return matchesSearch && matchesArchive && matchesStatus;
    });
  }, [batteries, batSearch, batArchiveFilter, batStatusFilter]);

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(staSearch.toLowerCase()) ||
        s.address.toLowerCase().includes(staSearch.toLowerCase());

      const matchesStatus = staStatusFilter === "all" || s.status === staStatusFilter;
      const matchesWifi = staWifiFilter === "all" || s.has_wifi;

      return matchesSearch && matchesStatus && matchesWifi;
    });
  }, [stations, staSearch, staStatusFilter, staWifiFilter]);

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("batteries");
            setEditingBattery(null);
            setEditingStation(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === "batteries"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BatteryIcon size={16} />
          Battery Inventory
        </button>
        <button
          onClick={() => {
            setActiveTab("stations");
            setEditingBattery(null);
            setEditingStation(null);
          }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === "stations"
              ? "border-slate-950 text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Zap size={16} />
          Charging Stations
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BATTERY INVENTORY */}
      {/* ========================================================================= */}
      {activeTab === "batteries" && (
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                Manage portable battery packs distributed to gatherings.
              </p>
            </div>
            {!editingBattery && (
              <button
                onClick={startNewBattery}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 px-4 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                <Plus size={14} /> Add Battery
              </button>
            )}
          </div>

          {/* Battery Form Editor */}
          {editingBattery && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-sky-850">
                  {editingBattery === "new" ? "New Battery Record" : "Edit Battery Details"}
                </h3>
                <button
                  onClick={() => setEditingBattery(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-slate-650">Battery Name *</span>
                  <input
                    type="text"
                    value={batForm.name}
                    onChange={(e) => setBatForm({ ...batForm, name: e.target.value })}
                    placeholder="e.g. 48V Swap Battery"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-650">Location / Camp Name *</span>
                  <input
                    type="text"
                    value={batForm.location}
                    onChange={(e) => setBatForm({ ...batForm, location: e.target.value })}
                    placeholder="e.g. Central Camp Gate"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-650">Volunteer (Managed By)</span>
                  <input
                    type="text"
                    value={batForm.managed_by}
                    onChange={(e) => setBatForm({ ...batForm, managed_by: e.target.value })}
                    placeholder="e.g. Rahul"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-650">Status</span>
                  <select
                    value={batForm.status}
                    onChange={(e) =>
                      setBatForm({ ...batForm, status: e.target.value as Battery["status"] })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="charging">Charging</option>
                    <option value="reserved">Reserved</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-650">Available Quantity</span>
                  <input
                    type="number"
                    value={batForm.available_quantity}
                    onChange={(e) =>
                      setBatForm({ ...batForm, available_quantity: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-650">Total Quantity</span>
                  <input
                    type="number"
                    value={batForm.total_quantity}
                    onChange={(e) =>
                      setBatForm({ ...batForm, total_quantity: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-650">Battery Charge (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={batForm.battery_percentage}
                    onChange={(e) =>
                      setBatForm({
                        ...batForm,
                        battery_percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-650">Ready In (Minutes)</span>
                  <input
                    type="number"
                    value={batForm.estimated_ready_minutes}
                    onChange={(e) =>
                      setBatForm({
                        ...batForm,
                        estimated_ready_minutes: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="If charging..."
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      disabled={batForm.is_portable}
                      value={batForm.is_portable ? 0 : batForm.latitude}
                      onChange={(e) =>
                        setBatForm({ ...batForm, latitude: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white disabled:bg-slate-100 px-3 py-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      disabled={batForm.is_portable}
                      value={batForm.is_portable ? 0 : batForm.longitude}
                      onChange={(e) =>
                        setBatForm({ ...batForm, longitude: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white disabled:bg-slate-100 px-3 py-2 text-sm outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-sky-100">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batForm.is_portable}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setBatForm({
                          ...batForm,
                          is_portable: val,
                          latitude: val ? 0 : batForm.latitude || 28.6139,
                          longitude: val ? 0 : batForm.longitude || 77.209,
                        });
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    Portable &amp; Mobile Battery (No Fixed Location)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batForm.is_archived}
                      onChange={(e) => setBatForm({ ...batForm, is_archived: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    Archive this battery (hide from public view)
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingBattery(null)}
                    className="rounded-lg border border-slate-350 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBattery}
                    disabled={batSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {batSaving ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Save Battery
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search, Filter, Bulk Operations Area */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search bar */}
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={batSearch}
                  onChange={(e) => setBatSearch(e.target.value)}
                  placeholder="Search by battery name, camp location, managed volunteer..."
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              {/* Status filter */}
              <select
                value={batStatusFilter}
                onChange={(e) => setBatStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 cursor-pointer outline-none focus:border-slate-400"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="charging">Charging</option>
                <option value="reserved">Reserved</option>
                <option value="unavailable">Unavailable</option>
              </select>

              {/* Archive filter */}
              <select
                value={batArchiveFilter}
                onChange={(e) => setBatArchiveFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 cursor-pointer outline-none focus:border-slate-400"
              >
                <option value="active">Active Only</option>
                <option value="archived">Archived Only</option>
                <option value="all">All Records</option>
              </select>
            </div>

            {/* Bulk Update Controls (Show only if checkbox is selected) */}
            {selectedBatIds.length > 0 && (
              <div className="bg-slate-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-700">
                    {selectedBatIds.length} Selected
                  </span>
                  <button
                    onClick={() => setSelectedBatIds([])}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-650 underline"
                  >
                    Clear Selection
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Bulk Update Status:
                  </span>
                  {(["available", "charging", "reserved", "unavailable"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleBulkStatusChange(st)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-750 cursor-pointer"
                    >
                      {st}
                    </button>
                  ))}
                  <div className="w-[1px] h-4 bg-slate-300 mx-2" />
                  <button
                    onClick={() => handleBulkArchiveChange(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-750 cursor-pointer"
                  >
                    <Archive size={10} /> Archive
                  </button>
                  <button
                    onClick={() => handleBulkArchiveChange(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-750 cursor-pointer"
                  >
                    Unarchive
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md text-[10px] font-bold text-rose-700 cursor-pointer"
                  >
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              </div>
            )}

            {/* Battery Inventory Table */}
            {batLoading ? (
              <p className="text-slate-400 text-sm text-center py-12">Loading batteries...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="py-3 px-4 w-12 text-center">
                        <button
                          onClick={() =>
                            handleSelectAllBatteries(filteredBatteries.map((b) => b.id))
                          }
                          className="text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {filteredBatteries.length > 0 &&
                          filteredBatteries.every((b) => selectedBatIds.includes(b.id)) ? (
                            <CheckSquare size={16} className="text-slate-800" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">Name</th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">
                        Location
                      </th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">Status</th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">Qty</th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">Charge</th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">
                        Volunteer
                      </th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatteries.map((b) => {
                      const isSelected = selectedBatIds.includes(b.id);
                      const statusColor =
                        b.status === "available"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.status === "charging"
                          ? "bg-amber-100 text-amber-800"
                          : b.status === "reserved"
                          ? "bg-violet-100 text-violet-800"
                          : "bg-rose-100 text-rose-800";

                      return (
                        <tr
                          key={b.id}
                          className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                            b.is_archived ? "opacity-50" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleSelectBattery(b.id)}
                              className="text-slate-400 hover:text-slate-650 focus:outline-none"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-slate-800" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-805">
                            {b.name}
                            {b.is_portable && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold">
                                PORTABLE
                              </span>
                            )}
                            {b.is_archived && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold">
                                ARCHIVED
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-550">{b.location}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusColor}`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                            {b.available_quantity} / {b.total_quantity}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {b.battery_percentage}%
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-500">
                            {b.managed_by || "—"}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 shrink-0">
                            <button
                              onClick={() => startEditBattery(b)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-slate-500 hover:text-sky-600 transition-colors"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => toggleArchiveBattery(b)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors"
                              title={b.is_archived ? "Activate" : "Archive"}
                            >
                              <Archive size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteBattery(b.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:border-rose-500 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBatteries.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                          No battery inventory found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CHARGING STATIONS */}
      {/* ========================================================================= */}
      {activeTab === "stations" && (
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                Manage deployed community charging and internet hotspot stations.
              </p>
            </div>
            {!editingStation && (
              <button
                onClick={startNewStation}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 px-4 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                <Plus size={14} /> Add Station
              </button>
            )}
          </div>

          {/* Station Form Editor with Map Picker */}
          {editingStation && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                <h3 className="text-sm font-black text-sky-850">
                  {editingStation === "new" ? "New Station Deployment" : "Edit Station Deployment"}
                </h3>
                <button
                  onClick={() => setEditingStation(null)}
                  className="text-slate-400 hover:text-slate-650"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nominatim Search Geocoder */}
              <form
                onSubmit={handleGeocode}
                className="bg-white rounded-xl p-3.5 border border-sky-100 space-y-2"
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450 block">
                  Find Coordinates via Address Search
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={geocodeQuery}
                    onChange={(e) => setGeocodeQuery(e.target.value)}
                    placeholder="e.g. Connaught Place, New Delhi or Jantar Mantar"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    disabled={geocoding}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {geocoding ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Search size={12} />
                    )}
                    Locate
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Form fields */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Station Name *</span>
                    <input
                      type="text"
                      value={staForm.name}
                      onChange={(e) => setStaForm({ ...staForm, name: e.target.value })}
                      placeholder="e.g. Camp Gate 2 Hub"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Address / Location Descr *</span>
                    <input
                      type="text"
                      value={staForm.address}
                      onChange={(e) => setStaForm({ ...staForm, address: e.target.value })}
                      placeholder="e.g. Behind main stage area"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Power Source</span>
                    <select
                      value={staForm.power_source}
                      onChange={(e) =>
                        setStaForm({
                          ...staForm,
                          power_source: e.target.value as ChargingStation["power_source"],
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option value="grid">Grid (Mains)</option>
                      <option value="battery">Battery Bank</option>
                      <option value="solar">Solar PV</option>
                      <option value="hybrid">Hybrid Generator</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Operating Hours</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="text"
                        value={staForm.opening_time}
                        onChange={(e) => setStaForm({ ...staForm, opening_time: e.target.value })}
                        placeholder="e.g. 06:00 AM"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      />
                      <input
                        type="text"
                        value={staForm.closing_time}
                        onChange={(e) => setStaForm({ ...staForm, closing_time: e.target.value })}
                        placeholder="e.g. 10:00 PM"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Available Ports</span>
                    <input
                      type="number"
                      value={staForm.available_ports}
                      onChange={(e) =>
                        setStaForm({ ...staForm, available_ports: parseInt(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Occupied Ports</span>
                    <input
                      type="number"
                      value={staForm.occupied_ports}
                      onChange={(e) =>
                        setStaForm({ ...staForm, occupied_ports: parseInt(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Estimated Wait (Minutes)</span>
                    <input
                      type="number"
                      value={staForm.waiting_minutes}
                      onChange={(e) =>
                        setStaForm({ ...staForm, waiting_minutes: parseInt(e.target.value) || 0 })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-650">Deployment Status</span>
                    <select
                      value={staForm.status}
                      onChange={(e) =>
                        setStaForm({
                          ...staForm,
                          status: e.target.value as ChargingStation["status"],
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option value="open">Open / Idle</option>
                      <option value="busy">Busy / Congested</option>
                      <option value="offline">Offline / Inactive</option>
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-655">Latitude</span>
                      <input
                        type="number"
                        step="any"
                        value={staForm.latitude}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setStaForm({ ...staForm, latitude: val });
                          syncMapMarker(val, Number(staForm.longitude));
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold text-slate-655">Longitude</span>
                      <input
                        type="number"
                        step="any"
                        value={staForm.longitude}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setStaForm({ ...staForm, longitude: val });
                          syncMapMarker(Number(staForm.latitude), val);
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                      />
                    </label>
                  </div>

                  <label className="block sm:col-span-2">
                    <span className="text-xs font-bold text-slate-650">Operational Notes</span>
                    <input
                      type="text"
                      value={staForm.notes}
                      onChange={(e) => setStaForm({ ...staForm, notes: e.target.value })}
                      placeholder="e.g. Bring own micro-USB / Type-C cables."
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </label>
                </div>

                {/* Map Picker Visual */}
                <div className="lg:col-span-2 flex flex-col">
                  <span className="text-xs font-extrabold text-slate-650 mb-1 flex items-center gap-1">
                    <MapPin size={12} className="text-sky-600" />
                    Interactive Map Picker (Drag Marker or Click Map)
                  </span>
                  <div className="w-full flex-1 min-h-[250px] lg:min-h-[320px] rounded-xl border border-slate-200 overflow-hidden relative shadow-inner bg-slate-100">
                    <div ref={mapContainerRef} className="absolute inset-0" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-sky-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staForm.has_wifi}
                    onChange={(e) => setStaForm({ ...staForm, has_wifi: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-sky-655 focus:ring-sky-500 cursor-pointer"
                  />
                  Offers Internet Hotspot (WiFi Enabled)
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingStation(null)}
                    className="rounded-lg border border-slate-350 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveStation}
                    disabled={staSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {staSaving ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Save Station
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search, Filter Area */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search bar */}
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={staSearch}
                  onChange={(e) => setStaSearch(e.target.value)}
                  placeholder="Search by station name, address location..."
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              {/* Status filter */}
              <select
                value={staStatusFilter}
                onChange={(e) => setStaStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 cursor-pointer outline-none focus:border-slate-400"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>

              {/* WiFi Filter */}
              <select
                value={staWifiFilter}
                onChange={(e) => setStaWifiFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 cursor-pointer outline-none focus:border-slate-400"
              >
                <option value="all">All Locations</option>
                <option value="wifi">WiFi / Internet Only</option>
              </select>
            </div>

            {/* Stations List Table */}
            {staLoading ? (
              <p className="text-slate-400 text-sm text-center py-12">Loading stations...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">Name</th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">
                        Address
                      </th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">Status</th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">
                        Power Source
                      </th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">Ports</th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">WiFi</th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase">
                        Wait Time
                      </th>
                      <th className="py-3 px-4 font-bold text-slate-600 text-xs uppercase text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStations.map((s) => {
                      const statusColor =
                        s.status === "open"
                          ? "bg-emerald-100 text-emerald-800"
                          : s.status === "busy"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700";

                      return (
                        <tr
                          key={s.id}
                          className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-slate-805">{s.name}</td>
                          <td className="py-3 px-4 text-slate-550 text-xs max-w-xs truncate">
                            {s.address}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusColor}`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-semibold bg-blue-50 text-blue-750 px-2 py-0.5 rounded">
                              {s.power_source}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-bold text-slate-700">
                            {s.available_ports} avl / {s.occupied_ports} occ
                          </td>
                          <td className="py-3 px-4">
                            {s.has_wifi ? (
                              <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-500 text-xs font-bold">
                                <Wifi size={12} /> Yes
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">No</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-750">
                            {s.waiting_minutes > 0 ? `${s.waiting_minutes} mins` : "None"}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => startEditStation(s)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-slate-500 hover:text-sky-600 transition-colors"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteStation(s.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 hover:border-rose-500 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStations.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                          No charging stations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
