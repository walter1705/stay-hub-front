import { describe, it, expect } from "vitest"

/**
 * Regex copiadas exactamente de los DTOs del backend:
 *
 * UserSignupRequestDTO:    ^(?=.*[A-Z])(?=.*\d).{8,}$
 * ChangePasswordRequestDTO: ^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d\s]).{8,}$
 * ResetPasswordRequestDTO:  ^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$
 */
const SIGNUP_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/
const CHANGE_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d\s]).{8,}$/
const RESET_REGEX  = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/

// ---------------------------------------------------------------------------
// Signup password
// ---------------------------------------------------------------------------

describe("SIGNUP_REGEX — mínimo 8 chars, 1 mayúscula, 1 número", () => {
  it("acepta contraseña válida", () => {
    expect(SIGNUP_REGEX.test("Password1")).toBe(true)
    expect(SIGNUP_REGEX.test("Test1234")).toBe(true)
    expect(SIGNUP_REGEX.test("ABCDEFG1")).toBe(true)
  })

  it("rechaza menos de 8 caracteres", () => {
    expect(SIGNUP_REGEX.test("Pass1")).toBe(false)
    expect(SIGNUP_REGEX.test("Ab1")).toBe(false)
  })

  it("rechaza sin mayúscula", () => {
    expect(SIGNUP_REGEX.test("password1")).toBe(false)
    expect(SIGNUP_REGEX.test("abcdefg1")).toBe(false)
  })

  it("rechaza sin número", () => {
    expect(SIGNUP_REGEX.test("Password")).toBe(false)
    expect(SIGNUP_REGEX.test("ABCDEFGH")).toBe(false)
  })

  it("rechaza string vacío", () => {
    expect(SIGNUP_REGEX.test("")).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------

describe("CHANGE_REGEX — 8 chars, mayúscula, minúscula, número, carácter especial", () => {
  it("acepta contraseñas válidas", () => {
    expect(CHANGE_REGEX.test("Test1234!")).toBe(true)
    expect(CHANGE_REGEX.test("Abc123@xyz")).toBe(true)
    expect(CHANGE_REGEX.test("P@ssw0rd")).toBe(true)
  })

  it("rechaza sin carácter especial", () => {
    expect(CHANGE_REGEX.test("Password1")).toBe(false)
    expect(CHANGE_REGEX.test("TestAbc123")).toBe(false)
  })

  it("rechaza sin minúscula", () => {
    expect(CHANGE_REGEX.test("PASSWORD1!")).toBe(false)
  })

  it("rechaza sin mayúscula", () => {
    expect(CHANGE_REGEX.test("password1!")).toBe(false)
  })

  it("rechaza sin número", () => {
    expect(CHANGE_REGEX.test("Password!")).toBe(false)
  })

  it("rechaza menos de 8 caracteres", () => {
    expect(CHANGE_REGEX.test("Te1!")).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------

describe("RESET_REGEX — 8 chars, mayúscula, minúscula, número, especial de @#$%^&+=!, sin espacios", () => {
  it("acepta contraseñas válidas", () => {
    expect(RESET_REGEX.test("Test123!")).toBe(true)
    expect(RESET_REGEX.test("P@ssw0rd")).toBe(true)
    expect(RESET_REGEX.test("Abc123#xyz")).toBe(true)
    expect(RESET_REGEX.test("Test1234$")).toBe(true)
  })

  it("rechaza especial fuera del set permitido (@#$%^&+=!)", () => {
    expect(RESET_REGEX.test("Password1*")).toBe(false)
    expect(RESET_REGEX.test("Password1-")).toBe(false)
    expect(RESET_REGEX.test("Password1.")).toBe(false)
  })

  it("rechaza con espacios", () => {
    expect(RESET_REGEX.test("Test 123!")).toBe(false)
    expect(RESET_REGEX.test(" Test123!")).toBe(false)
  })

  it("rechaza sin minúscula", () => {
    expect(RESET_REGEX.test("PASSWORD1!")).toBe(false)
  })

  it("rechaza sin mayúscula", () => {
    expect(RESET_REGEX.test("password1!")).toBe(false)
  })

  it("rechaza sin número", () => {
    expect(RESET_REGEX.test("Password!")).toBe(false)
  })

  it("rechaza menos de 8 caracteres", () => {
    expect(RESET_REGEX.test("Te1!")).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Comparación entre niveles de seguridad
// ---------------------------------------------------------------------------

describe("Comparación de requisitos entre endpoints", () => {
  it("signup acepta lo que change/reset rechazan (sin especial)", () => {
    const weakPassword = "Password1"
    expect(SIGNUP_REGEX.test(weakPassword)).toBe(true)
    expect(CHANGE_REGEX.test(weakPassword)).toBe(false)
    expect(RESET_REGEX.test(weakPassword)).toBe(false)
  })

  it("Test1234! cumple signup y change pero no reset (usa ! pero no otros del set)", () => {
    const pwd = "Test1234!"
    expect(SIGNUP_REGEX.test(pwd)).toBe(true)
    expect(CHANGE_REGEX.test(pwd)).toBe(true)
    expect(RESET_REGEX.test(pwd)).toBe(true)
  })
})
