import { apiClient } from "@/lib/api/client"

export interface Review {
  id: number
  accommodationId: number
  accommodationTitle?: string
  guestId: number
  guestName: string
  stayStartDate: string
  stayEndDate: string
  rating: number
  comment: string
  hostResponse?: string | null
  hostRespondedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateReviewRequest {
  accommodationId: number
  rating: number
  comment: string
}

export interface CreateOwnerResponseRequest {
  response: string
}

export const REVIEW_RATING_MIN = 1
export const REVIEW_RATING_MAX = 5
export const REVIEW_COMMENT_MIN_LENGTH = 10

export function validateReviewInput({ rating, comment }: Pick<CreateReviewRequest, "rating" | "comment">) {
  const trimmedComment = comment.trim()

  if (!Number.isInteger(rating) || rating < REVIEW_RATING_MIN || rating > REVIEW_RATING_MAX) {
    return "La calificacion debe estar entre 1 y 5."
  }

  if (trimmedComment.length < REVIEW_COMMENT_MIN_LENGTH) {
    return `El comentario debe tener al menos ${REVIEW_COMMENT_MIN_LENGTH} caracteres.`
  }

  return null
}

export function validateOwnerResponseInput(response: string) {
  if (response.trim().length < REVIEW_COMMENT_MIN_LENGTH) {
    return `La respuesta debe tener al menos ${REVIEW_COMMENT_MIN_LENGTH} caracteres.`
  }

  return null
}

export function canReviewReservation(status: string, endDate: string) {
  const end = new Date(endDate)
  return status === "COMPLETED" || (!Number.isNaN(end.getTime()) && end < new Date())
}

export async function getAccommodationReviews(accommodationId: number) {
  return apiClient<Review[]>(`/api/v2/accommodations/${accommodationId}/reviews`)
}

export async function createReservationReview(reservationId: number, data: CreateReviewRequest) {
  return apiClient<Review>(`/api/v2/accommodations/${data.accommodationId}/reviews`, {
    method: "POST",
    body: JSON.stringify({
      reservationId,
      rating: data.rating,
      comment: data.comment.trim(),
    }),
  })
}

export async function createOwnerReviewResponse(reviewId: number, data: CreateOwnerResponseRequest) {
  return apiClient<Review>(`/api/v2/reviews/${reviewId}/response`, {
    method: "POST",
    body: JSON.stringify({ response: data.response.trim() }),
  })
}
