import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"

export async function GET() {
  try {
    const countries = await prisma.originalCountry.findMany({
      orderBy: { name: "asc" }
    })

    return NextResponse.json(countries)
  } catch (error) {
    console.error("Failed to fetch countries:", error)
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const country = await prisma.originalCountry.create({
      data: {
        id: data.id,
        key: data.key,
        name: data.name,
      }
    })

    return NextResponse.json(country)
  } catch (error) {
    console.error("Failed to create country:", error)
    return NextResponse.json({ error: "Failed to create country" }, { status: 500 })
  }
}
