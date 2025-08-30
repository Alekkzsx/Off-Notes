"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X, File, ImageIcon, FileText } from "lucide-react"
import { toast } from "sonner"

interface FileUploadProps {
  noteId: string
  onFileUploaded: () => void
}

export function FileUpload({ noteId, onFileUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("noteId", noteId)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()
      toast.success(`File "${result.filename}" uploaded successfully`)
      onFileUploaded()

      // Reset input
      event.target.value = ""
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
        id={`file-upload-${noteId}`}
        accept="*/*"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => document.getElementById(`file-upload-${noteId}`)?.click()}
        disabled={uploading}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  )
}

interface Attachment {
  id: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  created_at: string
}

interface AttachmentListProps {
  noteId: string
  attachments: Attachment[]
  onAttachmentDeleted: () => void
}

export function AttachmentList({ noteId, attachments, onAttachmentDeleted }: AttachmentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (attachmentId: string) => {
    setDeleting(attachmentId)

    try {
      const response = await fetch("/api/attachments/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attachmentId }),
      })

      if (!response.ok) {
        throw new Error("Delete failed")
      }

      toast.success("File deleted successfully")
      onAttachmentDeleted()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete file")
    } finally {
      setDeleting(null)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />
    } else if (fileType.includes("text") || fileType.includes("document")) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (attachments.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getFileIcon(attachment.file_type)}
              <div className="flex-1 min-w-0">
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                >
                  {attachment.filename}
                </a>
                <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(attachment.id)}
              disabled={deleting === attachment.id}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
