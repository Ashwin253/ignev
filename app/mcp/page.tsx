"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Sparkles,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Zap,
  Car,
  BatteryCharging,
  Calculator,
  ArrowRight,
  Code2,
  Share2,
  CheckCircle2,
  Search,
} from "lucide-react";

export default function McpConnectPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chatgpt" | "claude" | "gemini">("chatgpt");

  // Playground state
  const [selectedTool, setSelectedTool] = useState<string>("search_evs");
  const [toolQuery, setToolQuery] = useState<string>("Tata");
  const [toolLoading, setToolLoading] = useState<boolean>(false);
  const [toolOutput, setToolOutput] = useState<any>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://www.evplse.com";
  const mcpUrl = `${baseUrl}/api/mcp`;
  const openApiUrl = `${baseUrl}/api/openapi.json`;
  const llmsUrl = `${baseUrl}/llms.txt`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        evpulse: {
          command: "npx",
          args: ["-y", "mcp-remote", mcpUrl],
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        evpulse: {
          url: mcpUrl,
        },
      },
    },
    null,
    2
  );

  const runPlayground = async () => {
    setToolLoading(true);
    setToolOutput(null);
    try {
      let endpoint = "";
      if (selectedTool === "search_evs") {
        endpoint = `/api/v1/evs?q=${encodeURIComponent(toolQuery || "Tata")}&limit=3`;
      } else if (selectedTool === "get_ev_details") {
        endpoint = `/api/v1/evs/${encodeURIComponent(toolQuery || "tata-curvv-ev")}`;
      } else if (selectedTool === "compare_evs") {
        endpoint = `/api/v1/compare?slugs=${encodeURIComponent(toolQuery || "tata-curvv-ev,mg-windsor-ev")}`;
      } else if (selectedTool === "find_charging_stations") {
        endpoint = `/api/v1/stations?city=${encodeURIComponent(toolQuery || "Delhi")}&limit=3`;
      } else if (selectedTool === "calculate_savings") {
        const km = parseFloat(toolQuery) || 40;
        endpoint = `/api/v1/savings?dailyKm=${km}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();
      setToolOutput(data);
    } catch (err: any) {
      setToolOutput({ error: err.message || "Failed to execute tool" });
    } finally {
      setToolLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles size={14} />
            <span>AI Model Context Protocol & ChatGPT Actions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Connect Your AI with EVPULSE
          </h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400">
            Link <strong>ChatGPT</strong>, <strong>Gemini</strong>, <strong>Claude Desktop</strong>, or <strong>Cursor</strong> directly to India&apos;s most comprehensive electric vehicle catalog and live charging station database.
          </p>
        </div>

        {/* Quick Copy Action Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* MCP URL */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <span>Model Context Protocol (MCP)</span>
                <span className="text-emerald-500 font-bold">JSON-RPC</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mb-2">For Claude, Cursor, Windsurf, Zed &amp; Gemini CLI</p>
              <div className="bg-slate-100 dark:bg-zinc-800/80 p-2.5 rounded-lg text-xs font-mono text-slate-800 dark:text-zinc-200 truncate select-all">
                {mcpUrl}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(mcpUrl, "mcp")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all"
            >
              {copiedKey === "mcp" ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === "mcp" ? "Copied!" : "Copy MCP Endpoint"}</span>
            </button>
          </div>

          {/* ChatGPT Actions URL */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <span>ChatGPT Custom Actions</span>
                <span className="text-blue-500 font-bold">OpenAPI 3.1</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mb-2">For ChatGPT Custom GPTs &amp; Google AI Studio</p>
              <div className="bg-slate-100 dark:bg-zinc-800/80 p-2.5 rounded-lg text-xs font-mono text-slate-800 dark:text-zinc-200 truncate select-all">
                {openApiUrl}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(openApiUrl, "openapi")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all"
            >
              {copiedKey === "openapi" ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === "openapi" ? "Copied!" : "Copy OpenAPI Schema"}</span>
            </button>
          </div>

          {/* llms.txt */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <span>LLM Context Index</span>
                <span className="text-purple-500 font-bold">llms.txt</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mb-2">For Web Gemini, Perplexity, and AI Search Crawlers</p>
              <div className="bg-slate-100 dark:bg-zinc-800/80 p-2.5 rounded-lg text-xs font-mono text-slate-800 dark:text-zinc-200 truncate select-all">
                {llmsUrl}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(llmsUrl, "llms")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all"
            >
              {copiedKey === "llms" ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === "llms" ? "Copied!" : "Copy llms.txt Link"}</span>
            </button>
          </div>
        </div>

        {/* Tabbed Setup Instructions */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          <div className="flex border-b border-slate-200 dark:border-zinc-800 pb-4 gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab("chatgpt")}
              className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "chatgpt"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-300"
              }`}
            >
              <Bot size={18} />
              <span>ChatGPT (Custom GPT)</span>
            </button>
            <button
              onClick={() => setActiveTab("claude")}
              className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "claude"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-300"
              }`}
            >
              <Terminal size={18} />
              <span>Claude Desktop &amp; Cursor (MCP)</span>
            </button>
            <button
              onClick={() => setActiveTab("gemini")}
              className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "gemini"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-300"
              }`}
            >
              <Sparkles size={18} />
              <span>Google Gemini &amp; AI Studio</span>
            </button>
          </div>

          {/* ChatGPT Guide */}
          {activeTab === "chatgpt" && (
            <div className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Create a Custom GPT</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Go to ChatGPT &rarr; <strong>Explore GPTs</strong> &rarr; Click <strong>+ Create</strong>. Give it a name like <em>&quot;EVPULSE Indian EV Expert&quot;</em>.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Custom Action</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Switch to the <strong>Configure</strong> tab. Scroll down to <strong>Actions</strong> &rarr; Click <strong>Create new action</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Import OpenAPI Schema</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Click <strong>&quot;Import from URL&quot;</strong>, paste the link below, and click <strong>Import</strong>:
                  </p>
                </div>
              </div>

              {/* Action URL Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Code2 className="text-blue-600 dark:text-blue-400 shrink-0" size={22} />
                  <div className="truncate">
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 block">OpenAPI Action URL:</span>
                    <span className="text-xs font-mono text-blue-700 dark:text-blue-300 select-all truncate block">{openApiUrl}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(openApiUrl, "chatgpt-action")}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                >
                  {copiedKey === "chatgpt-action" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey === "chatgpt-action" ? "Copied!" : "Copy Link for ChatGPT"}</span>
                </button>
              </div>

              {/* Sample Prompts */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Example Prompts to Try in ChatGPT</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800/60 text-xs text-slate-700 dark:text-zinc-300">
                    &ldquo;Find electric cars under ₹20 Lakhs with 400km+ range.&rdquo;
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800/60 text-xs text-slate-700 dark:text-zinc-300">
                    &ldquo;Compare Tata Curvv EV with MG Windsor EV in detail.&rdquo;
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-800/60 text-xs text-slate-700 dark:text-zinc-300">
                    &ldquo;How much will I save per year driving an EV 50km/day vs petrol?&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Claude & Cursor Guide */}
          {activeTab === "claude" && (
            <div className="pt-6 space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Connect <strong>Claude Desktop</strong> or <strong>Cursor</strong> using the Model Context Protocol. Add the configuration snippet to your settings file:
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Claude Desktop */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Claude Desktop (claude_desktop_config.json)</span>
                      <button
                        onClick={() => copyToClipboard(claudeConfig, "claude-json")}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                      >
                        {copiedKey === "claude-json" ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedKey === "claude-json" ? "Copied" : "Copy JSON"}</span>
                      </button>
                    </div>
                    <pre className="bg-slate-900 text-zinc-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                      {claudeConfig}
                    </pre>
                  </div>

                  {/* Cursor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Cursor (.cursor/mcp.json)</span>
                      <button
                        onClick={() => copyToClipboard(cursorConfig, "cursor-json")}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                      >
                        {copiedKey === "cursor-json" ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedKey === "cursor-json" ? "Copied" : "Copy JSON"}</span>
                      </button>
                    </div>
                    <pre className="bg-slate-900 text-zinc-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                      {cursorConfig}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gemini Guide */}
          {activeTab === "gemini" && (
            <div className="pt-6 space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Google Gemini supports function calling via OpenAPI schema, and web-based Gemini can read live markdown indexes:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 space-y-3">
                    <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">Google AI Studio &amp; Gemini API</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      Import the OpenAPI 3.1 specification into Google AI Studio under <em>Function Calling / Tools</em>.
                    </p>
                    <button
                      onClick={() => copyToClipboard(openApiUrl, "gemini-openapi")}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all"
                    >
                      {copiedKey === "gemini-openapi" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey === "gemini-openapi" ? "Copied!" : "Copy Schema URL"}</span>
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 space-y-3">
                    <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">Web Gemini &amp; Perplexity Chat</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      Provide our <code>llms.txt</code> file in your prompt for structured, real-time EV context.
                    </p>
                    <button
                      onClick={() => copyToClipboard(llmsUrl, "gemini-llms")}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all"
                    >
                      {copiedKey === "gemini-llms" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey === "gemini-llms" ? "Copied!" : "Copy llms.txt URL"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Interactive Playground */}
        {/* <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="text-emerald-500" size={24} />
                <span>Live Tool Simulator</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Test the queries your AI assistant will execute before connecting.
              </p>
            </div>
<div className="flex flex-wrap gap-2">
              {[
                { id: "search_evs", label: "search_evs", icon: Search },
                { id: "get_ev_details", label: "get_ev_details", icon: Car },
                { id: "compare_evs", label: "compare_evs", icon: Share2 },
                { id: "find_charging_stations", label: "find_charging_stations", icon: BatteryCharging },
                { id: "calculate_savings", label: "calculate_savings", icon: Calculator },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool.id);
                      if (tool.id === "search_evs") setToolQuery("Tata");
                      else if (tool.id === "get_ev_details") setToolQuery("tata-curvv-ev");
                      else if (tool.id === "compare_evs") setToolQuery("tata-curvv-ev,mg-windsor-ev");
                      else if (tool.id === "find_charging_stations") setToolQuery("Delhi");
                      else if (tool.id === "calculate_savings") setToolQuery("40");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedTool === tool.id
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={toolQuery}
              onChange={(e) => setToolQuery(e.target.value)}
              placeholder="Query parameter..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={runPlayground}
              disabled={toolLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all disabled:opacity-50 shadow-sm"
            >
              {toolLoading ? (
                <span>Running...</span>
              ) : (
                <>
                  <span>Run Live Query</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {toolOutput && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Response JSON</span>
              <pre className="max-h-96 overflow-y-auto bg-slate-900 text-emerald-400 p-4 rounded-2xl text-xs font-mono">
                {JSON.stringify(toolOutput, null, 2)}
              </pre>
            </div>
          )}
        </div> */}

        {/* Exposed Tools Documentation */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Supported AI Tools &amp; Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Search size={16} />
                <span>search_evs</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Filter by vehicle type (car, scooter, auto), brand, maximum price in Lakhs, or minimum driving range.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <Car size={16} />
                <span>get_ev_details</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Complete specs: battery capacity (kWh), fast-charging time, top speed, variant pricing, BaaS details, and pros/cons.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                <Share2 size={16} />
                <span>compare_evs</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Direct comparative table between 2 to 4 electric vehicles side-by-side to assist buying decisions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <BatteryCharging size={16} />
                <span>find_charging_stations</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Query active charging stations with network names (Statiq, Tata Power, etc.), power ratings (kW), and Google Maps links.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
                <Calculator size={16} />
                <span>calculate_savings</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Calculate real-world monthly and annual fuel savings of switching to an EV compared to petrol or diesel.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <CheckCircle2 size={16} />
                <span>Zero Setup Friction</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                No API keys required. Free, CORS-enabled, read-only live endpoints updated every minute with Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
