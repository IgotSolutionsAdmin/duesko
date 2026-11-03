"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, FileDown, LayoutDashboard, Receipt, Wallet } from "lucide-react";
import { ADMIN_NAV_LINKS, isAdminNavActive } from "@/lib/admin-nav";
import { signOut } from "@/lib/demo-auth-actions";

const icons = {
  "/admin": LayoutDashboard,
  "/admin/units": Building2,
  "/admin/charges": Receipt,
  "/admin/payments": Wallet,
  "/admin/export": FileDown,
} as const;

export function AdminNav({ hoaName }: { hoaName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside
        className="hidden h-dvh w-[260px] shrink-0 flex-col border-r border-[#e3eeec] bg-white px-5 py-7 print:hidden lg:flex"
        aria-label="Officer menu"
      >
        <Brand />
        <NavLinks pathname={pathname} className="mt-6 flex flex-col gap-1.5" />
        <div className="mt-auto flex flex-col gap-3 pt-8 pb-16">
          <Link
            href="/admin/more"
            className="text-sm leading-5 font-medium text-teal-deep"
          >
            {hoaName}
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#e3eeec] bg-white px-5 py-3 print:hidden lg:hidden">
        <Brand />
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/admin/more"
            className="truncate text-sm font-medium text-teal-deep"
          >
            {hoaName}
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-border text-teal-deep"
            aria-expanded={open}
            aria-controls="officer-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 bg-teal-deep" />
              <span className="block h-0.5 w-5 bg-teal-deep" />
              <span className="block h-0.5 w-5 bg-teal-deep" />
            </span>
          </button>
        </div>
      </header>

      {open ? (
        <div
          id="officer-menu"
          className="border-b border-[#e3eeec] bg-white px-5 py-4 lg:hidden"
        >
          <NavLinks pathname={pathname} className="flex flex-col gap-1.5" onNavigate={() => setOpen(false)} />
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <p className="text-sm font-medium text-teal-deep">{hoaName}</p>
            <SignOutButton />
          </div>
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
    <p className="flex items-center gap-2 font-heading text-xl font-semibold text-teal-deep">
      <span className="size-3 rounded-full bg-mango" aria-hidden />
      DuesKo
    </p>
  );
}

function NavLinks({
  pathname,
  className,
  onNavigate,
}: {
  pathname: string;
  className: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={className} aria-label="Officer">
      {ADMIN_NAV_LINKS.map((link) => {
        const active = isAdminNavActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
              active ? "bg-[#e0f5f2] text-teal-deep" : "text-[#3d5560]"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <input type="hidden" name="portal" value="admin" suppressHydrationWarning />
      <button
        type="submit"
        className="text-left text-sm font-medium text-ink/70 underline-offset-4 hover:underline"
      >
        Sign out
      </button>
    </form>
  );
}
