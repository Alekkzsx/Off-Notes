"use client"

import type React from "react"

import { useState } from "react"
import { FileExplorer } from "@/components/file-explorer"
import { SearchDialog } from "@/components/search-dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { LogOut, Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface NotesLayoutProps {
  children: React.ReactNode
  currentNoteId?: string
}

export function NotesLayout({ children, currentNoteId }: NotesLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      setIsSearchOpen(true)
    }
  }

  useState(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  })

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="font-semibold text-lg">Off Notes</h1>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setIsSearchOpen(true)} title="Search (Ctrl+K)">
              <Search className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <FileExplorer currentNoteId={currentNoteId} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  )
}
