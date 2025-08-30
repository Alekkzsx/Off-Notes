import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const noteId = formData.get("noteId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!noteId) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 })
    }

    // Upload to Vercel Blob with user-specific path
    const filename = `${user.id}/${noteId}/${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: "public",
    })

    // Save file reference to database
    const { data: attachment, error: dbError } = await supabase
      .from("attachments")
      .insert({
        note_id: noteId,
        filename: file.name,
        file_url: blob.url,
        file_size: file.size,
        file_type: file.type,
        user_id: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to save file reference" }, { status: 500 })
    }

    return NextResponse.json({
      id: attachment.id,
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
