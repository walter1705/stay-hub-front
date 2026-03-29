"use client"

import { useMemo, useState } from "react"
import { CalendarCheck, Home, Layers3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"

type InventoryType = "HOME_ONLY" | "ROOMS_ONLY" | "BOTH"
type UnitType = "HOME" | "ROOM"

interface InventoryPackage {
  id: string
  name: string
  startDate: string
  endDate: string
  type: InventoryType
  roomIds: string[]
  status: "Active" | "Scheduled"
}

interface ReservationRecord {
  id: string
  bookingCode: string
  packageName: string
  packageType: InventoryType
  unitType: UnitType
  roomId?: string
  startDate: string
  endDate: string
  blockedHome: boolean
  blockedRooms: "ALL" | string[]
}

const roomCatalog = [
  { id: "R1", label: "Habitacion 1" },
  { id: "R2", label: "Habitacion 2" },
  { id: "R3", label: "Habitacion 3" },
]

const inventoryTypeOptions: Array<{ value: InventoryType; label: string; detail: string }> = [
  {
    value: "HOME_ONLY",
    label: "Solo Casa Entera",
    detail: "Una reserva bloquea la casa y todas las habitaciones.",
  },
  {
    value: "ROOMS_ONLY",
    label: "Solo Habitaciones",
    detail: "Cada reserva bloquea solo las habitaciones seleccionadas.",
  },
  {
    value: "BOTH",
    label: "Ambas (Casa + Habitaciones)",
    detail: "Reserva de habitacion bloquea casa entera en el mismo periodo y viceversa.",
  },
]

const initialPackages: InventoryPackage[] = [
  {
    id: "pkg-1",
    name: "Semana Santa Flexible",
    startDate: "2026-04-10",
    endDate: "2026-04-20",
    type: "BOTH",
    roomIds: ["R1", "R2", "R3"],
    status: "Active",
  },
  {
    id: "pkg-2",
    name: "Plan Familiar",
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    type: "HOME_ONLY",
    roomIds: [],
    status: "Scheduled",
  },
]

function rangesOverlap(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string) {
  return firstStart <= secondEnd && secondStart <= firstEnd
}

function roomsIntersect(first: "ALL" | string[], second: "ALL" | string[]) {
  if (first === "ALL" || second === "ALL") {
    return true
  }

  return first.some((room) => second.includes(room))
}

function getNextId(prefix: string, length: number) {
  return `${prefix}-${length + 1}`
}

export function HostInventoryManager({ mode }: { mode: "availability" | "packages" }) {
  const { toast } = useToast()
  const [packages, setPackages] = useState<InventoryPackage[]>(initialPackages)
  const [reservations, setReservations] = useState<ReservationRecord[]>([])

  const [packageName, setPackageName] = useState("")
  const [packageStartDate, setPackageStartDate] = useState("")
  const [packageEndDate, setPackageEndDate] = useState("")
  const [packageType, setPackageType] = useState<InventoryType | "">("")
  const [packageRooms, setPackageRooms] = useState<string[]>([])

  const [bookingCode, setBookingCode] = useState("")
  const [reservationStartDate, setReservationStartDate] = useState("")
  const [reservationEndDate, setReservationEndDate] = useState("")
  const [reservationPackageId, setReservationPackageId] = useState("")
  const [reservationUnitType, setReservationUnitType] = useState<UnitType | "">("")
  const [reservationRoomId, setReservationRoomId] = useState("")

  const selectedPackage = useMemo(
    () => packages.find((inventoryPackage) => inventoryPackage.id === reservationPackageId),
    [packages, reservationPackageId],
  )

  const packageColumns: DataTableColumn<InventoryPackage>[] = [
    { id: "name", header: "Paquete", cell: (row) => row.name },
    {
      id: "type",
      header: "Tipo inventario",
      cell: (row) => {
        const label = inventoryTypeOptions.find((option) => option.value === row.type)?.label ?? row.type
        return <Badge variant="outline">{label}</Badge>
      },
    },
    { id: "dates", header: "Rango", cell: (row) => `${row.startDate} -> ${row.endDate}` },
    {
      id: "rooms",
      header: "Habitaciones",
      cell: (row) => (row.roomIds.length ? row.roomIds.join(", ") : "No aplica"),
    },
    { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
  ]

  const reservationColumns: DataTableColumn<ReservationRecord>[] = [
    { id: "booking", header: "Reserva", cell: (row) => row.bookingCode },
    { id: "package", header: "Paquete", cell: (row) => row.packageName },
    {
      id: "unit",
      header: "Unidad reservada",
      cell: (row) =>
        row.unitType === "HOME" ? "Casa Entera" : `Habitacion ${row.roomId ?? "sin definir"}`,
    },
    { id: "range", header: "Fechas", cell: (row) => `${row.startDate} -> ${row.endDate}` },
    { id: "block-home", header: "Bloquea casa", cell: (row) => (row.blockedHome ? "Si" : "No") },
    {
      id: "block-rooms",
      header: "Habitaciones bloqueadas",
      cell: (row) => (row.blockedRooms === "ALL" ? "Todas" : row.blockedRooms.join(", ")),
    },
  ]

  const blockedRanges = useMemo(
    () =>
      reservations.map((reservation) => ({
        id: reservation.id,
        range: `${reservation.startDate} -> ${reservation.endDate}`,
        source: reservation.bookingCode,
        scope: reservation.blockedRooms === "ALL" ? "Casa + Habitaciones" : reservation.blockedHome ? "Casa + habitacion" : "Habitacion",
      })),
    [reservations],
  )

  const resetPackageForm = () => {
    setPackageName("")
    setPackageStartDate("")
    setPackageEndDate("")
    setPackageType("")
    setPackageRooms([])
  }

  const resetReservationForm = () => {
    setBookingCode("")
    setReservationStartDate("")
    setReservationEndDate("")
    setReservationPackageId("")
    setReservationUnitType("")
    setReservationRoomId("")
  }

  const handleCreatePackage = () => {
    if (!packageName || !packageStartDate || !packageEndDate || !packageType) {
      toast({ title: "Datos incompletos", description: "Nombre, fechas y tipo de inventario son obligatorios.", variant: "destructive" })
      return
    }

    if (packageStartDate > packageEndDate) {
      toast({ title: "Rango invalido", description: "La fecha final debe ser posterior a la inicial.", variant: "destructive" })
      return
    }

    if (packageType === "ROOMS_ONLY" && packageRooms.length === 0) {
      toast({ title: "Seleccion requerida", description: "En Solo Habitaciones debes elegir al menos una habitacion.", variant: "destructive" })
      return
    }

    if (packageType === "BOTH" && packageRooms.length === 0) {
      toast({ title: "Configura ambas modalidades", description: "En Ambas debes configurar casa entera y habitaciones.", variant: "destructive" })
      return
    }

    const hasOverlap = packages.some((inventoryPackage) =>
      rangesOverlap(packageStartDate, packageEndDate, inventoryPackage.startDate, inventoryPackage.endDate),
    )

    if (hasOverlap) {
      toast({
        title: "Conflicto de paquete",
        description: "Ya existe un paquete en ese rango de fechas. Ajusta el rango o elimina el paquete anterior.",
        variant: "destructive",
      })
      return
    }

    const newPackage: InventoryPackage = {
      id: getNextId("pkg", packages.length),
      name: packageName,
      startDate: packageStartDate,
      endDate: packageEndDate,
      type: packageType,
      roomIds: packageType === "HOME_ONLY" ? [] : packageRooms,
      status: "Scheduled",
    }

    setPackages((current) => [newPackage, ...current])
    resetPackageForm()
    toast({ title: "Paquete creado", description: "El paquete queda listo para persistirse cuando exista el endpoint." })
  }

  const handleCreateReservation = () => {
    if (!bookingCode || !reservationStartDate || !reservationEndDate || !reservationPackageId || !reservationUnitType) {
      toast({ title: "Datos incompletos", description: "Completa codigo, fechas, paquete y tipo de reserva.", variant: "destructive" })
      return
    }

    if (reservationStartDate > reservationEndDate) {
      toast({ title: "Rango invalido", description: "La fecha final debe ser posterior a la inicial.", variant: "destructive" })
      return
    }

    if (!selectedPackage) {
      toast({ title: "Paquete no encontrado", description: "Selecciona un paquete valido para aplicar reglas de inventario.", variant: "destructive" })
      return
    }

    if (reservationUnitType === "ROOM" && !reservationRoomId) {
      toast({ title: "Habitacion requerida", description: "Debes escoger una habitacion para reserva por habitacion.", variant: "destructive" })
      return
    }

    if (selectedPackage.type === "HOME_ONLY" && reservationUnitType !== "HOME") {
      toast({
        title: "Regla de paquete",
        description: "Este paquete solo permite reservas de casa entera.",
        variant: "destructive",
      })
      return
    }

    if (selectedPackage.type === "ROOMS_ONLY" && reservationUnitType !== "ROOM") {
      toast({
        title: "Regla de paquete",
        description: "Este paquete solo permite reservas por habitacion.",
        variant: "destructive",
      })
      return
    }

    const reservationRangeFitsPackage = rangesOverlap(
      reservationStartDate,
      reservationEndDate,
      selectedPackage.startDate,
      selectedPackage.endDate,
    )

    if (!reservationRangeFitsPackage) {
      toast({
        title: "Fuera del paquete",
        description: "La reserva debe estar dentro de un paquete activo en ese rango.",
        variant: "destructive",
      })
      return
    }

    const blockedHome =
      reservationUnitType === "HOME" || (selectedPackage.type === "BOTH" && reservationUnitType === "ROOM")
    const blockedRooms: "ALL" | string[] =
      reservationUnitType === "HOME"
        ? "ALL"
        : selectedPackage.type === "BOTH"
          ? [reservationRoomId]
          : [reservationRoomId]

    const hasConflict = reservations.some((existingReservation) => {
      const overlaps = rangesOverlap(
        reservationStartDate,
        reservationEndDate,
        existingReservation.startDate,
        existingReservation.endDate,
      )

      if (!overlaps) {
        return false
      }

      if (blockedHome && existingReservation.blockedHome) {
        return true
      }

      return roomsIntersect(blockedRooms, existingReservation.blockedRooms)
    })

    if (hasConflict) {
      toast({
        title: "Conflicto de inventario",
        description: "La reserva entra en conflicto con un bloqueo existente para casa o habitaciones.",
        variant: "destructive",
      })
      return
    }

    const newReservation: ReservationRecord = {
      id: getNextId("res", reservations.length),
      bookingCode,
      packageName: selectedPackage.name,
      packageType: selectedPackage.type,
      unitType: reservationUnitType,
      roomId: reservationUnitType === "ROOM" ? reservationRoomId : undefined,
      startDate: reservationStartDate,
      endDate: reservationEndDate,
      blockedHome,
      blockedRooms,
    }

    setReservations((current) => [newReservation, ...current])
    resetReservationForm()

    if (selectedPackage.type === "BOTH" && reservationUnitType === "ROOM") {
      toast({
        title: "Bloqueo cruzado aplicado",
        description: "Reserva por habitacion en paquete Ambas: casa entera bloqueada para el mismo periodo.",
      })
      return
    }

    if (selectedPackage.type === "BOTH" && reservationUnitType === "HOME") {
      toast({
        title: "Bloqueo cruzado aplicado",
        description: "Reserva de casa entera en paquete Ambas: se bloquearon todas las habitaciones.",
      })
      return
    }

    toast({ title: "Reserva agregada", description: "Reserva validada con reglas actuales de inventario." })
  }

  const modeTitle = mode === "availability" ? "Disponibilidad e inventario" : "Gestion de paquetes"
  const modeDescription =
    mode === "availability"
      ? "Define paquetes, valida reservas y revisa bloqueos para casa entera y habitaciones."
      : "Crea paquetes por fecha con selector obligatorio de tipo y reglas de consistencia."

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="size-4" />
            {modeTitle}
          </CardTitle>
          <CardDescription>{modeDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border p-4">
            <h3 className="font-medium">1) Crear paquete por fechas</h3>
            <div className="space-y-2">
              <Label htmlFor="package-name">Nombre paquete</Label>
              <Input
                id="package-name"
                value={packageName}
                placeholder="Ej. Temporada verano"
                onChange={(event) => setPackageName(event.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="package-start">Fecha inicio</Label>
                <Input
                  id="package-start"
                  type="date"
                  value={packageStartDate}
                  onChange={(event) => setPackageStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-end">Fecha fin</Label>
                <Input
                  id="package-end"
                  type="date"
                  value={packageEndDate}
                  onChange={(event) => setPackageEndDate(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de inventario (obligatorio)</Label>
              <Select value={packageType} onValueChange={(value) => setPackageType(value as InventoryType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona: Solo Casa / Solo Habitaciones / Ambas" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {packageType ? (
                <p className="text-xs text-muted-foreground">
                  {inventoryTypeOptions.find((option) => option.value === packageType)?.detail}
                </p>
              ) : null}
            </div>

            {packageType === "ROOMS_ONLY" || packageType === "BOTH" ? (
              <div className="space-y-2">
                <Label>Habitaciones habilitadas</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {roomCatalog.map((room) => (
                    <label key={room.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <Checkbox
                        checked={packageRooms.includes(room.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPackageRooms((current) => [...current, room.id])
                            return
                          }
                          setPackageRooms((current) => current.filter((roomId) => roomId !== room.id))
                        }}
                      />
                      {room.label}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <Button onClick={handleCreatePackage} className="w-full">
              Guardar paquete
            </Button>
          </div>

          <div className="space-y-4 rounded-xl border p-4">
            <h3 className="font-medium">2) Simular reserva y bloqueos</h3>
            <div className="space-y-2">
              <Label htmlFor="booking-code">Codigo reserva</Label>
              <Input
                id="booking-code"
                value={bookingCode}
                placeholder="Ej. STH-2201"
                onChange={(event) => setBookingCode(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Paquete aplicado</Label>
              <Select value={reservationPackageId} onValueChange={setReservationPackageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona paquete" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((inventoryPackage) => (
                    <SelectItem key={inventoryPackage.id} value={inventoryPackage.id}>
                      {inventoryPackage.name} ({inventoryPackage.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reservation-start">Fecha inicio</Label>
                <Input
                  id="reservation-start"
                  type="date"
                  value={reservationStartDate}
                  onChange={(event) => setReservationStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reservation-end">Fecha fin</Label>
                <Input
                  id="reservation-end"
                  type="date"
                  value={reservationEndDate}
                  onChange={(event) => setReservationEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unidad reservada</Label>
              <Select value={reservationUnitType} onValueChange={(value) => setReservationUnitType(value as UnitType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Casa entera o habitacion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOME">Casa Entera</SelectItem>
                  <SelectItem value="ROOM">Habitacion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reservationUnitType === "ROOM" ? (
              <div className="space-y-2">
                <Label>Habitacion</Label>
                <Select value={reservationRoomId} onValueChange={setReservationRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona habitacion" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomCatalog.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <Button onClick={handleCreateReservation} className="w-full" variant="outline">
              Validar y agregar reserva
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CalendarCheck className="size-5" />
            <div>
              <p className="text-sm text-muted-foreground">Paquetes vigentes</p>
              <p className="text-2xl font-semibold">{packages.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Home className="size-5" />
            <div>
              <p className="text-sm text-muted-foreground">Reservas con bloqueo casa</p>
              <p className="text-2xl font-semibold">{reservations.filter((reservation) => reservation.blockedHome).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Layers3 className="size-5" />
            <div>
              <p className="text-sm text-muted-foreground">Bloqueos activos</p>
              <p className="text-2xl font-semibold">{blockedRanges.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paquetes por fecha y tipo</CardTitle>
          <CardDescription>
            Selector obligatorio aplicado. La persistencia final quedara conectada al endpoint cuando se publique en OpenAPI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={packages}
            columns={packageColumns}
            emptyTitle="Sin paquetes creados"
            emptyDescription="Crea un paquete para empezar a gestionar disponibilidad."
            getRowKey={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservas y bloqueos resultantes</CardTitle>
          <CardDescription>
            Regla clave cubierta: en paquete Ambas, una reserva por habitacion bloquea casa entera en el mismo periodo y viceversa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            data={reservations}
            columns={reservationColumns}
            emptyTitle="Sin reservas simuladas"
            emptyDescription="Agrega una reserva para validar reglas de bloqueo."
            getRowKey={(row) => row.id}
          />

          {blockedRanges.length > 0 ? (
            <div className="rounded-xl border bg-muted/20 p-4 text-sm">
              <p className="mb-2 font-medium">Bloqueos calculados</p>
              <ul className="space-y-1 text-muted-foreground">
                {blockedRanges.map((blockedRange) => (
                  <li key={blockedRange.id}>
                    {blockedRange.range} - {blockedRange.scope} ({blockedRange.source})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
