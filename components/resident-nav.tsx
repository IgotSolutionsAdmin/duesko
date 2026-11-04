"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CircleHelp, FileCheck, Home, Search, Settings, UserRound, Wallet } from "lucide-react";
import { signOut } from "@/lib/demo-auth-actions";

const links = [
  { href: "/resident", label: "My account", icon: Home },
  { href: "/resident/payments", label: "Payments", icon: Wallet },
  { href: "/resident/help", label: "Help", icon: CircleHelp },
] as const;

const sidebarLinks = [
  ...links,
  { href: "/resident/acknowledgments", label: "Acknowledgments", icon: FileCheck },
] as const;

function isResidentNavActive(pathname: string, href: string): boolean {
  if (href === "/resident") return pathname === "/resident";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ResidentNav({
  userName,
  userEmail,
  hoaName,
}: {
  userName: string;
  userEmail?: string;
  hoaName?: string;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className="hidden h-dvh w-[248px] shrink-0 flex-col border-r border-border bg-white px-3 py-4 print:hidden lg:flex"
        aria-label="Resident menu"
      >
        <WorkspaceLabel hoaName={hoaName} />
        <SidebarSearch />
        <nav className="mt-1 flex flex-1 flex-col gap-1" aria-label="Resident">
          {sidebarLinks.map((link) => {
            const active = isResidentNavActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
                  active ? "bg-[#f3f5f5] font-medium text-ink" : "text-[#3d5560] hover:bg-[#f7fafa]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <SidebarFooter userName={userName} userEmail={userEmail} />
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white px-2 pt-1 pb-[env(safe-area-inset-bottom,0px)] print:hidden lg:hidden"
        aria-label="Resident"
        data-testid="bottom-nav"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-3">
          {links.map((link) => {
            const active = isResidentNavActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-center text-xs font-medium text-ink ${
                    active ? "font-semibold" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function WorkspaceLabel({ hoaName }: { hoaName?: string }) {
  return (
    <div className="flex items-center gap-2 px-1.5 py-1.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-teal text-[11px] font-semibold text-white">
        D
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{hoaName ?? "DuesKo"}</span>
        <span className="block text-[11px] text-ink/45">Resident</span>
      </span>
    </div>
  );
}

function SidebarSearch() {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/") return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      document.getElementById("resident-sidebar-search")?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <label className="relative mt-2 mb-3 block">
      <span className="sr-only">Search</span>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink/40" aria-hidden />
      <input
        id="resident-sidebar-search"
        type="search"
        placeholder="Search"
        className="h-8 w-full rounded-lg border border-border bg-[#fafcfc] pr-8 pl-8 text-[13px] outline-none focus:border-teal"
        suppressHydrationWarning
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border px-1 text-[10px] text-ink/40">
        /
      </kbd>
    </label>
  );
}

function SidebarFooter({ userName, userEmail }: { userName: string; userEmail?: string }) {
  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "•";

  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3 pb-2">
      <Link
        href="/resident/help"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#3d5560] hover:bg-[#f7fafa]"
      >
        <Settings className="size-4 shrink-0" aria-hidden />
        Settings
      </Link>
      <Link
        href="/resident"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#3d5560] hover:bg-[#f7fafa]"
      >
        <UserRound className="size-4 shrink-0" aria-hidden />
        Profile
      </Link>
      <div className="mt-1 flex items-center gap-2 px-1.5 pt-1">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal/15 text-[11px] font-semibold text-teal-deep">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-ink">{userName}</span>
          {userEmail ? <span className="block truncate text-[11px] text-ink/45">{userEmail}</span> : null}
        </span>
      </div>
      <div className="px-1.5 pt-1 pb-10 lg:pb-2">
        <SignOutButton />
      </div>
    </div>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <input type="hidden" name="portal" value="resident" suppressHydrationWarning />
      <button
        type="submit"
        className="text-left text-[13px] font-medium text-ink/70 underline-offset-4 hover:underline"
      >
        Sign out
      </button>
    </form>
  );
}
