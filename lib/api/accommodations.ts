import { apiClient } from "@/lib/api/client"

export interface AccommodationHost {
  id: number
  email: string
  fullName: string
}

export interface AccommodationDetailResponse {
  host: AccommodationHost
  title: string
  description: string
  capacity: number
  pricePerNight: number
  mainImage?: string
  locationDescription: string
  city: string
  images: string[]
  available: boolean
}

export interface MessageResponse {
  message: string
}

export async function getAccommodationById(id: number) {
  return apiClient<AccommodationDetailResponse>(`/api/v2/accommodations/${id}`, {
    method: "GET",
  })
}

/** Soft-deletes an accommodation if it has no future active reservations */
export async function deactivateAccommodation(id: number) {
  return apiClient<MessageResponse>(`/api/v2/accommodations/${id}`, {
    method: "DELETE",
  })
}
