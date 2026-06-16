"use client";

import { useCompare } from "../context/CompareContext";
import { GitCompare } from "lucide-react";

export default function CompareButton({ slug, name }: { slug: string; name: string }) {
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const active = isInCompare(slug);

  return (
    <button
      onClick={() => active ? removeFromCompare(slug) : addToCompare(slug)}
      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-all active:scale-95 ${
        active
          ? "bg-[#34ebb1] border-[#34ebb1] text-slate-950 font-black shadow-[0_0_12px_rgba(52,235,177,0.2)]"
          : "border-slate-300 bg-white text-slate-700 hover:bg-[#34ebb1]/15 hover:text-slate-900 hover:border-[#34ebb1]/50 shadow-xs"
      }`}
    >
      <GitCompare size={15} />
      {active ? "In Compare" : "Compare"}
    </button>
  );
}
