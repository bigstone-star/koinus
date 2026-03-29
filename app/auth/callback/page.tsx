'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      // 1. URL에 code가 있으면 OAuth 로그인 (Google, Kakao)
      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace('/auth/login?error=auth_failed')
          return
        }
      }

      // 2. 세션에서 유저 정보 가져오기
      const { data: sessionData } = await sb.auth.getSession()
      const user = sessionData?.session?.user

      if (!user) {
        router.replace('/auth/login?error=auth_failed')
        return
      }

      // 3. user_profiles에 닉네임과 프로필 사진 저장/업데이트
      // 카카오: full_name = 닉네임, avatar_url = 프로필 사진
      // 구글: full_name = 이름, avatar_url = 프로필 사진
      const meta = user.user_metadata || {}
      const name = meta.full_name || meta.name || meta.preferred_username || null
      const avatar_url = meta.avatar_url || null

      if (name || avatar_url) {
        await sb.from('user_profiles').upsert({
          id: user.id,
          name: name,
          avatar_url: avatar_url,
          // email과 role은 건드리지 않음 (기존값 유지)
        }, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
      }

      // 4. 대시보드로 이동
      router.replace('/dashboard')
    }

    run()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-[14px]">로그인 처리 중입니다...</p>
      </div>
    </div>
  )
}'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    export default function CallbackPage() {
      const router = useRouter()

        useEffect(() => {
            const run = async () => {
                  // URL에 code가 있으면 (OAuth 로그인: Google, Kakao)
                        const code = new URLSearchParams(window.location.search).get('code')

                              if (code) {
                                      const { error } = await sb.auth.exchangeCodeForSession(code)
                                              if (error) {
                                                        router.replace('/auth/login?error=auth_failed')
                                                                  return
                                                                          }
                                                                                  router.replace('/dashboard')
                                                                                          return
                                                                                                }

                                                                                                      // code가 없으면 이미 세션이 있는지 확인 (이메일 링크 로그인)
                                                                                                            const { data, error } = await sb.auth.getSession()
                                                                                                                  if (error || !data.session) {
                                                                                                                          router.replace('/auth/login?error=auth_failed')
                                                                                                                                } else {
                                                                                                                                        router.replace('/dashboard')
                                                                                                                                              }
                                                                                                                                                  }
                                                                                                                                                  
                                                                                                                                                      run()
                                                                                                                                                        }, [router])
                                                                                                                                                        
                                                                                                                                                          return (
                                                                                                                                                              <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
                                                                                                                                                                    <div className="text-center">
                                                                                                                                                                            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                                                                                                                                                                    <p className="text-white/60 text-[14px]">로그인 처리 중입니다...</p>
                                                                                                                                                                                          </div>
                                                                                                                                                                                              </div>
                                                                                                                                                                                                )
                                                                                                                                                                                                }
