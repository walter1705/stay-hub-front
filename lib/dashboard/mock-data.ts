export interface BookingRow {
  id: string
  code: string
  house: string
  city: string
  checkIn: string
  checkOut: string
  status: "Confirmed" | "Pending" | "Cancelled" | "Completed"
  amount: string
}

export interface PaymentRow {
  id: string
  bookingCode: string
  dueDate: string
  amount: string
  status: "Pending" | "Paid" | "Overdue"
  method: string
}

export interface ReviewRow {
  id: string
  house: string
  rating: number
  comment: string
  createdAt: string
  status: "Published" | "Pending"
}

export interface PropertyRow {
  id: string
  code: string
  name: string
  city: string
  status: "Active" | "Inactive"
  occupancy: string
  estimatedIncome: string
}

export interface NotificationRow {
  id: string
  title: string
  detail: string
  createdAt: string
  status: "Open" | "Read"
}

export const guestBookings: BookingRow[] = [
  {
    id: "b1",
    code: "STH-2031",
    house: "Casa Roble Alto",
    city: "Villa de Leyva",
    checkIn: "2026-04-10",
    checkOut: "2026-04-14",
    status: "Confirmed",
    amount: "$1.800.000",
  },
  {
    id: "b2",
    code: "STH-1988",
    house: "Finca Loma Serena",
    city: "Guatape",
    checkIn: "2026-03-01",
    checkOut: "2026-03-04",
    status: "Completed",
    amount: "$980.000",
  },
  {
    id: "b3",
    code: "STH-2100",
    house: "Casona Agua Clara",
    city: "Barichara",
    checkIn: "2026-05-02",
    checkOut: "2026-05-05",
    status: "Pending",
    amount: "$1.250.000",
  },
]

export const guestPayments: PaymentRow[] = [
  {
    id: "p1",
    bookingCode: "STH-2031",
    dueDate: "2026-04-05",
    amount: "$360.000",
    status: "Pending",
    method: "Transferencia",
  },
  {
    id: "p2",
    bookingCode: "STH-1988",
    dueDate: "2026-02-20",
    amount: "$196.000",
    status: "Paid",
    method: "Transferencia",
  },
]

export const guestReviews: ReviewRow[] = [
  {
    id: "r1",
    house: "Finca Loma Serena",
    rating: 5,
    comment: "Excelente atencion y habitaciones impecables.",
    createdAt: "2026-03-05",
    status: "Published",
  },
  {
    id: "r2",
    house: "Casa Roble Alto",
    rating: 4,
    comment: "Buena experiencia, sugiero mas informacion de check-in.",
    createdAt: "2026-04-15",
    status: "Pending",
  },
]

export const hostProperties: PropertyRow[] = [
  {
    id: "h1",
    code: "CASA-001",
    name: "Casa Roble Alto",
    city: "Villa de Leyva",
    status: "Active",
    occupancy: "72%",
    estimatedIncome: "$8.900.000",
  },
  {
    id: "h2",
    code: "CASA-002",
    name: "Casona Agua Clara",
    city: "Barichara",
    status: "Inactive",
    occupancy: "0%",
    estimatedIncome: "$0",
  },
]

export const hostBookings: BookingRow[] = [
  {
    id: "hb1",
    code: "STH-2031",
    house: "Casa Roble Alto",
    city: "Villa de Leyva",
    checkIn: "2026-04-10",
    checkOut: "2026-04-14",
    status: "Confirmed",
    amount: "$1.800.000",
  },
  {
    id: "hb2",
    code: "STH-2022",
    house: "Casa Roble Alto",
    city: "Villa de Leyva",
    checkIn: "2026-04-20",
    checkOut: "2026-04-22",
    status: "Pending",
    amount: "$740.000",
  },
]

export const hostReviews = [
  {
    id: "hr1",
    guest: "Ana Torres",
    house: "Casa Roble Alto",
    rating: 5,
    comment: "Muy recomendable para familias.",
    createdAt: "2026-04-16",
  },
  {
    id: "hr2",
    guest: "Luis Mena",
    house: "Casa Roble Alto",
    rating: 4,
    comment: "Excelente ubicacion, mejorar wifi.",
    createdAt: "2026-04-05",
  },
]

export const hostNotifications: NotificationRow[] = [
  {
    id: "n1",
    title: "Nueva reserva",
    detail: "Reserva STH-2031 confirmada para Casa Roble Alto.",
    createdAt: "Hace 1 hora",
    status: "Open",
  },
  {
    id: "n2",
    title: "Comentario recibido",
    detail: "Ana Torres publico una nueva resena.",
    createdAt: "Hace 4 horas",
    status: "Read",
  },
]

export const adminUsers = [
  { id: "u1", name: "Ana Torres", email: "ana@example.com", role: "GUEST", status: "Active" },
  { id: "u2", name: "Walter Cardenas", email: "host@example.com", role: "HOST", status: "Active" },
  { id: "u3", name: "Camila Ops", email: "admin@example.com", role: "ADMIN", status: "Active" },
]

export const adminAlerts = [
  {
    id: "a1",
    title: "Intento de acceso denegado",
    detail: "Usuario guest intento abrir /dashboard/admin/users",
    severity: "High",
    createdAt: "2026-03-28 08:45",
  },
  {
    id: "a2",
    title: "Pendiente de pago 20%",
    detail: "5 reservas con recordatorio pendiente en ventana de 3 dias",
    severity: "Medium",
    createdAt: "2026-03-28 07:30",
  },
]

export const adminAudit = [
  {
    id: "ev1",
    actor: "host@example.com",
    action: "HOUSE_DEACTIVATED",
    target: "CASA-002",
    createdAt: "2026-03-27 16:10",
  },
  {
    id: "ev2",
    actor: "guest@example.com",
    action: "LOGIN_SUCCESS",
    target: "Sesion JWT",
    createdAt: "2026-03-27 08:05",
  },
]
