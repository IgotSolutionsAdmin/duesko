"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Home, Wallet } from "lucide-react";
import { signOut } from "@/lib/demo-auth-actions";

const links = [
  { href: "/resident", label: "My account", icon: Home },
  { href: "/resident/payments", label: "Payments", icon: Wallet },
  { href: "/resident/help", label: "Help", icon: CircleHelp },
] as const;

function isResidentNavActive(pathname: string, href: string): boolean {
  if (href === "/resident") return pathname === "/resident";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ResidentNav() {
  const pathname = usePathname();
  return (
    <>
      <aside
        className="hidden h-dvh w-[260px] shrink-0 flex-col border-r border-[#e3eeec] bg-white px-5 py-7 print:hidden lg:flex"
        aria-label="Resident menu"
      >
        <Brand />
        <nav className="mt-6 flex flex-col gap-1.5" aria-label="Resident">
          {links.map((link) => {
            const active = isResidentNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
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
        <div className="mt-auto pt-8 pb-16">
          <SignOutButton />
        </div>
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

function Brand() {
  return (
    <p className="flex items-center gap-2 font-heading text-xl font-semibold text-teal-deep">
      <span className="size-3 rounded-full bg-mango" aria-hidden />
      DuesKo
    </p>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <input type="hidden" name="portal" value="resident" suppressHydrationWarning />
      <button
        type="submit"
        className="text-left text-sm font-medium text-ink/70 underline-offset-4 hover:underline"
      >
        Sign out
      </button>
    </form>
  );
}
