"use client";

import { useState, useEffect } from "react";
import { Check, X, Car, Clock, Phone, MapPin, Loader2, CheckCircle2, Wrench } from "lucide-react";

type VehicleLead = {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  interest: string;
  message: string;
  source: string;
  brand: string | null;
  model: string | null;
  reg_year: string | null;
  service_type: string | null;
  price_expectation: string | null;
  status: string | null;
  created_at: string;
};

export default function VehicleApprovalsPanel({ supabase }: { supabase: any }) {
  const [leads, setLeads] = useState<VehicleLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicleRequests();
  }, []);

  const fetchVehicleRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .not("brand", "is", null)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching vehicle requests:", error.message);
      } else {
        setLeads((data ?? []) as VehicleLead[]);
      }
    } catch (err) {
      console.error("Failed to query vehicle requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: "approved" | "rejected" | "closed") => {
    setActioningId(leadId);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) {
        alert("Failed to update request: " + error.message);
      } else {
        alert(`Vehicle request successfully marked as ${newStatus}!`);
        // Remove from list
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Car className="text-emerald-600 animate-pulse" size={22} /> Customer Vehicle Registrations
        </h2>
        <p className="text-xs text-ink-mute mt-1">Review, inspect, and approve customer cars registered for Selling or Scrapping.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={28} />
        </div>
      ) : leads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {leads.map((l) => (
            <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      l.service_type === "scrap" 
                        ? "text-rose-700 bg-rose-50 border-rose-100" 
                        : "text-emerald-700 bg-emerald-50 border-emerald-100"
                    }`}>
                      {l.service_type === "scrap" ? "Scrap Request" : "Sale Request"}
                    </span>
                    <h3 className="font-extrabold text-slate-900 mt-2 text-base">
                      {l.brand} {l.model} ({l.reg_year})
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-600 block">
                      INR {l.price_expectation || "No estimate"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p><strong>Owner Name:</strong> {l.name || "Anonymous Client"}</p>
                  <p className="flex items-center gap-1">
                    <Phone size={12} className="text-ink-mute" /> 
                    <a href={`tel:${l.phone}`} className="text-emerald-600 font-bold hover:underline">{l.phone}</a>
                  </p>
                  <p className="flex items-center gap-1">
                    <MapPin size={12} className="text-ink-mute" /> {l.pincode || "Not specified"}
                  </p>
                  {l.message && (
                    <p className="text-ink-mute italic mt-1 pt-1.5 border-t border-slate-200/50">
                      "{l.message}"
                    </p>
                  )}
                  <p className="flex items-center gap-1 text-ink-mute pt-1 border-t border-slate-200/50 mt-1">
                    <Clock size={12} /> {new Date(l.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-5 pt-3 border-t border-slate-100">
                <button
                  disabled={actioningId !== null}
                  onClick={() => handleUpdateStatus(l.id, "approved")}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 transition cursor-pointer"
                >
                  <Check size={14} /> Approve Request
                </button>
                <button
                  disabled={actioningId !== null}
                  onClick={() => handleUpdateStatus(l.id, "rejected")}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2.5 transition cursor-pointer"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white rounded-2xl">
          <Car className="text-ink-soft" size={40} />
          <h3 className="font-extrabold text-sm text-slate-700 mt-4">No pending vehicle requests</h3>
          <p className="text-xs text-ink-mute max-w-xs mt-1 leading-relaxed">
            All submitted car selling or scrapping requests are up to date.
          </p>
        </div>
      )}
    </div>
  );
}
