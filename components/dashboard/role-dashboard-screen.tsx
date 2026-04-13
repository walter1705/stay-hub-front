"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Calendar, CircleDollarSign, Home, MessageSquare, Shield, Users } from "lucide-react"
import { roleSegmentToAppRole, type DashboardRoleSegment, isDashboardRoleSegment } from "@/lib/dashboard/roles"
import {
  adminAlerts,
  adminAudit,
  adminUsers,
  guestBookings,
  guestPayments,
  guestReviews,
  hostBookings,
  hostNotifications,
  hostProperties,
  hostReviews,
  type BookingRow,
  type PaymentRow,
  type PropertyRow,
  type ReviewRow,
} from "@/lib/dashboard/mock-data"
import { useToast } from "@/hooks/use-toast"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { GuestAccommodationSearch } from "@/components/dashboard/guest-accommodation-search"
import { HostInventoryManager } from "@/components/dashboard/host-inventory-manager"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { PageHeader } from "@/components/dashboard/page-header"
import { PaymentNoticeModal } from "@/components/dashboard/payment-notice-modal"
import { RoleRouteGuard } from "@/components/dashboard/role-route-guard"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { TableFilters } from "@/components/dashboard/table-filters"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
    { id: "amount", header: "Monto", cell: (row) => row.amount },
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

