import { redirect } from "next/navigation"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  return (
    <DashboardLayout>
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Welcome, {session.user.email}</h3>
          <p className="text-sm text-muted-foreground">Select a note or create a new one to get started.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
