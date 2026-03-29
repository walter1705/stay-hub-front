"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { login, signup, type LoginRequest, type SignupRequest } from "@/lib/api/auth"
import { getSessionFromToken, setToken } from "@/lib/auth/session"
import { getDefaultDashboardPath } from "@/lib/dashboard/roles"

/**
 * Hook for authentication logic.
 * Handles login/signup API calls, loading state, and error handling.
 */
export function useAuth() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Login and store JWT token */
  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true)
    setError(null)

    const result = await login(credentials)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return false
    }

    if (result.data?.token) {
      setToken(result.data.token)
      const session = getSessionFromToken(result.data.token)
      const redirectPath = getDefaultDashboardPath(session?.roles ?? ["GUEST"])
      router.push(redirectPath)
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }, [router])

  /** Register new user */
  const handleSignup = useCallback(async (userData: SignupRequest) => {
    setIsLoading(true)
    setError(null)

    if (userData.roles.length === 0) {
      setError("Please select at least one role")
      setIsLoading(false)
      return false
    }

    const result = await signup(userData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return false
    }

    setIsLoading(false)
    return true
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { isLoading, error, handleLogin, handleSignup, clearError }
}
