import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = session.user

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

    // TODO: Save file reference to database using Vercel Postgres

    return NextResponse.json({
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
