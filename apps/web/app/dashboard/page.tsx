'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function DashboardHome() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) {
        router.replace('/login')
      } else {
        setEmail(user.email ?? null)
        setLoading(false)
      }
    }
    run()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/login')
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [router])

  if (loading) return null

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div>
        <h1 style={{fontWeight:700, fontSize:22, marginBottom:8}}>商家 Dashboard</h1>
        <p>Hi，{email}</p>
        <button onClick={logout} style={{marginTop:12, padding:'8px 12px', borderRadius:6}}>登出</button>
      </div>
    </main>
  )
}
