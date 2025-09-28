"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { File, ImageIcon, Music, Video, MoreHorizontal, Trash2, Download, ExternalLink } from "lucide-react"
import { formatBytes } from "@/lib/utils"

interface FileItem {
  id: string
  name: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
}

interface FileListProps {
  noteId?: string
  onFileDelete?: (fileId: string) => void
  refreshTrigger?: number
}

export function FileList({ noteId, onFileDelete, refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-blue-500" />
    if (mimeType.startsWith("video/")) return <Video className="w-4 h-4 text-purple-500" />
    if (mimeType.startsWith("audio/")) return <Music className="w-4 h-4 text-green-500" />
    if (mimeType.includes("text") || mimeType.includes("document")) return <File className="w-4 h-4 text-orange-500" />
    return <File className="w-4 h-4 text-gray-500" />
  }

  const loadFiles = async () => {
    try {
      const url = noteId ? `/api/files/list?noteId=${noteId}` : "/api/files/list"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error("Error loading files:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch("/api/files/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      })

      if (response.ok) {
        setFiles(files.filter((file) => file.id !== fileId))
        onFileDelete?.(fileId)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleDownload = (file: FileItem) => {
    const link = document.createElement("a")
    link.href = file.file_path
    link.download = file.name
    link.click()
  }

  useEffect(() => {
    loadFiles()
  }, [noteId, refreshTrigger])

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4">Loading files...</div>
  }

  if (files.length === 0) {
    return <div className="text-sm text-muted-foreground p-4">No files attached</div>
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group">
            {getFileIcon(file.mime_type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(file.file_path, "_blank")}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(file)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(file.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
