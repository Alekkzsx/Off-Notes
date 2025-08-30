"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { FileUpload, AttachmentList } from "./file-upload"

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
  onUpdateNote: (noteId: string, updates: Partial<Note>) => Promise<void>
}

interface Attachment {
  id: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
}

export function NoteEditor({ note, onUpdateNote }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(true)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setHasChanges(false)
    loadAttachments()
  }, [note])

  useEffect(() => {
    const titleChanged = title !== note.title
    const contentChanged = content !== note.content
    setHasChanges(titleChanged || contentChanged)
  }, [title, content, note])

  const loadAttachments = async () => {
    setLoadingAttachments(true)
    try {
      const response = await fetch(`/api/attachments/${note.id}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data.attachments || [])
      }
    } catch (error) {
      console.error("Failed to load attachments:", error)
    } finally {
      setLoadingAttachments(false)
    }
  }

  const handleSave = async () => {
    if (hasChanges && !isSaving) {
      setIsSaving(true)
      try {
        await onUpdateNote(note.id, { title, content })
        setHasChanges(false)
      } catch (error) {
        console.error("Failed to save note:", error)
      } finally {
        setIsSaving(false)
      }
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
  }, [hasChanges, title, content, isSaving])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border/50">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
          placeholder="Untitled"
          disabled={isSaving}
        />
        <div className="flex items-center gap-2">
          <FileUpload noteId={note.id} onFileUploaded={loadAttachments} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-transparent"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="h-64 resize-none border-none shadow-none focus-visible:ring-0 text-sm leading-relaxed mb-4"
          disabled={isSaving}
        />

        {loadingAttachments ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading attachments...</span>
          </div>
        ) : (
          <AttachmentList noteId={note.id} attachments={attachments} onAttachmentDeleted={loadAttachments} />
        )}
      </div>

      {/* Status */}
      <div className="px-4 py-2 border-t border-border/50 text-xs text-muted-foreground">
        {isSaving ? "Saving changes..." : hasChanges ? "Unsaved changes" : "All changes saved"} • Last updated:{" "}
        {new Date(note.updated_at).toLocaleString()}
      </div>
    </div>
  )
}
