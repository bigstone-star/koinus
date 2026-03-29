'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('로그인 처리 중...')

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const errorParam = params.get('error')
        const errorDescription = params.get('error_description')

        // 1) OAuth 에러 파라미터가 있으면 즉시 실패 처리
        if (errorParam) {
          setStatus('로그인 실패: ' + (errorDescription || errorParam))
          setTimeout(() => {
            router.replace('/auth/login?error=auth_failed')
          }, 1500)
          return
        }

        // 2) 먼저 세션 확인
        let { data: sessionData, error: sessionError } = await sb.auth.getSession()

        // 3) 세션이 없고 code가 있을 때만 교환
        if (!sessionData?.session && code) {
          const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('exchangeCodeForSession error:', exchangeError)
            setStatus('인증 처리 중 오류가 발생했습니다.')
            setTimeout(() => {
              router.replace('/auth/login?error=auth_failed')
            }, 1500)
            return
          }

          // 교환 후 세션 다시 읽기
          const refreshed = await sb.auth.getSession()
          sessionData = refreshed.data
          sessionError = refreshed.error
        }

        // 4) 최종 세션 확인
        if (sessionError || !sessionData?.session?.user) {
          console.error('getSession error:', sessionError)
          setStatus('세션을 가져오지 못했습니다.')
          setTimeout(() => {
            router.replace('/auth/login?error=no_session')
          }, 1500)
          return
        }

        const user = sessionData.session.user
        const meta = user.user_metadata || {}

        // 5) user_profiles upsert
        // role은 넣지 않음 → 기존 admin/super_admin 유지
        const name =
          meta.full_name ||
          meta.name ||
          meta.preferred_username ||
          user.email?.split('@')[0] ||
          '사용자'

        const avatar_url =
          meta.avatar_url ||
          meta.picture ||
          null

        const { error: upsertError } = await sb.from('user_profiles').upsert(
          {
            id: user.id,
            email: user.email,
            name,
            avatar_url,
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        )

        if (upsertError) {
          console.error('user_profiles upsert error:', upsertError)
          // upsert 실패해도 로그인은 계속 진행
        }

        // 6) role 확인
        const { data: profile, error: profileError } = await sb
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('role lookup error:', profileError)
        }

        const role = profile?.role || 'user'

        setStatus('환영합니다! 이동 중...')

        // 7) 권한에 따라 이동
        if (role === 'admin' || role === 'super_admin') {
          router.replace('/admin')
        } else {
          router.replace('/dashboard')
        }
      } catch (err) {
        console.error('callback error:', err)
        setStatus('오류가 발생했습니다.')
        setTimeout(() => {
          router.replace('/auth/login?error=unknown')
        }, 1500)
      }
    }

    run()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
      <div className="text-center px-6">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-[14px]">{status}</p>
      </div>
    </div>
  )
}
