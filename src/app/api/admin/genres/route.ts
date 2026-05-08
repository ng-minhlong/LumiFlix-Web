import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }]
    })

    return NextResponse.json(genres)
  } catch (error) {
    console.error("Failed to fetch genres:", error)
    return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const genre = await prisma.genre.create({
      data: {
        id: data.id,
        type: data.type,
        key: data.key,
        name: data.name,
      }
    })

    return NextResponse.json(genre)
  } catch (error) {
    console.error("Failed to create genre:", error)
    return NextResponse.json({ error: "Failed to create genre" }, { status: 500 })
  }
}
