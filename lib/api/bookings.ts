import { apiClient } from "@/lib/api/client"

// --- Types ---

export interface BookingRequest {
  accommodationId: number
  checkInDate: string   // ISO date "YYYY-MM-DD"
  checkOutDate: string  // ISO date "YYYY-MM-DD"
  numberOfGuests: number
  specialRequests?: string
}

export interface BookingResponse {
  id: number
  code: string
  accommodationId: number
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  numberOfNights: number
  pricePerNight: number
  totalAmount: number
  status: "PENDING" | "CONFIRMED"
  createdAt: string
}

// --- API Functions ---

/** Creates a new booking for an accommodation */
export async function createBooking(data: BookingRequest) {
  return apiClient<BookingResponse>("/api/v2/bookings/book", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
