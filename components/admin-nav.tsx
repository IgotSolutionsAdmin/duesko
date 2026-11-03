"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/charges", label: "Charges" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/units", label: "Units" },
  { href: "/admin/more", label: "More" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex min-h-11 items-center justify-center text-center text-xs font-medium ${
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
