"use client";

// One combined "Ask Plse" widget: AI vehicle chat + EV loan assistance.
// Opens from its floating button, or when pages dispatch `open-ai-chat`
// (chat tab) / `open-assist` (loan tab) — both wired in DeferredGlobalWidgets.

// This widget synchronises external signals (route changes, open events, DOM
// tool state) into React state. That is the intended pattern here; the rule's
// suggested refactor is not applicable to third-party-driven UI.
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { X, Send, Loader2, Sparkles, Trash2, Minus, IndianRupee, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playClickSound, playHaptic } from "../lib/feedback";
import { useFeedback } from "../context/FeedbackContext";
import EnquiryForm from "./EnquiryForm";

type Message = { role: "user" | "assistant"; content: string };

export type WidgetTab = "chat" | "assist";

// A monotonically increasing signal so repeat opens always re-trigger the effect.
export interface WidgetOpenSignal {
  tab: WidgetTab;
  n: number;
}

type TawkApi = { hideWidget?: () => void; showWidget?: () => void };

const BRAND = "#34ebb1";

export default function AskPlseWidget({ openSignal }: { openSignal?: WidgetOpenSignal | null }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<WidgetTab>("chat");
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageContext, setPageContext] = useState("");
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { soundEnabled, hapticsEnabled } = useFeedback();

  const doClick = () => {
    if (soundEnabled) playClickSound();
    if (hapticsEnabled) playHaptic("click");
  };

  const doTextSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = new AudioCtor();
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

  // Open from page-level events (routed through DeferredGlobalWidgets).
  useEffect(() => {
    if (!openSignal) return;
    setOpen(true);
    setMinimized(false);
    setTab(openSignal.tab);
  }, [openSignal]);

  // Detect compare page and extract slugs
  useEffect(() => {
    if (pathname === "/compare") {
      const slugsParam = searchParams?.get("slugs") || "";
      setCompareSlugs(slugsParam ? slugsParam.split(",").filter(Boolean) : []);
    } else {
      setCompareSlugs([]);
    }
  }, [pathname, searchParams]);

  // Auto-derive page context so answers match what the visitor is looking at.
  useEffect(() => {
    if (pathname?.startsWith("/product/")) {
      const slug = pathname.split("/product/")[1];
      if (slug) {
        fetch(`/api/vehicle-context?slug=${slug}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.context) setPageContext(d.context);
          })
          .catch(() => {});
      }
    } else if (pathname === "/buy-ev" || pathname === "/catalog") {
      const typeParam = searchParams?.get("type") || "";
      const commParam = searchParams?.get("comm") || "";
      if (typeParam) {
        setPageContext(
          `User is browsing ${typeParam} vehicles ONLY. ONLY recommend ${typeParam} vehicles. Do NOT recommend other vehicle types.`
        );
      } else if (commParam === "true") {
        setPageContext(
          "User is browsing Commercial EVs ONLY. ONLY recommend commercial electric vehicles (vans, trucks, cargo). Do NOT recommend passenger cars or scooters."
        );
      } else {
        setPageContext(
          "User is browsing all available electric vehicles. Help them find the right EV based on budget, EMI, seating, brand preference, or vehicle type."
        );
      }
    } else if (pathname === "/compare") {
      const slugsParam = searchParams?.get("slugs") || "";
      const slugs = slugsParam ? slugsParam.split(",").filter(Boolean) : [];
      if (slugs.length >= 2) {
        Promise.all(
          slugs.map((slug) =>
            fetch(`/api/vehicle-context?slug=${slug}`)
              .then((r) => r.json())
              .catch(() => ({ context: "" }))
          )
        ).then((results) => {
          const contexts = results
            .map((r, i) => (r.context ? `Vehicle ${i + 1} (${slugs[i]}):\n${r.context}` : ""))
            .filter(Boolean);
          if (contexts.length) {
            setPageContext(
              `User is comparing ${slugs.length} vehicles. Help them decide which is better.\n\n${contexts.join("\n\n")}`
            );
          } else {
            setPageContext(
              `User is comparing vehicles: ${slugs.join(" vs ")}. Help them compare specs, pricing, and value.`
            );
          }
        });
      } else {
        setPageContext("User is on the compare page. Help them compare electric vehicles.");
      }
    } else if (pathname === "/tools") {
      const toolEl = document.querySelector("[data-active-tool]");
      const activeTool = toolEl?.getAttribute("data-active-tool") || "charging";
      const toolContextMap: Record<string, string> = {
        charging:
          "User is using the EV Charging Calculator. They want to know charge times and costs. Help them understand charger types and recommend EVs with good charging speeds.",
        savings:
          "User is using the Fuel vs EV Savings Calculator. They want to compare running costs of petrol vs electric. Help them understand long-term savings and recommend EVs with low running costs.",
        emi: "User is using the EMI Calculator for EV loans. Help them understand monthly payments and recommend EVs that fit their budget/EMI range.",
        range:
          "User is using the Real-World Range Calculator. Help them understand factors affecting range and recommend EVs with suitable range for their needs.",
      };
      setPageContext(toolContextMap[activeTool] || toolContextMap.charging);
    } else {
      setPageContext("");
    }
  }, [pathname, searchParams]);

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, tab]);

  // Hide the third-party chat bubble while our panel is open, so they don't stack.
  useEffect(() => {
    const tawk = (window as unknown as { Tawk_API?: TawkApi }).Tawk_API;
    if (!tawk) return;
    try {
      if (open && !minimized) tawk.hideWidget?.();
      else tawk.showWidget?.();
    } catch {}
  }, [open, minimized]);

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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.error || "No response" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    }
    setLoading(false);
  };

  const getQuickSuggestions = () => {
    if (pathname === "/compare" && compareSlugs.length >= 2) {
      return [
        "Which is better?",
        "Compare range & charging",
        "Which has lower EMI?",
        "Better for city driving?",
        "Safety comparison?",
        "Total cost of ownership?",
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
    if (pathname === "/compare" && compareSlugs.length >= 2) return "Ask me to compare these vehicles!";
    if (pathname === "/tools") return "I can help with calculations & recommend EVs!";
    if (pathname === "/buy-ev" || pathname === "/catalog") {
      const typeParam = searchParams?.get("type") || "";
      const commParam = searchParams?.get("comm") || "";
      if (typeParam === "Electric Car" || typeParam === "Electric+Car") return "Ask me about electric cars!";
      if (typeParam === "2 Wheeler" || typeParam === "2+Wheeler") return "Ask me about electric scooters & bikes!";
      if (typeParam === "3 Wheeler" || typeParam === "3+Wheeler") return "Ask me about electric 3-wheelers!";
      if (commParam === "true") return "Ask me about commercial EVs!";
      return "I can help you find the perfect EV!";
    }
    if (pageContext && pathname?.startsWith("/product/")) return "Ask me anything about this vehicle!";
    return "Ask me about any EV in India!";
  };

  const isComparePage = pathname === "/compare" && compareSlugs.length >= 2;

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              doClick();
              setOpen(true);
              setMinimized(false);
            }}
            className="fixed bottom-5 left-5 z-[55] flex items-center gap-2 rounded-full bg-[#34ebb1] px-4 py-3 text-sm font-bold text-slate-900 shadow-[0_10px_30px_rgba(15,60,40,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2dd9a0] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            aria-label="Open Ask Plse chat and loan assistance"
          >
            <Sparkles size={18} />
            <span className="hidden sm:inline">Ask Plse</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={`fixed z-[56] flex flex-col overflow-hidden bg-white shadow-2xl ${
              minimized
                ? "bottom-0 left-0 right-0 h-14 rounded-t-2xl border-slate-200 md:bottom-6 md:left-6 md:right-auto md:h-[560px] md:w-[390px] md:rounded-2xl md:border"
                : "bottom-0 left-0 right-0 h-[78vh] rounded-t-2xl border-0 md:inset-auto md:bottom-6 md:left-6 md:h-[560px] md:w-[390px] md:rounded-2xl md:border md:border-slate-200"
            }`}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between px-4 py-3"
              style={{ background: isComparePage ? "#10b981" : BRAND }}
            >
              <div
                className="flex items-center gap-2"
                onClick={() => minimized && setMinimized(false)}
                role={minimized ? "button" : undefined}
              >
                <Sparkles size={18} className={isComparePage ? "text-white" : "text-slate-900"} />
                <span className={`text-sm font-bold ${isComparePage ? "text-white" : "text-slate-900"}`}>
                  {isComparePage ? "COMPARE" : "Ask Plse"}
                </span>
                {minimized && <span className="ml-1 text-[10px] text-slate-700">— Tap to expand</span>}
              </div>
              <div className="flex items-center gap-2">
                {tab === "chat" && messages.length > 0 && !minimized && (
                  <button
                    onClick={() => setMessages([])}
                    className={`rounded p-1 ${isComparePage ? "text-white/80 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                    title="Clear chat"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  onClick={() => setMinimized(!minimized)}
                  className={`rounded p-1 md:hidden ${isComparePage ? "text-white/80 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                  title={minimized ? "Expand" : "Minimize"}
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setMinimized(false);
                  }}
                  className={isComparePage ? "text-white/80 hover:text-white" : "text-slate-700 hover:text-slate-900"}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Tabs */}
                <div className="flex shrink-0 gap-1 border-b border-slate-100 bg-white px-3 py-2">
                  <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={<Sparkles size={13} />}>
                    Ask AI
                  </TabButton>
                  <TabButton active={tab === "assist"} onClick={() => setTab("assist")} icon={<IndianRupee size={13} />}>
                    Loan Assist
                  </TabButton>
                </div>

                {tab === "chat" ? (
                  <>
                    {isComparePage && messages.length === 0 && (
                      <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-emerald-100 bg-emerald-50 px-4 py-2">
                        {compareSlugs.map((slug, i) => (
                          <span
                            key={slug}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700"
                          >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                              {i + 1}
                            </span>
                            {slug.replace(/-/g, " ").slice(0, 20)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                      {messages.length === 0 && (
                        <div className="py-6 text-center">
                          <Sparkles size={32} className={`mx-auto mb-3 ${isComparePage ? "text-emerald-500" : "text-[#34ebb1]"}`} />
                          <p className="text-sm font-bold text-slate-700">Ask Plse</p>
                          <p className="mt-1 text-xs text-slate-500">{getWelcomeMessage()}</p>
                          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                            {getQuickSuggestions().map((q) => (
                              <button
                                key={q}
                                onClick={() => setInput(q)}
                                className={`rounded-full border px-3 py-1 text-[10px] font-medium transition-colors ${
                                  isComparePage
                                    ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                              msg.role === "user"
                                ? "rounded-br-sm bg-slate-900 text-white"
                                : "rounded-bl-sm bg-slate-100 text-slate-800"
                            }`}
                          >
                            <ChatContent text={msg.content} />
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 p-3">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage();
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={isComparePage ? "Ask about these vehicles..." : "Ask about EVs..."}
                          className={`flex-1 rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none ${
                            isComparePage ? "border-emerald-200 focus:border-emerald-400" : "border-slate-200 focus:border-[#34ebb1]"
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={loading || !input.trim()}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors disabled:opacity-40 ${
                            isComparePage ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#34ebb1] text-slate-900 hover:bg-[#2dd9a0]"
                          }`}
                          aria-label="Send message"
                        >
                          <Send size={16} />
                        </button>
                      </form>
                      <p className="mt-1.5 text-center text-[9px] text-slate-400">
                        AI can make mistakes. Refer experts for current details.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#f6fbf8] to-white px-5 py-4">
                    <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand">
                      <IndianRupee size={13} />
                      EV Loan Assistance
                    </div>
                    <h3 className="text-lg font-black leading-tight text-ink">Find your EV loan</h3>
                    <p className="mt-1 text-xs font-medium text-[#526B60]">
                      Share your details and our team will help you explore financing options with competitive interest rates.
                    </p>
                    <div className="mt-4 rounded-2xl border border-line bg-white p-4">
                      <EnquiryForm
                        source="EV Loan Assistance"
                        compact={true}
                        buttonText="Register Now"
                      />
                    </div>
                    <button
                      onClick={() => setTab("chat")}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                    >
                      Ask our AI instead <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
        active ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// Renders text with [link text](/url) as clickable links, newlines, and bullet points
function ChatContent({ text }: { text: string }) {
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
              <span className="shrink-0 font-bold leading-5 text-[#34ebb1]">•</span>
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

        const isHeader = /^[A-Za-z &]+:$/.test(line.trim());

        return (
          <span key={li}>
            {isHeader ? (
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700">{line.trim()}</span>
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
