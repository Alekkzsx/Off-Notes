"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FolderIcon, FolderOpen, FileText, Plus, FolderPlus, Trash2, Edit3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Note {
  id: string
  title: string
  content: string
  folder_id?: string
  created_at: string
  updated_at: string
}

interface Folder {
  id: string
  name: string
  parent_id?: string
  created_at: string
}

interface FileExplorerProps {
  currentNoteId?: string
}

export function FileExplorer({ currentNoteId }: FileExplorerProps) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Load folders
      const { data: foldersData } = await supabase.from("folders").select("*").eq("user_id", user.id).order("name")

      // Load notes
      const { data: notesData } = await supabase.from("notes").select("*").eq("user_id", user.id).order("title")

      setFolders(foldersData || [])
      setNotes(notesData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("folders").insert({
        name: newFolderName.trim(),
        parent_id: selectedParentId,
        user_id: user.id,
      })

      if (error) throw error

      setNewFolderName("")
      setIsCreatingFolder(false)
      setSelectedParentId(null)
      loadData()
    } catch (error) {
      console.error("Error creating folder:", error)
    }
  }

  const deleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase.from("folders").delete().eq("id", folderId)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error("Error deleting folder:", error)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId)

      if (error) throw error
      loadData()

      // If we're currently viewing this note, redirect to notes page
      if (currentNoteId === noteId) {
        router.push("/notes")
      }
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFolder = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const childFolders = folders.filter((f) => f.parent_id === folder.id)
    const childNotes = notes.filter((n) => n.folder_id === folder.id)

    return (
      <div key={folder.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => toggleFolder(folder.id)}
            >
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <FolderIcon className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-sm font-medium">{folder.name}</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                setSelectedParentId(folder.id)
                setIsCreatingFolder(true)
              }}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </ContextMenuItem>
            <ContextMenuItem asChild>
              <Link href={`/notes/new?folder=${folder.id}`}>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Link>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => deleteFolder(folder.id)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Folder
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {isExpanded && (
          <div>
            {childFolders.map((childFolder) => renderFolder(childFolder, level + 1))}
            {childNotes.map((note) => renderNote(note, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderNote = (note: Note, level = 0) => {
    const isActive = currentNoteId === note.id

    return (
      <ContextMenu key={note.id}>
        <ContextMenuTrigger>
          <Link href={`/notes/${note.id}`}>
            <div
              className={`flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer ${
                isActive ? "bg-accent" : ""
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm truncate">{note.title}</span>
            </div>
          </Link>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem asChild>
            <Link href={`/notes/${note.id}`}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Note
            </Link>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => deleteNote(note.id)} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Note
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  const rootFolders = folders.filter((f) => !f.parent_id)
  const rootNotes = notes.filter((n) => !n.folder_id)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Files</h2>
          <div className="flex gap-1">
            <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" onClick={() => setSelectedParentId(null)}>
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        createFolder()
                      }
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatingFolder(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/notes/new">
                <Plus className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {rootFolders.map((folder) => renderFolder(folder))}
          {rootNotes.map((note) => renderNote(note))}
        </div>
      </div>
    </div>
  )
}
