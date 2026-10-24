"use client";

import { useState, useEffect } from "react";
import { Check, Phone, MapPin, MessageSquare, Clock, User, Sparkles, Send, ShieldCheck } from "lucide-react";

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

export default function ForYouLeadsPanel({ supabase, userId }: { supabase: any; userId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("source", "/foryou Recommendation")
      .order("created_at", { ascending: false });
    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  };

  const confirmAndSend = async (leadId: string) => {
    setSendingId(leadId);
    // Simulate confirming match results manually before forwarding
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    await supabase.from("leads").update({
      assisted_by: userId,
      assisted_at: new Date().toISOString(),
    }).eq("id", leadId);
    
    setSendingId(null);
    fetchLeads();
  };

  const undoConfirmation = async (leadId: string) => {
    await supabase.from("leads").update({
      assisted_by: null,
      assisted_at: null,
    }).eq("id", leadId);
    fetchLeads();
  };

  const parseMessage = (msg: string) => {
    const info: Record<string, string> = {};
    if (!msg) return info;
    const parts = msg.split(" | ");
    parts.forEach((part) => {
      const idx = part.indexOf(":");
      if (idx !== -1) {
        const key = part.substring(0, idx).trim().toLowerCase();
        const val = part.substring(idx + 1).trim();
        info[key] = val;
      }
    });
    return info;
  };

  const filtered = leads.filter((l) => {
    if (filter === "pending") return !l.assisted_by;
    if (filter === "confirmed") return !!l.assisted_by;
    return true;
  });

  const pendingCount = leads.filter((l) => !l.assisted_by).length;

  if (loading) return <div className="text-center py-12 text-ink-mute">Loading curation leads...</div>;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button onClick={() => setFilter("all")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${filter === "all" ? "bg-white text-ink" : "bg-slate-100 text-slate-600"}`}>
          All ({leads.length})
        </button>
        <button onClick={() => setFilter("pending")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${filter === "pending" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}>
          Pending Confirm ({pendingCount})
        </button>
        <button onClick={() => setFilter("confirmed")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${filter === "confirmed" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}>
          Sent/Confirmed ({leads.length - pendingCount})
        </button>
        <button onClick={fetchLeads} className="ml-auto text-xs text-emerald-600 font-bold hover:text-emerald-700 cursor-pointer">Refresh</button>
      </div>

      {/* Curation Leads list */}
      <div className="space-y-3">
        {filtered.map((lead) => {
          const parsed = parseMessage(lead.message);
          return (
            <div key={lead.id} className={`rounded-2xl border p-5 transition-all shadow-sm ${lead.assisted_by ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white"}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Lead Info header */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-extrabold text-slate-900 text-sm">{lead.name || "Anonymous User"}</p>
                      {lead.assisted_by ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                          <ShieldCheck size={10} /> Report Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                          Pending Curation
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute">
                      {lead.phone && <span className="inline-flex items-center gap-1"><Phone size={10} /> {lead.phone}</span>}
                      {lead.pincode && <span className="inline-flex items-center gap-1"><MapPin size={10} /> State: {lead.pincode}</span>}
                      <span className="inline-flex items-center gap-1"><Clock size={10} /> {new Date(lead.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Wizard Choices parsed representation */}
                  <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 space-y-2">
                    <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Curation parameters</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {parsed["usage"] && (
                        <div className="flex flex-col p-1.5 bg-white border border-slate-100 rounded-lg">
                          <span className="text-[9px] text-ink-mute uppercase font-medium">Usage Type</span>
                          <span className="font-bold text-slate-800">{parsed["usage"]}</span>
                        </div>
                      )}
                      {parsed["vehicle type"] && (
                        <div className="flex flex-col p-1.5 bg-white border border-slate-100 rounded-lg">
                          <span className="text-[9px] text-ink-mute uppercase font-medium">EV Type</span>
                          <span className="font-bold text-slate-800">{parsed["vehicle type"]}</span>
                        </div>
                      )}
                      {parsed["commute"] && (
                        <div className="flex flex-col p-1.5 bg-white border border-slate-100 rounded-lg">
                          <span className="text-[9px] text-ink-mute uppercase font-medium">Commute Range</span>
                          <span className="font-bold text-slate-800 capitalize">{parsed["commute"].replace("_", " ")}</span>
                        </div>
                      )}
                      {parsed["parking"] && (
                        <div className="flex flex-col p-1.5 bg-white border border-slate-100 rounded-lg">
                          <span className="text-[9px] text-ink-mute uppercase font-medium">Charging Setup</span>
                          <span className="font-bold text-slate-800 capitalize">{parsed["parking"].replace("_", " ")}</span>
                        </div>
                      )}
                      {parsed["budget range"] && (
                        <div className="flex flex-col p-1.5 bg-white border border-slate-100 rounded-lg">
                          <span className="text-[9px] text-ink-mute uppercase font-medium">Budget Limits</span>
                          <span className="font-bold text-slate-800 uppercase">{parsed["budget range"]}</span>
                        </div>
                      )}
                      {parsed["location"] && (
                        <div className="flex flex-col p-1.5 bg-white border border-slate-100 rounded-lg">
                          <span className="text-[9px] text-ink-mute uppercase font-medium">Location</span>
                          <span className="font-bold text-slate-800">{parsed["location"]}</span>
                        </div>
                      )}
                      {parsed["loan needed"] && (
                        <div className="flex flex-col p-1.5 bg-white border border-slate-100 rounded-lg col-span-2 sm:col-span-2">
                          <span className="text-[9px] text-ink-mute uppercase font-medium">Financing Needs</span>
                          <span className="font-bold text-slate-800 text-[11px] truncate">{parsed["loan needed"]}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 mt-2">
                      <span className="text-[10px] text-ink-mute font-medium">Real-Time match count shown to user:</span>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {parsed["match count"] || "N/A"} matches
                      </span>
                    </div>
                  </div>

                  {lead.assisted_by === userId && lead.assisted_at && (
                    <p className="text-[10px] text-emerald-600 font-medium">✓ You manually confirmed & forwarded recommendation matches on {new Date(lead.assisted_at).toLocaleDateString()}</p>
                  )}
                </div>

                {/* Manual confirm button */}
                <div className="shrink-0 flex items-center md:pt-2">
                  {!lead.assisted_by ? (
                    <button 
                      onClick={() => confirmAndSend(lead.id)}
                      disabled={sendingId === lead.id}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-3 shadow-md shadow-emerald-500/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {sendingId === lead.id ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send size={12} /> Confirm & Send Report
                        </>
                      )}
                    </button>
                  ) : lead.assisted_by === userId ? (
                    <button 
                      onClick={() => undoConfirmation(lead.id)}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-ink-mute hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                    >
                      Undo Confirmation
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-ink-mute text-sm">
            <Sparkles size={20} className="mx-auto mb-2 text-ink-soft" />
            No curation requests {filter !== "all" ? `in "${filter}" category` : "yet"}
          </div>
        )}
      </div>
    </div>
  );
}
