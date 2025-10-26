'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
    })
  }, [])

  if (!email) {
    return (
      <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div>尚未登入</div>
        <Link href="/auth/login" style={{marginLeft:12, textDecoration:'underline'}}>去登入</Link>
      </main>
    )
  }

  return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div>
        <h1 style={{fontWeight:700, fontSize:22}}>Dashboard</h1>
        <p>Hi，{email}</p>
        <button onClick={() => supabase.auth.signOut()} style={{marginTop:12}}>登出</button>
      </div>
    </main>
  )
}