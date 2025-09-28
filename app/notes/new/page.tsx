import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NoteEditor } from "@/components/note-editor"
import { NotesLayout } from "@/components/layout/notes-layout"

interface PageProps {
  searchParams: Promise<{ folder?: string }>
}

export default async function NewNotePage({ searchParams }: PageProps) {
  const { folder } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <NotesLayout>
      <NoteEditor folderId={folder} />
    </NotesLayout>
  )
}
