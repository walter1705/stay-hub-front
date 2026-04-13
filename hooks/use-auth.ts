"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  login,
  signup,
  forgotPassword,
  resetPassword,
  changePassword,
  type LoginRequest,
  type SignupRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
  type ChangePasswordRequest,
} from "@/lib/api/auth"
import { getSessionFromToken, setToken } from "@/lib/auth/session"
import { getDefaultDashboardPath } from "@/lib/dashboard/roles"

/**
 * Hook for authentication logic.
 * Handles login/signup/password flows, loading state, and error handling.
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

  /** Request a password recovery code sent to user's email */
  const handleForgotPassword = useCallback(async (data: ForgotPasswordRequest) => {
    setIsLoading(true)
    setError(null)

    const result = await forgotPassword(data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return false
    }

    setIsLoading(false)
    return true
  }, [])

  /** Reset password using the recovery code received by email */
  const handleResetPassword = useCallback(async (data: ResetPasswordRequest) => {
    setIsLoading(true)
    setError(null)

    const result = await resetPassword(data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return false
    }

    setIsLoading(false)
    return true
  }, [])

  /** Change password for authenticated user */
  const handleChangePassword = useCallback(async (data: ChangePasswordRequest) => {
    setIsLoading(true)
    setError(null)

    const result = await changePassword(data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return false
    }

    setIsLoading(false)
    return true
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    isLoading,
    error,
    handleLogin,
    handleSignup,
    handleForgotPassword,
    handleResetPassword,
    handleChangePassword,
    clearError,
  }
}
