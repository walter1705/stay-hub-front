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
  totalAmount: string
  accountNumber: string
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
  /** Numeric backend ID for API calls. Present only when the property originates from the real backend. */
  accommodationId?: number
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

export interface AdminUserRow {
  id: string
  name: string
  email: string
  role: string
  status: string
}

<<<<<<< HEAD
export interface AlertRow {
  id: string
  title: string
  detail: string
  severity: "High" | "Medium" | "Low"
  createdAt: string
}
=======
export const guestPayments: PaymentRow[] = [
  {
    id: "p1",
    bookingCode: "STH-2031",
    dueDate: "2026-04-15",
    amount: "$360.000",
    totalAmount: "$1.800.000",
    accountNumber: "001-123456-78",
    status: "Pending",
    method: "Transferencia",
  },
  {
    id: "p2",
    bookingCode: "STH-1988",
    dueDate: "2026-02-20",
    amount: "$196.000",
    totalAmount: "$980.000",
    accountNumber: "001-123456-78",
    status: "Paid",
    method: "Transferencia",
  },
]
>>>>>>> b178c72619a73b01c873d7163a941fd0eba81070

export interface AuditRow {
  id: string
  actor: string
  action: string
  target: string
  createdAt: string
}

export interface HostReviewRow {
  id: string
  guest: string
  house: string
  rating: number
  comment: string
  createdAt: string
}
