"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Home, Wallet } from "lucide-react";

const links = [
  { href: "/resident", label: "My account", icon: Home },
  { href: "/resident/payments", label: "Payments", icon: Wallet },
  { href: "/resident/help", label: "Help", icon: CircleHelp },
] as const;

export function ResidentNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white px-2 pt-1 pb-[env(safe-area-inset-bottom)] print:hidden"
      aria-label="Resident"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {links.map((link) => {
          const active =
            link.href === "/resident"
              ? pathname === "/resident"
              : pathname.startsWith(link.href);
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
  );
}
