'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        router.replace('/auth/login?error=auth_failed')
        return
      }

      router.replace('/dashboard')
    }

    run()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] text-white">
      로그인 처리 중입니다...
    </div>
  )
}
