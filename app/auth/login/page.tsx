'use client'

import { useEffect, useState } from 'react'
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
  const [logoBroken, setLogoBroken] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const err = p.get('error')
    if (err === 'auth_failed') setErrorMsg('로그인에 실패했습니다.')
    if (err === 'no_session') setErrorMsg('세션이 만료되었습니다.')
  }, [])

  const loginGoogle = async () => {
    setLoading('google')
    setErrorMsg('')
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + '/auth/callback' },
    })
  }

  const loginKakao = async () => {
    setLoading('kakao')
    setErrorMsg('')
    await sb.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: location.origin + '/auth/callback' },
    })
  }

  const loginEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('email')
    setErrorMsg('')

    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + '/auth/callback' },
    })

    setLoading('')

    if (error) setErrorMsg(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f7f1] px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          {!logoBroken ? (
            <img
              src="/logo.svg"
              alt="KOINUS"
              className="h-10 mx-auto mb-3 object-contain"
              onError={() => setLogoBroken(true)}
            />
          ) : (
            <div className="text-[34px] font-extrabold tracking-tight text-slate-800 mb-3">
              KOINUS
            </div>
          )}
        </div>

        <div className="bg-white rounded-[28px] px-6 py-7 shadow-sm border border-slate-200">
          {errorMsg && (
            <div className="text-red-500 text-[13px] text-center mb-4">
              {errorMsg}
            </div>
          )}

          {sent ? (
            <div className="text-center py-6">
              <div className="text-[18px] font-bold text-slate-800">이메일 확인</div>
              <p className="text-[13px] text-slate-500 mt-2 leading-6">
                {email}로 로그인 링크가 전송되었습니다.
              </p>

              <button
                onClick={() => setSent(false)}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-200"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-[20px] font-extrabold text-center text-slate-800 mb-6">
                시작하기
              </h2>

              <button
                onClick={loginGoogle}
                disabled={!!loading}
                className="w-full h-[52px] flex items-center justify-center gap-3 rounded-full bg-slate-100 font-semibold text-slate-800 mb-3 disabled:opacity-60"
              >
                {loading === 'google' ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <img
                    src="/icons/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                )}
                Continue with Google
              </button>

              <button
                onClick={loginKakao}
                disabled={!!loading}
                className="w-full h-[52px] flex items-center justify-center gap-3 rounded-full bg-[#FEE500] font-semibold text-[#3C1E1E] mb-5 disabled:opacity-60"
              >
                {loading === 'kakao' ? (
                  <div className="w-5 h-5 border-2 border-yellow-700 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <img
                    src="/icons/kakao.svg"
                    alt="Kakao"
                    className="w-5 h-5"
                  />
                )}
                Continue with Kakao
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[12px] text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={loginEmail}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[54px] rounded-xl border border-slate-300 px-4 mb-4 text-[16px] outline-none focus:border-[#6a9247]"
                />

                <button
                  type="submit"
                  disabled={!!loading}
                  className="w-full h-[52px] rounded-full bg-[#6a9247] text-white font-bold disabled:opacity-60"
                >
                  {loading === 'email' ? 'Sending...' : 'Continue with Email'}
                </button>
              </form>

              <a
                href="/"
                className="block text-center text-[13px] text-slate-500 underline mt-6"
              >
                로그인 없이 계속하기
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
