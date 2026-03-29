'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // URL 에러 파라미터 확인
    const p = new URLSearchParams(window.location.search)
    const err = p.get('error')
    if (err === 'auth_failed') setErrorMsg('로그인에 실패했습니다. 다시 시도해주세요.')
    if (err === 'no_session') setErrorMsg('세션이 만료됐습니다. 다시 로그인해주세요.')
  }, [])

  const loginGoogle = async () => {
    setLoading('google')
    setErrorMsg('')
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + '/auth/callback' }
    })
  }

  const loginKakao = async () => {
    setLoading('kakao')
    setErrorMsg('')
    await sb.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: location.origin + '/auth/callback' }
    })
  }

  const loginEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('email')
    setErrorMsg('')
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + '/auth/callback' }
    })
    setLoading('')
    if (error) setErrorMsg('오류: ' + error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold text-white">
            <span className="text-amber-400">교차로</span> 휴스턴
          </h1>
          <p className="text-white/50 text-[13px] mt-1">로그인 / 회원가입</p>
          <p className="text-white/30 text-[11px] mt-1">처음이어도 바로 가입됩니다</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 mb-4 text-[13px] text-red-300 text-center">
            {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {sent ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">📧</div>
              <div className="text-[18px] font-bold mb-2">이메일을 확인해주세요</div>
              <p className="text-[13px] text-slate-500">{email}로 로그인 링크를 보냈습니다</p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-[12px] text-indigo-500 underline"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={loginGoogle}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl py-3.5 mb-3 font-bold text-[15px] text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading === 'google'
                  ? <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  : <span>🔵</span>}
                Google로 계속하기
              </button>

              <button
                onClick={loginKakao}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-[#FEE500] rounded-xl py-3.5 mb-5 font-bold text-[15px] text-[#3C1E1E] hover:bg-[#f0d800] disabled:opacity-60"
              >
                {loading === 'kakao'
                  ? <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                  : <span>💬</span>}
                카카오로 계속하기
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[12px] text-slate-400">또는 이메일로</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={loginEmail}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  required
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400 mb-3"
                />
                <button
                  type="submit"
                  disabled={!!loading}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3.5 font-bold text-[15px] disabled:opacity-60"
                >
                  {loading === 'email' ? '전송 중...' : '이메일 로그인 링크 받기'}
                </button>
              </form>

              <p className="text-center text-[11px] text-slate-400 mt-4">
                처음 로그인하면 자동으로 회원가입됩니다
              </p>
            </>
          )}
        </div>

        <a href="/" className="block text-center text-white/40 text-[13px] mt-5">← 홈으로</a>
      </div>
    </div>
  )
}
