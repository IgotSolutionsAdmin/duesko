"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronsUpDown,
  FileCheck,
  FileDown,
  LayoutDashboard,
  Receipt,
  Search,
  Settings,
  UserRound,
  Wallet,
} from "lucide-react";
import { ADMIN_NAV_LINKS, ADMIN_SIDEBAR_LINKS, isAdminNavActive } from "@/lib/admin-nav";
import { signOut } from "@/lib/demo-auth-actions";

const icons = {
  "/admin": LayoutDashboard,
  "/admin/units": Building2,
  "/admin/charges": Receipt,
  "/admin/payments": Wallet,
  "/admin/acknowledgments": FileCheck,
  "/admin/export": FileDown,
} as const;

export function AdminNav({
  hoaName,
  userName,
  userEmail,
  counts,
}: {
  hoaName: string;
  userName: string;
  userEmail?: string;
  counts?: { payments?: number; units?: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside
        className="hidden h-dvh w-[248px] shrink-0 flex-col border-r border-border bg-white px-3 py-4 print:hidden lg:flex"
        aria-label="Officer menu"
      >
        <WorkspaceSwitcher hoaName={hoaName} />
        <SidebarSearch />
        <SidebarLinks pathname={pathname} counts={counts} />
        <SidebarFooter userName={userName} userEmail={userEmail} />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-2.5 print:hidden lg:hidden">
        <Brand />
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/admin/more" className="truncate text-[13px] font-medium text-ink">
            {hoaName}
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-ink"
            aria-expanded={open}
            aria-controls="officer-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 bg-ink" />
              <span className="block h-0.5 w-5 bg-ink" />
              <span className="block h-0.5 w-5 bg-ink" />
            </span>
          </button>
        </div>
      </header>

      {open ? (
        <div
          id="officer-menu"
          className="border-b border-border bg-white px-3 py-3 lg:hidden"
        >
          <WorkspaceSwitcher hoaName={hoaName} />
          <SidebarSearch />
          <SidebarLinks pathname={pathname} counts={counts} onNavigate={() => setOpen(false)} />
          <SidebarFooter userName={userName} userEmail={userEmail} />
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white px-2 pt-1 pb-[env(safe-area-inset-bottom,0px)] print:hidden lg:hidden"
        aria-label="Officer"
        data-testid="bottom-nav"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {ADMIN_NAV_LINKS.map((link) => {
            const active = isAdminNavActive(pathname, link.href);
            const Icon = icons[link.href];
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-center text-xs font-medium text-ink ${
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

function Brand() {
  return (
    <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
      <span className="flex size-6 items-center justify-center rounded-md bg-teal text-[11px] font-semibold text-white">
        D
      </span>
      DuesKo
    </p>
  );
}

function WorkspaceSwitcher({ hoaName }: { hoaName: string }) {
  return (
    <Link
      href="/admin/more"
      className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-[#f4f6f6]"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-teal text-[11px] font-semibold text-white">
        D
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{hoaName}</span>
      </span>
      <ChevronsUpDown className="size-3.5 shrink-0 text-ink/35" aria-hidden />
    </Link>
  );
}

function SidebarSearch() {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/") return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      document.getElementById("sidebar-search")?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <label className="relative mt-2 mb-3 block">
      <span className="sr-only">Search</span>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink/40" aria-hidden />
      <input
        id="sidebar-search"
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

function SidebarLinks({
  pathname,
  counts,
  onNavigate,
}: {
  pathname: string;
  counts?: { payments?: number; units?: number };
  onNavigate?: () => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Workspace: true,
    Records: true,
  });
  const groups = ["Workspace", "Records"] as const;

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Officer">
      {groups.map((group) => {
        const links = ADMIN_SIDEBAR_LINKS.filter((link) => link.group === group);
        const open = openGroups[group];
        return (
          <div key={group} className="mb-1">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] font-medium tracking-[0.06em] text-ink/45 uppercase"
              aria-expanded={open}
              onClick={() => setOpenGroups((current) => ({ ...current, [group]: !current[group] }))}
            >
              {group}
              <ChevronDown className={`size-3.5 transition ${open ? "" : "-rotate-90"}`} aria-hidden />
            </button>
            {open
              ? links.map((link) => {
                  const active = isAdminNavActive(pathname, link.href);
                  const Icon = icons[link.href as keyof typeof icons];
                  const count =
                    link.href === "/admin/payments"
                      ? counts?.payments
                      : link.href === "/admin/units"
                        ? counts?.units
                        : undefined;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
                        active ? "bg-[#f3f5f5] font-medium text-ink" : "text-[#3d5560] hover:bg-[#f7fafa]"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
                      <span className="min-w-0 flex-1 truncate">{link.label}</span>
                      {count ? (
                        <span className="rounded-full bg-[#eef1f1] px-1.5 text-[11px] text-ink/60">{count}</span>
                      ) : null}
                    </Link>
                  );
                })
              : null}
          </div>
        );
      })}
    </nav>
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
        href="/admin/more"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#3d5560] hover:bg-[#f7fafa]"
      >
        <Settings className="size-4 shrink-0" aria-hidden />
        Settings
      </Link>
      <Link
        href="/admin/more"
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
      <input type="hidden" name="portal" value="admin" suppressHydrationWarning />
      <button
        type="submit"
        className="text-left text-[13px] font-medium text-ink/70 underline-offset-4 hover:underline"
      >
        Sign out
      </button>
    </form>
  );
}
