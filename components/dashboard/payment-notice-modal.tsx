"use client"

import { AlertTriangle, BanknoteIcon, Calendar, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { PaymentRow } from "@/lib/dashboard/mock-data"

interface PaymentNoticeModalProps {
  payment: PaymentRow | null
  open: boolean
  onClose: () => void
}

function getDaysUntilDue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function PaymentNoticeModal({ payment, open, onClose }: PaymentNoticeModalProps) {
  if (!payment) return null

  const daysLeft = getDaysUntilDue(payment.dueDate)
  const isUrgent = daysLeft <= 3 && daysLeft >= 0
  const isOverdue = daysLeft < 0

  const dueDateFormatted = new Date(payment.dueDate).toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <BanknoteIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Aviso de pago del 20%</DialogTitle>
              <DialogDescription>
                Reserva <span className="font-semibold text-foreground">{payment.bookingCode}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status urgency banner */}
          {isOverdue && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700 font-medium">
                El plazo de pago ha vencido. Comunícate con el propietario para regularizar tu reserva.
              </p>
            </div>
          )}
          {isUrgent && !isOverdue && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-700 font-medium">
                ¡Quedan <span className="font-bold">{daysLeft} día{daysLeft !== 1 ? "s" : ""}</span> para realizar el pago. ¡No pierdas tu reserva!
              </p>
            </div>
          )}

          <Separator />

          {/* Payment details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BanknoteIcon className="h-4 w-4" />
                <span>Importe a pagar (20%)</span>
              </div>
              <span className="font-bold text-lg text-foreground">{payment.amount}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>Número de cuenta</span>
              </div>
              <span className="font-mono font-semibold text-foreground">{payment.accountNumber}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Fecha límite</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold text-foreground capitalize">{dueDateFormatted}</span>
                {!isOverdue && (
                  <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-xs">
                    {daysLeft === 0 ? "Vence hoy" : `${daysLeft} día${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`}
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">Vencido</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Instrucciones:</span> Realiza la transferencia bancaria al número de cuenta indicado por el monto exacto. Incluye el número de reserva <span className="font-mono font-semibold">{payment.bookingCode}</span> en el concepto del pago. El valor total de la reserva es <span className="font-semibold">{payment.totalAmount}</span>.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