export function RoleDashboardScreen({ roleSegment, section }: RoleDashboardScreenProps) {
  if (!isDashboardRoleSegment(roleSegment)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ruta no encontrada</CardTitle>
          <CardDescription>El rol solicitado no existe en la arquitectura del dashboard.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const requiredRole = roleSegmentToAppRole(roleSegment)

  return <RoleRouteGuard requiredRole={requiredRole}>{renderRoleSection(roleSegment, section)}</RoleRouteGuard>
}

function renderRoleSection(role: DashboardRoleSegment, section?: string) {
  if (role === "guest") {
    return <GuestDashboard section={section} />
  }

  if (role === "host") {
    return <HostDashboard section={section} />
  }

  return <AdminDashboard section={section} />
}

function GuestDashboard({ section }: { section?: string }) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<(typeof guestPayments)[0] | null>(null)

  const filteredBookings = useMemo(() => {
    return guestBookings.filter((booking) => {
      const matchesQuery = booking.code.toLowerCase().includes(query.toLowerCase()) || booking.house.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || booking.status.toLowerCase() === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  const filteredPayments = useMemo(() => {
    return guestPayments.filter((payment) => {
      const matchesQuery = payment.bookingCode.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || payment.status.toLowerCase() === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  const filteredReviews = useMemo(() => {
    return guestReviews.filter((review) => {
      const matchesQuery = review.house.toLowerCase().includes(query.toLowerCase()) || review.comment.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || review.status.toLowerCase() === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  if (!section) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const urgentPayments = guestPayments.filter((p) => {
      if (p.status !== "Pending" && p.status !== "Overdue") return false
      const due = new Date(p.dueDate)
      due.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysLeft <= 3
    })

    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Cliente"
          description="Controla reservas activas, pagos pendientes y proximas fechas de viaje en una vista unificada."
        />

        {urgentPayments.map((p) => (
          <Alert key={p.id} className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="font-semibold">Recordatorio de pago pendiente</AlertTitle>
            <AlertDescription className="space-y-1">
              <p>
                Tienes un pago del 20% de la reserva <span className="font-mono font-bold">{p.bookingCode}</span> con vencimiento el <span className="font-semibold">{new Date(p.dueDate).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>.
              </p>
              <p>
                Monto a pagar: <span className="font-bold">{p.amount}</span> &nbsp;|&nbsp; Número de cuenta: <span className="font-mono font-semibold">{p.accountNumber}</span>
              </p>
              <Button size="sm" variant="outline" className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100" onClick={() => setSelectedPayment(p)}>
                Ver detalle del aviso
              </Button>
            </AlertDescription>
          </Alert>
        ))}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Reservas activas" value="2" hint="vs mes anterior" trend={12} icon={Calendar} />
          <KpiCard label="Reservas pasadas" value="9" hint="historico" trend={5} icon={Home} />
          <KpiCard label="Pagos pendientes" value="1" hint="recordatorio 20%" trend={-8} icon={CircleDollarSign} />
          <KpiCard label="Comentarios" value="2" hint="ultimo trimestre" trend={3} icon={MessageSquare} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Proximas fechas</CardTitle>
            <CardDescription>Revisa tu siguiente check-in y el estado del pago inicial.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={guestBookings.filter((booking) => booking.status !== "Completed")}
              columns={getBookingColumns()}
              emptyTitle="Sin reservas activas"
              emptyDescription="Cuando tengas una nueva reserva, aparecera aqui."
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
        <PageHeader
          title="Reservas cliente"
          description="Listado de reservas activas y pasadas con filtros por estado y codigo."
        />
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
          emptyTitle="No hay reservas"
          emptyDescription="Ajusta los filtros para ver resultados."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "payments") {
    const paymentColumnsWithAction = [
      ...getPaymentColumns(),
      {
        id: "notice",
        header: "Aviso",
        cell: (row: (typeof guestPayments)[0]) =>
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
        <PageHeader
          title="Pagos y recordatorios"
          description="Gestiona pagos pendientes del 20% y estado de transferencias."
        />
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
        <PageHeader
          title="Historial de comentarios"
          description="Consulta comentarios enviados por casa y su estado de publicacion."
        />
        <TableFilters
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Buscar comentario o casa"
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
          emptyDescription="Todavia no hay comentarios para mostrar."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "search") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Buscar casa"
          description="Flujo funcional con OpenAPI actual: detalle de casa por id autenticado con JWT."
        />
        <GuestAccommodationSearch />
      </div>
    )
  }

  if (section === "profile") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Perfil y seguridad"
          description="Gestiona datos personales y deja listo el flujo de cambio de contrasena para conectar endpoint."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Datos sincronizados al iniciar sesion con JWT.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="font-medium">Nombre:</span> Usuario StayHub</p>
              <p><span className="font-medium">Email:</span> user@stayhub.app</p>
              <p><span className="font-medium">Telefono:</span> +57 3000000000</p>
              <p><span className="font-medium">Roles:</span> GUEST</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cambio de contrasena</CardTitle>
              <CardDescription>Validado en frontend, pendiente endpoint backend en OpenAPI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contrasena actual</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contrasena</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contrasena</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              <Button
                onClick={() => {
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    toast({ title: "Completa todos los campos", variant: "destructive" })
                    return
                  }
                  if (newPassword !== confirmPassword) {
                    toast({ title: "Las contrasenas no coinciden", variant: "destructive" })
                    return
                  }
                  toast({
                    title: "Listo para backend",
                    description: "Formulario validado. Falta endpoint de cambio de contrasena para completar el flujo.",
                  })
                }}
                className="w-full"
              >
                Guardar nueva contrasena
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <UnknownSection section={section} />
}

function HostDashboard({ section }: { section?: string }) {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [properties, setProperties] = useState(hostProperties)

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesQuery = property.name.toLowerCase().includes(query.toLowerCase()) || property.code.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || property.status.toLowerCase() === status
      return matchesQuery && matchesStatus
    })
  }, [properties, query, status])

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
              <Button size="sm" variant="outline">
                Dar de baja
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Dar de baja {row.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion cambiara el estado a inactivo y dejara lista la llamada cuando exista endpoint backend.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const hasFutureBookings = hostBookings.some((booking) => {
                      const isSameHouse = booking.house === row.name;
                      const isActiveBooking = booking.status === "Confirmed" || booking.status === "Pending";
                      const bookingDate = new Date(booking.checkIn);
                      const isFuture = bookingDate >= today;
                      
                      return isSameHouse && isActiveBooking && isFuture;
                    });

                    if (hasFutureBookings) {
                      e.preventDefault();
                      toast({
                        title: "Accion denegada",
                        description: "No se puede dar de baja una casa con reservas futuras.",
                        variant: "destructive",
                      });
                      return;
                    }

                    setProperties((current) =>
                      current.map((property) =>
                        property.id === row.id ? { ...property, status: "Inactive", occupancy: "0%", estimatedIncome: "$0" } : property,
                      ),
                    )
                    toast({
                      title: "Casa marcada como inactiva",
                      description: "Cambio aplicado en UI. Se conectara al endpoint de baja cuando se publique en OpenAPI.",
                    })
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

  const filteredHostBookings = useMemo(() => {
    return hostBookings.filter((booking) => {
      const matchesQuery = booking.code.toLowerCase().includes(query.toLowerCase()) || booking.house.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || booking.status.toLowerCase() === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  if (!section) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Propietario"
          description="Administra casas, reservas, comentarios y disponibilidad por tipo de inventario."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Casas activas"
            value={String(properties.filter((property) => property.status === "Active").length)}
            hint="portafolio"
            trend={9}
            icon={Home}
          />
          <KpiCard label="Reservas por confirmar" value="2" hint="proximas 72h" trend={6} icon={Calendar} />
          <KpiCard label="Ingresos estimados" value="$8.9M" hint="mes actual" trend={14} icon={CircleDollarSign} />
          <KpiCard label="Comentarios recibidos" value="2" hint="ultima semana" trend={2} icon={MessageSquare} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>Resumen de eventos de reservas, cancelaciones y comentarios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hostNotifications.map((notification) => (
              <div key={notification.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{notification.title}</p>
                  <StatusBadge value={notification.status} />
                </div>
                <p className="text-sm text-muted-foreground">{notification.detail}</p>
                <p className="mt-1 text-xs text-muted-foreground">{notification.createdAt}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (section === "properties") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Casas del propietario"
          description="Gestion de casas activas/inactivas y baja de casa lista para integracion backend."
        />
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
          emptyTitle="Sin casas"
          emptyDescription="Cambia filtros o agrega una nueva casa."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "bookings") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reservas por casa"
          description="Monitorea reservas activas y pendientes por propiedad."
        />
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
          data={filteredHostBookings}
          columns={getBookingColumns()}
          emptyTitle="Sin reservas"
          emptyDescription="No se encontraron reservas para los filtros aplicados."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "availability") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Disponibilidad"
          description="Flujo principal de inventario con selector obligatorio: Solo Casa Entera, Solo Habitaciones o Ambas."
        />
        <HostInventoryManager mode="availability" />
      </div>
    )
  }

  if (section === "packages") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Paquetes por fecha"
          description="Crea paquetes por rango y valida bloqueos cruzados antes de persistir en backend."
        />
        <HostInventoryManager mode="packages" />
      </div>
    )
  }

  if (section === "reviews") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Comentarios recibidos"
          description="Seguimiento de comentarios de clientes por casa."
        />
        <Card>
          <CardContent className="space-y-3 pt-6">
            {hostReviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{review.guest}</p>
                  <Badge variant="outline">{review.rating}/5</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{review.house}</p>
                <p className="mt-2 text-sm">{review.comment}</p>
                <p className="mt-2 text-xs text-muted-foreground">{review.createdAt}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (section === "notifications") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Notificaciones"
          description="Eventos de reservas, cancelaciones y comentarios listos para integrar endpoint real."
        />
        <DataTable
          data={hostNotifications}
          columns={[
            { id: "title", header: "Evento", cell: (row) => row.title },
            { id: "detail", header: "Detalle", cell: (row) => row.detail },
            { id: "createdAt", header: "Fecha", cell: (row) => row.createdAt },
            { id: "status", header: "Estado", cell: (row) => <StatusBadge value={row.status} /> },
          ]}
          emptyTitle="Sin notificaciones"
          emptyDescription="Aun no hay eventos para mostrar."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "profile") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Perfil propietario"
          description="Configuracion de cuenta y canales de contacto para notificaciones."
        />
        <Card>
          <CardHeader>
            <CardTitle>Datos de cuenta</CardTitle>
            <CardDescription>Modulo listo para conectar cambios al endpoint de perfil en sprint siguiente.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">Nombre comercial</p>
              <p className="text-muted-foreground">Walter Host</p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground">host@stayhub.app</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <UnknownSection section={section} />
}

function AdminDashboard({ section }: { section?: string }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((user) => {
      const matchesQuery = user.name.toLowerCase().includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || user.status.toLowerCase() === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  if (!section) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Administrador"
          description="Vision global de usuarios, casas, reservas, alertas y trazabilidad de auditoria."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Usuarios totales" value="1.245" hint="activos" trend={5} icon={Users} />
          <KpiCard label="Propietarios" value="148" hint="verificados" trend={4} icon={Home} />
          <KpiCard label="Reservas abiertas" value="312" hint="global" trend={7} icon={Calendar} />
          <KpiCard label="Alertas criticas" value="2" hint="requieren revision" trend={-12} icon={Shield} />
        </div>

        <Alert>
          <AlertTitle>Control y monitoreo habilitado</AlertTitle>
          <AlertDescription>
            El panel admin se comporta como existente para UI/UX. Al publicarse endpoints admin en OpenAPI, se conectan tablas y acciones sin reestructurar rutas.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (section === "users" || section === "hosts" || section === "properties" || section === "bookings") {
    const titleBySection: Record<string, string> = {
      users: "Usuarios",
      hosts: "Propietarios",
      properties: "Casas",
      bookings: "Reservas",
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title={titleBySection[section]}
          description="Vista global paginada y filtrable para operacion y soporte."
        />
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
          emptyDescription="No hay datos para los filtros seleccionados."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "alerts") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Alertas"
          description="Monitoreo de seguridad, pagos y eventos de riesgo."
        />
        <DataTable
          data={adminAlerts}
          columns={[
            { id: "title", header: "Alerta", cell: (row) => row.title },
            { id: "detail", header: "Detalle", cell: (row) => row.detail },
            { id: "severity", header: "Severidad", cell: (row) => <Badge variant={row.severity === "High" ? "destructive" : "outline"}>{row.severity}</Badge> },
            { id: "createdAt", header: "Fecha", cell: (row) => row.createdAt },
          ]}
          emptyTitle="Sin alertas"
          emptyDescription="No hay alertas activas en este momento."
          getRowKey={(row) => row.id}
        />
      </div>
    )
  }

  if (section === "audit") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Auditoria basica"
          description="Registro de acciones criticas y accesos para trazabilidad minima."
        />
        <DataTable
          data={adminAudit}
          columns={[
            { id: "actor", header: "Actor", cell: (row) => row.actor },
            { id: "action", header: "Accion", cell: (row) => row.action },
            { id: "target", header: "Objetivo", cell: (row) => row.target },
            { id: "createdAt", header: "Fecha", cell: (row) => row.createdAt },
          ]}
          emptyTitle="Sin eventos"
          emptyDescription="Aun no hay eventos de auditoria para este rango."
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
        <CardTitle>Seccion no disponible</CardTitle>
        <CardDescription>
          La seccion <span className="font-medium">{section}</span> no existe en la arquitectura actual del dashboard.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
