import { getSupabaseConfig } from "../lib/supabase";
import TeamDashboard from "./TeamDashboard";

export const metadata = {
  title: "Team Dashboard | EVPULSE",
};

export default function TeamPage() {
  const config = getSupabaseConfig();
  return <TeamDashboard supabaseUrl={config.url} supabaseAnonKey={config.anonKey} />;
}
