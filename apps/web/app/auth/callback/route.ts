import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  // 如果有 code，就兌換成登入 session
  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (e) {
      // 若兌換失敗就回登入頁
      return NextResponse.redirect(new URL('/auth/login?error=callback', request.url))
    }
  }

  // 成功後導向 Dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
