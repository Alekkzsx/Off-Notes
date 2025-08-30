import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon/client"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()

    const result = await sql`
      UPDATE notes 
      SET title = ${updates.title}, 
          content = ${updates.content}, 
          folder_id = ${updates.folder_id || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id} AND user_id = ${user.id}
      RETURNING id, title, content, folder_id, user_id, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
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

    const result = await sql`
      DELETE FROM notes 
      WHERE id = ${params.id} AND user_id = ${user.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
