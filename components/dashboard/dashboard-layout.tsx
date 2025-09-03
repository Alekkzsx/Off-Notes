"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Sidebar } from "./sidebar"
import { NoteEditor } from "./note-editor"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
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
          folders={[]}
          notes={[]}
          selectedNote={null}
          selectedFolder={null}
          onSelectNote={() => {}}
          onSelectFolder={() => {}}
          onCreateNote={() => {}}
          onCreateFolder={() => {}}
          onDeleteFolder={() => {}}
          onDeleteNote={() => {}}
          isCreatingNote={false}
          isCreatingFolder={false}
          isDeletingNote={null}
          isDeletingFolder={null}
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
            <div className="text-sm text-muted-foreground">{session?.user?.email}</div>
            <ThemeToggle />
          </div>
        </div>

        {/* Note editor */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
