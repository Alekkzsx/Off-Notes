import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon/client"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, folder_id } = await request.json()

    const result = await sql`
      INSERT INTO notes (title, content, folder_id, user_id)
      VALUES (${title || "Untitled"}, ${content || ""}, ${folder_id || null}, ${user.id})
      RETURNING id, title, content, folder_id, user_id, created_at, updated_at
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notes = await sql`
      SELECT id, title, content, folder_id, user_id, created_at, updated_at
      FROM notes
      WHERE user_id = ${user.id}
      ORDER BY updated_at DESC
    `

    return NextResponse.json(notes)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
