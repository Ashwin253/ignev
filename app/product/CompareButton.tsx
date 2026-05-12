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
          ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-100"
          : "border-slate-200 text-slate-700 hover:bg-slate-50"
      }`}
    >
      <GitCompare size={15} />
      {active ? "In Compare" : "Compare"}
    </button>
  );
}
