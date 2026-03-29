"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { getAccommodationById, type AccommodationDetailResponse } from "@/lib/api/accommodations"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

export function GuestAccommodationSearch() {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AccommodationDetailResponse | null>(null)

  const handleSearch = async () => {
    const value = Number(query)
    if (!Number.isInteger(value) || value <= 0) {
      toast({
        title: "Codigo invalido",
        description: "Con el contrato actual se consulta por id numerico de alojamiento.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const response = await getAccommodationById(value)
    setIsLoading(false)

    if (response.error) {
      setResult(null)
      toast({ title: "No se pudo obtener la casa", description: response.error, variant: "destructive" })
      return
    }

    setResult(response.data ?? null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Busqueda de casa por codigo</CardTitle>
          <CardDescription>
            Endpoint disponible hoy: consulta por id de alojamiento. Cuando se publique busqueda por codigo, el campo se adaptara sin cambiar UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:max-w-md">
            <Label htmlFor="search-code">Codigo / ID</Label>
            <Input
              id="search-code"
              placeholder="Ej. 1"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button onClick={handleSearch} disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 size-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>{result.title}</CardTitle>
            <CardDescription>{result.city} - {result.locationDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Capacidad: {result.capacity}</Badge>
              <Badge variant="outline">Precio noche: {result.pricePerNight}</Badge>
              <Badge variant={result.available ? "default" : "secondary"}>{result.available ? "Disponible" : "No disponible"}</Badge>
            </div>
            <p className="text-muted-foreground">{result.description}</p>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Host</p>
                <p className="font-medium">{result.host.fullName}</p>
                <p className="text-muted-foreground">{result.host.email}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Imagenes</p>
                <p>{result.images.length} registradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
