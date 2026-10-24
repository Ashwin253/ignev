import { getSupabaseConfig } from "../lib/supabase";
import TeamDashboard from "./TeamDashboard";

export const metadata = {
  title: "Team Dashboard | EVPLSE",
  robots: { index: false, follow: false },
};

// Never prerender: the dashboard needs live credentials and must not break `next build`
export const dynamic = "force-dynamic";

export default function TeamPage() {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6 pt-24">
        <div className="max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <h1 className="text-2xl font-extrabold text-ink">Team dashboard unavailable</h1>
          <p className="mt-2 text-ink-soft">
            Supabase isn&apos;t configured. Set <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">NEXT_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">NEXT_SUPABASE_PUBLISHABLE_KEY</code> in your environment and restart.
          </p>
        </div>
      </main>
    );
  }
  return <TeamDashboard supabaseUrl={config.url} supabaseAnonKey={config.anonKey} />;
}
