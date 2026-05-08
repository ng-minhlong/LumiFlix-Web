import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import type { MEDIA_TYPE } from "@prisma/client"
import { env } from "@/env.mjs"

function generateSlug(title: string | null, name: string | null): string {
  const text = title || name || ""
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).substring(2, 8)
}

function generateKey(): string {
  return Math.random().toString(36).substring(2, 10)
}

function checkShowCompleted(status: string | null): boolean {
  return status === "Ended" || status === "Released"
}

async function fetchCompleteShowData(tmdbId: number, mediaType: MEDIA_TYPE) {
  if (mediaType === "movie") {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`
    )
    if (res.ok) {
      return await res.json()
    }
  } else if (mediaType === "tv") {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`
    )
    if (res.ok) {
      return await res.json()
    }
  }
  return null
}

async function fetchSeasonData(tmdbId: number, seasonNumber: number) {
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`
  )

  if (!res.ok) {
    return null
  }

  return await res.json()
}

export async function GET() {
  try {
    const shows = await prisma.show.findMany({
      include: {
        movies: {
          orderBy: [{ createdAt: "asc" }],
        },
        seasons: {
          orderBy: [{ season_number: "asc" }],
          include: {
            episodes: {
              orderBy: [{ episode_number: "asc" }],
            },
          },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { popularity: "desc" }
      ]
    })

    return NextResponse.json(shows)
  } catch (error) {
    console.error("Failed to fetch shows:", error)
    return NextResponse.json({ error: "Failed to fetch shows" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Ensure media_type is properly set
    const mediaType = data.media_type || (data.title ? "movie" : "tv")
    
    // Fetch complete show data for TV series
    let completeData = data
    let tmdbData: any = null
    if (mediaType === "tv") {
      tmdbData = await fetchCompleteShowData(data.tmdbId, mediaType)
      if (tmdbData) {
        completeData = {
          ...data,
          number_of_seasons: tmdbData.number_of_seasons,
          number_of_episodes: tmdbData.number_of_episodes,
          status: tmdbData.status,
          tagline: tmdbData.tagline,
          budget: tmdbData.budget,
          homepage: tmdbData.homepage,
          imdb_id: tmdbData.imdb_id,
          revenue: tmdbData.revenue,
          runtime: tmdbData.episode_run_time?.[0] || tmdbData.runtime,
          seasons: tmdbData.seasons,
        }
      }

      console.log("Main tmdbData", tmdbData)
    }
    
    // Generate slug
    const slug = generateSlug(completeData.title, completeData.name)
    
    // Check if show is completed
    const isShowCompleted = checkShowCompleted(completeData.status)
    
    const show = await prisma.show.create({
      data: {
        tmdbId: completeData.tmdbId,
        name: completeData.name,
        title: completeData.title,
        original_title: completeData.original_title,
        poster_path: completeData.poster_path,
        backdrop_path: completeData.backdrop_path,
        overview: completeData.overview,
        original_language: completeData.original_language,
        media_type: mediaType as MEDIA_TYPE,
        status: completeData.status,
        tagline: completeData.tagline,
        budget: completeData.budget,
        homepage: completeData.homepage,
        imdb_id: completeData.imdb_id,
        popularity: completeData.popularity,
        vote_average: completeData.vote_average,
        vote_count: completeData.vote_count,
        release_date: completeData.release_date,
        first_air_date: completeData.first_air_date,
        last_air_date: completeData.last_air_date,
        number_of_seasons: completeData.number_of_seasons,
        number_of_episodes: completeData.number_of_episodes,
        revenue: completeData.revenue,
        runtime: completeData.runtime,
        adult: completeData.adult,
        video: completeData.video,
        is_show_completed: isShowCompleted,
        slug: slug,
        genre_ids: completeData.genre_ids || [],
        origin_country: completeData.origin_country || [],
      }
    })
    console.log("data output", data);
    console.log("mediaType: ", mediaType)
    console.log("completeData: ", completeData)
    

    // Create Movie records
    if (mediaType === "movie") {
      await prisma.movie.create({
        data: {
          key: generateKey(),
          showId: show.id,
          runtime: completeData.runtime ?? null,
          view_count: 0,
        }
      })
    } else if (mediaType === "tv") {
      const seasonList = (tmdbData?.seasons || completeData.seasons || []) as Array<any>

      for (const seasonData of seasonList) {
        if (typeof seasonData?.season_number !== "number") {
          continue
        }

        const season = await prisma.season.create({
          data: {
            showId: show.id,
            season_number: seasonData.season_number,
            overview: seasonData.overview,
            vote_average: seasonData.vote_average,
            air_date: seasonData.air_date,
            poster_path: seasonData.poster_path,
            name: seasonData.name,
          },
        })

        const seasonDetails = await fetchSeasonData(data.tmdbId, seasonData.season_number)
        const episodes = (seasonDetails?.episodes || []) as Array<any>

        if (episodes.length > 0) {
          await prisma.episode.createMany({
            data: episodes.map((episode) => ({
              showId: show.id,
              seasonId: season.id,
              episode_number: episode.episode_number,
              title: episode.name,
              video_key: generateKey(),
              runtime: episode.runtime,
              overview: episode.overview,
              still_path: episode.still_path,
              vote_average: episode.vote_average,
              air_date: episode.air_date,
            })),
          })
        }
      }
    }

    return NextResponse.json(show)
  } catch (error) {
    console.error("Failed to create show:", error)
    return NextResponse.json({ error: "Failed to create show" }, { status: 500 })
  }
}
