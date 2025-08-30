import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon/client"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE folders 
      SET name = ${name.trim()}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id} AND user_id = ${user.id}
      RETURNING id, name, parent_id, user_id, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, move all notes from this folder to root
    await sql`
      UPDATE notes 
      SET folder_id = NULL 
      WHERE folder_id = ${params.id} AND user_id = ${user.id}
    `

    // Then delete the folder
    const result = await sql`
      DELETE FROM folders 
      WHERE id = ${params.id} AND user_id = ${user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
