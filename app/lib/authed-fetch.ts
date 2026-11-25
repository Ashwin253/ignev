import type { SupabaseClient } from "@supabase/supabase-js";

// Attach the signed-in user's access token so API routes can write through
// RLS policies that target the `authenticated` role.
export async function authedFetch(
  supabase: SupabaseClient | null,
  url: string,
  init?: RequestInit
) {
  const headers = new Headers(init?.headers);
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...init, headers });
}
