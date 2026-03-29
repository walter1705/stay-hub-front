import { Badge } from "@/components/ui/badge"

const variantByStatus: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  confirmed: "default",
  paid: "default",
  completed: "secondary",
  pending: "outline",
  scheduled: "outline",
  blocked: "destructive",
  cancelled: "destructive",
  overdue: "destructive",
  inactive: "secondary",
  open: "outline",
}

export function StatusBadge({ value }: { value: string }) {
  const key = value.toLowerCase()
  return <Badge variant={variantByStatus[key] ?? "outline"}>{value}</Badge>
}
