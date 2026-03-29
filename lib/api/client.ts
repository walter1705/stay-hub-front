const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined")
}

const TOKEN_KEY = "token"

interface ApiResponse<T> {
  data?: T
  error?: string
}

/** Generic HTTP client for API calls. Returns { data } on success, { error } on failure. */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
  const headers = new Headers(options.headers)
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const config: RequestInit = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY)
      }
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.message || `Error: ${response.status}` }
    }

    const data = await response.json()
    return { data }
  } catch {
    return { error: "Network error. Please try again." }
  }
}
