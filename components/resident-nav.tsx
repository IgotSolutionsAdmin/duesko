"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/resident", label: "My account" },
  { href: "/resident/payments", label: "Payments" },
  { href: "/resident/help", label: "Help" },
];

export function ResidentNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2 print:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {links.map((link) => {
          const active =
            link.href === "/resident"
              ? pathname === "/resident"
              : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex min-h-11 items-center justify-center text-center text-sm font-medium ${
                  active ? "text-teal-deep" : "text-ink/45"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
