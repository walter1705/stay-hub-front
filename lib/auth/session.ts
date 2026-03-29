export const TOKEN_KEY = "token"

export type AppRole = "GUEST" | "HOST" | "ADMIN"

export interface AuthSession {
  token: string
  roles: AppRole[]
  email?: string
  expiresAt?: number
  isExpired: boolean
}

type JwtPayload = {
  sub?: string
  exp?: number
  email?: string
  role?: string | string[]
  roles?: string[]
  authorities?: string[]
  scope?: string
  scp?: string[]
}

function isBrowser() {
  return typeof window !== "undefined"
}

function normalizeRole(role: string): AppRole | null {
  const cleaned = role.toUpperCase().replace("ROLE_", "")
  if (cleaned === "GUEST" || cleaned === "HOST" || cleaned === "ADMIN") {
    return cleaned
  }

  return null
}

function parseBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")

  if (typeof atob === "function") {
    return atob(padded)
  }

  return ""
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".")
  if (!payload) {
    return null
  }

  try {
    const json = parseBase64Url(payload)
    if (!json) {
      return null
    }

    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function extractRoles(payload: JwtPayload | null): AppRole[] {
  if (!payload) {
    return []
  }

  const roleCandidates: string[] = []
  if (payload.roles) roleCandidates.push(...payload.roles)
  if (payload.authorities) roleCandidates.push(...payload.authorities)
  if (payload.role) {
    if (Array.isArray(payload.role)) {
      roleCandidates.push(...payload.role)
    } else {
      roleCandidates.push(payload.role)
    }
  }
  if (payload.scope) {
    roleCandidates.push(...payload.scope.split(" "))
  }
  if (payload.scp) {
    roleCandidates.push(...payload.scp)
  }

  const normalized = roleCandidates
    .map(normalizeRole)
    .filter((role): role is AppRole => role !== null)

  if (normalized.length === 0) {
    return ["GUEST"]
  }

  return Array.from(new Set(normalized))
}

export function getToken() {
  if (!isBrowser()) {
    return null
  }

  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  if (!isBrowser()) {
    return
  }

  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  if (!isBrowser()) {
    return
  }

  localStorage.removeItem(TOKEN_KEY)
}

export function getSessionFromToken(token: string): AuthSession | null {
  const payload = decodeJwtPayload(token)
  const roles = extractRoles(payload)
  const expiresAt = payload?.exp ? payload.exp * 1000 : undefined

  return {
    token,
    roles,
    email: payload?.email ?? payload?.sub,
    expiresAt,
    isExpired: Boolean(expiresAt && Date.now() > expiresAt),
  }
}

export function getCurrentSession(): AuthSession | null {
  const token = getToken()
  if (!token) {
    return null
  }

  const session = getSessionFromToken(token)
  if (!session || session.isExpired) {
    clearToken()
    return null
  }

  return session
}
