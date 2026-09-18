import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database.types";

/**
 * Server-side Supabase client for Server Components, Route Handlers and Server Actions.
 *
 * Still the anon key, still RLS-enforced. The service-role key is not used here and has no
 * code path in Clarix yet; introducing one means adding an entry to SECURITY.md first.
 */
/**
 * Wrapped in React's `cache()`, so one request gets one client rather than one per loader.
 *
 * This changes nothing about what any caller sees: the client is built from the same request's
 * cookies either way. What it removes is the repeated work of reading and parsing them, and it
 * lets the auth token be validated once per request instead of once per module that asks.
 */
export const createClient = cache(async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. The middleware
          // refreshes the session instead, so this is safe to ignore.
        }
      },
    },
  });
});

/**
 * The signed-in user, fetched once per request.
 *
 * `auth.getUser()` is a network call: it asks the auth server to validate the token rather than
 * trusting what is in the cookie, which is the right thing to do and the reason it is not free.
 * The layouts and the data loaders each need to know who is asking, so a single page render was
 * making that round trip several times over and getting the same answer every time.
 *
 * Returns exactly what `auth.getUser()` returns, so callers are unchanged in every respect
 * except how long they wait.
 */
export const getRequestUser = cache(async function getRequestUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
