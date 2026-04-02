'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function GlobalHeader() {
  const pathname = usePathname()

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
        .maybeSingle()

      setProfile(p)
    }
  }

  const isCommunity = pathname?.startsWith('/community')
  const isDirectory =
    pathname === '/' ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/pricing') ||
    pathname?.startsWith('/register')

  const navClass = (active: boolean) =>
    active
      ? 'bg-amber-400 text-[#1a1a2e] font-extrabold'
      : 'bg-white/10 text-white/85 border border-white/10 font-bold hover:bg-white/15'

  return (
    <div className="bg-[#1a1a2e] text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-extrabold text-[16px] tracking-tight">
          <span className="text-amber-400">교차로</span> TEXAS
        </Link>

        <Link
          href="/community"
          className={`text-[12px] px-3 py-1.5 rounded-lg transition ${navClass(!!isCommunity)}`}
        >
          커뮤니티
        </Link>

        <Link
          href="/"
          className={`text-[12px] px-3 py-1.5 rounded-lg transition ${navClass(!!isDirectory)}`}
        >
          업소록
        </Link>
      </div>

      <div className="flex items-center gap-2 text-[12px]">
        {user ? (
          <>
            <span className="text-white/75 font-medium">
              {profile?.name || '회원'}
            </span>

            {profile?.role === 'super_admin' && (
              <span className="bg-red-500 px-2 py-1 rounded text-white text-[10px] font-extrabold">
                SA
              </span>
            )}

            {profile?.role === 'admin' && (
              <span className="bg-blue-500 px-2 py-1 rounded text-white text-[10px] font-extrabold">
                ADMIN
              </span>
            )}

            {profile?.role === 'owner' && (
              <span className="bg-emerald-500 px-2 py-1 rounded text-white text-[10px] font-extrabold">
                OWNER
              </span>
            )}
          </>
        ) : (
          <Link
            href="/auth/login"
            className="bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white/90 font-bold hover:bg-white/15"
          >
            로그인
          </Link>
        )}
      </div>
    </div>
  )
}
