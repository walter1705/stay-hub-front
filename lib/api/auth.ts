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

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface MessageResponse {
  message: string
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

/** Sends a recovery code to the user's email */
export async function forgotPassword(data: ForgotPasswordRequest) {
  return apiClient<MessageResponse>("/api/v2/users/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** Resets user password using the recovery code received by email */
export async function resetPassword(data: ResetPasswordRequest) {
  return apiClient<MessageResponse>("/api/v2/users/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** Changes the authenticated user's password, requires current password */
export async function changePassword(data: ChangePasswordRequest) {
  return apiClient<MessageResponse>("/api/v2/users/auth/change-password", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}
