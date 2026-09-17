import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Browser-side Supabase client. Uses the anon key, so every query it makes is subject to the
 * RLS policies in supabase/migrations, which is the point (DECISIONS.md D011).
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
