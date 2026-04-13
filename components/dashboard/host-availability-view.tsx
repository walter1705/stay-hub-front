"use client"

import { useState } from "react"
import { CalendarOff, CalendarCheck2, Info, Percent } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BlockedPeriod {
  id: string
  startDate: string
  endDate: string
  reason: "maintenance" | "personal" | "reservation"
  label: string
  status: "Active" | "Scheduled"
}

const blockedColumns: DataTableColumn<BlockedPeriod>[] = [
  { id: "label", header: "Motivo", cell: (row) => row.label },
  {
    id: "dates",
    header: "Periodo",
    cell: (row) => `${formatDate(row.startDate)} — ${formatDate(row.endDate)}`,
  },
  {
    id: "nights",
    header: "Noches",
    cell: (row) => calculateNights(row.startDate, row.endDate),
  },
  { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
]

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}

function calculateNights(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const nights = Math.round(diff / (1000 * 60 * 60 * 24))
  return `${nights} ${nights === 1 ? "noche" : "noches"}`
}

export function HostAvailabilityView() {
  const { toast } = useToast()
  const [periods, setPeriods] = useState<BlockedPeriod[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [label, setLabel] = useState("")

  const handleBlockPeriod = () => {
    if (!startDate || !endDate || !label) {
      toast({
        title: "Completa todos los campos",
        description: "Indica el motivo y las fechas del bloqueo.",
        variant: "destructive",
      })
      return
    }
    if (startDate >= endDate) {
      toast({
        title: "Rango invalido",
        description: "La fecha de fin debe ser posterior a la de inicio.",
        variant: "destructive",
      })
      return
    }

    const overlaps = periods.some(
      (p) => !(endDate <= p.startDate || startDate >= p.endDate),
    )
    if (overlaps) {
      toast({
        title: "Conflicto de fechas",
        description: "Ya existe un bloqueo en ese rango de fechas.",
        variant: "destructive",
      })
      return
    }

    const today = new Date().toISOString().split("T")[0]
    const newPeriod: BlockedPeriod = {
      id: `block-${Date.now()}`,
      startDate,
      endDate,
      reason: "maintenance",
      label,
      status: startDate <= today ? "Active" : "Scheduled",
    }
    setPeriods((prev) => [...prev, newPeriod].sort((a, b) => a.startDate.localeCompare(b.startDate)))
    setStartDate("")
    setEndDate("")
    setLabel("")
    toast({ title: "Periodo bloqueado", description: `${label} registrado correctamente.` })
  }

  const handleRemovePeriod = (id: string) => {
    setPeriods((prev) => prev.filter((p) => p.id !== id))
    toast({ title: "Bloqueo eliminado" })
  }

  const activePeriods = periods.filter((p) => p.status === "Active")
  const scheduledPeriods = periods.filter((p) => p.status === "Scheduled")

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Bloqueos activos"
          value={String(activePeriods.length) || "0"}
          hint="en este momento"
          trend={0}
          icon={CalendarOff}
        />
        <KpiCard
          label="Bloqueos programados"
          value={String(scheduledPeriods.length) || "0"}
          hint="proximos"
          trend={0}
          icon={CalendarCheck2}
        />
        <KpiCard
          label="Disponibilidad"
          value={periods.length === 0 ? "100%" : "—"}
          hint="este mes"
          trend={0}
          icon={Percent}
        />
      </div>

      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          Esta vista muestra los periodos bloqueados de tus propiedades. Para configurar reglas de inventario
          por tipo (casa entera, habitaciones), ve a <strong>Paquetes</strong>.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bloquear periodo</CardTitle>
            <CardDescription>
              Marca fechas no disponibles por mantenimiento, uso personal u otros motivos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="block-label">Motivo del bloqueo</Label>
              <Input
                id="block-label"
                placeholder="Ej. Mantenimiento, Uso personal"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="block-start">Fecha inicio</Label>
                <Input
                  id="block-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-end">Fecha fin</Label>
                <Input
                  id="block-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleBlockPeriod} className="w-full">
              Bloquear periodo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>Estado actual de disponibilidad de tus propiedades.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {periods.length === 0 ? (
              <p className="text-muted-foreground">
                No hay bloqueos registrados. Todas las fechas estan disponibles.
              </p>
            ) : (
              <ul className="space-y-2">
                {periods.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <span className="font-medium">{p.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(p.startDate)} — {formatDate(p.endDate)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemovePeriod(p.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
                {periods.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{periods.length - 5} más</p>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los bloqueos</CardTitle>
          <CardDescription>Historial de periodos bloqueados ordenados por fecha.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={periods}
            columns={[
              ...blockedColumns,
              {
                id: "actions",
                header: "",
                cell: (row) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemovePeriod(row.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Eliminar
                  </Button>
                ),
              },
            ]}
            emptyTitle="Sin bloqueos registrados"
            emptyDescription="Agrega un bloqueo manual o las reservas aparecen aqui automaticamente."
            getRowKey={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
