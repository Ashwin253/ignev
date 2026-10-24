"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Eye, Smartphone, Monitor, Globe,
  Car, RefreshCw, BarChart3,
  Layers, Calendar, ChevronDown,
} from "lucide-react";

type Period = "7" | "30" | "90";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Last 1 Week", value: "7" },
  { label: "Last 1 Month", value: "30" },
  { label: "Last 3 Months", value: "90" },
];

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
  const [period, setPeriod] = useState<Period>("30");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [supabase, period]);

  const fetchStats = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const periodStart = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString();

      // Total & Today count (scoped to selected period)
      const { count: total } = await supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", periodStart);
      const { count: today } = await supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", todayStart);

      // Fetch oldest record date within period
      const { data: oldestRows } = await supabase
        .from("page_views")
        .select("created_at")
        .gte("created_at", periodStart)
        .order("created_at", { ascending: true })
        .limit(1);

      const oldestDate = oldestRows?.[0]?.created_at || null;

      // Fetch last 1,000 views within period to calculate breakdowns
      const { data: rawViews } = await supabase
        .from("page_views")
        .select("path, slug, device, referrer, created_at")
        .gte("created_at", periodStart)
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


  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              In-House Team Analytics
            </h2>
            <p className="text-xs text-ink-mute mt-0.5">
              Live telemetry stored in Supabase · <span className="font-semibold text-emerald-600">{PERIODS.find(p => p.value === period)?.label}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 transition-colors cursor-pointer shadow-xs"
            >
              <Calendar size={13} />
              {PERIODS.find(p => p.value === period)?.label}
              <ChevronDown size={12} className={showPeriodMenu ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {showPeriodMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-30 space-y-0.5 animate-in fade-in duration-150">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setPeriod(p.value); setShowPeriodMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                      period === p.value
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Calendar size={12} className="text-brand" />
                    {p.label}
                    {period === p.value && <span className="ml-auto text-emerald-500">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Views */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-mute mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Pageviews</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats ? stats.total.toLocaleString("en-IN") : "0"}
          </p>
          <span className="text-[11px] text-ink-mute mt-1 block">
            {stats?.oldestDate ? `Since ${new Date(stats.oldestDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}` : "All-time recorded traffic"}
          </span>
        </div>

        {/* Today's Views */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Traffic</span>
            <Eye size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-800">
            {stats ? stats.today.toLocaleString("en-IN") : "0"}
          </p>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">Live visitors today</span>
        </div>

        {/* Top EV Demand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-mute mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top EV Demand</span>
            <Car size={16} className="text-amber-500" />
          </div>
          <p className="text-base sm:text-lg font-black text-slate-900 truncate">
            {stats?.topVehicles?.[0]?.name || "None yet"}
          </p>
          <span className="text-[11px] text-ink-mute mt-1 block">
            {stats?.topVehicles?.[0]?.count ? `${stats.topVehicles[0].count} views` : "Awaiting views"}
          </span>
        </div>

        {/* Primary Platform */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-mute mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Primary Device</span>
            <Smartphone size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats?.devices?.[0]?.pct ? `${stats.devices[0].pct}%` : "0%"}
          </p>
          <span className="text-[11px] text-ink-mute mt-1 block">
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
              <span className="text-[11px] text-ink-mute">Live User Interest</span>
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
              <div className="text-center py-8 text-ink-mute text-xs font-semibold">
                No EV model page views recorded yet.
              </div>
            )}
          </div>

          {/* Top Visited Pages */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-emerald-600" />
                Top Visited Pages
              </h3>
              <span className="text-[11px] text-ink-mute">Navigation Flow</span>
            </div>

            {stats?.topPages && stats.topPages.length > 0 ? (
              <div className="space-y-2.5">
                {stats.topPages.map((p, i) => (
                  <div key={p.path} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-mono font-bold text-emerald-700 truncate max-w-[240px]">
                      {p.path}
                    </span>
                    <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                      {p.count} views
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-ink-mute text-xs font-semibold">
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
                <Smartphone size={16} className="text-emerald-600" />
                Devices & Platforms
              </h3>
              <span className="text-[11px] text-ink-mute">Screen Types</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {stats?.devices?.map(d => (
                <div key={d.name} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 text-center space-y-1">
                  <div className="flex justify-center text-ink-mute mb-1">
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
              <span className="text-[11px] text-ink-mute">Acquisition</span>
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
              <div className="text-center py-8 text-ink-mute text-xs font-semibold">
                No referral channels recorded yet.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
