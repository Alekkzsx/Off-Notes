import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 relative">
              <Image src="/favicon.ico" alt="Off Notes Logo" width={64} height={64} className="rounded-lg" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Thank you for signing up!</CardTitle>
              <CardDescription className="text-muted-foreground">
                Check your email to confirm your account
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              We've sent you a confirmation email. Please check your inbox and click the confirmation link to activate
              your Off Notes account.
            </p>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/auth/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
