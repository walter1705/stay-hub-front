"use client"

import { useCallback, useEffect, useState } from "react"
import { clearToken, getCurrentSession, type AuthSession } from "@/lib/auth/session"

type SessionStatus = "loading" | "authenticated" | "unauthenticated"

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<SessionStatus>("loading")

  const refresh = useCallback(() => {
    const currentSession = getCurrentSession()
    if (!currentSession) {
      setSession(null)
      setStatus("unauthenticated")
      return
    }
    setSession(currentSession)
    setStatus("authenticated")
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing session from localStorage on mount
    refresh()
  }, [refresh])

  const logout = useCallback(() => {
    clearToken()
    setSession(null)
    setStatus("unauthenticated")
  }, [])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "token") {
        refresh()
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [refresh])

  return { status, session, refresh, logout }
}
