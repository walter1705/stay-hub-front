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

export async function getAccommodationById(id: number) {
  return apiClient<AccommodationDetailResponse>(`/api/v2/accommodations/${id}`, {
    method: "GET",
  })
}
