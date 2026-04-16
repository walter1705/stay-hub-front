import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  decodeJwtPayload,
  extractRoles,
  getSessionFromToken,
  getToken,
  setToken,
  clearToken,
  TOKEN_KEY,
} from "@/lib/auth/session"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBase64Url(obj: object): string {
  const json = JSON.stringify(obj)
  const base64 = Buffer.from(json).toString("base64")
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function makeJwt(payload: object): string {
  const header = toBase64Url({ alg: "HS256", typ: "JWT" })
  const body = toBase64Url(payload)
  return `${header}.${body}.fakesignature`
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600   // 1h from now
const PAST_EXP   = Math.floor(Date.now() / 1000) - 3600   // 1h ago

// ---------------------------------------------------------------------------
// decodeJwtPayload
// ---------------------------------------------------------------------------

describe("decodeJwtPayload", () => {
  it("extrae el payload de un JWT válido", () => {
    const token = makeJwt({ sub: "user@test.com", exp: FUTURE_EXP })
    const payload = decodeJwtPayload(token)
    expect(payload?.sub).toBe("user@test.com")
    expect(payload?.exp).toBe(FUTURE_EXP)
  })

  it("retorna null para un token sin payload", () => {
    expect(decodeJwtPayload("solo-una-parte")).toBeNull()
  })

  it("retorna null para un token con payload no-JSON", () => {
    expect(decodeJwtPayload("header.not-json.sig")).toBeNull()
  })

  it("retorna null para string vacío", () => {
    expect(decodeJwtPayload("")).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// extractRoles
// ---------------------------------------------------------------------------

describe("extractRoles", () => {
  it("extrae roles del campo roles", () => {
    const payload = { roles: ["HOST", "GUEST"] }
    expect(extractRoles(payload)).toEqual(expect.arrayContaining(["HOST", "GUEST"]))
  })

  it("extrae roles del campo authorities", () => {
    const payload = { authorities: ["ROLE_HOST"] }
    expect(extractRoles(payload)).toContain("HOST")
  })

  it("extrae roles del campo role (string)", () => {
    const payload = { role: "GUEST" }
    expect(extractRoles(payload)).toContain("GUEST")
  })

  it("extrae roles del campo role (array)", () => {
    const payload = { role: ["GUEST", "HOST"] }
    expect(extractRoles(payload)).toEqual(expect.arrayContaining(["GUEST", "HOST"]))
  })

  it("elimina duplicados cuando hay múltiples fuentes", () => {
    const payload = { roles: ["GUEST"], authorities: ["GUEST"] }
    const result = extractRoles(payload)
    expect(result.filter((r) => r === "GUEST")).toHaveLength(1)
  })

  it("retorna ['GUEST'] cuando payload tiene roles vacíos (sin candidatos reconocidos)", () => {
    expect(extractRoles({ roles: [] })).toEqual(["GUEST"])
  })

  it("retorna [] cuando payload es null (sin sesión — no hay rol que inferir)", () => {
    // La función retorna [] para payload null: sin payload no hay usuario, no hay rol por defecto
    expect(extractRoles(null)).toEqual([])
  })

  it("ignora roles desconocidos", () => {
    const payload = { roles: ["SUPERADMIN", "GUEST"] }
    expect(extractRoles(payload)).toEqual(["GUEST"])
  })

  it("normaliza prefijo ROLE_", () => {
    const payload = { authorities: ["ROLE_HOST", "ROLE_GUEST"] }
    expect(extractRoles(payload)).toEqual(expect.arrayContaining(["HOST", "GUEST"]))
  })
})

// ---------------------------------------------------------------------------
// getSessionFromToken
// ---------------------------------------------------------------------------

describe("getSessionFromToken", () => {
  it("construye sesión válida con token no expirado", () => {
    const token = makeJwt({ sub: "user@test.com", exp: FUTURE_EXP, roles: ["HOST"] })
    const session = getSessionFromToken(token)
    expect(session).not.toBeNull()
    expect(session?.email).toBe("user@test.com")
    expect(session?.roles).toContain("HOST")
    expect(session?.isExpired).toBe(false)
    expect(session?.token).toBe(token)
  })

  it("marca isExpired=true cuando el token expiró", () => {
    const token = makeJwt({ sub: "user@test.com", exp: PAST_EXP })
    const session = getSessionFromToken(token)
    expect(session?.isExpired).toBe(true)
  })

  it("usa campo email si sub no está presente", () => {
    const token = makeJwt({ email: "otro@test.com", exp: FUTURE_EXP })
    const session = getSessionFromToken(token)
    expect(session?.email).toBe("otro@test.com")
  })

  it("retorna sesión con roles vacíos para token malformado (getSessionFromToken nunca retorna null)", () => {
    // La implementación no valida el token — siempre retorna un objeto.
    // getCurrentSession() es quien llama clearToken() si isExpired o roles vacíos.
    const session = getSessionFromToken("token-invalido")
    expect(session).not.toBeNull()
    expect(session?.roles).toEqual([])
    expect(session?.email).toBeUndefined()
    expect(session?.isExpired).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getToken / setToken / clearToken
// ---------------------------------------------------------------------------

describe("localStorage token helpers", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("setToken guarda el token en localStorage", () => {
    setToken("mi-token")
    expect(localStorage.getItem(TOKEN_KEY)).toBe("mi-token")
  })

  it("getToken retorna el token almacenado", () => {
    localStorage.setItem(TOKEN_KEY, "mi-token")
    expect(getToken()).toBe("mi-token")
  })

  it("getToken retorna null si no hay token", () => {
    expect(getToken()).toBeNull()
  })

  it("clearToken elimina el token", () => {
    localStorage.setItem(TOKEN_KEY, "mi-token")
    clearToken()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
