import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get or create user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    // Create profile if it doesn't exist
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email!,
      display_name: user.user_metadata?.display_name || user.email?.split("@")[0],
    })
  }

  return <DashboardLayout user={user} />
}
