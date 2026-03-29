import { Spinner } from "@/components/ui/spinner"

export function FullscreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        {label}
      </div>
    </div>
  )
}
