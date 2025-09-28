"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "./file-upload"
import { FileList } from "./file-list"
import { Files } from "lucide-react"

interface FileManagerProps {
  noteId?: string
  className?: string
}

export function FileManager({ noteId, className }: FileManagerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleFileDelete = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Files className="w-4 h-4" />
          File Attachments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <FileUpload noteId={noteId} onUploadComplete={handleUploadComplete} />
          </TabsContent>
          <TabsContent value="files" className="mt-4">
            <div className="max-h-64">
              <FileList noteId={noteId} onFileDelete={handleFileDelete} refreshTrigger={refreshTrigger} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
