"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TMDBGenre {
  id: number
  name: string
}

interface Genre {
  id: number
  type: string
  key: string
  name: string
}

export default function GenreAdminPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [movieGenres, setMovieGenres] = useState<TMDBGenre[]>([])
  const [tvGenres, setTvGenres] = useState<TMDBGenre[]>([])
  const [selectedType, setSelectedType] = useState<"movie" | "tv">("movie")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const fetchGenres = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/genres")
      if (response.ok) {
        const data = await response.json()
        setGenres(data)
      }
    } catch (error) {
      console.error("Failed to fetch genres:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTmdbGenres = async () => {
    setIsFetching(true)
    try {
      const [movieRes, tvRes] = await Promise.all([
        fetch("https://api.themoviedb.org/3/genre/movie/list?api_key=5c4cb1dcd77beccb40d5f6d032a1116d"),
        fetch("https://api.themoviedb.org/3/genre/tv/list?api_key=5c4cb1dcd77beccb40d5f6d032a1116d")
      ])

      if (movieRes.ok && tvRes.ok) {
        const [movieData, tvData] = await Promise.all([
          movieRes.json(),
          tvRes.json()
        ])
        setMovieGenres(movieData.genres)
        setTvGenres(tvData.genres)
      }
    } catch (error) {
      console.error("Failed to fetch TMDB genres:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const addGenre = async (genre: TMDBGenre, type: "movie" | "tv") => {
    try {
      const response = await fetch("/api/admin/genres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: genre.id,
          type: type,
          key: genre.name.toLowerCase().replace(/\s+/g, "-"),
          name: genre.name,
        }),
      })

      if (response.ok) {
        await fetchGenres()
        if (type === "movie") {
          setMovieGenres(prev => prev.filter(g => g.id !== genre.id))
        } else {
          setTvGenres(prev => prev.filter(g => g.id !== genre.id))
        }
      }
    } catch (error) {
      console.error("Failed to add genre:", error)
    }
  }

  const updateGenres = async () => {
    if (movieGenres.length === 0 && tvGenres.length === 0) {
      await fetchTmdbGenres()
    }
    
    // Add all movie genres
    for (const genre of movieGenres) {
      const exists = genres.some(g => g.id === genre.id && g.type === "movie")
      if (!exists) {
        await addGenre(genre, "movie")
      }
    }
    
    // Add all TV genres
    for (const genre of tvGenres) {
      const exists = genres.some(g => g.id === genre.id && g.type === "tv")
      if (!exists) {
        await addGenre(genre, "tv")
      }
    }
  }

  const currentGenres = selectedType === "movie" ? movieGenres : tvGenres

  useEffect(() => {
    fetchGenres()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Genre Management</h1>
        <div className="flex gap-2">
          <Button onClick={fetchTmdbGenres} disabled={isFetching}>
            Fetch Genres
          </Button>
          <Button onClick={updateGenres} disabled={isFetching || (movieGenres.length === 0 && tvGenres.length === 0)}>
            Update Database
          </Button>
          <Button onClick={fetchGenres} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TMDB Genres */}
        <Card>
          <CardHeader>
            <CardTitle>TMDB Genres</CardTitle>
            <CardDescription>Genres available from TMDB API</CardDescription>
            <Select value={selectedType} onValueChange={(value: "movie" | "tv") => setSelectedType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">Movie Genres</SelectItem>
                <SelectItem value="tv">TV Genres</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {currentGenres.map((genre) => {
                  const exists = genres.some(g => g.id === genre.id && g.type === selectedType)
                  return (
                    <div key={`${selectedType}-${genre.id}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{genre.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {genre.id} • {selectedType}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addGenre(genre, selectedType)}
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

        {/* Database Genres */}
        <Card>
          <CardHeader>
            <CardTitle>Database Genres</CardTitle>
            <CardDescription>Genres in your database</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {genres.map((genre) => (
                  <div key={`${genre.type}-${genre.id}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{genre.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {genre.id} • {genre.type} • {genre.key}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{genre.type}</Badge>
                      <Badge variant="outline">In Database</Badge>
                    </div>
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