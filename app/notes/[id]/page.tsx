import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NoteEditor } from "@/components/note-editor"
import { NotesLayout } from "@/components/layout/notes-layout"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NotePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch the note
  const { data: note, error } = await supabase.from("notes").select("*").eq("id", id).eq("user_id", user.id).single()

  if (error || !note) {
    redirect("/notes")
  }

  return (
    <NotesLayout currentNoteId={id}>
      <NoteEditor note={note} />
    </NotesLayout>
  )
}
