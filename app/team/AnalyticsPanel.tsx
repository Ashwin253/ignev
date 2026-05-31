"use client";

import { useState, useEffect } from "react";
import { ExternalLink, BarChart3, Eye, MousePointer, TrendingUp, Smartphone, Monitor } from "lucide-react";

const DASHBOARDS = [
  {
    id: "clarity",
    name: "Microsoft Clarity",
    icon: Eye,
    color: "bg-violet-500",
    url: "https://clarity.microsoft.com/projects/view/wpuxsm04uu/dashboard",
    description: "Heatmaps, session recordings",
  },
  {
    id: "vercel",
    name: "Vercel Analytics",
    icon: BarChart3,
    color: "bg-slate-900",
    url: "https://vercel.com/ashwin253s-projects/ignev/analytics",
    description: "Page views, web vitals",
  },
  {
    id: "google",
    name: "Google Analytics",
    icon: MousePointer,
    color: "bg-amber-500",
    url: "https://analytics.google.com",
    description: "Traffic sources, audience",
  },
];

export default function AnalyticsPanel({ supabase }: { supabase?: any }) {
  const [stats, setStats] = useState<{ total: number; today: number; topPages: any[]; devices: any[] } | null>(null);

  useEffect(() => { if (supabase) fetchStats(); }, [supabase]);

  const fetchStats = async () => {
    if (!supabase) return;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { count: total } = await supabase.from("page_views").select("*", { count: "exact", head: true });
    const { count: today } = await supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", todayStart);
    
    let topPages: any[] = [];
    try {
      const { data } = await supabase.rpc("get_top_pages");
      topPages = data ?? [];
    } catch { /* function might not exist yet */ }

    const { data: deviceData } = await supabase.from("page_views").select("device");
    const devices = { mobile: 0, tablet: 0, desktop: 0 };
    for (const row of (deviceData ?? [])) {
      if (row.device in devices) (devices as any)[row.device]++;
    }

    setStats({
      total: total ?? 0,
      today: today ?? 0,
      topPages,
      devices: [
        { name: "Mobile", count: devices.mobile },
        { name: "Tablet", count: devices.tablet },
        { name: "Desktop", count: devices.desktop },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Activity Stats from Supabase */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1"><TrendingUp size={14} /><span className="text-[9px] font-bold uppercase">Total Views</span></div>
            <p className="text-2xl font-black text-slate-900">{stats.total.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-center gap-2 text-sky-500 mb-1"><Eye size={14} /><span className="text-[9px] font-bold uppercase">Today</span></div>
            <p className="text-2xl font-black text-sky-700">{stats.today.toLocaleString()}</p>
          </div>
          {stats.devices.map((d) => (
            <div key={d.name} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                {d.name === "Mobile" ? <Smartphone size={14} /> : <Monitor size={14} />}
                <span className="text-[9px] font-bold uppercase">{d.name}</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{d.count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Top pages */}
      {stats && stats.topPages.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Top Pages</p>
          <div className="space-y-2">
            {stats.topPages.slice(0, 10).map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 truncate flex-1">{p.path}</span>
                <span className="font-bold text-slate-900 shrink-0 ml-3">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* External dashboards - uncomment when needed */}
      {/* <p className="text-sm text-slate-500">External dashboards for deeper analysis:</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {DASHBOARDS.map((d) => (
          <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
            className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`h-10 w-10 rounded-xl ${d.color} flex items-center justify-center shrink-0`}>
              <d.icon size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm">{d.name}</p>
              <p className="text-[10px] text-slate-500">{d.description}</p>
            </div>
            <ExternalLink size={14} className="text-slate-400 shrink-0" />
          </a>
        ))}
      </div> */}
    </div>
  );
}
