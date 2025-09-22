"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

interface Note {
  id: string
  title: string
  content: string
  folder_id: string | null
  created_at: string
  updated_at: string
}

interface NoteEditorProps {
  note: Note
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void
}

export function NoteEditor({ note, onUpdateNote }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setHasChanges(false)
  }, [note])

  useEffect(() => {
    const titleChanged = title !== note.title
    const contentChanged = content !== note.content
    setHasChanges(titleChanged || contentChanged)
  }, [title, content, note])

  const handleSave = () => {
    if (hasChanges) {
      onUpdateNote(note.id, { title, content })
      setHasChanges(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault()
      handleSave()
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasChanges, title, content])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border/50">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
          placeholder="Untitled"
        />
        <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasChanges} className="bg-transparent">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="h-full resize-none border-none shadow-none focus-visible:ring-0 text-sm leading-relaxed"
        />
      </div>

      {/* Status */}
      <div className="px-4 py-2 border-t border-border/50 text-xs text-muted-foreground">
        {hasChanges ? "Unsaved changes" : "All changes saved"} • Last updated:{" "}
        {new Date(note.updated_at).toLocaleString()}
      </div>
    </div>
  )
}
