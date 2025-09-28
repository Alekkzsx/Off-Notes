"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Eye, Edit3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Note {
  id: string
  title: string
  content: string
  folder_id?: string
  created_at: string
  updated_at: string
}

interface NoteEditorProps {
  note?: Note
  folderId?: string
  onSave?: (note: Note) => void
}

export function NoteEditor({ note, folderId, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "")
  const [content, setContent] = useState(note?.content || "")
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Auto-save functionality
  useEffect(() => {
    if (!title && !content) return

    const autoSaveTimer = setTimeout(() => {
      handleSave(true)
    }, 2000)

    return () => clearTimeout(autoSaveTimer)
  }, [title, content])

  const handleSave = async (isAutoSave = false) => {
    if (!title.trim()) return

    setIsSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const noteData = {
        title: title.trim(),
        content: content.trim(),
        folder_id: folderId || null,
        user_id: user.id,
      }

      let savedNote

      if (note?.id) {
        // Update existing note
        const { data, error } = await supabase.from("notes").update(noteData).eq("id", note.id).select().single()

        if (error) throw error
        savedNote = data
      } else {
        // Create new note
        const { data, error } = await supabase.from("notes").insert(noteData).select().single()

        if (error) throw error
        savedNote = data

        // Redirect to the new note's URL
        if (!isAutoSave) {
          router.push(`/notes/${savedNote.id}`)
        }
      }

      setLastSaved(new Date())
      onSave?.(savedNote)
    } catch (error) {
      console.error("Error saving note:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering - in a real app, you'd use a proper markdown parser
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, "<br>")
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-lg font-medium border-none shadow-none focus-visible:ring-0 px-0"
        />
        <div className="flex items-center gap-2">
          {lastSaved && <span className="text-sm text-muted-foreground">Saved {lastSaved.toLocaleTimeString()}</span>}
          <Button onClick={() => handleSave()} disabled={isSaving || !title.trim()} size="sm">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="edit" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 m-4 mt-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note..."
              className="h-full resize-none border-none shadow-none focus-visible:ring-0 font-mono"
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 m-4 mt-2">
            <Card className="h-full">
              <CardContent className="p-6 h-full overflow-auto">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: `<p class="mb-4">${renderMarkdown(content || "Nothing to preview yet...")}</p>`,
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
