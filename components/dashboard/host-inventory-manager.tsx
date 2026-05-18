"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarCheck, Layers3, MoreHorizontal, Search, Trash, Edit, History, X, FlaskConical } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { getAccommodationById, type AccommodationDetailResponse } from "@/lib/api/accommodations"
import {
  createRentalPackage,
  getRentalPackages,
  updateRentalPackage,
  deleteRentalPackage,
  type RentalPackageResponse,
} from "@/lib/api/rental-packages"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ---------------------------------------------------------------------------
// Persisted recent accommodations (localStorage)
// ---------------------------------------------------------------------------

const RECENT_KEY = "stayhub:host:recent_accommodations"
const MAX_RECENT = 5

interface RecentAccommodation {
  id: number
  title: string
  city: string
}

function loadRecent(): RecentAccommodation[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveRecent(acc: AccommodationDetailResponse & { id: number }) {
  const current = loadRecent().filter((r) => r.id !== acc.id)
  const updated = [{ id: acc.id, title: acc.title, city: acc.city }, ...current].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

// ---------------------------------------------------------------------------
// Mock data — only used in development via the "Demo" button
// ---------------------------------------------------------------------------

const MOCK_ACCOMMODATION: AccommodationDetailResponse & { id: number } = {
  id: 42,
  title: "Cabaña El Roble — Vista al Valle",
  city: "Armenia",
  description: "Cabaña campestre con vista panorámica al Valle del Quindío.",
  capacity: 8,
  pricePerNight: 180000,
  locationDescription: "A 10 min del Parque del Café",
  images: [],
  available: true,
  host: { id: 1, email: "host@stayhub.dev", fullName: "Carlos Ramírez" },
}

const MOCK_PACKAGES: RentalPackageResponse[] = [
  {
    id: 1,
    accommodationId: 42,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    pricePerNight: "220000.00",
    createdAt: "2026-05-01T10:00:00",
    updatedAt: "2026-05-01T10:00:00",
  },
  {
    id: 2,
    accommodationId: 42,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    pricePerNight: "95000.50",
    createdAt: "2026-05-02T09:30:00",
    updatedAt: "2026-05-10T14:15:00",
  },
  {
    id: 3,
    accommodationId: 42,
    startDate: "2026-12-15",
    endDate: "2026-12-31",
    pricePerNight: "350000.00",
    createdAt: "2026-05-03T11:00:00",
    updatedAt: "2026-05-03T11:00:00",
  },
]

// ---------------------------------------------------------------------------
// Shared Zod schema
// ---------------------------------------------------------------------------

const packageSchema = z.object({
  startDate: z.string().min(1, "La fecha de inicio es requerida."),
  endDate: z.string().min(1, "La fecha de fin es requerida."),
  pricePerNight: z
    .string()
    .min(1, "El precio es requerido.")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "El precio debe ser un número mayor a 0.",
    }),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "La fecha final debe ser estrictamente posterior a la fecha de inicio.",
    path: ["endDate"],
  }
)

