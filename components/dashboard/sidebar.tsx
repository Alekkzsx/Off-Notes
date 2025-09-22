"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, FolderPlus, FolderIcon, FileText, MoreHorizontal, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

interface SidebarProps {
  folders: Folder[]
  notes: Note[]
  selectedNote: Note | null
  selectedFolder: string | null
  onSelectNote: (note: Note) => void
  onSelectFolder: (folderId: string | null) => void
  onCreateNote: (folderId?: string) => void
  onCreateFolder: (name: string, parentId?: string) => void
  onDeleteFolder: (folderId: string) => void
  onDeleteNote: (noteId: string) => void
}

export function Sidebar({
  folders,
  notes,
  selectedNote,
  selectedFolder,
  onSelectNote,
  onSelectFolder,
  onCreateNote,
  onCreateFolder,
  onDeleteFolder,
  onDeleteNote,
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [newFolderName, setNewFolderName] = useState("")
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim())
      setNewFolderName("")
      setShowNewFolderInput(false)
    }
  }

  const renderFolder = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolder === folder.id
    const childFolders = folders.filter((f) => f.parent_id === folder.id)
    const folderNotes = notes.filter((note) => note.folder_id === folder.id)

    return (
      <div key={folder.id}>
        <div
          className={`
            flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-muted/50
            ${isSelected ? "bg-muted" : ""}
          `}
          style={{ paddingLeft: `${8 + level * 16}px` }}
        >
          <Button variant="ghost" size="sm" className="w-4 h-4 p-0" onClick={() => toggleFolder(folder.id)}>
            {childFolders.length > 0 ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
          </Button>

          <FolderIcon className="w-4 h-4 text-muted-foreground" />

          <span className="flex-1 text-sm truncate" onClick={() => onSelectFolder(folder.id)}>
            {folder.name}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCreateNote(folder.id)}>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteFolder(folder.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && (
          <>
            {childFolders.map((childFolder) => renderFolder(childFolder, level + 1))}
            {folderNotes.map((note) => (
              <div
                key={note.id}
                className={`
                  flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-muted/50 group
                  ${selectedNote?.id === note.id ? "bg-muted" : ""}
                `}
                style={{ paddingLeft: `${24 + (level + 1) * 16}px` }}
                onClick={() => onSelectNote(note)}
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{note.title}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteNote(note.id)
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  const rootNotes = notes.filter((note) => note.folder_id === null)

  return (
    <div className="flex flex-col h-full">
      {/* Actions */}
      <div className="p-4 border-b border-border/50">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onCreateNote()} className="flex-1 bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNewFolderInput(true)} className="bg-transparent">
            <FolderPlus className="w-4 h-4" />
          </Button>
        </div>

        {showNewFolderInput && (
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder()
                if (e.key === "Escape") {
                  setShowNewFolderInput(false)
                  setNewFolderName("")
                }
              }}
              className="text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleCreateFolder}>
              Add
            </Button>
          </div>
        )}
      </div>

      {/* File tree */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Root folder */}
          <div
            className={`
              flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-muted/50
              ${selectedFolder === null ? "bg-muted" : ""}
            `}
            onClick={() => onSelectFolder(null)}
          >
            <FolderIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">All Notes</span>
          </div>

          {/* Root notes */}
          {selectedFolder === null &&
            rootNotes.map((note) => (
              <div
                key={note.id}
                className={`
                flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-muted/50 group
                ${selectedNote?.id === note.id ? "bg-muted" : ""}
              `}
                style={{ paddingLeft: "24px" }}
                onClick={() => onSelectNote(note)}
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{note.title}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteNote(note.id)
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

          {/* Folders */}
          {folders.filter((f) => f.parent_id === null).map((folder) => renderFolder(folder))}
        </div>
      </ScrollArea>
    </div>
  )
}
