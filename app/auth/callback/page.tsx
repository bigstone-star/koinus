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

        // 에러 파라미터 있으면 즉시 실패
        if (errorParam) {
          setStatus('로그인 실패: ' + (params.get('error_description') || errorParam))
          setTimeout(() => router.replace('/auth/login?error=auth_failed'), 2000)
          return
        }

        // OAuth code 교환
        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('exchangeCode error:', error)
            setStatus('인증 오류가 발생했습니다')
            setTimeout(() => router.replace('/auth/login?error=auth_failed'), 2000)
            return
          }
        }

        // 세션 확인
        const { data: sessionData, error: sessionError } = await sb.auth.getSession()
        if (sessionError || !sessionData?.session?.user) {
          setStatus('세션을 가져오지 못했습니다')
          setTimeout(() => router.replace('/auth/login?error=no_session'), 2000)
          return
        }

        const user = sessionData.session.user
        const meta = user.user_metadata || {}

        // user_profiles upsert (닉네임/사진)
        const name =
          meta.full_name ||
          meta.name ||
          meta.preferred_username ||
          user.email?.split('@')[0] ||
          '사용자'
        const avatar_url = meta.avatar_url || null

        const { error: upsertError } = await sb.from('user_profiles').upsert(
          { id: user.id, email: user.email, name, avatar_url },
          { onConflict: 'id', ignoreDuplicates: false }
        )
        if (upsertError) {
          console.error('upsert error:', upsertError)
          // upsert 실패해도 로그인은 계속 진행
        }

        // role 확인 → admin이면 /admin으로
        const { data: profile } = await sb
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setStatus('환영합니다! 이동 중...')

        if (profile?.role === 'admin' || profile?.role === 'super_admin') {
          router.replace('/admin')
        } else {
          router.replace('/dashboard')
        }
      } catch (err) {
        console.error('callback error:', err)
        setStatus('오류가 발생했습니다')
        setTimeout(() => router.replace('/auth/login?error=unknown'), 2000)
      }
    }

    run()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-[14px]">{status}</p>
      </div>
    </div>
  )
}
```

---

### 파일 2: `app/auth/login/page.tsx` — 에러 메시지 + 안내 텍스트 개선
```
위치: app/auth/login/page.tsx
변경: 기존 파일에서 에러 표시 + 안내 문구만 추가 (최소 수정)
