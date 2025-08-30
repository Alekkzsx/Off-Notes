"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "./sidebar"
import { NoteEditor } from "./note-editor"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { AICopilot } from "./ai-copilot"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"

interface Note {
  id: string
  title: string
  content: string
  folder_id: string | null
  created_at: string
  updated_at: string
}

interface Folder {
  id: string
  name: string
  parent_id: string | null
  created_at: string
}

interface DashboardLayoutProps {
  user: User
}

export function DashboardLayout({ user }: DashboardLayoutProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null)
  const [isDeletingFolder, setIsDeletingFolder] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load folders
      const { data: foldersData, error: foldersError } = await supabase.from("folders").select("*").order("name")

      if (foldersError) throw foldersError
      setFolders(foldersData || [])

      // Load notes
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false })

      if (notesError) throw notesError
      setNotes(notesData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const createNote = async (folderId?: string) => {
    setIsCreatingNote(true)
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled",
          content: "",
          folder_id: folderId || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create note")
      }

      const newNote = await response.json()
      setNotes([newNote, ...notes])
      setSelectedNote(newNote)
      toast.success("Note created successfully")
    } catch (error) {
      console.error("Error creating note:", error)
      toast.error("Failed to create note. Please try again.")
    } finally {
      setIsCreatingNote(false)
    }
  }

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update note")
      }

      const updatedNote = await response.json()
      setNotes(notes.map((note) => (note.id === noteId ? updatedNote : note)))

      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNote)
      }
      toast.success("Note saved successfully")
    } catch (error) {
      console.error("Error updating note:", error)
      toast.error("Failed to update note. Please try again.")
    }
  }

  const deleteNote = async (noteId: string) => {
    setIsDeletingNote(noteId)
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete note")
      }

      setNotes(notes.filter((note) => note.id !== noteId))
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
      }
      toast.success("Note deleted successfully")
    } catch (error) {
      console.error("Error deleting note:", error)
      toast.error("Failed to delete note. Please try again.")
    } finally {
      setIsDeletingNote(null)
    }
  }

  const createFolder = async (name: string, parentId?: string) => {
    setIsCreatingFolder(true)
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          parent_id: parentId || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create folder")
      }

      const newFolder = await response.json()
      setFolders([...folders, newFolder])
      toast.success("Folder created successfully")
    } catch (error) {
      console.error("Error creating folder:", error)
      toast.error("Failed to create folder. Please try again.")
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const deleteFolder = async (folderId: string) => {
    setIsDeletingFolder(folderId)
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete folder")
      }

      setFolders(folders.filter((folder) => folder.id !== folderId))
      // Move notes from deleted folder to root
      setNotes(notes.map((note) => (note.folder_id === folderId ? { ...note, folder_id: null } : note)))
      toast.success("Folder deleted successfully")
    } catch (error) {
      console.error("Error deleting folder:", error)
      toast.error("Failed to delete folder. Please try again.")
    } finally {
      setIsDeletingFolder(null)
    }
  }

  const filteredNotes = selectedFolder
    ? notes.filter((note) => note.folder_id === selectedFolder)
    : notes.filter((note) => note.folder_id === null)

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          <div className="text-muted-foreground">Loading your notes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-background border-r border-border/50
        transform transition-transform duration-200 ease-in-out lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h1 className="text-lg font-semibold tracking-tight">Off-Notes</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Sidebar
          folders={folders}
          notes={filteredNotes}
          selectedNote={selectedNote}
          selectedFolder={selectedFolder}
          onSelectNote={setSelectedNote}
          onSelectFolder={setSelectedFolder}
          onCreateNote={createNote}
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
          onDeleteNote={deleteNote}
          isCreatingNote={isCreatingNote}
          isCreatingFolder={isCreatingFolder}
          isDeletingNote={isDeletingNote}
          isDeletingFolder={isDeletingFolder}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <ThemeToggle />
          </div>
        </div>

        {/* Note editor */}
        <div className="flex-1">
          {selectedNote ? (
            <div className="flex flex-col h-full">
              <NoteEditor note={selectedNote} onUpdateNote={updateNote} />
              <AICopilot currentNoteContent={selectedNote?.content} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-3">
                <div className="text-xl font-medium">No note selected</div>
                <div className="text-sm opacity-75">Select a note from the sidebar or create a new one</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
