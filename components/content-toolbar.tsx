"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ListFilter, Plus } from "lucide-react";

const ADMIN_ACTIONS: { test: (path: string) => boolean; href: string; label: string }[] = [
  { test: (path) => path === "/admin" || path.startsWith("/admin/units"), href: "/admin/units/new", label: "New" },
  { test: (path) => path.startsWith("/admin/charges"), href: "/admin/charges/new", label: "New" },
  { test: (path) => path.startsWith("/admin/payments"), href: "/admin/payments/cash", label: "New" },
];

function crumbsFor(pathname: string, portal: "admin" | "resident"): { href: string; label: string }[] {
  const root = portal === "admin" ? { href: "/admin", label: "Admin" } : { href: "/resident", label: "Home" };
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [root];
  let href = "";
  for (const part of parts) {
    href += `/${part}`;
    if (href === "/admin" || href === "/resident") continue;
    const label = part
      .replace(/^\d+$/, "Detail")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    crumbs.push({ href, label });
  }
  if (crumbs.length === 1 && portal === "admin") {
    crumbs.push({ href: "/admin", label: "Dashboard" });
  }
  return crumbs;
}

function focusSidebarSearch() {
  document.getElementById("sidebar-search")?.focus();
}

export function ContentToolbar({ portal }: { portal: "admin" | "resident" }) {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname, portal);
  const action = portal === "admin" ? ADMIN_ACTIONS.find((item) => item.test(pathname)) : undefined;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px] text-ink/45">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <span key={`${crumb.href}-${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3 shrink-0" aria-hidden /> : null}
              {last ? (
                <span className="truncate font-medium text-ink">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="truncate hover:text-ink">
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
      <div className="flex items-center gap-2">
        {portal === "admin" ? (
          <button
            type="button"
            onClick={focusSidebarSearch}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 text-[13px] font-medium text-ink hover:bg-[#f4f6f6]"
          >
            <ListFilter className="size-3.5" aria-hidden />
            Filter
          </button>
        ) : null}
        {action ? (
          <Link
            href={action.href}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal px-2.5 text-[13px] font-medium text-white hover:bg-teal-deep"
          >
            <Plus className="size-3.5" aria-hidden />
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
