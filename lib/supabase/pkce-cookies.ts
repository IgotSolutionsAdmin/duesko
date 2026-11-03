import "server-only";

import { cookies } from "next/headers";
import { supabaseCookieOptions } from "./session";

/** Cookie name for one PKCE storage key. Names stay short and ASCII. */
export function pkceCookieName(storageKey: string): string {
  const cleaned = storageKey.replace(/[^A-Za-z0-9_-]/g, "_");
  return `dk_${cleaned}`.slice(0, 180);
}

/**
 * Stores the magic-link code verifier in httpOnly cookies.
 * Invite links do not use PKCE; this is only for signInWithOtp.
 */
export async function cookiePkceStorage() {
  const jar = await cookies();
  return {
    getItem(key: string) {
      return jar.get(pkceCookieName(key))?.value ?? null;
    },
    setItem(key: string, value: string) {
      jar.set(pkceCookieName(key), value, {
        ...supabaseCookieOptions,
        maxAge: 60 * 10,
      });
    },
    removeItem(key: string) {
      jar.set(pkceCookieName(key), "", { ...supabaseCookieOptions, maxAge: 0 });
    },
  };
}
