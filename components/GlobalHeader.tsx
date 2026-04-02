'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function GlobalHeader() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data } = await sb.auth.getUser()
    setUser(data.user)

    if (data.user) {
      const { data: p } = await sb
        .from('user_profiles')
        .select('name, role')
        .eq('id', data.user.id)
        .single()

      setProfile(p)
    }
  }

  return (
    <div className="bg-[#1a1a2e] text-white px-4 py-3 flex items-center justify-between">

      {/* 좌측 */}
      <div className="flex items-center gap-3">
        <Link href="/" className="font-extrabold text-[16px]">
          교차로 TEXAS
        </Link>

        <Link
          href="/community/houston"
          className="text-[12px] bg-white/10 px-2 py-1 rounded"
        >
          커뮤니티
        </Link>

        <Link
          href="/"
          className="text-[12px] bg-yellow-400 text-black px-2 py-1 rounded font-bold"
        >
          업소록
        </Link>
      </div>

      {/* 우측 */}
      <div className="flex items-center gap-2 text-[12px]">

        {user ? (
          <>
            <span className="text-white/70">
              {profile?.name || '회원'}
            </span>

            {profile?.role === 'super_admin' && (
              <span className="bg-red-500 px-2 py-1 rounded text-white text-[10px]">
                SA
              </span>
            )}

            {profile?.role === 'admin' && (
              <span className="bg-blue-500 px-2 py-1 rounded text-white text-[10px]">
                ADMIN
              </span>
            )}
          </>
        ) : (
          <Link href="/auth/login" className="bg-white/20 px-2 py-1 rounded">
            로그인
          </Link>
        )}
      </div>
    </div>
  )
}
