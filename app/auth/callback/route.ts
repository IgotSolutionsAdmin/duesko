import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType, Session } from "@supabase/supabase-js";
import { applyAuthNextDestination } from "@/lib/auth-reset-url";
import { linkTypeFromParam } from "@/lib/auth-destination";
import { routeAfterSession, roleFor } from "@/lib/auth-session";
import { DEMO_COOKIE } from "@/lib/demo-cookie";
import { createAuthClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { pkceCookieName } from "@/lib/supabase/pkce-cookies";
import {
  SUPABASE_ACCESS_COOKIE,
  SUPABASE_REFRESH_COOKIE,
  supabaseCookieOptions,
} from "@/lib/supabase/session";

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return page("Supabase is not configured for this server.", false);
  }

  const url = new URL(request.url);
  if (url.searchParams.get("error") || url.searchParams.get("error_description")) {
    return page("That sign-in link is invalid or has expired.", false);
  }

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (code) {
    return exchangeCode(request, code, url.searchParams.get("sb_flow_id"));
  }
  if (tokenHash && isOtpType(type)) {
    return verifyTokenHash(request, tokenHash, type);
  }
  return page("Finishing sign-in…", true);
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return page("Supabase is not configured for this server.", false);
  }
  const form = await request.formData();
  const accessToken = field(form, "access_token");
  const refreshToken = field(form, "refresh_token");
  if (!accessToken || !refreshToken) {
    return page("This sign-in link is incomplete.", false);
  }

  const supabase = createAuthClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data?.session) {
    return page("That sign-in link is invalid or has expired.", false);
  }
  return redirectWithSession(request, supabase, data.session, field(form, "type"), field(form, "next"));
}

async function exchangeCode(request: NextRequest, code: string, flowId: string | null) {
  const pkce = pkceJar(request);
  const supabase = createAuthClient(pkce.storage);
  const { data, error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );
  if (error || !data?.session) {
    const response = page("That sign-in link is invalid or has expired.", false);
    pkce.apply(response);
    return response;
  }
  const linkType = redirectTypeOf(data);
  return redirectWithSession(
    request,
    supabase,
    data.session,
    linkType,
    request.nextUrl.searchParams.get("next"),
    pkce,
  );
}

async function verifyTokenHash(request: NextRequest, tokenHash: string, type: EmailOtpType) {
  const supabase = createAuthClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error || !data?.session) {
    return page("That sign-in link is invalid or has expired.", false);
  }
  return redirectWithSession(
    request,
    supabase,
    data.session,
    type,
    request.nextUrl.searchParams.get("next"),
  );
}

async function redirectWithSession(
  request: NextRequest,
  supabase: ReturnType<typeof createAuthClient>,
  session: Session,
  linkType: string | null,
  next: string | null,
  pkce?: PkceJar,
) {
  const role = await roleFor(supabase, session.user.id);
  const destination = applyAuthNextDestination(
    routeAfterSession({
      linkType,
      invitedAt: session.user.invited_at,
      metadata: session.user.user_metadata,
      role,
    }),
    next ?? request.nextUrl.searchParams.get("next"),
  );
  const response = NextResponse.redirect(new URL(destination, request.url));
  const jar = await cookies();
  jar.set(SUPABASE_ACCESS_COOKIE, session.access_token, supabaseCookieOptions);
  jar.set(SUPABASE_REFRESH_COOKIE, session.refresh_token, supabaseCookieOptions);
  jar.set(DEMO_COOKIE, "", { ...supabaseCookieOptions, maxAge: 0 });
  response.cookies.set(SUPABASE_ACCESS_COOKIE, session.access_token, supabaseCookieOptions);
  response.cookies.set(SUPABASE_REFRESH_COOKIE, session.refresh_token, supabaseCookieOptions);
  response.cookies.set(DEMO_COOKIE, "", { ...supabaseCookieOptions, maxAge: 0 });
  response.headers.set("referrer-policy", "no-referrer");
  response.headers.set("cache-control", "no-store");
  pkce?.apply(response);
  return response;
}

function redirectTypeOf(data: object): string | null {
  if (!("redirectType" in data)) return null;
  const value = (data as { redirectType?: unknown }).redirectType;
  return linkTypeFromParam(typeof value === "string" ? value : null);
}

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && OTP_TYPES.has(value as EmailOtpType);
}

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

type PkceJar = {
  storage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
  apply: (response: NextResponse) => void;
};

function pkceJar(request: NextRequest): PkceJar {
  const writes = new Map<string, { value: string; maxAge: number }>();
  return {
    storage: {
      getItem(key) {
        const name = pkceCookieName(key);
        const written = writes.get(name);
        if (written) return written.value || null;
        return request.cookies.get(name)?.value ?? null;
      },
      setItem(key, value) {
        writes.set(pkceCookieName(key), { value, maxAge: 60 * 10 });
      },
      removeItem(key) {
        writes.set(pkceCookieName(key), { value: "", maxAge: 0 });
      },
    },
    apply(response) {
      for (const [name, entry] of writes) {
        response.cookies.set(name, entry.value, {
          ...supabaseCookieOptions,
          maxAge: entry.maxAge,
        });
      }
    },
  };
}

function page(message: string, recoverHash: boolean) {
  return new NextResponse(documentFor(message, recoverHash), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}

function documentFor(message: string, recoverHash: boolean): string {
  const script = recoverHash
    ? `<form id="session" method="post" action="/auth/callback">
        <input type="hidden" name="access_token" />
        <input type="hidden" name="refresh_token" />
        <input type="hidden" name="type" />
        <input type="hidden" name="next" />
      </form>
      <script>
        (function () {
          var status = document.getElementById("status");
          var page = new URL(window.location.href);
          var hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          var access = hash.get("access_token");
          var refresh = hash.get("refresh_token");
          var failed = hash.get("error") || hash.get("error_description");
          if (failed) {
            status.textContent = "That sign-in link is invalid or has expired.";
            return;
          }
          if (!access || !refresh) {
            status.textContent = "This sign-in link is incomplete.";
            return;
          }
          var form = document.getElementById("session");
          form.access_token.value = access;
          form.refresh_token.value = refresh;
          form.type.value = hash.get("type") || page.searchParams.get("type") || "";
          form.next.value = page.searchParams.get("next") || "";
          history.replaceState(null, "", page.pathname + page.search);
          form.submit();
        })();
      </script>`
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <title>Signing in · DuesKo</title>
  </head>
  <body style="margin:0;background:#f4fbfa;color:#0f2a33;font-family:Inter,sans-serif">
    <main style="max-width:32rem;margin:0 auto;padding:2rem 1.25rem">
      <p style="font:600 1.5rem/1.2 'Plus Jakarta Sans',sans-serif;color:#0a5c5b">DuesKo</p>
      <h1 style="font:600 1.75rem/1.2 'Plus Jakarta Sans',sans-serif">Signing in</h1>
      <p id="status">${message}</p>
    </main>
    ${script}
  </body>
</html>`;
}
