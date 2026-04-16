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

export type ReservationStatus = "ACTIVE" | "CANCELLED" | "COMPLETED"

export interface ReservationSummary {
  id: number
  accommodationId: number
  accommodationTitle: string
  startDate: string
  endDate: string
  totalPrice: number
  currency: string
  status: ReservationStatus
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  last: boolean
  first: boolean
}

// --- API Functions ---

/** Creates a new booking for an accommodation */
export async function createBooking(data: BookingRequest) {
  return apiClient<BookingResponse>("/api/v2/bookings/book", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** Returns paginated reservations for the authenticated user.
 *  HOST → all reservations across their accommodations.
 *  GUEST → their own reservations. */
export async function getMyReservations(page = 0) {
  return apiClient<PageResponse<ReservationSummary>>(
    `/api/v2/bookings/my-reservations?page=${page}`
  )
}
