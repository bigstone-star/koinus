'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { FcGoogle } from 'react-icons/fc'

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
    <div className="min-h-screen flex items-center justify-center bg-[#f3f7f1] px-4">
      <div className="w-full max-w-[400px]">

        {/* 🔥 로고 */}
        <img
          src="/logo.png"
          className="h-10 mx-auto mb-6 object-contain"
        />

        <div className="bg-white rounded-[28px] px-6 py-7 shadow-sm">

          {errorMsg && (
            <div className="text-red-500 text-[13px] text-center mb-4">
              {errorMsg}
            </div>
          )}

          {sent ? (
            <div className="text-center py-6">
              <div className="text-[18px] font-bold">이메일 확인</div>
              <p className="text-[13px] text-gray-500 mt-2">
                {email}로 로그인 링크 전송됨
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-[20px] font-extrabold text-center mb-6">
                시작하기
              </h2>

              {/* Google */}
              <button
                onClick={loginGoogle}
                className="w-full h-[52px] flex items-center justify-center gap-3 rounded-full bg-gray-100 font-semibold mb-3"
              >
                <FcGoogle size={20} />
                Continue with Google
              </button>

              {/* Kakao */}
              <button
                onClick={loginKakao}
                className="w-full h-[52px] flex items-center justify-center gap-3 rounded-full bg-[#FEE500] font-semibold mb-5"
              >
                <img src="/icons/kakao.svg" className="w-5 h-5" />
                카카오로 계속하기
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[12px] text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={loginEmail}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[54px] rounded-xl border px-4 mb-4"
                />

                <button className="w-full h-[52px] rounded-full bg-[#6a9247] text-white font-bold">
                  Continue
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
