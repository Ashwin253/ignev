import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ijkofkibmxlqwolknosi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_rqrDDLSjIbOL3eaq1Q_JRg_B4jVnxGU";

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
