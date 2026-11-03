import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
  flowType: "pkce" as const,
  storageKey: "duesko-auth",
};

type PkceStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

/**
 * Anon client for Supabase Auth. Does not attach a user session.
 * Pass storage so a magic-link PKCE verifier can live in httpOnly cookies.
 */
export function createAuthClient(storage?: PkceStorage): SupabaseClient {
  const url = supabaseUrl();
  const anonKey = supabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured");
  }
  return createClient(url, anonKey, {
    auth: storage ? { ...authOptions, storage } : authOptions,
  });
}

/**
 * Anon client whose queries run as the signed-in user.
 * PostgREST applies row level security to this session.
 */
export async function createDataClient(
  accessToken: string,
  refreshToken: string,
): Promise<SupabaseClient | null> {
  const supabase = createAuthClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.session) return null;
  return supabase;
}
