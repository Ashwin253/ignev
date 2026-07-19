"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, Phone, MapPin, MessageSquare, Clock, User } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  interest: string;
  message: string;
  source: string;
  assisted_by: string | null;
  assisted_at: string | null;
  created_at: string;
};

export default function LeadsPanel({ supabase, userId }: { supabase: any; userId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "assisted">("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .neq("source", "/foryou Recommendation")
      .order("created_at", { ascending: false });
    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  };

  const markAssisted = async (leadId: string) => {
    await supabase.from("leads").update({
      assisted_by: userId,
      assisted_at: new Date().toISOString(),
    }).eq("id", leadId);
    fetchLeads();
  };

  const unmarkAssisted = async (leadId: string) => {
    await supabase.from("leads").update({
      assisted_by: null,
      assisted_at: null,
    }).eq("id", leadId);
    fetchLeads();
  };

  const sourceOptions = useMemo(() => {
    const sources = [...new Set(leads.map((l) => l.source).filter(Boolean))].sort();
    return ["all", ...sources];
  }, [leads]);

  const filtered = leads.filter((l) => {
    // 1. Status Filter
    if (filter === "pending" && l.assisted_by) return false;
    if (filter === "assisted" && !l.assisted_by) return false;

    // 2. Source Filter
    if (selectedSource !== "all" && l.source !== selectedSource) return false;

    return true;
  });

  const pendingCount = leads.filter((l) => !l.assisted_by).length;

  if (loading) return <div className="text-center py-12 text-slate-400">Loading leads...</div>;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter("all")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            All ({leads.length})
          </button>
          <button onClick={() => setFilter("pending")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${filter === "pending" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            Pending ({pendingCount})
          </button>
          <button onClick={() => setFilter("assisted")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${filter === "assisted" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            Assisted ({leads.length - pendingCount})
          </button>
        </div>

        {/* Source Dropdown Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">Source:</span>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 outline-none focus:border-slate-300 transition"
          >
            {sourceOptions.map((src) => (
              <option key={src} value={src}>
                {src === "all" ? "All Sources" : src}
              </option>
            ))}
          </select>
        </div>

        <button onClick={fetchLeads} className="ml-auto text-xs text-sky-600 font-bold hover:text-sky-700 cursor-pointer">Refresh</button>
      </div>

      {/* Leads list */}
      <div className="space-y-2">
        {filtered.map((lead) => (
          <div key={lead.id} className={`rounded-xl border p-4 transition-all ${lead.assisted_by ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-900 text-sm">{lead.name || "Anonymous"}</p>
                  {lead.assisted_by && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      <Check size={9} /> Assisted
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {lead.phone && <span className="inline-flex items-center gap-1"><Phone size={10} /> {lead.phone}</span>}
                  {lead.pincode && <span className="inline-flex items-center gap-1"><MapPin size={10} /> {lead.pincode}</span>}
                  {lead.interest && <span className="inline-flex items-center gap-1"><User size={10} /> {lead.interest}</span>}
                </div>
                {lead.message && (
                  <p className="mt-1.5 text-xs text-slate-600 flex items-start gap-1">
                    <MessageSquare size={10} className="mt-0.5 shrink-0 text-slate-400" /> {lead.message}
                  </p>
                )}
                <p className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock size={9} /> {new Date(lead.created_at).toLocaleString()} · {lead.source}
                </p>
                {lead.assisted_by === userId && lead.assisted_at && (
                  <p className="text-[10px] text-emerald-600 mt-0.5">You assisted this on {new Date(lead.assisted_at).toLocaleDateString()}</p>
                )}
              </div>
              <div className="shrink-0">
                {!lead.assisted_by ? (
                  <button onClick={() => markAssisted(lead.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer">
                    <Check size={12} /> I Assisted
                  </button>
                ) : lead.assisted_by === userId ? (
                  <button onClick={() => unmarkAssisted(lead.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
                    Undo
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">No leads {filter !== "all" ? `in "${filter}" category` : "yet"}</div>
        )}
      </div>
    </div>
  );
}
