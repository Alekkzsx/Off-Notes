import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get("noteId")

    let query = supabase.from("files").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

    if (noteId) {
      query = query.eq("note_id", noteId)
    }

    const { data: files, error } = await query

    if (error) {
      console.error("Error listing files:", error)
      return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
    }

    return NextResponse.json({ files })
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 })
  }
}
