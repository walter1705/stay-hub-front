"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TableFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  statusValue: string
  onStatusChange: (value: string) => void
  statuses: Array<{ value: string; label: string }>
}

export function TableFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar",
  statusValue,
  onStatusChange,
  statuses,
}: TableFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center">
      <Input
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        className="md:max-w-xs"
      />
      <Select value={statusValue} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-56">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
