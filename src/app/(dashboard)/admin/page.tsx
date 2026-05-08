"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { searchShows, getShows, getCompleteShowData } from "@/lib/fetchers"
import type { MEDIA_TYPE } from "@prisma/client"
import type { Show as TMDBShow } from "@/types"

// Define the Show interface based on our Prisma schema
interface Show {
  id: string
  tmdbId: number
  name: string | null
  title: string | null
  original_title: string | null
  poster_path: string | null
  backdrop_path: string | null
  overview: string | null
  original_language: string
  media_type: MEDIA_TYPE
  status: string | null
  tagline: string | null
  budget: number | null
  homepage: string | null
  imdb_id: string | null
  popularity: number
  vote_average: number
  origin_country: string[]
  genre_ids: number[]
  vote_count: number
  release_date: string | null
  first_air_date: string | null
  last_air_date: string | null
  number_of_seasons: number | null
  number_of_episodes: number | null
  revenue: number | null
  runtime: number | null
  adult: boolean
  video: boolean
  category: any
  isFeatured: boolean
  is_show_completed: boolean
  slug: string
  createdAt: Date
  updatedAt: Date
  movies: Movie[]
  seasons: Season[]
}

interface Movie {
  id: string
  key: string
  showId: string
  runtime: number | null
  view_count: number
  createdAt: Date
  updatedAt: Date
}

interface Season {
  id: string
  showId: string
  season_number: number
  overview: string | null
  vote_average: number | null
  air_date: string | null
  poster_path: string | null
  name: string | null
  episodes: Episode[]
}

interface Episode {
  id: string
  showId: string
  seasonId: string
  episode_number: number
  title: string | null
  video_key: string
  runtime: number | null
  overview: string | null
  still_path: string | null
  vote_average: number | null
  air_date: string | null
}

interface ShowWithDetails extends Show {
  tmdbData?: TMDBShow
}

