'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = pathname.startsWith(href)
    return (
      <Link
        href={href}
        className={`block px-3 py-2 rounded-lg ${active ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800/60'}`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] bg-black text-neutral-100">
      <aside className="p-4 border-r border-neutral-800">
        <div className="text-xl font-semibold mb-2">OneReserve</div>
        <div className="text-xs text-neutral-400 mb-4">Dashboard</div>
        <nav className="space-y-1">
          <NavLink href="/dashboard" label="首頁" />
          <NavLink href="/dashboard/bookings" label="預約清單" />
          <NavLink href="/dashboard/calendar" label="預約日曆" />
        </nav>
        <Separator className="my-4 bg-neutral-800" />
        <Button onClick={signOut} variant="secondary" className="w-full">登出</Button>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  )
}
