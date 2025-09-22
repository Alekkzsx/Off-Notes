"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import prisma from "@/lib/auth"
import { Sidebar } from "./sidebar"
import { NoteEditor } from "./note-editor"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { type Note, type Folder } from "@prisma/client" // Import Prisma generated types

interface DashboardLayoutProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function DashboardLayout({ user }: DashboardLayoutProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load folders
      const foldersData = await prisma.folder.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
      })
      setFolders(foldersData || [])

      // Load notes
      const notesData = await prisma.note.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      })
      setNotes(notesData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const createNote = async (folderId?: string) => {
    try {
      const newNote = await prisma.note.create({
        data: {
          title: "Untitled",
          content: "",
          folderId: folderId || null,
          userId: user.id,
        },
      })

      setNotes([newNote, ...notes])
      setSelectedNote(newNote)
    } catch (error) {
      console.error("Error creating note:", error)
    }
  }

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: { ...updates, updatedAt: new Date() },
      })

      setNotes(notes.map((note) => (note.id === noteId ? { ...note, ...updates, updatedAt: updatedNote.updatedAt } : note)))

      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...selectedNote, ...updates, updatedAt: updatedNote.updatedAt })
      }
    } catch (error) {
      console.error("Error updating note:", error)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      await prisma.note.delete({
        where: { id: noteId },
      })

      setNotes(notes.filter((note) => note.id !== noteId))
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
      }
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const createFolder = async (name: string, parentId?: string) => {
    try {
      const newFolder = await prisma.folder.create({
        data: {
          name,
          parentId: parentId || null,
          userId: user.id,
        },
      })

      setFolders([...folders, newFolder])
    } catch (error) {
      console.error("Error creating folder:", error)
    }
  }

  const deleteFolder = async (folderId: string) => {
    try {
      await prisma.folder.delete({
        where: { id: folderId },
      })

      setFolders(folders.filter((folder) => folder.id !== folderId))
      // Move notes from deleted folder to root
      await prisma.note.updateMany({
        where: { folderId: folderId },
        data: { folderId: null },
      })
      setNotes(notes.map((note) => (note.folderId === folderId ? { ...note, folderId: null } : note)))
    } catch (error) {
      console.error("Error deleting folder:", error)
    }
  }

  const filteredNotes = selectedFolder
    ? notes.filter((note) => note.folderId === selectedFolder)
    : notes.filter((note) => note.folderId === null)

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
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
          <h1 className="text-lg font-semibold">Obsidian Web</h1>
          <div className="flex items-center gap-2">
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
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>

        {/* Note editor */}
        <div className="flex-1">
          {selectedNote ? (
            <NoteEditor note={selectedNote} onUpdateNote={updateNote} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-lg mb-2">No note selected</div>
                <div className="text-sm">Select a note from the sidebar or create a new one</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
