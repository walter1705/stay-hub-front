import { apiClient } from "./client"

// --- Types ---

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface SignupRequest {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  birthDate: string
  profilePicture?: string
  roles: string[]
}

export interface SignupResponse {
  email: string
  fullName: string
  phoneNumber: string
  birthDate: string
  profilePicture?: string
  roles: string[]
}

// --- API Functions ---

/** Authenticates user, returns JWT token */
export async function login(credentials: LoginRequest) {
  return apiClient<LoginResponse>("/api/v2/users/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })
}

/** Registers new user account */
export async function signup(userData: SignupRequest) {
  return apiClient<SignupResponse>("/api/v2/users/auth/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  })
}
