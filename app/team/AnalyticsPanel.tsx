"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Eye, Smartphone, Monitor, Globe,
  Car, RotateCcw, Trash2, RefreshCw, BarChart3,
  Layers, ArrowUpRight, Sparkles, CheckCircle2, Shield,
  Calendar, Database, ChevronDown, Clock
} from "lucide-react";

export default function AnalyticsPanel({ supabase }: { supabase?: any }) {
  const [stats, setStats] = useState<{
    total: number;
    today: number;
    oldestDate: string | null;
    topPages: Array<{ path: string; count: number }>;
    topVehicles: Array<{ slug: string; name: string; count: number }>;
    devices: Array<{ name: string; count: number; pct: number }>;
    referrers: Array<{ source: string; count: number }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [showCleanupMenu, setShowCleanupMenu] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [supabase]);

  const fetchStats = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Total & Today count
      const { count: total } = await supabase.from("page_views").select("*", { count: "exact", head: true });
      const { count: today } = await supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", todayStart);

      // Fetch oldest record date
      const { data: oldestRows } = await supabase
        .from("page_views")
        .select("created_at")
        .order("created_at", { ascending: true })
        .limit(1);

      const oldestDate = oldestRows?.[0]?.created_at || null;

      // Fetch last 1,000 views to calculate breakdowns
      const { data: rawViews } = await supabase
        .from("page_views")
        .select("path, slug, device, referrer, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      const views = rawViews || [];
      const totalCount = total || views.length || 0;

      // 1. Top Pages Breakdown
      const pageMap: Record<string, number> = {};
      const vehicleMap: Record<string, number> = {};
      const deviceMap: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
      const refMap: Record<string, number> = {};

      views.forEach((v: any) => {
        // Pages
        const p = v.path || "/";
        pageMap[p] = (pageMap[p] || 0) + 1;

        // Vehicles
        if (v.slug && v.slug.trim() !== "") {
          const s = v.slug.trim();
          vehicleMap[s] = (vehicleMap[s] || 0) + 1;
        } else if (p.startsWith("/product/")) {
          const s = p.replace("/product/", "").split("/")[0].split("?")[0];
          if (s) vehicleMap[s] = (vehicleMap[s] || 0) + 1;
        }

        // Devices
        const d = (v.device || "desktop").toLowerCase();
        if (d in deviceMap) deviceMap[d]++;
        else deviceMap.desktop++;

        // Referrers
        let ref = v.referrer || "Direct / Internal";
        if (ref.includes("google")) ref = "Google Search";
        else if (ref.includes("whatsapp") || ref.includes("wa.me")) ref = "WhatsApp";
        else if (ref.includes("facebook") || ref.includes("instagram") || ref.includes("twitter")) ref = "Social Media";
        else if (ref !== "Direct / Internal") {
          try {
            const urlObj = new URL(ref);
            ref = urlObj.hostname;
          } catch {
            // keep raw ref
          }
        }
        refMap[ref] = (refMap[ref] || 0) + 1;
      });

      const topPages = Object.entries(pageMap)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const topVehicles = Object.entries(vehicleMap)
        .map(([slug, count]) => {
          const name = slug
            .split("-")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          return { slug, name, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const devTotal = deviceMap.mobile + deviceMap.tablet + deviceMap.desktop || 1;
      const devices = [
        { name: "Mobile", count: deviceMap.mobile, pct: Math.round((deviceMap.mobile / devTotal) * 100) },
        { name: "Desktop", count: deviceMap.desktop, pct: Math.round((deviceMap.desktop / devTotal) * 100) },
        { name: "Tablet", count: deviceMap.tablet, pct: Math.round((deviceMap.tablet / devTotal) * 100) },
      ];

      const referrers = Object.entries(refMap)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setStats({
        total: totalCount,
        today: today || 0,
        oldestDate,
        topPages,
        topVehicles,
        devices,
        referrers,
      });
    } catch (e) {
      console.warn("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupData = async (days: "30" | "90" | "all") => {
    let confirmPrompt = "";
    if (days === "all") {
      confirmPrompt = "Are you sure you want to RESET all analytics data?\nAll recorded page views will be permanently deleted from Supabase.";
    } else {
      confirmPrompt = `Delete analytics pageview records older than ${days} days from Supabase?`;
    }

    if (!confirm(confirmPrompt)) return;

    setCleanupLoading(true);
    setShowCleanupMenu(false);

    try {
      const res = await fetch(`/api/track?days=${days}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Old analytics data cleaned successfully.");
        fetchStats();
      } else {
        alert("Cleanup failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error cleaning analytics: " + err.message);
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              In-House Team Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live telemetry stored in Supabase table <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sky-700">page_views</code>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 relative">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          {/* Clean / Delete Data Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCleanupMenu(!showCleanupMenu)}
              disabled={cleanupLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Trash2 size={13} />
              {cleanupLoading ? "Cleaning..." : "Manage / Clean Data"}
              <ChevronDown size={12} />
            </button>

            {showCleanupMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-30 space-y-1 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">Data Retention & Cleanup</p>
                  <p className="text-[10px] text-slate-500">Prune old Supabase database records</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleCleanupData("30")}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Clock size={13} className="text-slate-400" />
                  Delete records older than 30 days
                </button>

                <button
                  type="button"
                  onClick={() => handleCleanupData("90")}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Clock size={13} className="text-slate-400" />
                  Delete records older than 90 days
                </button>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCleanupData("all")}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 size={13} className="text-rose-500" />
                    Reset all stats to 0 (Clear all)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Views */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Pageviews</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats ? stats.total.toLocaleString("en-IN") : "0"}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.oldestDate ? `Since ${new Date(stats.oldestDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}` : "All-time recorded traffic"}
          </span>
        </div>

        {/* Today's Views */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-sky-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Traffic</span>
            <Eye size={16} className="text-sky-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-sky-800">
            {stats ? stats.today.toLocaleString("en-IN") : "0"}
          </p>
          <span className="text-[11px] text-sky-600/80 mt-1 block">Live visitors today</span>
        </div>

        {/* Top EV Demand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top EV Demand</span>
            <Car size={16} className="text-amber-500" />
          </div>
          <p className="text-base sm:text-lg font-black text-slate-900 truncate">
            {stats?.topVehicles?.[0]?.name || "None yet"}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.topVehicles?.[0]?.count ? `${stats.topVehicles[0].count} views` : "Awaiting views"}
          </span>
        </div>

        {/* Primary Platform */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Primary Device</span>
            <Smartphone size={16} className="text-violet-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.devices?.[0]?.pct ? `${stats.devices[0].pct}%` : "0%"}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.devices?.[0]?.name || "Mobile"} users
          </span>
        </div>
      </div>

      {/* ── Main Breakdown Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 6 cols: Top EV Models & Top Pages */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Top Viewed EV Models */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Car size={16} className="text-emerald-600" />
                Most Viewed EV Models
              </h3>
              <span className="text-[11px] text-slate-500">Live User Interest</span>
            </div>

            {stats?.topVehicles && stats.topVehicles.length > 0 ? (
              <div className="space-y-3">
                {stats.topVehicles.map((v, i) => {
                  const maxCount = stats.topVehicles[0].count || 1;
                  const pct = Math.round((v.count / maxCount) * 100);

                  return (
                    <div key={v.slug} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                            {i + 1}
                          </span>
                          {v.name}
                        </span>
                        <span className="font-black text-slate-900">{v.count} views</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No EV model page views recorded yet.
              </div>
            )}
          </div>

          {/* Top Visited Pages */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-sky-600" />
                Top Visited Pages
              </h3>
              <span className="text-[11px] text-slate-500">Navigation Flow</span>
            </div>

            {stats?.topPages && stats.topPages.length > 0 ? (
              <div className="space-y-2.5">
                {stats.topPages.map((p, i) => (
                  <div key={p.path} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-mono font-bold text-sky-700 truncate max-w-[240px]">
                      {p.path}
                    </span>
                    <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                      {p.count} views
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No page visits recorded yet.
              </div>
            )}
          </div>

        </div>

        {/* Right 6 cols: Devices & Traffic Sources */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Device Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Smartphone size={16} className="text-violet-600" />
                Devices & Platforms
              </h3>
              <span className="text-[11px] text-slate-500">Screen Types</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {stats?.devices?.map(d => (
                <div key={d.name} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 text-center space-y-1">
                  <div className="flex justify-center text-slate-500 mb-1">
                    {d.name === "Mobile" ? <Smartphone size={18} /> : d.name === "Desktop" ? <Monitor size={18} /> : <Layers size={18} />}
                  </div>
                  <p className="text-xs font-bold text-slate-600">{d.name}</p>
                  <p className="text-lg font-black text-slate-900">{d.count}</p>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                    {d.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources / Referrers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Globe size={16} className="text-amber-600" />
                Traffic Channels & Referrers
              </h3>
              <span className="text-[11px] text-slate-500">Acquisition</span>
            </div>

            {stats?.referrers && stats.referrers.length > 0 ? (
              <div className="space-y-2">
                {stats.referrers.map(r => (
                  <div key={r.source} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      {r.source}
                    </span>
                    <span className="font-bold text-slate-900">
                      {r.count} sessions
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No referral channels recorded yet.
              </div>
            )}
          </div>

          {/* Supabase Storage Schema Reference */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Database size={14} className="text-sky-600" />
                Supabase Storage Table
              </span>
              <button
                type="button"
                onClick={() => setShowSchema(!showSchema)}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
              >
                {showSchema ? "Hide SQL" : "View SQL"}
              </button>
            </div>

            {showSchema && (
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS page_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path        text NOT NULL,
  slug        text DEFAULT '',
  referrer    text DEFAULT '',
  device      text DEFAULT 'desktop',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pv_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_slug ON page_views(slug);`}
              </pre>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
