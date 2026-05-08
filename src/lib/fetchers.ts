import type { Show } from "@/types"
import type { MEDIA_TYPE } from "@prisma/client"
import { absoluteUrl } from "@/lib/utils"

function getApiUrl(path: string) {
  if (typeof window === "undefined") {
    return absoluteUrl(path)
  }
  return path
}

export async function getShows(mediaType: MEDIA_TYPE) {
  const res = await fetch(getApiUrl(`/api/shows?mediaType=${mediaType}`), {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch shows")
  }

  const data = (await res.json()) as {
    trending?: Show[]
    topRated?: Show[]
    netflix?: Show[]
    action?: Show[]
    comedy?: Show[]
    horror?: Show[]
    romance?: Show[]
    docs?: Show[]
  }

  return {
    trending: data.trending,
    topRated: data.topRated,
    netflix: data.netflix,
    action: data.action,
    comedy: data.comedy,
    horror: data.horror,
    romance: data.romance,
    docs: data.docs,
  }
}

export async function getNewAndPopularShows() {
  const res = await fetch(getApiUrl("/api/shows/new-and-popular"), {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch shows")
  }

  const data = (await res.json()) as {
    popularTvs?: Show[]
    popularMovies?: Show[]
    trendingTvs?: Show[]
    trendingMovies?: Show[]
  }

  return {
    popularTvs: data.popularTvs,
    popularMovies: data.popularMovies,
    trendingTvs: data.trendingTvs,
    trendingMovies: data.trendingMovies,
  }
}

export async function searchShows(query: string) {
  const res = await fetch(
    getApiUrl(`/api/shows?query=${encodeURIComponent(query)}`),
    {
      cache: "no-store",
    }
  )

  if (!res.ok) {
    throw new Error("Failed to find shows")
  }

  const shows = (await res.json()) as { results: Show[] }

  const popularShows = shows.results.sort((a, b) => b.popularity - a.popularity)

  return {
    results: popularShows,
  }
}

export async function getCompleteShowData(tmdbId: number, mediaType: MEDIA_TYPE) {
  const res = await fetch(
    getApiUrl(`/api/shows/${tmdbId}?mediaType=${mediaType}`),
    {
      cache: "no-store",
    }
  )

  if (!res.ok) {
    return null
  }

  return await res.json()
}
