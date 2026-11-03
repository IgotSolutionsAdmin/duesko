import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "./lib/demo-cookie";
import { DEMO_ROLE_BY_ID } from "./lib/demo-directory";
import { SUPABASE_ACCESS_COOKIE } from "./lib/supabase/cookie-names";
import type { Role } from "./lib/types";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await resolveRole(request);

  if (pathname === "/admin/login") {
    if (role === "admin_treasurer") return redirect(request, "/admin");
    if (role === "resident") return redirect(request, "/resident");
    return NextResponse.next();
  }
  if (pathname === "/resident/login") {
    if (role === "resident") return redirect(request, "/resident");
    if (role === "admin_treasurer") return redirect(request, "/admin");
    return NextResponse.next();
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!role) return redirect(request, "/admin/login");
    if (role !== "admin_treasurer") return redirect(request, "/resident");
  }
  if (pathname === "/resident" || pathname.startsWith("/resident/")) {
    if (!role) return redirect(request, "/resident/login");
    if (role !== "resident") return redirect(request, "/admin");
  }
  return NextResponse.next();
}

function redirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

async function resolveRole(request: NextRequest): Promise<Role | null> {
  const demoId = request.cookies.get(DEMO_COOKIE)?.value;
  if (demoId && DEMO_ROLE_BY_ID[demoId]) return DEMO_ROLE_BY_ID[demoId];

  const access = request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!access || !url || !anonKey) return null;

  const supabase = createClient(url, anonKey, {
    accessToken: async () => access,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data } = await supabase.from("users").select("id, role");
  const subject = jwtSubject(access);
  const row = (data ?? []).find((user) => user.id === subject);
  if (row?.role === "admin_treasurer" || row?.role === "resident") return row.role;
  return null;
}

function jwtSubject(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
    };
    return json.sub ?? null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/resident", "/resident/:path*"],
};
