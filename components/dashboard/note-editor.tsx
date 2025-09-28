"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileManager } from "@/components/file-manager/file-manager"
import { MarkdownEditor } from "@/components/editor/markdown-editor"
import { Save, Paperclip, Clock } from "lucide-react"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

interface Note {
  id: string
  title: string
  content: string
  folder_id: string | null
  user_id: string
  created_at: string
  updated_at: string
}

interface NoteEditorProps {
  note: Note
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void
}

export function NoteEditor({ note, onUpdateNote }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || "")
  const [hasChanges, setHasChanges] = useState(false)
  const [showFileManager, setShowFileManager] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content || "")
    setHasChanges(false)
    setLastSaved(new Date(note.updated_at))
  }, [note])

  const handleSave = useCallback(() => {
    if (hasChanges) {
      onUpdateNote(note.id, { title, content })
      setHasChanges(false)
      setLastSaved(new Date())
    }
  }, [hasChanges, note.id, title, content, onUpdateNote])

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }

      const timeout = setTimeout(() => {
        handleSave()
      }, 2000) // Auto-save after 2 seconds of inactivity

      setAutoSaveTimeout(timeout)
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [hasChanges, handleSave, autoSaveTimeout])

  useEffect(() => {
    const titleChanged = title !== note.title
    const contentChanged = content !== (note.content || "")
    setHasChanges(titleChanged || contentChanged)
  }, [title, content, note])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    },
    [handleSave],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const getWordCount = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  const getCharCount = (text: string) => {
    return text.length
  }

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
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Unsaved
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFileManager(!showFileManager)}
            className="bg-transparent"
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Files
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasChanges} className="bg-transparent">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* File Manager */}
      <Collapsible open={showFileManager} onOpenChange={setShowFileManager}>
        <CollapsibleContent>
          <div className="border-b border-border/50">
            <FileManager noteId={note.id} className="border-none shadow-none" />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Content Editor */}
      <div className="flex-1">
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Start writing your note... You can use Markdown formatting!"
          className="h-full"
        />
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>{getWordCount(content)} words</span>
          <span>{getCharCount(content)} characters</span>
          <span>
            {hasChanges ? "Unsaved changes" : "All changes saved"}
            {lastSaved && ` • Last saved: ${lastSaved.toLocaleTimeString()}`}
          </span>
        </div>
        <div className="text-xs">Created: {new Date(note.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  )
}
