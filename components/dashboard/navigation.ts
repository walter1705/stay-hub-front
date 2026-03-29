import {
  Bell,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Compass,
  Gauge,
  Home,
  House,
  MessageSquare,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { DashboardRoleSegment } from "@/lib/dashboard/roles"

export interface DashboardNavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const roleLabels: Record<DashboardRoleSegment, string> = {
  guest: "Cliente",
  host: "Propietario",
  admin: "Administrador",
}

const guestItems: DashboardNavItem[] = [
  { href: "/dashboard/guest", label: "Resumen", icon: Gauge },
  { href: "/dashboard/guest/bookings", label: "Reservas", icon: CalendarDays },
  { href: "/dashboard/guest/payments", label: "Pagos", icon: CircleDollarSign },
  { href: "/dashboard/guest/reviews", label: "Comentarios", icon: MessageSquare },
  { href: "/dashboard/guest/search", label: "Buscar casa", icon: Search },
  { href: "/dashboard/guest/profile", label: "Perfil y seguridad", icon: Shield },
]

const hostItems: DashboardNavItem[] = [
  { href: "/dashboard/host", label: "Resumen", icon: Gauge },
  { href: "/dashboard/host/properties", label: "Casas", icon: House },
  { href: "/dashboard/host/bookings", label: "Reservas", icon: CalendarDays },
  { href: "/dashboard/host/availability", label: "Disponibilidad", icon: Compass },
  { href: "/dashboard/host/packages", label: "Paquetes", icon: ClipboardList },
  { href: "/dashboard/host/reviews", label: "Comentarios", icon: MessageSquare },
  { href: "/dashboard/host/notifications", label: "Notificaciones", icon: Bell },
  { href: "/dashboard/host/profile", label: "Perfil", icon: Shield },
]

const adminItems: DashboardNavItem[] = [
  { href: "/dashboard/admin", label: "Resumen global", icon: Gauge },
  { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
  { href: "/dashboard/admin/hosts", label: "Propietarios", icon: Home },
  { href: "/dashboard/admin/properties", label: "Casas", icon: House },
  { href: "/dashboard/admin/bookings", label: "Reservas", icon: BookOpen },
  { href: "/dashboard/admin/alerts", label: "Alertas", icon: ShieldAlert },
  { href: "/dashboard/admin/audit", label: "Auditoria", icon: Settings },
]

const navByRole: Record<DashboardRoleSegment, DashboardNavItem[]> = {
  guest: guestItems,
  host: hostItems,
  admin: adminItems,
}

export function getNavigationByRole(role: DashboardRoleSegment) {
  return navByRole[role]
}

export function getSectionLabel(role: DashboardRoleSegment, section?: string) {
  if (!section) {
    return "Resumen"
  }

  const item = navByRole[role].find((candidate) => candidate.href.endsWith(`/${section}`))
  return item?.label ?? section
}
