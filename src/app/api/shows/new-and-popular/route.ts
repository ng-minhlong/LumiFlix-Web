import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { prisma } from "@/server/db"

const SHOW_SELECT = {
  tmdbId: true,
  id: true,
  slug: true,
  adult: true,
  backdrop_path: true,
  media_type: true,
  budget: true,
  homepage: true,
  origin_country: true,
  genre_ids: true,
  imdb_id: true,
  original_language: true,
  original_title: true,
  overview: true,
  popularity: true,
  poster_path: true,
  number_of_seasons: true,
  number_of_episodes: true,
  release_date: true,
  first_air_date: true,
  last_air_date: true,
  revenue: true,
  runtime: true,
  status: true,
  tagline: true,
  title: true,
  name: true,
  video: true,
  vote_average: true,
  vote_count: true,
} satisfies Prisma.ShowSelect

type ShowResult = Prisma.ShowGetPayload<{ select: typeof SHOW_SELECT }>

function toTmdbLikeShow(show: ShowResult) {
  return {
    ...show,
    id: show.tmdbId,
    showId: show.id,
  }
}

export async function GET() {
  try {
    const [popularTvs, popularMovies, trendingTvs, trendingMovies] =
      await Promise.all([
        prisma.show.findMany({
          where: { media_type: "tv" },
          orderBy: [{ popularity: "desc" }, { vote_average: "desc" }],
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { media_type: "movie" },
          orderBy: [{ popularity: "desc" }, { vote_average: "desc" }],
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { media_type: "tv" },
          orderBy: [{ first_air_date: "desc" }, { createdAt: "desc" }],
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { media_type: "movie" },
          orderBy: [{ release_date: "desc" }, { createdAt: "desc" }],
          take: 20,
          select: SHOW_SELECT,
        }),
      ])

    return NextResponse.json({
      popularTvs: popularTvs.map(toTmdbLikeShow),
      popularMovies: popularMovies.map(toTmdbLikeShow),
      trendingTvs: trendingTvs.map(toTmdbLikeShow),
      trendingMovies: trendingMovies.map(toTmdbLikeShow),
    })
  } catch (error) {
    console.error("Failed to fetch new and popular shows:", error)
    return NextResponse.json(
      { error: "Failed to fetch new and popular shows" },
      { status: 500 }
    )
  }
}
