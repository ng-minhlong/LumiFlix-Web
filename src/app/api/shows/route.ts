import { NextRequest, NextResponse } from "next/server"
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaType = searchParams.get("mediaType") as "movie" | "tv" | null
    const query = searchParams.get("query")

    if (query !== null) {
      const term = query.trim()
      if (!term) {
        return NextResponse.json({ results: [] })
      }

      const shows = await prisma.show.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { name: { contains: term, mode: "insensitive" } },
            { original_title: { contains: term, mode: "insensitive" } },
          ],
        },
        orderBy: { popularity: "desc" },
        take: 50,
        select: SHOW_SELECT,
      })

      return NextResponse.json({ results: shows.map(toTmdbLikeShow) })
    }

    if (!mediaType) {
      return NextResponse.json(
        { error: "Missing mediaType parameter" },
        { status: 400 }
      )
    }

    const baseWhere = { media_type: mediaType } satisfies Prisma.ShowWhereInput

    const [trending, topRated, netflix, action, comedy, horror, romance, docs] =
      await Promise.all([
        prisma.show.findMany({
          where: baseWhere,
          orderBy: { popularity: "desc" },
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { ...baseWhere, vote_count: { gte: 100 } },
          orderBy: [{ vote_average: "desc" }, { popularity: "desc" }],
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { ...baseWhere, isFeatured: true },
          orderBy: [{ popularity: "desc" }, { vote_average: "desc" }],
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { ...baseWhere, genre_ids: { has: 28 } },
          orderBy: { popularity: "desc" },
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { ...baseWhere, genre_ids: { has: 35 } },
          orderBy: { popularity: "desc" },
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { ...baseWhere, genre_ids: { has: 27 } },
          orderBy: { popularity: "desc" },
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { ...baseWhere, genre_ids: { has: 10749 } },
          orderBy: { popularity: "desc" },
          take: 20,
          select: SHOW_SELECT,
        }),
        prisma.show.findMany({
          where: { ...baseWhere, genre_ids: { has: 99 } },
          orderBy: { popularity: "desc" },
          take: 20,
          select: SHOW_SELECT,
        }),
      ])

    return NextResponse.json({
      trending: trending.map(toTmdbLikeShow),
      topRated: topRated.map(toTmdbLikeShow),
      netflix: netflix.map(toTmdbLikeShow),
      action: action.map(toTmdbLikeShow),
      comedy: comedy.map(toTmdbLikeShow),
      horror: horror.map(toTmdbLikeShow),
      romance: romance.map(toTmdbLikeShow),
      docs: docs.map(toTmdbLikeShow),
    })
  } catch (error) {
    console.error("Failed to fetch shows:", error)
    return NextResponse.json({ error: "Failed to fetch shows" }, { status: 500 })
  }
}
