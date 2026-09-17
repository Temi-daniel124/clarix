/**
 * Supabase connection details for the `Clarix` project only.
 *
 * DECISIONS.md D020 and SECURITY.md: this codebase never reads, references or connects to the
 * unrelated project that shares the same Supabase organization. If a command or config ever
 * points somewhere other than the ref recorded in docs/ARCHITECTURE.md, stop and confirm it.
 *
 * Values come from the environment, never from a committed file. The service-role key is
 * deliberately absent from this module: no server code path needs it yet, and SECURITY.md's
 * enumerated list of such paths is still empty.
 */

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (and in the Vercel project settings). " +
        "See BUILD.md § Environment variables checklist.",
    );
  }

  return { url, anonKey };
}

/** True when the app has enough configuration to talk to Supabase at all. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
