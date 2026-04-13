"use client"

import { useState } from "react"
import { Search, Users, CalendarDays, CheckCircle2 } from "lucide-react"
import { getAccommodationById, type AccommodationDetailResponse } from "@/lib/api/accommodations"
import { createBooking } from "@/lib/api/bookings"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function formatCOP(value: number) {
  return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

export function GuestAccommodationSearch() {
  const { toast } = useToast()

  // Search state
  const [accommodationId, setAccommodationId] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<AccommodationDetailResponse | null>(null)

  // Booking dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [specialRequests, setSpecialRequests] = useState("")
  const [isBooking, setIsBooking] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<{ code: string; total: number } | null>(null)

  const nights = calculateNights(checkIn, checkOut)
  const total = result ? nights * result.pricePerNight : 0
  const today = new Date().toISOString().split("T")[0]

  const handleSearch = async () => {
    const idValue = Number(accommodationId)
    if (!Number.isInteger(idValue) || idValue <= 0) {
      toast({ title: "Codigo invalido", description: "Ingresa el codigo numerico del alojamiento.", variant: "destructive" })
      return
    }
    if (checkIn && checkOut && checkIn >= checkOut) {
      toast({ title: "Fechas invalidas", description: "El check-out debe ser posterior al check-in.", variant: "destructive" })
      return
    }

    setIsSearching(true)
    setResult(null)
    setConfirmedBooking(null)
    const response = await getAccommodationById(idValue)
    setIsSearching(false)

    if (response.error) {
      toast({ title: "No se encontro el alojamiento", description: response.error, variant: "destructive" })
      return
    }

    setResult(response.data ?? null)
  }

  const handleBook = async () => {
    if (!result || !checkIn || !checkOut || nights <= 0) {
      toast({ title: "Completa las fechas", description: "Selecciona fechas de check-in y check-out.", variant: "destructive" })
      return
    }
    if (guests < 1 || guests > result.capacity) {
      toast({
        title: "Cantidad de huespedes invalida",
        description: `Este alojamiento acepta entre 1 y ${result.capacity} personas.`,
        variant: "destructive",
      })
      return
    }

    setIsBooking(true)
    const response = await createBooking({
      accommodationId: Number(accommodationId),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: guests,
      specialRequests: specialRequests || undefined,
    })
    setIsBooking(false)

    if (response.error) {
      toast({ title: "No se pudo realizar la reserva", description: response.error, variant: "destructive" })
      return
    }

    setConfirmedBooking({
      code: response.data?.code ?? "—",
      total: response.data?.totalAmount ?? total,
    })
    setDialogOpen(false)
    setSpecialRequests("")
    toast({ title: "Reserva confirmada", description: `Codigo: ${response.data?.code}` })
  }

  return (
    <div className="space-y-6">
      {/* Search form */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar alojamiento</CardTitle>
          <CardDescription>Ingresa el codigo del alojamiento y selecciona tus fechas para ver disponibilidad y precio.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="acc-id">Codigo de alojamiento</Label>
              <Input
                id="acc-id"
                placeholder="Ej. 1"
                value={accommodationId}
                onChange={(e) => setAccommodationId(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-in">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Check-in
                </span>
              </Label>
              <Input
                id="check-in"
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value)
                  if (checkOut && e.target.value >= checkOut) setCheckOut("")
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-out">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Check-out
                </span>
              </Label>
              <Input
                id="check-out"
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guests">
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  Huespedes
                </span>
              </Label>
              <Input
                id="guests"
                type="number"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={isSearching} className="mt-4">
            {isSearching ? (
              <><Spinner className="mr-2 size-4" />Buscando...</>
            ) : (
              <><Search className="mr-2 size-4" />Buscar</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Booking confirmed */}
      {confirmedBooking && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-4 pt-6">
            <CheckCircle2 className="size-8 shrink-0 text-green-600" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-400">
                Reserva confirmada — {confirmedBooking.code}
              </p>
              <p className="text-sm text-green-700 dark:text-green-500">
                Total: {formatCOP(confirmedBooking.total)}. Revisa tus reservas para ver el estado completo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result card */}
      {result && !confirmedBooking && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{result.title}</CardTitle>
                <CardDescription>{result.city} — {result.locationDescription}</CardDescription>
              </div>
              <Badge variant={result.available ? "default" : "secondary"} className="shrink-0 mt-0.5">
                {result.available ? "Disponible" : "No disponible"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">
                <Users className="mr-1.5 size-3" />
                Hasta {result.capacity} personas
              </Badge>
              <Badge variant="outline">
                {formatCOP(result.pricePerNight)} / noche
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">{result.description}</p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Propietario</p>
                <p className="font-medium">{result.host.fullName}</p>
                <p className="text-muted-foreground">{result.host.email}</p>
              </div>
              {result.images.length > 0 && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Fotos</p>
                  <p>{result.images.length} {result.images.length === 1 ? "imagen" : "imagenes"}</p>
                </div>
              )}
            </div>

            {/* Price summary when dates selected */}
            {checkIn && checkOut && nights > 0 && (
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {formatCOP(result.pricePerNight)} × {nights} {nights === 1 ? "noche" : "noches"}
                  </span>
                  <span className="font-semibold text-base">{formatCOP(total)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(checkIn + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  {" — "}
                  {new Date(checkOut + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  {" · "}
                  {guests} {guests === 1 ? "huesped" : "huespedes"}
                </div>
              </div>
            )}

            <Button
              className="w-full sm:w-auto"
              disabled={!result.available}
              onClick={() => {
                if (!checkIn || !checkOut || nights <= 0) {
                  toast({
                    title: "Selecciona las fechas",
                    description: "Elige check-in y check-out antes de reservar.",
                    variant: "destructive",
                  })
                  return
                }
                setDialogOpen(true)
              }}
            >
              {result.available ? "Reservar ahora" : "No disponible"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Booking confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription>
              Revisa los detalles antes de confirmar tu reserva.
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alojamiento</span>
                  <span className="font-medium">{result.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span>{new Date(checkIn + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span>{new Date(checkOut + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Huespedes</span>
                  <span>{guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Noches</span>
                  <span>{nights}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special-requests">Solicitudes especiales (opcional)</Label>
                <Textarea
                  id="special-requests"
                  placeholder="Llegada tarde, cuna para bebe, alergias..."
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleBook} disabled={isBooking}>
                  {isBooking ? (
                    <><Spinner className="mr-2 size-4" />Reservando...</>
                  ) : (
                    "Confirmar reserva"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
