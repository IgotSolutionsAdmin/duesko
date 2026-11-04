export const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/units", label: "Units" },
  { href: "/admin/charges", label: "Charges" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/export", label: "Export" },
] as const;

export type AdminNavHref = (typeof ADMIN_NAV_LINKS)[number]["href"];

export const ADMIN_SIDEBAR_LINKS = [
  { href: "/admin", label: "Dashboard", group: "Workspace" },
  { href: "/admin/units", label: "Units", group: "Workspace" },
  { href: "/admin/charges", label: "Charges", group: "Workspace" },
  { href: "/admin/payments", label: "Payments", group: "Records" },
  { href: "/admin/acknowledgments", label: "Acknowledgments", group: "Records" },
  { href: "/admin/export", label: "Export", group: "Records" },
] as const;

/** True when this officer nav item is the current page or a page under it. */
export function isAdminNavActive(pathname: string, href: AdminNavHref | string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
