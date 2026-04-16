import { apiClient } from "@/lib/api/client"

// --- Types ---

export interface BookingRequest {
  accommodationId: number
  startDate: string  // ISO datetime "YYYY-MM-DDTHH:mm:ss"
  endDate: string    // ISO datetime "YYYY-MM-DDTHH:mm:ss"
}

export interface BookingResponse {
  id: number
  startDate: string
  endDate: string
  totalPrice: number
  currency: string
  status: "ACTIVE" | "CANCELLED" | "COMPLETED"
  accommodationId: number
  accommodationTitle: string
  userId: number
}

// --- API Functions ---

/** Creates a new booking for an accommodation */
export async function createBooking(data: BookingRequest) {
  return apiClient<BookingResponse>("/api/v2/bookings/book", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
