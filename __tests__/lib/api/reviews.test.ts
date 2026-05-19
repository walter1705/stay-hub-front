import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  canReviewReservation,
  createOwnerReviewResponse,
  createReservationReview,
  getAccommodationReviews,
  validateOwnerResponseInput,
  validateReviewInput,
} from "@/lib/api/reviews"

function mockFetchOk(body: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status,
    json: async () => body,
  } as Response)
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("reviews api", () => {
  it("consulta los comentarios de un alojamiento", async () => {
    mockFetchOk([])
    await getAccommodationReviews(7)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/accommodations/7/reviews"),
      expect.any(Object),
    )
  })

  it("crea comentario para una reserva pasada", async () => {
    mockFetchOk({ id: 10 }, 201)
    await createReservationReview(45, { accommodationId: 7, rating: 5, comment: " Muy buena estadia " })

    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain("/api/v2/accommodations/7/reviews")
    expect(options.method).toBe("POST")
    expect(options.body).toBe(JSON.stringify({ reservationId: 45, rating: 5, comment: "Muy buena estadia" }))
  })

  it("crea respuesta del propietario para un comentario", async () => {
    mockFetchOk({ id: 10 }, 201)
    await createOwnerReviewResponse(10, { response: " Gracias por tu comentario " })

    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain("/api/v2/reviews/10/response")
    expect(options.method).toBe("POST")
    expect(options.body).toBe(JSON.stringify({ response: "Gracias por tu comentario" }))
  })
})

describe("reviews validation", () => {
  it("valida rango de calificacion", () => {
    expect(validateReviewInput({ rating: 0, comment: "Comentario valido" })).toContain("calificacion")
    expect(validateReviewInput({ rating: 6, comment: "Comentario valido" })).toContain("calificacion")
    expect(validateReviewInput({ rating: 5, comment: "Comentario valido" })).toBeNull()
  })

  it("valida longitud minima de comentario y respuesta", () => {
    expect(validateReviewInput({ rating: 5, comment: "corto" })).toContain("al menos")
    expect(validateOwnerResponseInput("corta")).toContain("al menos")
    expect(validateOwnerResponseInput("Respuesta suficientemente larga")).toBeNull()
  })

  it("permite comentar reservas completadas o con fecha pasada", () => {
    expect(canReviewReservation("COMPLETED", "2099-01-01T00:00:00")).toBe(true)
    expect(canReviewReservation("ACTIVE", "2000-01-01T00:00:00")).toBe(true)
    expect(canReviewReservation("ACTIVE", "2099-01-01T00:00:00")).toBe(false)
  })
})
