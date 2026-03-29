import type { AppRole } from "@/lib/auth/session"

export type DashboardRoleSegment = "guest" | "host" | "admin"

const ROLE_SEGMENT_TO_APP_ROLE: Record<DashboardRoleSegment, AppRole> = {
  guest: "GUEST",
  host: "HOST",
  admin: "ADMIN",
}

const APP_ROLE_TO_SEGMENT: Record<AppRole, DashboardRoleSegment> = {
  GUEST: "guest",
  HOST: "host",
  ADMIN: "admin",
}

const ROLE_PRIORITY: AppRole[] = ["ADMIN", "HOST", "GUEST"]

export function isDashboardRoleSegment(value: string): value is DashboardRoleSegment {
  return value === "guest" || value === "host" || value === "admin"
}

export function roleSegmentToAppRole(segment: DashboardRoleSegment): AppRole {
  return ROLE_SEGMENT_TO_APP_ROLE[segment]
}

export function appRoleToSegment(role: AppRole): DashboardRoleSegment {
  return APP_ROLE_TO_SEGMENT[role]
}

export function getDefaultRole(roles: AppRole[]): AppRole {
  const matched = ROLE_PRIORITY.find((role) => roles.includes(role))
  return matched ?? "GUEST"
}

export function getDefaultDashboardPath(roles: AppRole[]) {
  const primaryRole = getDefaultRole(roles)
  return `/dashboard/${appRoleToSegment(primaryRole)}`
}

export function isRoleAllowed(role: AppRole, availableRoles: AppRole[]) {
  return availableRoles.includes(role)
}
