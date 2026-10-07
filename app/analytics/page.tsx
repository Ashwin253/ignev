"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AnalyticsPanel from "../team/AnalyticsPanel";

export default function AnalyticsPage() {
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      setSupabase(createClient(url, key));
    }
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnalyticsPanel supabase={supabase} />
      </div>
    </div>
  );
}
