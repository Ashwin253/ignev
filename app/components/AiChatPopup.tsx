"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { X, Send, Loader2, Sparkles, Trash2, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playClickSound, playHaptic } from "../lib/feedback";
import { useFeedback } from "../context/FeedbackContext";

type Message = { role: "user" | "assistant"; content: string };

export default function AiChatPopup({ vehicleContext }: { vehicleContext?: string }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageContext, setPageContext] = useState(vehicleContext || "");
  const { soundEnabled, hapticsEnabled } = useFeedback();

  // Feedback helpers
  const doClick = () => {
    if (soundEnabled) playClickSound();
    if (hapticsEnabled) playHaptic("click");
  };
  const doTextSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  };
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Detect compare page and extract slugs
  useEffect(() => {
    if (pathname === "/compare") {
      const slugsParam = searchParams?.get("slugs") || "";
      const slugs = slugsParam ? slugsParam.split(",").filter(Boolean) : [];
      setCompareSlugs(slugs);
    } else {
      setCompareSlugs([]);
    }
  }, [pathname, searchParams]);

  // Auto-fetch vehicle context based on current page
  useEffect(() => {
    if (vehicleContext) { setPageContext(vehicleContext); return; }

    if (pathname?.startsWith("/product/")) {
      const slug = pathname.split("/product/")[1];
      if (slug) {
        fetch(`/api/vehicle-context?slug=${slug}`)
          .then(r => r.json())
          .then(d => { if (d.context) setPageContext(d.context); })
          .catch(() => {});
      }
    } else if (pathname === "/buy-ev" || pathname === "/catalog") {
      // Detect type/category filter from URL params
      const typeParam = searchParams?.get("type") || "";
      const commParam = searchParams?.get("comm") || "";
      let categoryContext = "";
      if (typeParam) {
        categoryContext = `User is browsing ${typeParam} vehicles ONLY. ONLY recommend ${typeParam} vehicles. Do NOT recommend other vehicle types.`;
      } else if (commParam === "true") {
        categoryContext = "User is browsing Commercial EVs ONLY. ONLY recommend commercial electric vehicles (vans, trucks, cargo). Do NOT recommend passenger cars or scooters.";
      } else {
        categoryContext = "User is browsing all available electric vehicles. Help them find the right EV based on budget, EMI, seating, brand preference, or vehicle type.";
      }
      setPageContext(categoryContext);
    } else if (pathname === "/compare") {
      // Fetch context for compared vehicles
      const slugsParam = searchParams?.get("slugs") || "";
      const slugs = slugsParam ? slugsParam.split(",").filter(Boolean) : [];
      if (slugs.length >= 2) {
        Promise.all(slugs.map(slug =>
          fetch(`/api/vehicle-context?slug=${slug}`).then(r => r.json()).catch(() => ({ context: "" }))
        )).then(results => {
          const contexts = results.map((r, i) => r.context ? `Vehicle ${i + 1} (${slugs[i]}):\n${r.context}` : "").filter(Boolean);
          if (contexts.length) {
            setPageContext(`User is comparing ${slugs.length} vehicles. Help them decide which is better.\n\n${contexts.join("\n\n")}`);
          } else {
            setPageContext(`User is comparing vehicles: ${slugs.join(" vs ")}. Help them compare specs, pricing, and value.`);
          }
        });
      } else {
        setPageContext("User is on the compare page. Help them compare electric vehicles.");
      }
    } else if (pathname === "/tools") {
      // Detect active tool tab from the DOM data attribute
      const toolEl = document.querySelector("[data-active-tool]");
      const activeTool = toolEl?.getAttribute("data-active-tool") || "charging";
      const toolContextMap: Record<string, string> = {
        charging: "User is using the EV Charging Calculator. They want to know charge times and costs. Help them understand charger types and recommend EVs with good charging speeds.",
        savings: "User is using the Fuel vs EV Savings Calculator. They want to compare running costs of petrol vs electric. Help them understand long-term savings and recommend EVs with low running costs.",
        emi: "User is using the EMI Calculator for EV loans. Help them understand monthly payments and recommend EVs that fit their budget/EMI range.",
        range: "User is using the Real-World Range Calculator. Help them understand factors affecting range and recommend EVs with suitable range for their needs.",
      };
      setPageContext(toolContextMap[activeTool] || toolContextMap.charging);
    } else {
      setPageContext("");
    }
  }, [pathname, vehicleContext, searchParams]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Hide/show Tawk widget when Ask Plse chat opens/closes on mobile
  useEffect(() => {
    const tawk = (window as any).Tawk_API;
    if (!tawk) return;
    try {
      if (open && !minimized) {
        tawk.hideWidget?.();
      } else {
        tawk.showWidget?.();
      }
    } catch {}
  }, [open, minimized]);

  useEffect(() => {
    const handleOpenChat = () => {
      setOpen(true);
      setMinimized(false);
    };
    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenChat);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    doClick();
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          vehicleContext: pageContext,
        }),
      });
      const data = await res.json();
      doTextSound();
      if (hapticsEnabled) playHaptic("tab");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.error || "No response" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again." }]);
    }
    setLoading(false);
  };

  // Determine quick suggestions based on page
  const getQuickSuggestions = () => {
    if (pathname === "/compare" && compareSlugs.length >= 2) {
      return [
        `Which is better?`,
        `Compare range & charging`,
        `Which has lower EMI?`,
        `Better for city driving?`,
        `Safety comparison?`,
        `Total cost of ownership?`,
      ];
    }
    if (pathname === "/tools") {
      const toolEl = typeof document !== "undefined" ? document.querySelector("[data-active-tool]") : null;
      const activeTool = toolEl?.getAttribute("data-active-tool") || "charging";
      const toolSuggestions: Record<string, string[]> = {
        charging: ["Everyday up-down distance?", "Best charger for my EV?", "Home charging cost?", "Fast charging EVs?"],
        savings: ["How much will I save?", "EV vs Petrol 5 years?", "Break-even point?", "Cheapest running cost EV?"],
        emi: ["₹10,000/month budget EVs?", "Best loan tenure?", "Lowest EMI EV?", "Zero down payment EVs?"],
        range: ["Best range EV?", "Highway vs city range?", "Range in winter?", "500km range EVs?"],
      };
      return toolSuggestions[activeTool] || toolSuggestions.charging;
    }
    if (pathname === "/buy-ev" || pathname === "/catalog") {
      const typeParam = searchParams?.get("type") || "";
      const commParam = searchParams?.get("comm") || "";
      if (typeParam === "Electric Car" || typeParam === "Electric+Car") {
        return ["Best electric car under 15L?", "Longest range car?", "7 seater EV?", "Best SUV EV?", "Family car EV?", "Luxury EVs?"];
      }
      if (typeParam === "2 Wheeler" || typeParam === "2+Wheeler") {
        return ["Best electric scooter?", "Longest range scooter?", "Under ₹1L scooter?", "Best for daily commute?", "Fastest e-bike?", "Swappable battery?"];
      }
      if (typeParam === "3 Wheeler" || typeParam === "3+Wheeler") {
        return ["Best e-auto?", "Cargo 3-wheeler EV?", "Lowest running cost?", "Best range auto?", "Passenger auto EV?", "Fleet options?"];
      }
      if (commParam === "true") {
        return ["Best cargo EV?", "Fleet pricing?", "Longest range commercial?", "Lowest running cost?", "Delivery van EV?", "3-wheeler cargo?"];
      }
      return ["₹10,000/month EMI EVs?", "7 seater EVs?", "Models by Tata?", "Scooters by Ather?", "Best EV under 10L?", "Longest range EV?"];
    }
    if (pageContext && pathname?.startsWith("/product/")) {
      return ["What's the range?", "Is BAAS worth it?", "Charging time?", "Best variant?"];
    }
    return ["Best EV under 15L?", "EV vs Petrol savings?", "Top speed EVs?", "2-wheeler EVs?"];
  };

  const getWelcomeMessage = () => {
    if (pathname === "/compare" && compareSlugs.length >= 2) {
      return "Ask me to compare these vehicles!";
    }
    if (pathname === "/tools") {
      return "I can help with calculations & recommend EVs!";
    }
    if (pathname === "/buy-ev" || pathname === "/catalog") {
      const typeParam = searchParams?.get("type") || "";
      const commParam = searchParams?.get("comm") || "";
      if (typeParam === "Electric Car" || typeParam === "Electric+Car") return "Ask me about electric cars!";
      if (typeParam === "2 Wheeler" || typeParam === "2+Wheeler") return "Ask me about electric scooters & bikes!";
      if (typeParam === "3 Wheeler" || typeParam === "3+Wheeler") return "Ask me about electric 3-wheelers!";
      if (commParam === "true") return "Ask me about commercial EVs!";
      return "I can help you find the perfect EV!";
    }
    if (pageContext && pathname?.startsWith("/product/")) {
      return "Ask me anything about this vehicle!";
    }
    return "Ask me about any EV in India!";
  };

  // Compare page: show which vehicles are being compared
  const isComparePage = pathname === "/compare" && compareSlugs.length >= 2;
  const isHome = pathname === "/";

  return (
    <>
      {/* Floating Ask Plse widget is hidden as requested; Chat opens via 'open-ai-chat' events from page buttons */}

      {/* Chat popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={`fixed z-[55] flex flex-col bg-white shadow-2xl overflow-hidden ${
              minimized
                ? "bottom-0 left-0 right-0 h-14 rounded-t-2xl md:bottom-6 md:left-6 md:right-auto md:w-[380px] md:h-[500px] md:rounded-2xl md:border border-slate-200"
                : "bottom-0 left-0 right-0 h-[55vh] rounded-t-2xl md:inset-auto md:bottom-6 md:left-6 md:w-[380px] md:h-[500px] md:rounded-2xl border-0 md:border border-slate-200"
            }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 shrink-0 ${isComparePage ? "bg-emerald-500" : "bg-[#34ebb1]"}`}>
            <div className="flex items-center gap-2" onClick={() => minimized && setMinimized(false)} role={minimized ? "button" : undefined}>
              <Sparkles size={18} className={isComparePage ? "text-white" : "text-slate-900"} />
              <span className={`text-sm font-bold ${isComparePage ? "text-white" : "text-slate-900"}`}>
                {isComparePage ? "COMPARE" : "Ask Plse"}
              </span>
              {minimized && <span className="text-[10px] text-slate-700 ml-1">— Tap to expand</span>}
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && !minimized && (
                <button
                  onClick={() => setMessages([])}
                  className={`p-1 rounded ${isComparePage ? "text-white/80 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                  title="Clear chat"
                >
                  <Trash2 size={15} />
                </button>
              )}
              {/* Minimize - mobile only */}
              <button
                onClick={() => setMinimized(!minimized)}
                className={`p-1 rounded md:hidden ${isComparePage ? "text-white/80 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                title={minimized ? "Expand" : "Minimize"}
              >
                <Minus size={16} />
              </button>
              <button onClick={() => { setOpen(false); setMinimized(false); }} className={isComparePage ? "text-white/80 hover:text-white" : "text-slate-700 hover:text-slate-900"}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content - hidden when minimized on mobile */}
          {!minimized && (
            <>

          {/* Compare page: Vehicle badges */}
          {isComparePage && messages.length === 0 && (
            <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex flex-wrap gap-1.5">
              {compareSlugs.map((slug, i) => (
                <span key={slug} className="inline-flex items-center gap-1 rounded-full bg-white border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">{i + 1}</span>
                  {slug.replace(/-/g, " ").slice(0, 20)}
                </span>
              ))}
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles size={32} className={`mx-auto mb-3 ${isComparePage ? "text-emerald-500" : "text-[#34ebb1]"}`} />
                <p className="text-sm font-bold text-slate-700">Ask Plse</p>
                <p className="text-xs text-slate-500 mt-1">{getWelcomeMessage()}</p>
                <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                  {getQuickSuggestions().map((q) => (
                    <button key={q} onClick={() => { setInput(q); }} className={`rounded-full border px-3 py-1 text-[10px] font-medium transition-colors ${
                      isComparePage 
                        ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" 
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}>
                  <ChatContent text={msg.content} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-slate-400" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isComparePage ? "Ask about these vehicles..." : "Ask about EVs..."}
                className={`flex-1 rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none ${
                  isComparePage ? "border-emerald-200 focus:border-emerald-400" : "border-slate-200 focus:border-[#34ebb1]"
                }`}
              />
              <button type="submit" disabled={loading || !input.trim()}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-white disabled:opacity-40 transition-colors ${
                  isComparePage ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#34ebb1] hover:bg-[#2dd9a0] text-slate-900"
                }`}>
                <Send size={16} />
              </button>
            </form>
            <p className="text-[9px] text-center text-slate-400 mt-1.5">AI can make mistakes. Refer experts for current details.</p>
          </div>
          </>
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


// Renders text with [link text](/url) as clickable links, newlines, and bullet points
function ChatContent({ text }: { text: string }) {
  // Clean any residual ** markdown
  const cleaned = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  const lines = cleaned.split("\n");
  return (
    <div className="whitespace-pre-wrap break-words">
      {lines.map((line, li) => {
        const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ") || line.trim().startsWith("* ");
        const content = isBullet ? line.trim().replace(/^[-•*]\s+/, "") : line;
        const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);

        if (isBullet) {
          return (
            <div key={li} className="flex items-start gap-1.5 py-0.5">
              <span className="text-[#34ebb1] font-bold shrink-0 leading-5">•</span>
              <span className="leading-5">
                {parts.map((part, i) => {
                  const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                  if (linkMatch) {
                    return (
                      <a key={i} href={linkMatch[2]} className="font-bold text-[#34ebb1] underline hover:text-emerald-700">
                        {linkMatch[1]}
                      </a>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </span>
            </div>
          );
        }

        // Section headers (e.g., "Scooters:" or "SUVs:")
        const isHeader = /^[A-Za-z &]+:$/.test(line.trim());

        return (
          <span key={li}>
            {isHeader ? (
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wide">{line.trim()}</span>
            ) : (
              parts.map((part, i) => {
                const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (linkMatch) {
                  return (
                    <a key={i} href={linkMatch[2]} className="font-bold text-[#34ebb1] underline hover:text-emerald-700">
                      {linkMatch[1]}
                    </a>
                  );
                }
                return <span key={i}>{part}</span>;
              })
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </div>
  );
}
