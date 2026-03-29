import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  trend?: number
  icon: LucideIcon
}

export function KpiCard({ label, value, hint, trend, icon: Icon }: KpiCardProps) {
  const TrendIcon = trend === undefined ? Minus : trend >= 0 ? ArrowUpRight : ArrowDownRight
  const trendLabel = trend === undefined ? "Sin variacion" : `${Math.abs(trend)}%`

  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="inline-flex size-9 items-center justify-center rounded-lg border bg-muted/40">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendIcon
            className={cn(
              "size-3.5",
              trend === undefined ? "text-muted-foreground" : trend >= 0 ? "text-foreground" : "text-destructive",
            )}
          />
          {trendLabel}
          {hint ? ` - ${hint}` : ""}
        </p>
      </CardContent>
    </Card>
  )
}
