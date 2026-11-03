import type { Role } from "./types";

export function homePath(role: Role): "/admin" | "/resident" {
  return role === "admin_treasurer" ? "/admin" : "/resident";
}

export function roleLabel(role: Role): string {
  return role === "admin_treasurer" ? "Admin treasurer" : "Resident";
}
