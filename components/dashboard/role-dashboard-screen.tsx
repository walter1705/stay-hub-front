"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Calendar, CheckCircle2, Circle, CircleDollarSign, Home, MessageSquare, Shield, Users, XCircle } from "lucide-react"
import { changePassword } from "@/lib/api/auth"
import { deactivateAccommodation } from "@/lib/api/accommodations"
import { roleSegmentToAppRole, type DashboardRoleSegment, isDashboardRoleSegment } from "@/lib/dashboard/roles"
import {
  type BookingRow,
  type PaymentRow,
  type PropertyRow,
  type ReviewRow,
  type NotificationRow,
  type AdminUserRow,
  type AlertRow,
  type AuditRow,
  type HostReviewRow,
} from "@/lib/dashboard/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/hooks/use-session"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { GuestAccommodationSearch } from "@/components/dashboard/guest-accommodation-search"
import { HostPackagesView } from "@/components/dashboard/host-inventory-manager"
import { HostAvailabilityView } from "@/components/dashboard/host-availability-view"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { PageHeader } from "@/components/dashboard/page-header"
import { PaymentNoticeModal } from "@/components/dashboard/payment-notice-modal"
import { RoleRouteGuard } from "@/components/dashboard/role-route-guard"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { TableFilters } from "@/components/dashboard/table-filters"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RoleDashboardScreenProps {
  roleSegment: string
  section?: string
}

