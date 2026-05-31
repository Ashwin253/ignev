"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2, Users, Globe, Zap, Eye, MousePointerClick, Clock,
  TrendingUp, Smartphone, Monitor, AlertTriangle, Shield, Activity,
  ChevronRight, ArrowUpRight, Layers, Map, FileText, ImageIcon,
  Download, ZoomIn, X, ChevronLeft
} from "lucide-react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const clarityData = {
  period: "05/02/2026 – 05/31/2026",
  sessions: { total: 125, bot: 40, human: 85 },
  pagesPerSession: 5.584,
  scrollDepth: 56.27,
  activeTime: 122,
  totalTime: 358,
  users: { unique: 46, newSessions: 58, returningSessions: 67 },
  performance: { score: 78.26, lcp: "3.304s", inp: "280ms", cls: "0.002" },
  topUsers: [
    { id: "1rgi7ge", sessions: 25, country: "India", device: "Mobile" },
    { id: "1go6r1r", sessions: 21, country: "India", device: "PC" },
    { id: "1aic38i", sessions: 12, country: "India", device: "Mobile" },
    { id: "fvcqpo",  sessions: 11, country: "India", device: "PC" },
    { id: "1ydeyxe", sessions: 11, country: "India", device: "Mobile" },
    { id: "uug4tf",  sessions: 9,  country: "India", device: "PC" },
    { id: "s8zhfz",  sessions: 8,  country: "India", device: "PC" },
    { id: "1hvg6la", sessions: 5,  country: "India", device: "PC" },
  ],
  insights: [
    { name: "Quick Back Click",  sessions: 67, pct: 53.6 },
    { name: "Dead Clicks",       sessions: 34, pct: 27.2 },
    { name: "Rage Clicks",       sessions: 3,  pct: 2.4  },
    { name: "Excessive Scroll",  sessions: 0,  pct: 0    },
  ],
  browsers: [
    { name: "Chrome",           sessions: 70, pct: 56.0 },
    { name: "Chrome Mobile",    sessions: 46, pct: 36.8 },
    { name: "Mobile Safari",    sessions: 6,  pct: 4.8  },
    { name: "Samsung Internet", sessions: 2,  pct: 1.6  },
    { name: "Google App",       sessions: 1,  pct: 0.8  },
  ],
  topPages: [
    { url: "/",                           sessions: 125 },
    { url: "/catalog",                    sessions: 55  },
    { url: "/map",                        sessions: 22  },
    { url: "/product/tata-punch",         sessions: 22  },
    { url: "/updates",                    sessions: 17  },
    { url: "/shop",                       sessions: 15  },
    { url: "/compare",                    sessions: 12  },
    { url: "/service",                    sessions: 11  },
    { url: "/own",                        sessions: 10  },
    { url: "/product/urban-cruiser-ebella", sessions: 6 },
  ],
  smartEvents: [
    { name: "Submit Form",    sessions: 6, pct: 4.8 },
    { name: "Request Quote",  sessions: 5, pct: 4.0 },
    { name: "Retry",          sessions: 3, pct: 2.4 },
    { name: "Download",       sessions: 3, pct: 2.4 },
    { name: "Login",          sessions: 3, pct: 2.4 },
    { name: "Contact Us",     sessions: 2, pct: 1.6 },
    { name: "Outbound Click", sessions: 2, pct: 1.6 },
    { name: "Find Location",  sessions: 1, pct: 0.8 },
  ],
  channels: [
    { name: "Other",          sessions: 165 },
    { name: "Direct",         sessions: 10  },
    { name: "Referral",       sessions: 7   },
    { name: "Organic Search", sessions: 6   },
  ],
  bots: [
    { type: "Suspicious Interaction", count: 40 },
    { type: "Suspicious Device",      count: 29 },
    { type: "Suspicious Network",     count: 10 },
    { type: "Web Scrapers",           count: 1  },
  ],
  urlPerformance: [
    { url: "/product/ola-electric",   score: 93,    lcp: 1.304, inp: 128, cls: 0     },
    { url: "/team",                   score: 82.75, lcp: 1.252, inp: 280, cls: 0.724 },
    { url: "/updates",                score: 82.55, lcp: 2.728, inp: 224, cls: 0.065 },
    { url: "/offers",                 score: 82.33, lcp: 3.304, inp: 288, cls: 0.011 },
    { url: "/compare",                score: 80.95, lcp: 3.304, inp: 280, cls: 0.008 },
    { url: "/own",                    score: 80.29, lcp: 2.952, inp: 232, cls: 0.001 },
    { url: "/service",                score: 80.00, lcp: 3.304, inp: 280, cls: 0.006 },
    { url: "/product/tata-punch",     score: 79.89, lcp: 3.304, inp: 256, cls: 0.006 },
    { url: "/map",                    score: 78.83, lcp: 3.072, inp: 272, cls: 0.002 },
    { url: "/",                       score: 77.89, lcp: 3.304, inp: 288, cls: 0     },
  ],
};

