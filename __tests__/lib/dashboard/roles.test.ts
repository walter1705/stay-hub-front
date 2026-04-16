import { describe, it, expect } from "vitest"
import {
  isDashboardRoleSegment,
  roleSegmentToAppRole,
  appRoleToSegment,
  getDefaultRole,
  getDefaultDashboardPath,
  isRoleAllowed,
} from "@/lib/dashboard/roles"

describe("isDashboardRoleSegment", () => {
  it("reconoce segmentos válidos", () => {
    expect(isDashboardRoleSegment("guest")).toBe(true)
    expect(isDashboardRoleSegment("host")).toBe(true)
    expect(isDashboardRoleSegment("admin")).toBe(true)
  })

  it("rechaza segmentos inválidos", () => {
    expect(isDashboardRoleSegment("user")).toBe(false)
    expect(isDashboardRoleSegment("")).toBe(false)
    expect(isDashboardRoleSegment("GUEST")).toBe(false)
  })
})

describe("roleSegmentToAppRole", () => {
  it("convierte segmento a AppRole correctamente", () => {
    expect(roleSegmentToAppRole("guest")).toBe("GUEST")
    expect(roleSegmentToAppRole("host")).toBe("HOST")
    expect(roleSegmentToAppRole("admin")).toBe("ADMIN")
  })
})

describe("appRoleToSegment", () => {
  it("convierte AppRole a segmento correctamente", () => {
    expect(appRoleToSegment("GUEST")).toBe("guest")
    expect(appRoleToSegment("HOST")).toBe("host")
    expect(appRoleToSegment("ADMIN")).toBe("admin")
  })
})

describe("getDefaultRole", () => {
  it("prioriza ADMIN sobre HOST y GUEST", () => {
    expect(getDefaultRole(["GUEST", "HOST", "ADMIN"])).toBe("ADMIN")
  })

  it("prioriza HOST sobre GUEST", () => {
    expect(getDefaultRole(["GUEST", "HOST"])).toBe("HOST")
  })

  it("retorna GUEST si es el único rol", () => {
    expect(getDefaultRole(["GUEST"])).toBe("GUEST")
  })

  it("retorna GUEST por defecto si el array está vacío", () => {
    expect(getDefaultRole([])).toBe("GUEST")
  })

  it("funciona con un solo rol ADMIN", () => {
    expect(getDefaultRole(["ADMIN"])).toBe("ADMIN")
  })
})

describe("getDefaultDashboardPath", () => {
  it("redirige admin al dashboard de admin", () => {
    expect(getDefaultDashboardPath(["ADMIN"])).toBe("/dashboard/admin")
  })

  it("redirige host al dashboard de host", () => {
    expect(getDefaultDashboardPath(["HOST"])).toBe("/dashboard/host")
  })

  it("redirige guest al dashboard de guest", () => {
    expect(getDefaultDashboardPath(["GUEST"])).toBe("/dashboard/guest")
  })

  it("redirige al dashboard de mayor prioridad cuando hay múltiples roles", () => {
    expect(getDefaultDashboardPath(["GUEST", "HOST"])).toBe("/dashboard/host")
    expect(getDefaultDashboardPath(["GUEST", "HOST", "ADMIN"])).toBe("/dashboard/admin")
  })

  it("redirige a guest cuando no hay roles", () => {
    expect(getDefaultDashboardPath([])).toBe("/dashboard/guest")
  })
})

describe("isRoleAllowed", () => {
  it("retorna true cuando el rol está en la lista", () => {
    expect(isRoleAllowed("HOST", ["GUEST", "HOST"])).toBe(true)
  })

  it("retorna false cuando el rol no está en la lista", () => {
    expect(isRoleAllowed("ADMIN", ["GUEST", "HOST"])).toBe(false)
  })

  it("retorna false con lista vacía", () => {
    expect(isRoleAllowed("GUEST", [])).toBe(false)
  })
})