type PackageFormValues = z.infer<typeof packageSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: string): string {
  const numeric = parseFloat(price)
  return isNaN(numeric)
    ? `$${price}`
    : `$${numeric.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ---------------------------------------------------------------------------
// Edit Dialog — fully isolated form, opens/closes cleanly
// ---------------------------------------------------------------------------

interface EditPackageDialogProps {
  pkg: RentalPackageResponse | null
  onClose: () => void
  onSaved: () => void
  accommodationId: number
}

function EditPackageDialog({ pkg, onClose, onSaved, accommodationId }: EditPackageDialogProps) {
  const { toast } = useToast()
  const isOpen = pkg !== null

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: { startDate: "", endDate: "", pricePerNight: "" },
  })

  // Populate form whenever a package is selected for editing
  useEffect(() => {
    if (pkg) {
      form.reset({
        startDate: pkg.startDate,
        endDate: pkg.endDate,
        pricePerNight: pkg.pricePerNight,
      })
    }
  }, [pkg, form])

  const onSubmit = async (values: PackageFormValues) => {
    if (!pkg) return
    const res = await updateRentalPackage(accommodationId, pkg.id, values)
    if (res.error) {
      toast({ title: "Error al actualizar", description: res.error, variant: "destructive" })
      return
    }
    toast({ title: "Paquete actualizado correctamente" })
    onSaved()
    onClose()
  }

  // Reset form on close so it's clean for the next edit
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="size-4" />
            Editar Paquete #{pkg?.id}
          </DialogTitle>
          <DialogDescription>
            Modifica los campos que desees. Los cambios reemplazarán los valores actuales.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pricePerNight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio por noche</FormLabel>
                  <FormControl>
                    <Input type="text" inputMode="decimal" placeholder="150000.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                Guardar Cambios
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HostPackagesView() {
  const { toast } = useToast()

  // Accommodation selection
  const [accommodationIdInput, setAccommodationIdInput] = useState("")
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationDetailResponse | null>(null)
  const [isLoadingAccommodation, setIsLoadingAccommodation] = useState(false)

  // Recent accommodations history
  const [recentAccommodations, setRecentAccommodations] = useState<RecentAccommodation[]>([])

  // Packages list
  const [packages, setPackages] = useState<RentalPackageResponse[]>([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)

  // Edit dialog: holds the package being edited (null = closed)
  const [editingPackage, setEditingPackage] = useState<RentalPackageResponse | null>(null)

  // Create form
  const createForm = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: { startDate: "", endDate: "", pricePerNight: "" },
  })

  useEffect(() => {
    setRecentAccommodations(loadRecent())
  }, [])

  // Dev-only: load mock data without backend
  const loadDemoData = () => {
    saveRecent(MOCK_ACCOMMODATION)
    setRecentAccommodations(loadRecent())
    setSelectedAccommodation(MOCK_ACCOMMODATION)
    setAccommodationIdInput(String(MOCK_ACCOMMODATION.id))
    setPackages(MOCK_PACKAGES)
    toast({
      title: "🧪 Datos de prueba cargados",
      description: "Estás viendo datos simulados. El backend no fue contactado.",
    })
  }

  // -------------------------------------------------------------------------
  // Load accommodation by ID
  // -------------------------------------------------------------------------

  const handleLoadAccommodation = async (idOverride?: number) => {
    const id = idOverride ?? parseInt(accommodationIdInput)
    if (isNaN(id) || id <= 0) {
      toast({ title: "ID inválido", description: "Ingresa un ID numérico válido.", variant: "destructive" })
      return
    }

    setIsLoadingAccommodation(true)
    const res = await getAccommodationById(id)
    setIsLoadingAccommodation(false)

    if (res.error || !res.data) {
      toast({
        title: "No encontrado",
        description: "No se encontró un alojamiento con ese ID o no tienes acceso.",
        variant: "destructive",
      })
      setSelectedAccommodation(null)
      setPackages([])
      return
    }

    const accWithId = { ...res.data, id }
    saveRecent(accWithId)
    setRecentAccommodations(loadRecent())
    setSelectedAccommodation(accWithId)
    setAccommodationIdInput(String(id))
    loadPackages(id)
  }

  // -------------------------------------------------------------------------
  // Load packages
  // -------------------------------------------------------------------------

  const loadPackages = async (accId: number) => {
    setIsLoadingPackages(true)
    const res = await getRentalPackages(accId)
    setIsLoadingPackages(false)
    if (res.data) {
      setPackages(res.data)
    } else {
      toast({ title: "Error", description: "No se pudieron cargar los paquetes.", variant: "destructive" })
    }
  }

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------

  const onCreateSubmit = async (values: PackageFormValues) => {
    if (!selectedAccommodation) return
    const res = await createRentalPackage(selectedAccommodation.id, values)
    if (res.error) {
      toast({ title: "Error al crear", description: res.error, variant: "destructive" })
      return
    }
    toast({ title: "Paquete creado correctamente" })
    createForm.reset()
    loadPackages(selectedAccommodation.id)
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  const handleDelete = async (packageId: number) => {
    if (!selectedAccommodation) return
    const res = await deleteRentalPackage(selectedAccommodation.id, packageId)
    if (res.error) {
      toast({ title: "Error al eliminar", description: res.error, variant: "destructive" })
      return
    }
    toast({ title: "Paquete eliminado" })
    loadPackages(selectedAccommodation.id)
  }

  // -------------------------------------------------------------------------
  // Table columns
  // -------------------------------------------------------------------------

  const packageColumns: DataTableColumn<RentalPackageResponse>[] = [
    { id: "id", header: "ID", cell: (row) => row.id },
    {
      id: "dates",
      header: "Rango",
      cell: (row) => `${row.startDate} — ${row.endDate}`,
    },
    {
      id: "price",
      header: "Precio / Noche",
      cell: (row) => formatPrice(row.pricePerNight),
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Opciones">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingPackage(row)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Accommodation selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Seleccionar Alojamiento
          </CardTitle>
          <CardDescription>
            Ingresa el ID de tu alojamiento para gestionar sus paquetes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 max-w-sm">
            <Input
              placeholder="ID de alojamiento..."
              value={accommodationIdInput}
              onChange={(e) => setAccommodationIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadAccommodation()}
              type="number"
              min={1}
            />
            <Button onClick={() => handleLoadAccommodation()} disabled={isLoadingAccommodation}>
              {isLoadingAccommodation ? "Cargando..." : "Cargar"}
            </Button>
            {process.env.NODE_ENV === "development" && (
              <Button
                type="button"
                variant="outline"
                onClick={loadDemoData}
                className="gap-1.5 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                title="Cargar datos de prueba (solo visible en desarrollo)"
              >
                <FlaskConical className="size-4" />
                Demo
              </Button>
            )}
          </div>

          {/* Recent accommodations */}
          {recentAccommodations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <History className="size-3" />
                Alojamientos recientes
              </p>
              <div className="flex flex-wrap gap-2">
                {recentAccommodations.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleLoadAccommodation(acc.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="font-mono text-muted-foreground">#{acc.id}</span>
                    <span className="font-medium">{acc.title}</span>
                    <span className="text-muted-foreground">· {acc.city}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected accommodation info */}
          {selectedAccommodation && (
            <div className="flex items-start justify-between p-4 border rounded-md bg-muted/20">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Alojamiento seleccionado</p>
                <p className="font-medium text-lg">{selectedAccommodation.title}</p>
                <p className="text-sm text-muted-foreground">{selectedAccommodation.city}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedAccommodation(null); setPackages([]) }}
                className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                aria-label="Deseleccionar alojamiento"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAccommodation && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create form — always available, never polluted by edit state */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="size-5" />
                Nuevo Paquete
              </CardTitle>
              <CardDescription>
                Define la disponibilidad y precios por temporada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha Inicio</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha Fin</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="pricePerNight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio por noche</FormLabel>
                        <FormControl>
                          <Input type="text" inputMode="decimal" placeholder="150000.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Crear Paquete
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Packages table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="size-5" />
                Paquetes Existentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={packages}
                columns={packageColumns}
                emptyTitle={isLoadingPackages ? "Cargando..." : "Sin paquetes"}
                emptyDescription={
                  isLoadingPackages ? "" : "No hay paquetes configurados para este alojamiento."
                }
                getRowKey={(row) => String(row.id)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit dialog — completely isolated, opens/closes cleanly */}
      {selectedAccommodation && (
        <EditPackageDialog
          pkg={editingPackage}
          accommodationId={selectedAccommodation.id}
          onClose={() => setEditingPackage(null)}
          onSaved={() => loadPackages(selectedAccommodation.id)}
        />
      )}
    </div>
  )
}
