import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NotesLayout } from "@/components/layout/notes-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function NotesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <NotesLayout>
      <div className="h-full flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to Off Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Select a note from the sidebar or create a new one to get started.</p>
            <p className="text-xs text-muted-foreground">
              Tip: Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd> to search your notes
            </p>
            <Button asChild>
              <Link href="/notes/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Note
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </NotesLayout>
  )
}