export default function AdminPage() {
  const [shows, setShows] = useState<ShowWithDetails[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<TMDBShow[]>([])
  const [selectedMediaType, setSelectedMediaType] = useState<MEDIA_TYPE>("movie")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedShow, setSelectedShow] = useState<Show | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchShows = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/shows")
      if (response.ok) {
        const data = await response.json()
        setShows(data)
      }
    } catch (error) {
      console.error("Failed to fetch shows:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchMovies = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const results = await searchShows(searchQuery)
      setSearchResults(results.results || [])
    } catch (error) {
      console.error("Failed to search shows:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const fetchTopShows = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/shows/top?mediaType=${selectedMediaType}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error("Failed to fetch top shows:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addShowToDatabase = async (tmdbShow: TMDBShow) => {
    try {
      // Fetch complete data for TV series if needed
      let completeShowData = tmdbShow
      if (tmdbShow.media_type === "tv" && (!tmdbShow.number_of_seasons || !tmdbShow.number_of_episodes)) {
        const completeData = await getCompleteShowData(tmdbShow.id, tmdbShow.media_type)
        if (completeData) {
          completeShowData = {
            ...tmdbShow,
            number_of_seasons: completeData.number_of_seasons,
            number_of_episodes: completeData.number_of_episodes,
            status: completeData.status,
            tagline: completeData.tagline,
            budget: completeData.budget,
            homepage: completeData.homepage,
            imdb_id: completeData.imdb_id,
            revenue: completeData.revenue,
            runtime: completeData.episode_run_time?.[0] || completeData.runtime,
          }
        }
      }

      const response = await fetch("/api/admin/shows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tmdbId: completeShowData.id,
          name: completeShowData.name,
          title: completeShowData.title,
          original_title: completeShowData.original_title,
          poster_path: completeShowData.poster_path,
          backdrop_path: completeShowData.backdrop_path,
          overview: completeShowData.overview,
          original_language: completeShowData.original_language,
          media_type: completeShowData.media_type,
          status: completeShowData.status,
          tagline: completeShowData.tagline,
          budget: completeShowData.budget,
          homepage: completeShowData.homepage,
          imdb_id: completeShowData.imdb_id,
          popularity: completeShowData.popularity,
          vote_average: completeShowData.vote_average,
          origin_country: completeShowData.origin_country,
          genre_ids: completeShowData.genre_ids,
          vote_count: completeShowData.vote_count,
          release_date: completeShowData.release_date,
          first_air_date: completeShowData.first_air_date,
          last_air_date: completeShowData.last_air_date,
          number_of_seasons: completeShowData.number_of_seasons,
          number_of_episodes: completeShowData.number_of_episodes,
          revenue: completeShowData.revenue,
          runtime: completeShowData.runtime,
          adult: completeShowData.adult,
          video: completeShowData.video,
          completeShowData: completeShowData
        }),
      })

      if (response.ok) {
        await fetchShows()
        setSearchResults(prev => prev.filter(show => show.id !== tmdbShow.id))
      }
    } catch (error) {
      console.error("Failed to add show:", error)
    }
  }

  const toggleFeatured = async (showId: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/shows/${showId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      })

      if (response.ok) {
        await fetchShows()
      }
    } catch (error) {
      console.error("Failed to update show:", error)
    }
  }

  const openDetailModal = (show: Show) => {
    setSelectedShow(show)
    setIsDetailModalOpen(true)
  }

  const deleteShow = async (showId: string) => {
    if (!confirm("Are you sure you want to delete this show? This will also delete all associated movies.")) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/shows/${showId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchShows()
      }
    } catch (error) {
      console.error("Failed to delete show:", error)
    }
  }

  useEffect(() => {
    fetchShows()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Show Management</h1>
        <Button onClick={fetchShows} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search and Add Shows */}
        <Card>
          <CardHeader>
            <CardTitle>Add Shows from TMDB</CardTitle>
            <CardDescription>Search for movies and TV shows to add to your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search movies and TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchMovies()}
              />
              <Button onClick={searchMovies} disabled={isSearching}>
                Search
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold">Fetch Top Shows</h3>
              <div className="flex gap-2">
                <Select value={selectedMediaType} onValueChange={(value: MEDIA_TYPE) => setSelectedMediaType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="tv">TV Shows</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-24"
                />
                <Button onClick={fetchTopShows} disabled={isLoading}>
                  Fetch Top
                </Button>
              </div>
            </div>

            <Separator />

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {searchResults.map((show) => (
                  <div key={show.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {show.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                          alt={show.title || show.name || ""}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{show.title || show.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {show.media_type} • {show.release_date?.split("-")[0] || show.first_air_date?.split("-")[0]}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{show.overview}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addShowToDatabase(show)}
                      disabled={shows.some(s => s.tmdbId === show.id)}
                    >
                      {shows.some(s => s.tmdbId === show.id) ? "Added" : "Add"}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Manage Existing Shows */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Shows</CardTitle>
            <CardDescription>Manage shows in your database</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {shows.map((show) => (
                  <div key={show.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {show.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                          alt={show.title || show.name || ""}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{show.title || show.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {show.media_type} • {show.release_date?.split("-")[0] || show.first_air_date?.split("-")[0]}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {show.isFeatured && <Badge variant="default">Featured</Badge>}
                          <Badge variant="secondary">{show.media_type}</Badge>
                          <Badge variant={show.is_show_completed ? "default" : "outline"}>
                            {show.is_show_completed ? "Completed" : "Ongoing"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetailModal(show)}
                      >
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteShow(show.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant={show.isFeatured ? "default" : "outline"}
                        onClick={() => toggleFeatured(show.id, show.isFeatured)}
                      >
                        {show.isFeatured ? "Unfeature" : "Feature"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

      {/* Movie Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedShow?.title || selectedShow?.name} - Video Details</DialogTitle>
            <DialogDescription>
              {selectedShow?.media_type === "movie"
                ? `Total Movies: ${selectedShow?.movies.length || 0}`
                : `Total Episodes: ${
                    selectedShow?.seasons.reduce((acc, season) => acc + season.episodes.length, 0) || 0
                  }`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedShow?.media_type === "movie"
                ? selectedShow?.movies.map((movie) => (
                    <div key={movie.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">Key: {movie.key}</p>
                          <p className="text-sm text-muted-foreground">Views: {movie.view_count}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Movie</Badge>
                    </div>
                  ))
                : selectedShow?.seasons.flatMap((season) =>
                    season.episodes.map((episode) => (
                      <div key={episode.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-sm font-medium">S{season.season_number}</div>
                            <div className="text-xs text-muted-foreground">E{episode.episode_number}</div>
                          </div>
                          <div>
                            <p className="font-medium">{episode.title || "Untitled episode"}</p>
                            <p className="text-sm text-muted-foreground">Key: {episode.video_key}</p>
                          </div>
                        </div>
                        <Badge variant="outline">Episode</Badge>
                      </div>
                    ))
                  )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
