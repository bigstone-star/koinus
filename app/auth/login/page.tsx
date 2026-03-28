'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState('')
  const loginGoogle = async () => {
    setLoading('google')
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/api/auth/callback' } })
  }
  const loginEmail = async (e: any) => {
    e.preventDefault(); setLoading('email')
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/api/auth/callback' } })
    setLoading('')
    if (error) alert('오류: ' + error.message); else setSent(true)
  }
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold text-white"><span className="text-amber-400">교차로</span> 휴스턴</h1>
          <p className="text-white/50 text-[14px] mt-1">로그인 / 회원가입</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {sent ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">📧</div>
              <div className="text-[18px] font-bold mb-2">이메일을 확인해주세요</div>
              <p className="text-[13px] text-slate-500">{email}로 링크를 보냈습니다</p>
            </div>
          ) : (
            <>
              <button onClick={loginGoogle} disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl py-3.5 mb-3 font-bold text-[15px] text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                {loading==='google' ? <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"/> : '🔵'} Google로 계속하기
              </button>
              <button onClick={()=>alert('카카오 로그인 준비 중입니다')}
                className="w-full flex items-center justify-center gap-3 bg-[#FEE500] rounded-xl py-3.5 mb-5 font-bold text-[15px] text-[#3C1E1E]">
                💬 카카오로 계속하기
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200"/>
                <span className="text-[12px] text-slate-400">또는 이메일로</span>
                <div className="flex-1 h-px bg-slate-200"/>
              </div>
              <form onSubmit={loginEmail}>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일 주소" required
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400 mb-3"/>
                <button type="submit" disabled={!!loading}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3.5 font-bold text-[15px] disabled:opacity-60">
                  {loading==='email'?'전송 중...':'이메일 로그인 링크 받기'}
                </button>
              </form>
            </>
          )}
        </div>
        <a href="/" className="block text-center text-white/40 text-[13px] mt-5">← 홈으로</a>
      </div>
    </div>
  )
}