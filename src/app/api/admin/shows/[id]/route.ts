import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isFeatured } = await request.json()
    
    const show = await prisma.show.update({
      where: { id: params.id },
      data: { isFeatured }
    })

    return NextResponse.json(show)
  } catch (error) {
    console.error("Failed to update show:", error)
    return NextResponse.json({ error: "Failed to update show" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.show.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete show:", error)
    return NextResponse.json({ error: "Failed to delete show" }, { status: 500 })
  }
}
