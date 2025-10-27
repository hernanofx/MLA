import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RedirectPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Redirect based on user role
  if (session.user?.role === 'vms') {
    redirect("/vms")
  } else if (session.user?.role === 'operario') {
    redirect("/loads")
  } else {
    redirect("/dashboard")
  }
}