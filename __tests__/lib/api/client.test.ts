import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { apiClient } from "@/lib/api/client"

const TOKEN_KEY = "token"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchOk(body: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status,
    json: async () => body,
  } as Response)
}

function mockFetchError(status: number, body: unknown = { message: "Error" }) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => body,
  } as Response)
}

function mockFetchNetworkError() {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"))
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

afterEach(() => {
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// Request construction
// ---------------------------------------------------------------------------

describe("apiClient — construcción del request", () => {
  it("hace fetch a la URL correcta", async () => {
    mockFetchOk({ data: "ok" })
    await apiClient("/api/v2/test")
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/test"),
      expect.any(Object),
    )
  })

  it("agrega Content-Type application/json por defecto", async () => {
    mockFetchOk({})
    await apiClient("/api/v2/test")
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect((options.headers as Headers).get("Content-Type")).toBe("application/json")
  })

  it("agrega Authorization header cuando hay token en localStorage", async () => {
    localStorage.setItem(TOKEN_KEY, "eyJmake.token.here")
    mockFetchOk({})
    await apiClient("/api/v2/test")
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer eyJmake.token.here")
  })

  it("NO agrega Authorization header cuando no hay token", async () => {
    mockFetchOk({})
    await apiClient("/api/v2/test")
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect((options.headers as Headers).get("Authorization")).toBeNull()
  })

  it("no sobreescribe Authorization si ya viene en options", async () => {
    localStorage.setItem(TOKEN_KEY, "token-del-storage")
    mockFetchOk({})
    await apiClient("/api/v2/test", {
      headers: { Authorization: "Bearer token-custom" },
    })
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer token-custom")
  })
})

// ---------------------------------------------------------------------------
// Respuestas exitosas
// ---------------------------------------------------------------------------

describe("apiClient — respuestas exitosas", () => {
  it("retorna { data } en respuesta 200", async () => {
    mockFetchOk({ id: 1, name: "Carlos" })
    const result = await apiClient<{ id: number; name: string }>("/api/v2/users/1")
    expect(result.data).toEqual({ id: 1, name: "Carlos" })
    expect(result.error).toBeUndefined()
  })

  it("retorna { data } en respuesta 201", async () => {
    mockFetchOk({ token: "jwt-token" }, 201)
    const result = await apiClient("/api/v2/auth/login")
    expect(result.data).toEqual({ token: "jwt-token" })
  })
})

// ---------------------------------------------------------------------------
// Manejo de errores
// ---------------------------------------------------------------------------

describe("apiClient — manejo de errores", () => {
  it("retorna { error } cuando la respuesta no es ok", async () => {
    mockFetchError(400, { message: "Email inválido" })
    const result = await apiClient("/api/v2/users")
    expect(result.error).toBe("Email inválido")
    expect(result.data).toBeUndefined()
  })

  it("retorna error genérico cuando el body de error no tiene message", async () => {
    mockFetchError(500, {})
    const result = await apiClient("/api/v2/users")
    expect(result.error).toContain("500")
  })

  it("limpia el token de localStorage en respuesta 401", async () => {
    localStorage.setItem(TOKEN_KEY, "token-expirado")
    mockFetchError(401, { message: "Unauthorized" })
    await apiClient("/api/v2/protected")
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it("NO limpia el token en otros errores (400, 403, 404)", async () => {
    localStorage.setItem(TOKEN_KEY, "token-valido")
    for (const status of [400, 403, 404]) {
      mockFetchError(status, { message: "Error" })
      await apiClient("/api/v2/something")
      expect(localStorage.getItem(TOKEN_KEY)).toBe("token-valido")
    }
  })

  it("retorna error de red cuando fetch falla", async () => {
    mockFetchNetworkError()
    const result = await apiClient("/api/v2/test")
    expect(result.error).toBe("Network error. Please try again.")
    expect(result.data).toBeUndefined()
  })
})
