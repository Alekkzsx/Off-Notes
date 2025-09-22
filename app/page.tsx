import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-foreground rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-background rounded-sm"></div>
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Obsidian Web</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your personal knowledge management system
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/auth/register">Create Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
