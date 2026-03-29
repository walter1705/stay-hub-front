"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/hooks/use-session"
import { getDefaultDashboardPath } from "@/lib/dashboard/roles"
import { FullscreenLoader } from "@/components/dashboard/fullscreen-loader"

export function DashboardRedirect() {
  const router = useRouter()
  const { status, session } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }

    if (status === "authenticated" && session) {
      router.replace(getDefaultDashboardPath(session.roles))
    }
  }, [router, session, status])

  return <FullscreenLoader label="Preparando tu dashboard..." />
}
