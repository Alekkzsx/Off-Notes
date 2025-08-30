import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon/client"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, parent_id } = await request.json()

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO folders (name, parent_id, user_id)
      VALUES (${name.trim()}, ${parent_id || null}, ${user.id})
      RETURNING id, name, parent_id, user_id, created_at, updated_at
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

    const folders = await sql`
      SELECT id, name, parent_id, user_id, created_at, updated_at
      FROM folders
      WHERE user_id = ${user.id}
      ORDER BY name
    `

    return NextResponse.json(folders)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
