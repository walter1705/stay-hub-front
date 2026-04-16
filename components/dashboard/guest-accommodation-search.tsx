"use client"

import { useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Home,
  MapPin,
  Search,
  Users,
  XCircle,
} from "lucide-react"
import { getAccommodationById, type AccommodationDetailResponse } from "@/lib/api/accommodations"
import { createBooking } from "@/lib/api/bookings"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

type View = "search" | "detail"

function formatCOP(value: number) {
  return value.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

function toDateTime(date: string, time: string): string {
  return `${date}T${time}:00`
}

// ---------------------------------------------------------------------------
// Search view — just the code input + brief result card
// ---------------------------------------------------------------------------

interface SearchViewProps {
  onViewDetail: (accommodation: AccommodationDetailResponse, id: number) => void
}

function SearchView({ onViewDetail }: SearchViewProps) {
  const { toast } = useToast()
  const [code, setCode] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<AccommodationDetailResponse | null>(null)
  const [resultId, setResultId] = useState<number | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async () => {
    const id = Number(code.trim())
    if (!Number.isInteger(id) || id <= 0) {
      toast({ title: "Codigo invalido", description: "Ingresa el codigo numerico del alojamiento.", variant: "destructive" })
      return
    }

    setIsSearching(true)
    setResult(null)
    setNotFound(false)

    const response = await getAccommodationById(id)
    setIsSearching(false)

    if (response.error || !response.data) {
      setNotFound(true)
      return
    }

    setResult(response.data)
    setResultId(id)
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar alojamiento</CardTitle>
          <CardDescription>Ingresa el codigo del alojamiento para ver su informacion.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 max-w-sm">
            <Input
              placeholder="Ej. 1"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setResult(null)
                setNotFound(false)
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Spinner className="size-4" /> : <Search className="size-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Not found feedback */}
      {notFound && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-4 pt-6">
            <XCircle className="size-7 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Alojamiento no encontrado</p>
              <p className="text-sm text-muted-foreground">
                No existe un alojamiento con el codigo <span className="font-mono font-medium">{code}</span>. Verifica e intenta de nuevo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brief result card */}
      {result && resultId !== null && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base truncate">{result.title}</h3>
                  <Badge variant={result.available ? "default" : "secondary"} className="shrink-0">
                    {result.available ? "Disponible" : "No disponible"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3 shrink-0" />
                  {result.city}
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    Hasta {result.capacity} personas
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCOP(result.pricePerNight)} / noche
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => onViewDetail(result, resultId)}
              >
                Ver alojamiento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail view — full page with booking flow
// ---------------------------------------------------------------------------

interface DetailViewProps {
  accommodation: AccommodationDetailResponse
  accommodationId: number
  onBack: () => void
}

function DetailView({ accommodation, accommodationId, onBack }: DetailViewProps) {
  const { toast } = useToast()
  const today = new Date().toISOString().split("T")[0]

  const [bookingOpen, setBookingOpen] = useState(false)
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [isBooking, setIsBooking] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<{ id: number; total: number; currency: string } | null>(null)

  const nights = calculateNights(checkIn, checkOut)
  const total = nights * accommodation.pricePerNight

  const handleBook = async () => {
    if (!checkIn || !checkOut || nights <= 0) {
      toast({ title: "Fechas requeridas", description: "Selecciona check-in y check-out.", variant: "destructive" })
      return
    }

    setIsBooking(true)
    const response = await createBooking({
      accommodationId,
      startDate: toDateTime(checkIn, "14:00"),
      endDate: toDateTime(checkOut, "11:00"),
    })
    setIsBooking(false)

    if (response.error || !response.data) {
      toast({ title: "No se pudo realizar la reserva", description: response.error, variant: "destructive" })
      return
    }

    setConfirmedBooking({
      id: response.data.id,
      total: response.data.totalPrice,
      currency: response.data.currency,
    })
    setBookingOpen(false)
    setCheckIn("")
    setCheckOut("")
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Volver a la busqueda
      </Button>

      {/* Confirmed booking banner */}
      {confirmedBooking && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-4 pt-6">
            <CheckCircle2 className="size-8 shrink-0 text-green-600" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-400">
                Reserva #{confirmedBooking.id} confirmada
              </p>
              <p className="text-sm text-green-700 dark:text-green-500">
                Total: {confirmedBooking.total.toLocaleString("es-CO", {
                  style: "currency",
                  currency: confirmedBooking.currency,
                  maximumFractionDigits: 0,
                })}. Revisa la seccion de reservas para ver el estado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden h-52 md:h-72 bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-end">
        {accommodation.mainImage ? (
          <img
            src={accommodation.mainImage}
            alt={accommodation.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Home className="size-24" />
          </div>
        )}
        <div className="relative z-10 w-full p-5 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{accommodation.title}</h1>
              <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                <MapPin className="size-3.5 shrink-0" />
                {accommodation.city} — {accommodation.locationDescription}
              </p>
            </div>
            <Badge
              variant={accommodation.available ? "default" : "secondary"}
              className="shrink-0 mb-0.5"
            >
              {accommodation.available ? "Disponible" : "No disponible"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold">{formatCOP(accommodation.pricePerNight)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">por noche</p>
            </div>
            <div className="rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                <Users className="size-5" />
                {accommodation.capacity}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {accommodation.capacity === 1 ? "persona" : "personas max."}
              </p>
            </div>
            <div className="rounded-xl border p-4 text-center col-span-2 md:col-span-1">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                <MapPin className="size-5" />
                {accommodation.city}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">ubicacion</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h2 className="font-semibold">Descripcion</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{accommodation.description}</p>
          </div>

          {/* Gallery */}
          {accommodation.images.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold">Fotos del alojamiento</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {accommodation.images.map((src, i) => (
                  <div key={i} className="rounded-lg overflow-hidden bg-muted aspect-video">
                    <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Host */}
          <div className="space-y-2">
            <h2 className="font-semibold">Propietario</h2>
            <div className="rounded-xl border p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-semibold text-sm">
                  {accommodation.host.fullName?.charAt(0).toUpperCase() ?? "?"}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{accommodation.host.fullName}</p>
                <p className="text-xs text-muted-foreground">{accommodation.host.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — booking panel */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {confirmedBooking ? "Reserva confirmada" : "Realizar reserva"}
              </CardTitle>
              {!confirmedBooking && (
                <CardDescription>Selecciona tus fechas para calcular el precio total.</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {confirmedBooking ? (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-3 text-sm text-center space-y-1">
                  <CheckCircle2 className="size-6 mx-auto text-green-600" />
                  <p className="font-medium text-green-800 dark:text-green-400">Reserva #{confirmedBooking.id}</p>
                  <p className="text-green-700 dark:text-green-500 text-xs">
                    Tu reserva fue confirmada exitosamente.
                  </p>
                </div>
              ) : !bookingOpen ? (
                <Button
                  className="w-full"
                  disabled={!accommodation.available}
                  onClick={() => setBookingOpen(true)}
                >
                  {accommodation.available ? "Reservar ahora" : "No disponible"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-checkin" className="flex items-center gap-1.5 text-xs">
                      <CalendarDays className="size-3.5" /> Check-in
                    </Label>
                    <Input
                      id="detail-checkin"
                      type="date"
                      min={today}
                      value={checkIn}
                      onChange={(e) => {
                        setCheckIn(e.target.value)
                        if (checkOut && e.target.value >= checkOut) setCheckOut("")
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-checkout" className="flex items-center gap-1.5 text-xs">
                      <CalendarDays className="size-3.5" /> Check-out
                    </Label>
                    <Input
                      id="detail-checkout"
                      type="date"
                      min={checkIn || today}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>

                  {nights > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>{formatCOP(accommodation.pricePerNight)} × {nights} {nights === 1 ? "noche" : "noches"}</span>
                          <span>{formatCOP(total)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-1 border-t">
                          <span>Total</span>
                          <span>{formatCOP(total)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setBookingOpen(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" className="flex-1" onClick={handleBook} disabled={isBooking}>
                      {isBooking ? <Spinner className="size-4" /> : "Confirmar"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export function GuestAccommodationSearch() {
  const [view, setView] = useState<View>("search")
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationDetailResponse | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const handleViewDetail = (accommodation: AccommodationDetailResponse, id: number) => {
    setSelectedAccommodation(accommodation)
    setSelectedId(id)
    setView("detail")
  }

  const handleBack = () => {
    setView("search")
    setSelectedAccommodation(null)
    setSelectedId(null)
  }

  if (view === "detail" && selectedAccommodation && selectedId !== null) {
    return (
      <DetailView
        accommodation={selectedAccommodation}
        accommodationId={selectedId}
        onBack={handleBack}
      />
    )
  }

  return <SearchView onViewDetail={handleViewDetail} />
}
