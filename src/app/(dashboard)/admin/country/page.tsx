"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface TMDBCountries {
  iso_3166_1: string
  english_name: string
  native_name: string
}

interface OriginalCountry {
  id: string
  key: string
  name: string
}

export default function CountryAdminPage() {
  const [countries, setCountries] = useState<OriginalCountry[]>([])
  const [tmdbCountries, setTmdbCountries] = useState<TMDBCountries[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const fetchCountries = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/countries")
      if (response.ok) {
        const data = await response.json()
        setCountries(data)
      }
    } catch (error) {
      console.error("Failed to fetch countries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTmdbCountries = async () => {
    setIsFetching(true)
    try {
      const response = await fetch("https://api.themoviedb.org/3/configuration/countries?api_key=5c4cb1dcd77beccb40d5f6d032a1116d")
      if (response.ok) {
        const data = await response.json()
        setTmdbCountries(data)
      }
    } catch (error) {
      console.error("Failed to fetch TMDB countries:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const addCountry = async (tmdbCountry: TMDBCountries) => {
    try {
      const response = await fetch("/api/admin/countries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: tmdbCountry.iso_3166_1,
          key: tmdbCountry.english_name.toLowerCase().replace(/\s+/g, "-"),
          name: tmdbCountry.english_name,
        }),
      })

      if (response.ok) {
        await fetchCountries()
        setTmdbCountries(prev => prev.filter(c => c.iso_3166_1 !== tmdbCountry.iso_3166_1))
      }
    } catch (error) {
      console.error("Failed to add country:", error)
    }
  }

  const updateCountries = async () => {
    if (tmdbCountries.length === 0) {
      await fetchTmdbCountries()
    }
    
    for (const tmdbCountry of tmdbCountries) {
      const exists = countries.some(c => c.id === tmdbCountry.iso_3166_1)
      if (!exists) {
        await addCountry(tmdbCountry)
      }
    }
  }

  useEffect(() => {
    fetchCountries()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Country Management</h1>
        <div className="flex gap-2">
          <Button onClick={fetchTmdbCountries} disabled={isFetching}>
            Fetch Countries
          </Button>
          <Button onClick={updateCountries} disabled={isFetching || tmdbCountries.length === 0}>
            Update Database
          </Button>
          <Button onClick={fetchCountries} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TMDB Countries */}
        <Card>
          <CardHeader>
            <CardTitle>TMDB Countries</CardTitle>
            <CardDescription>Countries available from TMDB API</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {tmdbCountries.map((country) => {
                  const exists = countries.some(c => c.id === country.iso_3166_1)
                  return (
                    <div key={country.iso_3166_1} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{country.english_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {country.iso_3166_1} • {country.native_name}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addCountry(country)}
                        disabled={exists}
                      >
                        {exists ? "Added" : "Add"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Database Countries */}
        <Card>
          <CardHeader>
            <CardTitle>Database Countries</CardTitle>
            <CardDescription>Countries in your database</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {countries.map((country) => (
                  <div key={country.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{country.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {country.id} • {country.key}
                      </p>
                    </div>
                    <Badge variant="secondary">In Database</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}