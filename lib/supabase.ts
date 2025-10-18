import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/auth-helpers-nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

import { getConfig } from "./config";

type Database = Record<string, never>;

let serviceClient: SupabaseClient<Database> | null = null;

/**
 * Returns a Supabase client scoped to the current server request.
 * Ensures auth cookies are automatically managed by @supabase/auth-helpers-nextjs.
 */
export function getSupabaseServerClient() {
  const config = getConfig();
  const cookieStore = cookies();
  const headerStore = headers();

  return createServerClient<Database>(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
      headers: {
        get(key: string) {
          return headerStore.get(key) ?? undefined;
        },
      },
    },
  );
}

/**
 * Returns a Supabase client authenticated with the service role for privileged operations.
 * Keep usage limited to trusted server contexts.
 */
export function getSupabaseServiceRoleClient() {
  const config = getConfig();
  if (!serviceClient) {
    serviceClient = createClient<Database>(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serviceClient;
}

export type SupabaseServerClient = ReturnType<typeof getSupabaseServerClient>;
