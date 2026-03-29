'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { cn } from '@/lib/utils'

/** Progress bar that animates from 100% to 0% over the toast duration */
function ToastProgress({ duration, createdAt }: { duration: number; createdAt: number }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - createdAt
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      
      if (remaining <= 0) clearInterval(interval)
    }, 50)

    return () => clearInterval(interval)
  }, [duration, createdAt])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden rounded-b-md">
      <div
        className={cn(
          "h-full bg-foreground/50 transition-all duration-75 ease-linear",
          "group-[.destructive]:bg-destructive-foreground/50"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, createdAt, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            {duration && createdAt && (
              <ToastProgress duration={duration} createdAt={createdAt} />
            )}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
