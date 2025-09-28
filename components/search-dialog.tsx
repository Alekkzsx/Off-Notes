"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Search, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Note {
  id: string
  title: string
  content: string
  folder_id?: string
  created_at: string
  updated_at: string
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Note[]>([])
  const [recentNotes, setRecentNotes] = useState<Note[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadRecentNotes()
      setQuery("")
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (query.trim()) {
      const debounceTimer = setTimeout(() => {
        performSearch(query)
      }, 300)
      return () => clearTimeout(debounceTimer)
    } else {
      setResults([])
    }
  }, [query])

  const loadRecentNotes = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5)

      setRecentNotes(data || [])
    } catch (error) {
      console.error("Error loading recent notes:", error)
    }
  }

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Use PostgreSQL full-text search
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order("updated_at", { ascending: false })
        .limit(20)

      setResults(data || [])
    } catch (error) {
      console.error("Error searching notes:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleNoteSelect = (noteId: string) => {
    onOpenChange(false)
    router.push(`/notes/${noteId}`)
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Notes
          </DialogTitle>
        </DialogHeader>

        <div className="px-6">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your notes..."
            className="w-full"
            autoFocus
          />
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-4 mt-4">
            {query.trim() ? (
              // Search results
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {isSearching ? "Searching..." : `Results for "${query}"`}
                </h3>
                {results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((note) => (
                      <Button
                        key={note.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 text-left"
                        onClick={() => handleNoteSelect(note.id)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1">{highlightText(note.title, query)}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {highlightText(truncateContent(note.content), query)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Updated {new Date(note.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : !isSearching ? (
                  <p className="text-sm text-muted-foreground py-4">No notes found matching "{query}"</p>
                ) : null}
              </div>
            ) : (
              // Recent notes
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Notes
                </h3>
                {recentNotes.length > 0 ? (
                  <div className="space-y-2">
                    {recentNotes.map((note) => (
                      <Button
                        key={note.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 text-left"
                        onClick={() => handleNoteSelect(note.id)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1">{note.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {truncateContent(note.content)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Updated {new Date(note.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">No recent notes found</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
