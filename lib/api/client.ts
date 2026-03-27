const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined")
}

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

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.message || `Error: ${response.status}` }
    }

    const data = await response.json()
    return { data }
  } catch {
    return { error: "Network error. Please try again." }
  }
}
