'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })

    setMsg(error ? `登入失敗：${error.message}` : '✅ 已寄出登入連結，去收信！')
  }

  return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <form onSubmit={send} style={{display:'grid',gap:12, border:'1px solid #ddd', padding:24, borderRadius:12}}>
        <h1 style={{fontWeight:700, fontSize:20}}>登入 OneReserve</h1>
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
          style={{padding:10, border:'1px solid #ccc', borderRadius:8, width:280}}
        />
        <button type="submit" style={{padding:'10px 14px', borderRadius:8, background:'#FFD34D', border:'1px solid #E6C23F'}}>
          寄登入連結
        </button>
        {msg && <p style={{fontSize:14}}>{msg}</p>}
      </form>
    </main>
  )
}