const vercelData = {
  period: "May 1 – May 30, 2026",
  topPages: [
    { page: "/",                          visitors: 78, pageviews: 181 },
    { page: "/product/tata-punch",        visitors: 43, pageviews: 91  },
    { page: "/catalog",                   visitors: 38, pageviews: 107 },
    { page: "/compare",                   visitors: 16, pageviews: 23  },
    { page: "/service",                   visitors: 8,  pageviews: 14  },
    { page: "/updates",                   visitors: 8,  pageviews: 13  },
    { page: "/offers",                    visitors: 7,  pageviews: 9   },
    { page: "/map",                       visitors: 6,  pageviews: 10  },
    { page: "/product/punch",             visitors: 6,  pageviews: 9   },
    { page: "/product/urban-cruiser-ebella", visitors: 6, pageviews: 8 },
  ],
  referrers: [
    { source: "google.com",                              visitors: 4, pageviews: 4 },
    { source: "com.google.android.googlequicksearchbox", visitors: 3, pageviews: 3 },
    { source: "vercel.com",                              visitors: 2, pageviews: 5 },
  ],
  countries: [
    { country: "India",  code: "IN", visitors: 75, pageviews: 454 },
    { country: "USA",    code: "US", visitors: 22, pageviews: 34  },
    { country: "Poland", code: "PL", visitors: 7,  pageviews: 10  },
    { country: "Canada", code: "CA", visitors: 1,  pageviews: 1   },
  ],
  devices: [
    { type: "Desktop", visitors: 16, pageviews: 92 },
    { type: "Mobile",  visitors: 9,  pageviews: 25 },
  ],
};

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  blue:    "#2563EB",
  green:   "#16A34A",
  violet:  "#7C3AED",
  cyan:    "#0891B2",
  amber:   "#D97706",
  pink:    "#DB2777",
  emerald: "#059669",
  orange:  "#EA580C",
};
const CHART_PAL = [C.blue, C.green, C.cyan, C.violet, C.amber, C.pink, C.emerald, C.orange];

// Light theme tokens
const T = {
  pageBg:   "#f0f4f8",
  cardBg:   "#ffffff",
  cardBdr:  "#e2e8f0",
  rowHover: "#f8fafc",
  text1:    "#0f172a",   // headings
  text2:    "#334155",   // body
  text3:    "#64748b",   // muted
  text4:    "#94a3b8",   // very muted
  divider:  "#e2e8f0",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function shortUrl(url: string) {
  return url.replace("https://www.evplse.com", "") || "/";
}

// ─── SVG BAR CHART ───────────────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
  color?: string;
  color2?: string;
}

function BarChart({ data, height = 160, color = C.blue, color2 }: BarChartProps) {
  const max = Math.max(...data.map(d => Math.max(d.value, d.value2 ?? 0)));
  const barW  = color2 ? 10 : 18;
  const gap   = color2 ? 2  : 0;
  const slotW = color2 ? 36 : 28;
  const svgW  = data.length * slotW + 12;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${height + 32}`} className="overflow-visible">
      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={0} x2={svgW} y1={height - f * height} y2={height - f * height}
          stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="2,2" />
      ))}
      {data.map((d, i) => {
        const h1 = max > 0 ? (d.value / max) * height : 0;
        const h2 = max > 0 && d.value2 != null ? (d.value2 / max) * height : 0;
        const x  = i * slotW + 6;
        return (
          <g key={i}>
            <rect x={x} y={height - h1} width={barW} height={h1} rx={3} fill={color}>
              <animate attributeName="height" from="0" to={h1} dur="0.5s" fill="freeze" begin={`${i * 0.04}s`} />
              <animate attributeName="y" from={height} to={height - h1} dur="0.5s" fill="freeze" begin={`${i * 0.04}s`} />
            </rect>
            {color2 && d.value2 != null && (
              <rect x={x + barW + gap} y={height - h2} width={barW} height={h2} rx={3} fill={color2} opacity={0.8}>
                <animate attributeName="height" from="0" to={h2} dur="0.5s" fill="freeze" begin={`${i * 0.04}s`} />
                <animate attributeName="y" from={height} to={height - h2} dur="0.5s" fill="freeze" begin={`${i * 0.04}s`} />
              </rect>
            )}
            <text x={x + (color2 ? barW + gap / 2 : barW / 2)} y={height - h1 - 4}
              textAnchor="middle" fontSize="7" fill={T.text3} fontWeight="600">
              {d.value}
            </text>
            <text x={x + (color2 ? (barW * 2 + gap) / 2 : barW / 2)} y={height + 14}
              textAnchor="middle" fontSize="7" fill={T.text3}>
              {d.label.length > 6 ? d.label.slice(0, 6) + "…" : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG DONUT ───────────────────────────────────────────────────────────────
interface DonutProps { data: { label: string; value: number }[]; size?: number; thickness?: number; }

function DonutChart({ data, size = 120, thickness = 20 }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r     = (size - thickness) / 2;
  const cx    = size / 2;
  const cy    = size / 2;
  const circ  = 2 * Math.PI * r;
  let offset  = 0;
  const segs  = data.map((d, i) => {
    const dash = total > 0 ? (d.value / total) * circ : 0;
    const seg  = { ...d, dash, gap: circ - dash, offset, color: CHART_PAL[i % CHART_PAL.length] };
    offset += dash;
    return seg;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
      {segs.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset + circ / 4}
          strokeLinecap="butt" />
      ))}
      <text x={cx} y={cy - 4}  textAnchor="middle" fontSize="15" fontWeight="800" fill={T.text1}>{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8"  fill={T.text3}>total</text>
    </svg>
  );
}

// ─── SCORE ARC ───────────────────────────────────────────────────────────────
function ScoreArc({ score }: { score: number }) {
  const r     = 52;
  const circ  = Math.PI * r;
  const dash  = (score / 100) * circ;
  const color = score >= 90 ? C.emerald : score >= 75 ? C.amber : C.orange;
  return (
    <svg width={140} height={84} viewBox="0 0 140 84">
      <path d="M 10 72 A 60 60 0 0 1 130 72" fill="none" stroke="#e2e8f0" strokeWidth={14} strokeLinecap="round" />
      <path d="M 10 72 A 60 60 0 0 1 130 72" fill="none" stroke={color} strokeWidth={14}
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      <text x={70} y={58} textAnchor="middle" fontSize="24" fontWeight="800" fill={T.text1}>{score.toFixed(0)}</text>
      <text x={70} y={74} textAnchor="middle" fontSize="9"  fill={T.text3}>/ 100</text>
    </svg>
  );
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
interface KPICardProps {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}
function KPICard({ title, value, sub, icon, color }: KPICardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-5 border shadow-sm"
      style={{ background: T.cardBg, borderColor: T.cardBdr }}>
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-8"
        style={{ background: color, filter: "blur(20px)" }} />
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}18` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <p className="text-2xl font-extrabold tracking-tight" style={{ color: T.text1 }}>{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color: T.text3 }}>{title}</p>
      {sub && <p className="text-xs mt-1" style={{ color: T.text4 }}>{sub}</p>}
    </motion.div>
  );
}

