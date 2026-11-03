export const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/units", label: "Units" },
  { href: "/admin/charges", label: "Charges" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/export", label: "Export" },
] as const;

export type AdminNavHref = (typeof ADMIN_NAV_LINKS)[number]["href"];

/** True when this officer nav item is the current page or a page under it. */
export function isAdminNavActive(pathname: string, href: AdminNavHref | string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
