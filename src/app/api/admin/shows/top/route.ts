import { NextRequest, NextResponse } from "next/server"
import { env } from "@/env.mjs"
import type { Show } from "@/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaType = searchParams.get("mediaType") as "movie" | "tv"
    const year = searchParams.get("year")

    if (!mediaType || !year) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const res = await fetch(
      `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US&sort_by=vote_average.desc&vote_count.gte=100&primary_release_year=${year}&first_air_date_year=${year}`
    )

    if (!res.ok) {
      throw new Error("Failed to fetch top shows")
    }

    const data = await res.json() as { results: Show[] }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch top shows:", error)
    return NextResponse.json({ error: "Failed to fetch top shows" }, { status: 500 })
  }
}
