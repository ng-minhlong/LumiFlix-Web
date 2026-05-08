import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/server/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { tmdbId: string } }
) {
  try {
    const mediaType = request.nextUrl.searchParams.get("mediaType") as
      | "movie"
      | "tv"
      | null
    const tmdbId = Number(params.tmdbId)

    if (!Number.isFinite(tmdbId) || !mediaType) {
      return NextResponse.json(
        { error: "Invalid tmdbId or missing mediaType" },
        { status: 400 }
      )
    }

    const show = await prisma.show.findFirst({
      where: {
        tmdbId,
        media_type: mediaType,
      },
    })

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...show,
      id: show.tmdbId,
      showId: show.id,
    })
  } catch (error) {
    console.error("Failed to fetch complete show data:", error)
    return NextResponse.json(
      { error: "Failed to fetch complete show data" },
      { status: 500 }
    )
  }
}
