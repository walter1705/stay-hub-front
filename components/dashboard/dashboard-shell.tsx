"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu, LogOut, UserCircle2 } from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { appRoleToSegment, getDefaultDashboardPath, isDashboardRoleSegment } from "@/lib/dashboard/roles"
import { getNavigationByRole, getSectionLabel, roleLabels } from "@/components/dashboard/navigation"
import { FullscreenLoader } from "@/components/dashboard/fullscreen-loader"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { status, session, logout } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const pathSegments = pathname.split("/").filter(Boolean)
  const roleSegment = pathSegments[1]
  const sectionSegment = pathSegments[2]

  const availableRoleSegments = useMemo(() => {
    if (!session) {
      return []
    }

    return session.roles.map((role) => appRoleToSegment(role))
  }, [session])

  const defaultPath = useMemo(() => {
    if (!session) {
      return "/dashboard/guest"
    }

    return getDefaultDashboardPath(session.roles)
  }, [session])

  const defaultRole = defaultPath.split("/").filter(Boolean)[1]
  const fallbackRole = availableRoleSegments[0] ?? "guest"
  const normalizedRole =
    roleSegment && isDashboardRoleSegment(roleSegment)
      ? roleSegment
      : isDashboardRoleSegment(defaultRole)
        ? defaultRole
        : fallbackRole

  const menuRole = availableRoleSegments.includes(normalizedRole) ? normalizedRole : fallbackRole
  const navigationItems = getNavigationByRole(menuRole)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [router, status])

  if (status === "loading") {
    return <FullscreenLoader label="Cargando dashboard..." />
  }

  if (status === "unauthenticated" || !session) {
    return <FullscreenLoader label="Redirigiendo al login..." />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 border-r bg-card/70 p-6 md:flex md:flex-col">
          <DashboardBrand email={session.email} />
          <nav className="mt-8 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            Dashboard basado en JWT + permisos por rol. Las acciones no expuestas en OpenAPI quedan en modo preparacion.
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex h-16 items-center gap-3 px-4 md:px-8">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="size-4" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="border-b p-4">
                    <SheetTitle>StayHub Dashboard</SheetTitle>
                  </SheetHeader>
                  <nav className="space-y-1 p-4">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                </SheetContent>
              </Sheet>

              <Breadcrumb className="hidden md:block">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={defaultPath}>Dashboard</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{roleLabels[normalizedRole]}</BreadcrumbPage>
                  </BreadcrumbItem>
                  {sectionSegment ? (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{getSectionLabel(normalizedRole, sectionSegment)}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : null}
                </BreadcrumbList>
              </Breadcrumb>

              <div className="ml-auto flex items-center gap-2 md:gap-3">
                {availableRoleSegments.length > 1 ? (
                  <Select
                    value={normalizedRole}
                    onValueChange={(value) => {
                      if (isDashboardRoleSegment(value) && availableRoleSegments.includes(value)) {
                        router.push(`/dashboard/${value}`)
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoleSegments.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                <Button variant="outline" className="h-9 gap-2 px-3">
                  <UserCircle2 className="size-4" />
                  <span className="hidden md:inline">{session.email ?? "Cuenta"}</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    logout()
                    router.replace("/login")
                  }}
                >
                  <LogOut className="size-4" />
                  <span className="sr-only">Cerrar sesion</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

function DashboardBrand({ email }: { email?: string }) {
  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
        <span className="font-serif text-xl">StayHub</span>
      </div>
      <p className="text-sm text-muted-foreground">Sesion JWT activa para {email ?? "usuario"}.</p>
    </div>
  )
}
