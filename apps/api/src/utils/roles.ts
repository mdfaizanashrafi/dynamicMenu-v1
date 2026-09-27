import type { Role } from "@prisma/client";

/** Role hierarchy per ARCHITECTURE.md §26 (higher index = more privilege). */
const ROLE_ORDER: Role[] = ["STAFF", "MANAGER", "ADMIN", "OWNER"];

export function roleLevel(role: Role): number {
  return ROLE_ORDER.indexOf(role);
}

/** True when `role` is at least as privileged as `required`. */
export function roleAtLeast(role: Role, required: Role): boolean {
  return roleLevel(role) >= roleLevel(required);
}

export type Permission =
  | "restaurant:manage"
  | "members:manage"
  | "menu:manage"
  | "orders:manage";

const PERMISSION_MIN_ROLE: Record<Permission, Role> = {
  "restaurant:manage": "ADMIN",
  "members:manage": "ADMIN",
  "menu:manage": "MANAGER",
  "orders:manage": "STAFF",
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return roleAtLeast(role, PERMISSION_MIN_ROLE[permission]);
}
