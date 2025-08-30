import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attachmentId } = await request.json()

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID required" }, { status: 400 })
    }

    // Get attachment details
    const { data: attachment, error: fetchError } = await supabase
      .from("attachments")
      .select("*")
      .eq("id", attachmentId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    // Delete from Vercel Blob
    await del(attachment.file_url)

    // Delete from database
    const { error: deleteError } = await supabase
      .from("attachments")
      .delete()
      .eq("id", attachmentId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Database delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