function getBookingColumns(): DataTableColumn<BookingRow>[] {
  return [
    { id: "code", header: "Codigo", cell: (row) => row.code },
    { id: "house", header: "Casa", cell: (row) => row.house },
    { id: "city", header: "Ciudad", cell: (row) => row.city },
    { id: "checkIn", header: "Check-in", cell: (row) => row.checkIn },
    { id: "checkOut", header: "Check-out", cell: (row) => row.checkOut },
    { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
    { id: "amount", header: "Total", cell: (row) => row.amount },
  ]
}

function getPaymentColumns(): DataTableColumn<PaymentRow>[] {
  return [
    { id: "booking", header: "Reserva", cell: (row) => row.bookingCode },
    { id: "dueDate", header: "Vencimiento", cell: (row) => row.dueDate },
    { id: "amount", header: "Monto (20%)", cell: (row) => row.amount },
    { id: "method", header: "Metodo", cell: (row) => row.method },
    { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
  ]
}

function getReviewColumns(): DataTableColumn<ReviewRow>[] {
  return [
    { id: "house", header: "Casa", cell: (row) => row.house },
    { id: "rating", header: "Calificacion", cell: (row) => `${row.rating}/5` },
    { id: "comment", header: "Comentario", cell: (row) => row.comment, className: "max-w-[320px] truncate" },
    { id: "createdAt", header: "Fecha", cell: (row) => row.createdAt },
    { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
  ]
}

// Stable empty arrays — defined at module level so useMemo deps don't change on every render
const EMPTY_BOOKINGS: BookingRow[] = []
const EMPTY_PAYMENTS: PaymentRow[] = []
const EMPTY_REVIEWS: ReviewRow[] = []
const EMPTY_NOTIFICATIONS: NotificationRow[] = []
const EMPTY_HOST_REVIEWS: HostReviewRow[] = []
const EMPTY_USERS: AdminUserRow[] = []

export function RoleDashboardScreen({ roleSegment, section }: RoleDashboardScreenProps) {
  if (!isDashboardRoleSegment(roleSegment)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ruta no encontrada</CardTitle>
          <CardDescription>El rol solicitado no existe en el sistema.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const requiredRole = roleSegmentToAppRole(roleSegment)

  return <RoleRouteGuard requiredRole={requiredRole}>{renderRoleSection(roleSegment, section)}</RoleRouteGuard>
}

function renderRoleSection(role: DashboardRoleSegment, section?: string) {
  if (role === "guest") return <GuestDashboard section={section} />
  if (role === "host") return <HostDashboard section={section} />
  return <AdminDashboard section={section} />
}

// ---------------------------------------------------------------------------
// Change password card — shared between guest and host profile
// ---------------------------------------------------------------------------

// ChangePasswordRequestDTO: ^(?=.*\d)(?=.*\p{Ll})(?=.*\p{Lu})(?=.*[^\p{L}\d\s]).{8,}$
// JS equivalent (Latin charset)
const CHANGE_PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z\d\s]).{8,}$/

function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "1 letra mayúscula", ok: /[A-Z]/.test(password) },
    { label: "1 letra minúscula", ok: /[a-z]/.test(password) },
    { label: "1 número", ok: /\d/.test(password) },
    { label: "1 carácter especial", ok: /[^a-zA-Z\d\s]/.test(password) },
  ]
  return (
    <ul className="mt-1.5 space-y-0.5">
      {checks.map(({ label, ok }) => (
        <li key={label} className={`text-xs flex items-center gap-1.5 transition-colors ${ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
          {ok ? <CheckCircle2 className="size-3 shrink-0" /> : <Circle className="size-3 shrink-0" />}
          {label}
        </li>
      ))}
    </ul>
  )
}

function ChangePasswordCard() {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Completa todos los campos", variant: "destructive" })
      return
    }
    if (!CHANGE_PASSWORD_REGEX.test(newPassword)) {
      toast({ title: "La contraseña no cumple los requisitos de seguridad", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" })
      return
    }
    setIsLoading(true)
    const result = await changePassword({ currentPassword, newPassword })
    setIsLoading(false)
    if (result.error) {
      toast({ title: "No se pudo cambiar la contraseña", description: result.error, variant: "destructive" })
      return
    }
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    toast({ title: "Contraseña actualizada correctamente" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>Ingresa tu contraseña actual y elige una nueva.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="cp-current">Contraseña actual</Label>
          <Input id="cp-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-new">Nueva contraseña</Label>
          <Input id="cp-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <PasswordRequirements password={newPassword} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-confirm">Confirmar nueva contraseña</Label>
          <Input id="cp-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
              <XCircle className="size-3 shrink-0" /> Las contraseñas no coinciden
            </p>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
          {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Guest
// ---------------------------------------------------------------------------

function GuestDashboard({ section }: { section?: string }) {
  const { session } = useSession()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null)

  const bookings = EMPTY_BOOKINGS
  const payments = EMPTY_PAYMENTS
  const reviews = EMPTY_REVIEWS

  const filteredBookings = useMemo(
    () => bookings.filter((b) => {
      const q = query.toLowerCase()
      return (b.code.toLowerCase().includes(q) || b.house.toLowerCase().includes(q)) &&
        (status === "all" || b.status.toLowerCase() === status)
    }),
    [bookings, query, status],
  )

  const filteredPayments = useMemo(
    () => payments.filter((p) => {
      return p.bookingCode.toLowerCase().includes(query.toLowerCase()) &&
        (status === "all" || p.status.toLowerCase() === status)
    }),
    [payments, query, status],
  )

  const filteredReviews = useMemo(
    () => reviews.filter((r) => {
      const q = query.toLowerCase()
      return (r.house.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)) &&
        (status === "all" || r.status.toLowerCase() === status)
    }),
    [reviews, query, status],
  )

  if (!section) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const urgentPayments = payments.filter((p) => {
      if (p.status !== "Pending" && p.status !== "Overdue") return false
      const due = new Date(p.dueDate)
      due.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysLeft <= 3
    })

    return (
      <div className="space-y-6">
        <PageHeader
          title="Inicio"
          description="Controla reservas activas, pagos pendientes y proximas fechas de viaje."
        />

        {urgentPayments.map((p) => (
          <Alert key={p.id} className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold">Recordatorio de pago pendiente</AlertTitle>
            <AlertDescription className="space-y-1">
              <p>
                Tienes un pago del 20% de la reserva{" "}
                <span className="font-mono font-bold">{p.bookingCode}</span> con vencimiento el{" "}
                <span className="font-semibold">
                  {new Date(p.dueDate).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                </span>.
              </p>
              <p>
                Monto a pagar: <span className="font-bold">{p.amount}</span>{" "}
                &nbsp;|&nbsp; Número de cuenta:{" "}
                <span className="font-mono font-semibold">{p.accountNumber}</span>
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                onClick={() => setSelectedPayment(p)}
              >
                Ver detalle del aviso
              </Button>
            </AlertDescription>
          </Alert>
        ))}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Reservas activas" value="—" hint="" trend={0} icon={Calendar} />
          <KpiCard label="Reservas pasadas" value="—" hint="" trend={0} icon={Home} />
          <KpiCard label="Pagos pendientes" value={String(payments.filter(p => p.status === "Pending").length)} hint="" trend={0} icon={CircleDollarSign} />
          <KpiCard label="Comentarios" value="—" hint="" trend={0} icon={MessageSquare} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Proximas reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={[]}
              columns={getBookingColumns()}
              emptyTitle="Sin reservas activas"
              emptyDescription="Cuando realices una reserva, aparecera aqui."
              getRowKey={(row) => row.id}
            />
          </CardContent>
        </Card>

        <PaymentNoticeModal
          payment={selectedPayment}
          open={selectedPayment !== null}
          onClose={() => setSelectedPayment(null)}
        />
      </div>
    )
  }

  if (section === "bookings") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mis reservas" description="Historial de reservas activas y pasadas." />
        <TableFilters
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por codigo o casa"
          statusValue={status}
          onStatusChange={setStatus}
          statuses={[
            { value: "all", label: "Todos" },
            { value: "confirmed", label: "Confirmada" },
            { value: "pending", label: "Pendiente" },
            { value: "completed", label: "Completada" },
            { value: "cancelled", label: "Cancelada" },
          ]}
        />
        <DataTable
          data={filteredBookings}
          columns={getBookingColumns()}
          emptyTitle="Sin reservas"
          emptyDescription="Todavia no tienes reservas registradas."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "payments") {
    const paymentColumnsWithAction: DataTableColumn<PaymentRow>[] = [
      ...getPaymentColumns(),
      {
        id: "notice",
        header: "Aviso",
        cell: (row) =>
          row.status !== "Paid" ? (
            <Button size="sm" variant="outline" onClick={() => setSelectedPayment(row)}>
              Ver aviso
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
    ]

    return (
      <div className="space-y-6">
        <PageHeader title="Pagos" description="Estado de pagos de tus reservas." />
        <TableFilters
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por codigo de reserva"
          statusValue={status}
          onStatusChange={setStatus}
          statuses={[
            { value: "all", label: "Todos" },
            { value: "pending", label: "Pendiente" },
            { value: "paid", label: "Pagado" },
            { value: "overdue", label: "Vencido" },
          ]}
        />
        <DataTable
          data={filteredPayments}
          columns={paymentColumnsWithAction}
          emptyTitle="No hay pagos para mostrar"
          emptyDescription="No se encontraron pagos con esos filtros."
          getRowKey={(row) => row.id}
        />
        <PaymentNoticeModal
          payment={selectedPayment}
          open={selectedPayment !== null}
          onClose={() => setSelectedPayment(null)}
        />
      </div>
    )
  }

  if (section === "reviews") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mis comentarios" description="Comentarios enviados sobre alojamientos." />
        <TableFilters
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por casa o comentario"
          statusValue={status}
          onStatusChange={setStatus}
          statuses={[
            { value: "all", label: "Todos" },
            { value: "published", label: "Publicado" },
            { value: "pending", label: "Pendiente" },
          ]}
        />
        <DataTable
          data={filteredReviews}
          columns={getReviewColumns()}
          emptyTitle="Sin comentarios"
          emptyDescription="Aqui apareceran tus comentarios sobre alojamientos."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "search") {
    return (
      <div className="space-y-6">
        <PageHeader title="Buscar alojamiento" description="Consulta detalles y disponibilidad de alojamientos." />
        <GuestAccommodationSearch />
      </div>
    )
  }

  if (section === "profile") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mi perfil" description="Informacion de tu cuenta y seguridad." />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Datos de cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="font-medium">{session?.email ?? "—"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Roles</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {session?.roles.map((role) => (
                    <Badge key={role} variant="outline">{role}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <ChangePasswordCard />
        </div>
      </div>
    )
  }

  return <UnknownSection section={section} />
}

// ---------------------------------------------------------------------------
// Host
// ---------------------------------------------------------------------------

function HostDashboard({ section }: { section?: string }) {
  const { session } = useSession()
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [properties, setProperties] = useState<PropertyRow[]>([])

  const bookings = EMPTY_BOOKINGS
  const notifications = EMPTY_NOTIFICATIONS
  const reviews = EMPTY_HOST_REVIEWS

  const filteredProperties = useMemo(
    () => properties.filter((p) => {
      const q = query.toLowerCase()
      return (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) &&
        (status === "all" || p.status.toLowerCase() === status)
    }),
    [properties, query, status],
  )

  const filteredBookings = useMemo(
    () => bookings.filter((b) => {
      const q = query.toLowerCase()
      return (b.code.toLowerCase().includes(q) || b.house.toLowerCase().includes(q)) &&
        (status === "all" || b.status.toLowerCase() === status)
    }),
    [bookings, query, status],
  )

  const propertyColumns: DataTableColumn<PropertyRow>[] = [
    { id: "code", header: "Codigo", cell: (row) => row.code },
    { id: "name", header: "Casa", cell: (row) => row.name },
    { id: "city", header: "Ciudad", cell: (row) => row.city },
    { id: "occupancy", header: "Ocupacion", cell: (row) => row.occupancy },
    { id: "income", header: "Ingreso estimado", cell: (row) => row.estimatedIncome },
    { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
    {
      id: "actions",
      header: "Accion",
      cell: (row) =>
        row.status === "Active" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">Dar de baja</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Dar de baja {row.name}</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion desactivara el alojamiento. No es posible si tiene reservas futuras activas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (e) => {
                    if (row.accommodationId) {
                      const result = await deactivateAccommodation(row.accommodationId)
                      if (result.error) {
                        e.preventDefault()
                        toast({ title: "No se pudo dar de baja", description: result.error, variant: "destructive" })
                        return
                      }
                    }
                    setProperties((current) =>
                      current.map((p) =>
                        p.id === row.id ? { ...p, status: "Inactive", occupancy: "0%", estimatedIncome: "$0" } : p,
                      ),
                    )
                    toast({ title: "Alojamiento dado de baja correctamente" })
                  }}
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Badge variant="secondary">Inactiva</Badge>
        ),
    },
  ]

  if (!section) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inicio" description="Resumen de la actividad de tus propiedades." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Casas activas" value="—" hint="" trend={0} icon={Home} />
          <KpiCard label="Reservas por confirmar" value="—" hint="" trend={0} icon={Calendar} />
          <KpiCard label="Ingresos estimados" value="—" hint="" trend={0} icon={CircleDollarSign} />
          <KpiCard label="Comentarios recibidos" value="—" hint="" trend={0} icon={MessageSquare} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={notifications}
              columns={[
                { id: "title", header: "Evento", cell: (row) => row.title },
                { id: "detail", header: "Detalle", cell: (row) => row.detail },
                { id: "createdAt", header: "Fecha", cell: (row) => row.createdAt },
                { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
              ]}
              emptyTitle="Sin notificaciones"
              emptyDescription="Aqui apareceran los eventos de reservas y comentarios."
              getRowKey={(row) => row.id}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (section === "properties") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mis propiedades" description="Gestion de alojamientos registrados." />
        <TableFilters
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por codigo o nombre"
          statusValue={status}
          onStatusChange={setStatus}
          statuses={[
            { value: "all", label: "Todos" },
            { value: "active", label: "Activa" },
            { value: "inactive", label: "Inactiva" },
          ]}
        />
        <DataTable
          data={filteredProperties}
          columns={propertyColumns}
          emptyTitle="Sin propiedades"
          emptyDescription="Todavia no tienes propiedades registradas."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "bookings") {
    return (
      <div className="space-y-6">
        <PageHeader title="Reservas" description="Reservas activas y pendientes de tus propiedades." />
        <TableFilters
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por codigo o casa"
          statusValue={status}
          onStatusChange={setStatus}
          statuses={[
            { value: "all", label: "Todos" },
            { value: "confirmed", label: "Confirmada" },
            { value: "pending", label: "Pendiente" },
            { value: "cancelled", label: "Cancelada" },
          ]}
        />
        <DataTable
          data={filteredBookings}
          columns={getBookingColumns()}
          emptyTitle="Sin reservas"
          emptyDescription="Aqui apareceran las reservas de tus propiedades."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "availability") {
    return (
      <div className="space-y-6">
        <PageHeader title="Disponibilidad" description="Consulta y gestiona los periodos bloqueados de tus propiedades." />
        <HostAvailabilityView />
      </div>
    )
  }

  if (section === "packages") {
    return (
      <div className="space-y-6">
        <PageHeader title="Paquetes" description="Crea paquetes de inventario por rango de fechas y valida reglas de bloqueo." />
        <HostPackagesView />
      </div>
    )
  }

  if (section === "reviews") {
    return (
      <div className="space-y-6">
        <PageHeader title="Comentarios recibidos" description="Valoraciones de huespedes sobre tus propiedades." />
        <DataTable
          data={reviews}
          columns={[
            { id: "guest", header: "Huesped", cell: (row) => row.guest },
            { id: "house", header: "Propiedad", cell: (row) => row.house },
            { id: "rating", header: "Calificacion", cell: (row) => `${row.rating}/5` },
            { id: "comment", header: "Comentario", cell: (row) => row.comment, className: "max-w-[320px] truncate" },
            { id: "createdAt", header: "Fecha", cell: (row) => row.createdAt },
          ]}
          emptyTitle="Sin comentarios"
          emptyDescription="Aqui apareceran los comentarios de tus huespedes."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "notifications") {
    return (
      <div className="space-y-6">
        <PageHeader title="Notificaciones" description="Eventos de reservas, cancelaciones y comentarios." />
        <DataTable
          data={notifications}
          columns={[
            { id: "title", header: "Evento", cell: (row) => row.title },
            { id: "detail", header: "Detalle", cell: (row) => row.detail },
            { id: "createdAt", header: "Fecha", cell: (row) => row.createdAt },
            { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
          ]}
          emptyTitle="Sin notificaciones"
          emptyDescription="Aqui apareceran los eventos de tus propiedades."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "profile") {
    return (
      <div className="space-y-6">
        <PageHeader title="Mi perfil" description="Informacion de tu cuenta y seguridad." />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Datos de cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="font-medium">{session?.email ?? "—"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Roles</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {session?.roles.map((role) => (
                    <Badge key={role} variant="outline">{role}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <ChangePasswordCard />
        </div>
      </div>
    )
  }

  return <UnknownSection section={section} />
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

function AdminDashboard({ section }: { section?: string }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")

  const users = EMPTY_USERS
  const alerts: AlertRow[] = []
  const audit: AuditRow[] = []

  const filteredUsers = useMemo(
    () => users.filter((u) => {
      const q = query.toLowerCase()
      return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (status === "all" || u.status.toLowerCase() === status)
    }),
    [users, query, status],
  )

  if (!section) {
    return (
      <div className="space-y-6">
        <PageHeader title="Panel de administracion" description="Vision global de usuarios, propiedades y reservas." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Usuarios totales" value="—" hint="" trend={0} icon={Users} />
          <KpiCard label="Propietarios" value="—" hint="" trend={0} icon={Home} />
          <KpiCard label="Reservas abiertas" value="—" hint="" trend={0} icon={Calendar} />
          <KpiCard label="Alertas criticas" value="—" hint="" trend={0} icon={Shield} />
        </div>
      </div>
    )
  }

  if (section === "users" || section === "hosts" || section === "properties" || section === "bookings") {
    const titleBySection: Record<string, string> = {
      users: "Usuarios",
      hosts: "Propietarios",
      properties: "Propiedades",
      bookings: "Reservas",
    }

    return (
      <div className="space-y-6">
        <PageHeader title={titleBySection[section]} description="Listado global filtrable." />
        <TableFilters
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar por nombre o email"
          statusValue={status}
          onStatusChange={setStatus}
          statuses={[
            { value: "all", label: "Todos" },
            { value: "active", label: "Activo" },
          ]}
        />
        <DataTable
          data={filteredUsers}
          columns={[
            { id: "name", header: "Nombre", cell: (row) => row.name },
            { id: "email", header: "Email", cell: (row) => row.email },
            { id: "role", header: "Rol", cell: (row) => <Badge variant="outline">{row.role}</Badge> },
            { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
          ]}
          emptyTitle="Sin registros"
          emptyDescription="No hay datos disponibles."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "alerts") {
    return (
      <div className="space-y-6">
        <PageHeader title="Alertas" description="Monitoreo de seguridad y eventos de riesgo." />
        <DataTable
          data={alerts}
          columns={[
            { id: "title", header: "Alerta", cell: (row) => row.title },
            { id: "detail", header: "Detalle", cell: (row) => row.detail },
            {
              id: "severity",
              header: "Severidad",
              cell: (row) => (
                <Badge variant={row.severity === "High" ? "destructive" : "outline"}>{row.severity}</Badge>
              ),
            },
            { id: "createdAt", header: "Fecha", cell: (row) => row.createdAt },
          ]}
          emptyTitle="Sin alertas activas"
          emptyDescription="No hay alertas registradas en este momento."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "audit") {
    return (
      <div className="space-y-6">
        <PageHeader title="Auditoria" description="Registro de acciones criticas del sistema." />
        <DataTable
          data={audit}
          columns={[
            { id: "actor", header: "Actor", cell: (row) => row.actor },
            { id: "action", header: "Accion", cell: (row) => row.action },
            { id: "target", header: "Objetivo", cell: (row) => row.target },
            { id: "createdAt", header: "Fecha", cell: (row) => row.createdAt },
          ]}
          emptyTitle="Sin eventos"
          emptyDescription="No hay eventos de auditoria para mostrar."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  return <UnknownSection section={section} />
}

function UnknownSection({ section }: { section?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seccion no encontrada</CardTitle>
        <CardDescription>
          La seccion <span className="font-medium">{section}</span> no existe.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
