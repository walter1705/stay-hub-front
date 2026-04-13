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

export interface AlertRow {
  id: string
  title: string
  detail: string
  severity: "High" | "Medium" | "Low"
  createdAt: string
}

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