// ─── HORIZONTAL BAR ──────────────────────────────────────────────────────────
function HBar({ label, value, max, color = C.blue, sub = "" }:
  { label: string; value: number; max: number; color?: string; sub?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="truncate max-w-[200px]" style={{ color: T.text2 }}>{label}</span>
        <span className="font-bold ml-2" style={{ color: T.text1 }}>{value}{sub}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

// ─── CARD WRAPPER ────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border shadow-sm p-5 ${className}`}
      style={{ background: T.cardBg, borderColor: T.cardBdr }}>
      {children}
    </div>
  );
}

// ─── SECTION TITLE ───────────────────────────────────────────────────────────
function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-xl" style={{ background: "#f1f5f9" }}>
        <div style={{ color: T.text3 }}>{icon}</div>
      </div>
      <div>
        <h3 className="font-semibold text-sm" style={{ color: T.text1 }}>{title}</h3>
        {sub && <p className="text-xs" style={{ color: T.text3 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── LEGEND DOT ──────────────────────────────────────────────────────────────
function Dot({ color }: { color: string }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

// ─── CLARITY TAB ─────────────────────────────────────────────────────────────
function ClarityTab() {
  const d = clarityData;
  const humanPct  = Math.round((d.sessions.human / d.sessions.total) * 100);
  const activePct = Math.round((d.activeTime / d.totalTime) * 100);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard title="Total Sessions"  value={d.sessions.total}      sub={`${humanPct}% human traffic`}       icon={<Activity size={16}/>}   color={C.blue}   />
        <KPICard title="Unique Users"    value={d.users.unique}         sub={`${d.users.newSessions} new sessions`} icon={<Users size={16}/>}    color={C.violet} />
        <KPICard title="Pages / Session" value={d.pagesPerSession}      sub="average"                            icon={<Layers size={16}/>}     color={C.cyan}   />
        <KPICard title="Scroll Depth"    value={`${d.scrollDepth}%`}   sub="average scroll"                     icon={<TrendingUp size={16}/>} color={C.green}  />
      </div>

      {/* Session breakdown + Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle icon={<BarChart2 size={16}/>} title="Session Breakdown" sub="Human vs Bot" />
          <div className="flex items-center gap-6">
            <DonutChart data={[{ label:"Human", value: d.sessions.human },{ label:"Bot", value: d.sessions.bot }]} size={130} />
            <div className="space-y-3 flex-1 text-sm">
              {[
                { label:"Human sessions", val: d.sessions.human, color: C.blue   },
                { label:"Bot sessions",   val: d.sessions.bot,   color: C.violet },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <Dot color={r.color} />
                  <span style={{ color: T.text2 }}>{r.label}</span>
                  <span className="ml-auto font-bold text-base" style={{ color: T.text1 }}>{r.val}</span>
                </div>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: T.divider }}>
                {[["New sessions", d.users.newSessions],["Returning", d.users.returningSessions]].map(([l,v]) => (
                  <div key={String(l)} className="flex items-center justify-between text-xs py-0.5">
                    <span style={{ color: T.text3 }}>{l}</span>
                    <span className="font-bold" style={{ color: T.text1 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<Clock size={16}/>} title="Time Spent" sub="Active vs total (seconds)" />
          <div className="flex items-center gap-6">
            <DonutChart data={[{ label:"Active", value: d.activeTime },{ label:"Idle", value: d.totalTime - d.activeTime }]} size={130} />
            <div className="space-y-4 flex-1">
              {[
                { label:"Active time", val: d.activeTime,  pct: activePct, color: C.blue  },
                { label:"Total time",  val: d.totalTime,   pct: 100,        color: "#cbd5e1" },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: T.text2 }}>{r.label}</span>
                    <span className="font-bold" style={{ color: T.text1 }}>{r.val}s</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                    <div className="h-full rounded-full" style={{ width:`${r.pct}%`, background: r.color }} />
                  </div>
                </div>
              ))}
              <p className="text-xs" style={{ color: T.text3 }}>{activePct}% of total time was active</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <SectionTitle icon={<Globe size={16}/>} title="Top Pages by Sessions" sub="Microsoft Clarity" />
        <div className="overflow-x-auto mb-5">
          <BarChart data={d.topPages.map(p => ({ label: shortUrl(p.url), value: p.sessions }))} height={140} color={C.blue} />
        </div>
        <div className="space-y-2">
          {d.topPages.map((p, i) => (
            <HBar key={i} label={shortUrl(p.url)} value={p.sessions} max={d.topPages[0].sessions} color={CHART_PAL[i % CHART_PAL.length]} />
          ))}
        </div>
      </Card>

      {/* Browsers + UX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle icon={<Monitor size={16}/>} title="Browsers" sub="By session count" />
          <div className="space-y-3">
            {d.browsers.map((b, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span style={{ color: T.text2 }}>{b.name}</span>
                  <span className="font-bold" style={{ color: T.text1 }}>{b.pct}%  <span style={{ color: T.text3 }}>({b.sessions})</span></span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${b.pct}%` }}
                    transition={{ duration:0.55, delay: i * 0.07 }}
                    className="h-full rounded-full" style={{ background: CHART_PAL[i] }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<MousePointerClick size={16}/>} title="UX Insights" sub="Behavioral signals" />
          <div className="space-y-2.5">
            {d.insights.map((ins, i) => {
              const badgeColor = ins.pct > 40 ? { bg:"#fef2f2", text:"#dc2626" }
                               : ins.pct > 10 ? { bg:"#fffbeb", text:"#d97706" }
                               :               { bg:"#f0fdf4", text:"#16a34a" };
              return (
                <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: "#f8fafc", border: `1px solid ${T.divider}` }}>
                  <span className="text-sm" style={{ color: T.text2 }}>{ins.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: T.text3 }}>{ins.sessions} sess.</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: badgeColor.bg, color: badgeColor.text }}>
                      {ins.pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Performance */}
      <Card>
        <SectionTitle icon={<Zap size={16}/>} title="Performance Overview" sub="Core Web Vitals (average)" />
        <div className="flex flex-wrap items-start gap-8 mb-6">
          <div className="flex flex-col items-center">
            <ScoreArc score={d.performance.score} />
            <p className="text-xs font-medium mt-1" style={{ color: T.text3 }}>Overall Score</p>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label:"LCP", value: d.performance.lcp, tip:"Largest Contentful Paint", color: C.amber   },
              { label:"INP", value: d.performance.inp, tip:"Interaction to Next Paint", color: C.cyan    },
              { label:"CLS", value: d.performance.cls, tip:"Cumulative Layout Shift",  color: C.emerald },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-4 border" style={{ background:"#f8fafc", borderColor: T.divider }}>
                <p className="text-xs mb-1" style={{ color: T.text3 }}>{m.tip}</p>
                <p className="text-2xl font-extrabold" style={{ color: m.color }}>{m.value}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: T.text2 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.divider}` }}>
                {["URL","Score","LCP (s)","INP (ms)","CLS"].map(h => (
                  <th key={h} className={`pb-2 font-semibold ${h==="URL"?"text-left":"text-right"}`} style={{ color: T.text3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.urlPerformance.map((u, i) => (
                <tr key={i} className="transition-colors" style={{ borderBottom:`1px solid ${T.divider}` }}
                  onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td className="py-2.5" style={{ color: T.text2 }}>{u.url}</td>
                  <td className="py-2.5 text-right">
                    <span className="font-extrabold" style={{
                      color: u.score >= 85 ? C.emerald : u.score >= 75 ? C.amber : C.orange
                    }}>{u.score.toFixed(0)}</span>
                  </td>
                  <td className="py-2.5 text-right font-medium" style={{ color: T.text2 }}>{u.lcp.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-medium" style={{ color: T.text2 }}>{u.inp}</td>
                  <td className="py-2.5 text-right font-medium" style={{ color: T.text2 }}>{u.cls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Smart Events + Bots & Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle icon={<Activity size={16}/>} title="Smart Events" sub="Tracked interactions" />
          <div className="space-y-2.5">
            {d.smartEvents.map((ev, i) => (
              <HBar key={i} label={ev.name} value={ev.pct}
                max={Math.max(...d.smartEvents.map(e => e.pct))}
                color={CHART_PAL[i]} sub="%" />
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<Shield size={16}/>} title="Bot Traffic" sub="Detected bot sessions" />
          <div className="space-y-2.5 mb-5">
            {d.bots.map((b, i) => (
              <HBar key={i} label={b.type} value={b.count}
                max={Math.max(...d.bots.map(x => x.count))}
                color={C.orange} sub=" sess." />
            ))}
          </div>
          <div className="pt-4" style={{ borderTop:`1px solid ${T.divider}` }}>
            <SectionTitle icon={<Map size={16}/>} title="Channels" sub="Traffic sources" />
            <div className="space-y-2.5">
              {d.channels.map((ch, i) => (
                <HBar key={i} label={ch.name} value={ch.sessions}
                  max={Math.max(...d.channels.map(c => c.sessions))}
                  color={CHART_PAL[i]} />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <SectionTitle icon={<Users size={16}/>} title="Top Users" sub="By session count" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.divider}` }}>
                {["#","User ID","Device","Country","Sessions"].map((h,i) => (
                  <th key={h} className={`pb-2 font-semibold ${i===4?"text-right":i===2||i===3?"text-center":"text-left"}`}
                    style={{ color: T.text3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.topUsers.map((u, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.divider}` }}
                  onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                  className="transition-colors">
                  <td className="py-2.5" style={{ color: T.text4 }}>{i+1}</td>
                  <td className="py-2.5 font-mono font-semibold" style={{ color: T.text1 }}>{u.id}</td>
                  <td className="py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 justify-center" style={{ color: T.text2 }}>
                      {u.device==="Mobile" ? <Smartphone size={11}/> : <Monitor size={11}/>} {u.device}
                    </span>
                  </td>
                  <td className="py-2.5 text-center" style={{ color: T.text2 }}>{u.country}</td>
                  <td className="py-2.5 text-right font-extrabold text-base" style={{ color: T.text1 }}>{u.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── VERCEL TAB ───────────────────────────────────────────────────────────────
function VercelTab() {
  const d = vercelData;
  const totalVisitors  = d.countries.reduce((s, c) => s + c.visitors,  0);
  const totalPageviews = d.topPages.reduce((s, p)  => s + p.pageviews, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard title="Total Visitors"  value={totalVisitors}       sub="unique visitors"   icon={<Users size={16}/>}     color={C.blue}   />
        <KPICard title="Total Page Views" value={totalPageviews}     sub="across all pages"  icon={<Eye size={16}/>}       color={C.green}  />
        <KPICard title="Countries"        value={d.countries.length} sub="reached"           icon={<Globe size={16}/>}     color={C.cyan}   />
        <KPICard title="Device Types"     value={d.devices.length}   sub="desktop + mobile"  icon={<Smartphone size={16}/>} color={C.violet} />
      </div>

      {/* Top pages */}
      <Card>
        <SectionTitle icon={<Globe size={16}/>} title="Top Pages" sub="Visitors vs Page Views" />
        <div className="overflow-x-auto mb-3">
          <BarChart data={d.topPages.map(p => ({ label: p.page, value: p.visitors, value2: p.pageviews }))}
            height={150} color={C.blue} color2={C.green} />
        </div>
        <div className="flex gap-5 text-xs mb-4">
          <span className="flex items-center gap-1.5" style={{ color: T.text3 }}><Dot color={C.blue}/> Visitors</span>
          <span className="flex items-center gap-1.5" style={{ color: T.text3 }}><Dot color={C.green}/> Page Views</span>
        </div>
        <div className="space-y-1.5">
          {d.topPages.map((p, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg transition-colors"
              style={{ borderBottom:`1px solid ${T.divider}` }}>
              <span className="text-xs w-5 font-semibold" style={{ color: T.text4 }}>{i+1}</span>
              <span className="text-xs flex-1 truncate" style={{ color: T.text2 }}>{p.page}</span>
              <span className="text-xs font-extrabold" style={{ color: T.text1 }}>{p.visitors}</span>
              <span className="text-xs w-20 text-right" style={{ color: T.text3 }}>{p.pageviews} views</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Countries */}
        <Card>
          <SectionTitle icon={<Globe size={16}/>} title="Countries" sub="By visitor count" />
          <div className="flex items-center gap-5 mb-5">
            <DonutChart data={d.countries.map(c => ({ label: c.country, value: c.visitors }))} size={130} />
            <div className="space-y-2 flex-1">
              {d.countries.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Dot color={CHART_PAL[i]} />
                  <span style={{ color: T.text2 }}>{c.country}</span>
                  <span className="ml-auto font-extrabold" style={{ color: T.text1 }}>{c.visitors}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2.5">
            {d.countries.map((c, i) => (
              <HBar key={i} label={`${c.country} (${c.code})`} value={c.pageviews}
                max={d.countries[0].pageviews} color={CHART_PAL[i]} sub=" views" />
            ))}
          </div>
        </Card>

        {/* Devices + Referrers */}
        <Card>
          <SectionTitle icon={<Monitor size={16}/>} title="Devices" sub="Desktop vs Mobile" />
          <div className="flex items-center gap-5 mb-5">
            <DonutChart data={d.devices.map(dv => ({ label: dv.type, value: dv.visitors }))} size={130} />
            <div className="space-y-4 flex-1">
              {d.devices.map((dv, i) => {
                const total = d.devices.reduce((s,x) => s+x.visitors,0);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Dot color={CHART_PAL[i]} />
                      {dv.type==="Desktop" ? <Monitor size={12} style={{color:T.text3}}/> : <Smartphone size={12} style={{color:T.text3}}/>}
                      <span style={{ color: T.text2 }}>{dv.type}</span>
                      <span className="ml-auto font-extrabold" style={{ color: T.text1 }}>{dv.visitors}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background:"#e2e8f0" }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${(dv.visitors/total)*100}%` }}
                        transition={{ duration:0.55, delay: i*0.1 }}
                        className="h-full rounded-full" style={{ background: CHART_PAL[i] }} />
                    </div>
                    <p className="text-xs text-right" style={{ color: T.text3 }}>{dv.pageviews} page views</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4" style={{ borderTop:`1px solid ${T.divider}` }}>
            <SectionTitle icon={<ChevronRight size={16}/>} title="Referrers" sub="Traffic sources" />
            <div className="space-y-2.5">
              {d.referrers.map((r, i) => (
                <HBar key={i} label={r.source} value={r.visitors}
                  max={Math.max(...d.referrers.map(x => x.visitors))}
                  color={CHART_PAL[i+2]} sub=" visitors" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── COMBINED TAB ─────────────────────────────────────────────────────────────
function CombinedTab() {
  const clarityMap: Record<string,number> = {};
  clarityData.topPages.forEach(p => { clarityMap[shortUrl(p.url)] = p.sessions; });

  const vercelMap: Record<string,{visitors:number;pageviews:number}> = {};
  vercelData.topPages.forEach(p => { vercelMap[p.page] = { visitors: p.visitors, pageviews: p.pageviews }; });

  const allPages = Array.from(new Set([...Object.keys(clarityMap),...Object.keys(vercelMap)]))
    .sort((a,b) => ((vercelMap[b]?.visitors??0)+(clarityMap[b]??0)) - ((vercelMap[a]?.visitors??0)+(clarityMap[a]??0)));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard title="Clarity Sessions" value={clarityData.sessions.total}
          sub={`${clarityData.sessions.bot} bot sessions`}    icon={<Activity size={16}/>} color={C.violet} />
        <KPICard title="Vercel Visitors"  value={vercelData.countries.reduce((s,c)=>s+c.visitors,0)}
          sub="unique visitors"                                icon={<Users size={16}/>}   color={C.cyan}   />
        <KPICard title="Avg Pages/Session" value={clarityData.pagesPerSession}
          sub="Clarity metric"                                 icon={<Layers size={16}/>}  color={C.amber}  />
        <KPICard title="Perf Score"       value={`${clarityData.performance.score.toFixed(0)}/100`}
          sub="site average"                                   icon={<Zap size={16}/>}     color={C.green}  />
      </div>

      {/* Cross-platform table */}
      <Card>
        <SectionTitle icon={<BarChart2 size={16}/>} title="Cross-Platform Page Analysis"
          sub="Clarity sessions × Vercel visitors & views" />
        <div className="flex flex-wrap gap-4 text-xs mb-4">
          {[
            { label:"Clarity Sessions", color: C.violet },
            { label:"Vercel Visitors",  color: C.cyan   },
            { label:"Page Views",       color: C.green  },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5" style={{ color: T.text3 }}>
              <Dot color={l.color}/> {l.label}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.divider}` }}>
                {["Page","Clarity Sessions","Vercel Visitors","Vercel Views","Views/Visitor"].map((h,i) => (
                  <th key={h} className={`pb-2.5 font-semibold ${i===0?"text-left":"text-right"}`}
                    style={{ color: T.text3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPages.slice(0,12).map((page, i) => {
                const cs = clarityMap[page] ?? 0;
                const vv = vercelMap[page]?.visitors  ?? 0;
                const pv = vercelMap[page]?.pageviews ?? 0;
                const ratio = vv > 0 ? (pv / vv).toFixed(1) : "—";
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.divider}` }}
                    onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                    className="transition-colors">
                    <td className="py-2.5 font-medium" style={{ color: T.text2 }}>{page||"/"}</td>
                    <td className="py-2.5 text-right font-extrabold" style={{ color: cs>0?C.violet:T.text4 }}>{cs||"—"}</td>
                    <td className="py-2.5 text-right font-extrabold" style={{ color: vv>0?C.cyan:T.text4   }}>{vv||"—"}</td>
                    <td className="py-2.5 text-right font-semibold"  style={{ color: pv>0?C.green:T.text4  }}>{pv||"—"}</td>
                    <td className="py-2.5 text-right"                style={{ color: T.text3 }}>{ratio}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background:"#fffbeb", borderColor:"#fde68a" }}>
          <SectionTitle icon={<AlertTriangle size={16}/>} title="UX Concerns" sub="From Clarity insights" />
          <div className="space-y-3">
            {[
              { icon:<AlertTriangle size={14}/>, c:"#d97706", title:"Quick Back Clicks — 53.6%",
                body:"More than half of sessions bounce back quickly — landing page content may not match expectations." },
              { icon:<MousePointerClick size={14}/>, c:"#ea580c", title:"Dead Clicks — 27.2%",
                body:"Users are clicking unresponsive elements. Review UI affordance and interactive cues." },
              { icon:<Shield size={14}/>, c:"#dc2626", title:"Bot Sessions — 40 (32%)",
                body:"High bot traffic detected (mostly suspicious interaction bots). Consider bot protection." },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background:"rgba(255,255,255,0.6)" }}>
                <span className="mt-0.5 flex-shrink-0" style={{ color: item.c }}>{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: T.text1 }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.text2 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-5 shadow-sm" style={{ background:"#f0fdf4", borderColor:"#bbf7d0" }}>
          <SectionTitle icon={<TrendingUp size={16}/>} title="Growth Opportunities" sub="Combined insights" />
          <div className="space-y-3">
            {[
              { icon:<Globe size={14}/>,   c:C.green,  title:"Catalog drives deep engagement",
                body:"/catalog ranks #2 on both platforms. Better catalog UX could unlock more conversions." },
              { icon:<Users size={14}/>,   c:C.cyan,   title:"US market showing interest",
                body:"22 US visitors with 34 page views. Consider adding US-relevant EV info or localization." },
              { icon:<Zap size={14}/>,     c:C.blue,   title:"Fix LCP on homepage",
                body:"Homepage LCP of 3.304s is the bottleneck. Optimizing the hero image could push score 77 → 85+." },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background:"rgba(255,255,255,0.6)" }}>
                <span className="mt-0.5 flex-shrink-0" style={{ color: item.c }}>{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: T.text1 }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.text2 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PHOTOS TAB ───────────────────────────────────────────────────────────────
function PhotosTab() {
  const [images, setImages]     = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [idx, setIdx]           = useState(0);

  useEffect(() => {
    fetch("/api/stats-files")
      .then(r => r.json())
      .then(d => { setImages(d.images ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function openLightbox(src: string, i: number) {
    setLightbox(src);
    setIdx(i);
  }
  function prev() {
    const ni = (idx - 1 + images.length) % images.length;
    setIdx(ni); setLightbox(images[ni]);
  }
  function next() {
    const ni = (idx + 1) % images.length;
    setIdx(ni); setLightbox(images[ni]);
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={<ImageIcon size={16}/>} title="Stats Photos"
          sub={`Images from /public/stats — ${images.length} file${images.length !== 1 ? "s" : ""}`} />

        {loading && (
          <div className="flex items-center justify-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease:"linear" }}
              className="w-8 h-8 rounded-full border-2" style={{ borderColor:`${C.blue}40`, borderTopColor: C.blue }} />
          </div>
        )}

        {!loading && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ImageIcon size={40} style={{ color: T.text4 }} />
            <p className="text-sm" style={{ color: T.text3 }}>No images in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">/public/stats</code> yet.</p>
            <p className="text-xs" style={{ color: T.text4 }}>Drop <span className="font-semibold">.png .jpg .jpeg .gif .webp .svg</span> files there and refresh.</p>
          </div>
        )}

        {!loading && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((src, i) => {
              const name = src.split("/").pop() ?? src;
              return (
                <motion.div key={src} initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
                  transition={{ delay: i * 0.06 }}
                  className="group relative rounded-2xl overflow-hidden border shadow-sm cursor-pointer"
                  style={{ borderColor: T.cardBdr }}
                  onClick={() => openLightbox(src, i)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={name} className="w-full object-cover" style={{ maxHeight: 220 }} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="px-3 py-2 border-t" style={{ borderColor: T.cardBdr, background: T.cardBg }}>
                    <p className="text-xs truncate font-medium" style={{ color: T.text2 }}>{name}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:"rgba(0,0,0,0.85)" }}
            onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              className="relative max-w-5xl w-full"
              onClick={e => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox} alt="" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
              <button onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                style={{ background:"#ffffff" }}>
                <X size={16} style={{ color: T.text1 }} />
              </button>
              {images.length > 1 && (
                <>
                  <button onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background:"rgba(255,255,255,0.9)" }}>
                    <ChevronLeft size={18} style={{ color: T.text1 }} />
                  </button>
                  <button onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background:"rgba(255,255,255,0.9)" }}>
                    <ChevronRight size={18} style={{ color: T.text1 }} />
                  </button>
                  <p className="text-center text-xs mt-3" style={{ color:"rgba(255,255,255,0.6)" }}>
                    {idx + 1} / {images.length} — {(lightbox.split("/").pop() ?? "")}
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PDFs TAB ─────────────────────────────────────────────────────────────────
function PDFsTab() {
  const [pdfs, setPdfs]     = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats-files")
      .then(r => r.json())
      .then(d => { setPdfs(d.pdfs ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle icon={<FileText size={16}/>} title="Stats PDFs"
          sub={`PDF reports from /public/stats — ${pdfs.length} file${pdfs.length !== 1 ? "s" : ""}`} />

        {loading && (
          <div className="flex items-center justify-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease:"linear" }}
              className="w-8 h-8 rounded-full border-2" style={{ borderColor:`${C.violet}40`, borderTopColor: C.violet }} />
          </div>
        )}

        {!loading && pdfs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText size={40} style={{ color: T.text4 }} />
            <p className="text-sm" style={{ color: T.text3 }}>No PDFs in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">/public/stats</code> yet.</p>
            <p className="text-xs" style={{ color: T.text4 }}>Drop <span className="font-semibold">.pdf</span> files there and refresh.</p>
          </div>
        )}

        {!loading && pdfs.length > 0 && (
          <div className="space-y-3">
            {pdfs.map((src, i) => {
              const name = src.split("/").pop() ?? src;
              const isOpen = active === src;
              return (
                <motion.div key={src} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border overflow-hidden shadow-sm"
                  style={{ borderColor: isOpen ? C.violet : T.cardBdr }}>
                  {/* Header row */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    style={{ background: isOpen ? `${C.violet}10` : "#f8fafc" }}
                    onClick={() => setActive(isOpen ? null : src)}>
                    <div className="p-2 rounded-xl" style={{ background:`${C.violet}18` }}>
                      <FileText size={16} style={{ color: C.violet }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: T.text1 }}>{name}</p>
                      <p className="text-xs" style={{ color: T.text3 }}>PDF document</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={src} download
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors"
                        style={{ color: C.blue, borderColor:`${C.blue}30`, background:"#ffffff" }}
                        onClick={e => e.stopPropagation()}>
                        <Download size={12}/> Download
                      </a>
                      <a href={src} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors"
                        style={{ color: C.violet, borderColor:`${C.violet}30`, background:"#ffffff" }}
                        onClick={e => e.stopPropagation()}>
                        <ArrowUpRight size={12}/> Open
                      </a>
                      <ChevronRight size={16} className="transition-transform" style={{ color: T.text4, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
                    </div>
                  </div>
                  {/* Inline preview */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
                        exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }}
                        className="overflow-hidden">
                        <iframe src={src} title={name}
                          className="w-full border-t" style={{ height: 640, borderColor: T.divider }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"combined", label:"Combined",          icon:<BarChart2 size={14}/> },
  { id:"clarity",  label:"Microsoft Clarity", icon:<Eye size={14}/>       },
  { id:"vercel",   label:"Vercel Insights",   icon:<Activity size={14}/>  },
  { id:"photos",   label:"Photos",            icon:<ImageIcon size={14}/> },
  { id:"pdfs",     label:"PDFs",              icon:<FileText size={14}/>  },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [tab, setTab] = useState<"combined"|"clarity"|"vercel"|"photos"|"pdfs">("combined");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Page header */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: T.text1 }}>
              Site <span className="text-gradient">Analytics</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: T.text3 }}>EVPLSE · May 2026 · Clarity + Vercel Insights</p>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border shadow-sm"
            style={{ background: T.cardBg, borderColor: T.cardBdr, color: T.text3 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Last updated: 31 May 2026
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-8 border shadow-sm w-fit"
        style={{ background:"#ffffff", borderColor: T.cardBdr }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ color: tab===t.id ? T.text1 : T.text3 }}>
            {tab===t.id && (
              <motion.div layoutId="tab-indicator"
                className="absolute inset-0 rounded-xl shadow-sm"
                style={{ background: "#f1f5f9", border:`1px solid ${T.cardBdr}` }}
                transition={{ type:"spring", bounce:0.2, duration:0.35 }} />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{t.icon}{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-5 }} transition={{ duration:0.18 }}>
          {tab==="combined" && <CombinedTab />}
          {tab==="clarity"  && <ClarityTab  />}
          {tab==="vercel"   && <VercelTab   />}
          {tab==="photos"   && <PhotosTab   />}
          {tab==="pdfs"     && <PDFsTab     />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
