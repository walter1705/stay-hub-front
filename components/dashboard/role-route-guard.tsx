"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ShieldAlert } from "lucide-react"
import { useSession } from "@/hooks/use-session"
import { appRoleToSegment, getDefaultDashboardPath } from "@/lib/dashboard/roles"
import type { AppRole } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FullscreenLoader } from "@/components/dashboard/fullscreen-loader"

interface RoleRouteGuardProps {
  requiredRole: AppRole
  children: ReactNode
}

export function RoleRouteGuard({ requiredRole, children }: RoleRouteGuardProps) {
  const { status, session } = useSession()

  if (status === "loading") {
    return <FullscreenLoader label="Validando permisos del dashboard..." />
  }

  if (status === "unauthenticated" || !session) {
    return null
  }

  if (!session.roles.includes(requiredRole)) {
    const fallbackPath = getDefaultDashboardPath(session.roles)
    const rolePath = `/dashboard/${appRoleToSegment(requiredRole)}`

    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="max-w-xl">
          <CardHeader>
            <div className="inline-flex size-10 items-center justify-center rounded-lg border bg-muted/40">
              <ShieldAlert className="size-5" />
            </div>
            <CardTitle>Acceso restringido</CardTitle>
            <CardDescription>
              Tu sesion no tiene permiso para acceder a <span className="font-medium">{rolePath}</span>. Se mantiene
              protegida la informacion por rol.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={fallbackPath}>Ir a mi dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Iniciar con otra cuenta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
