'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function GlobalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [currentRegion, setCurrentRegion] = useState('houston')
  const [menuOpen, setMenuOpen] = useState(false)

  // ✅ 추가
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    init()
    syncRegionFromStorage()
    loadLogo() // ✅ 로고 불러오기

    const handleRegionChanged = (e: any) => {
      const nextRegion = e?.detail || 'houston'
      setCurrentRegion(nextRegion)
    }

    const handleStorage = () => {
      syncRegionFromStorage()
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('gj_region_changed', handleRegionChanged)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('gj_region_changed', handleRegionChanged)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    syncRegionFromStorage()
    setMenuOpen(false)
  }, [pathname])

  const init = async () => {
    const { data } = await sb.auth.getUser()
    setUser(data.user)

    if (data.user) {
      const { data: p } = await sb
        .from('user_profiles')
        .select('name, role')
        .eq('id', data.user.id)
        .maybeSingle()

      setProfile(p || null)
    } else {
      setProfile(null)
    }
  }

  // ✅ 로고 불러오기
  const loadLogo = async () => {
    const { data } = await sb
      .from('settings')
      .select('value')
      .eq('key', 'logo_url')
      .maybeSingle()

    if (data?.value) setLogoUrl(data.value)
  }

  const syncRegionFromStorage = () => {
    try {
      const savedRegion = localStorage.getItem('gj_region')
      if (savedRegion) setCurrentRegion(savedRegion)
      else setCurrentRegion('houston')
    } catch {
      setCurrentRegion('houston')
    }
  }

  const signOut = async () => {
    await sb.auth.signOut()
    setMenuOpen(false)
    router.push('/')
    router.refresh()
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
      ? 'bg-amber-400 text-[#1a1a2e] border border-amber-400'
      : 'bg-white/10 text-white/90 border border-white/15'

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')?.[0] ||
    '회원'

  return (
    <div className="bg-[#1a1a2e] text-white px-3 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">

        {/* ✅ 로고 부분 */}
        <Link
  href="/"
  className="flex items-center shrink-0"
  style={{ height: '40px', overflow: 'hidden' }}
>
  {logoUrl && (
    <img
      src={logoUrl}
      alt="logo"
      style={{
        height: '25px',
        maxHeight: '26px',
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )}
</Link>

        <div className="flex items-center gap-2 ml-2 min-w-0">
          <Link
            href={`/community/${currentRegion}`}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap shrink-0 ${navClass(!!isCommunity)}`}
          >
            커뮤니티
          </Link>

          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap shrink-0 ${navClass(!!isDirectory)}`}
          >
            업소록
          </Link>
        </div>
      </div>

      <div className="relative shrink-0" ref={menuRef}>
        {user ? (
          <>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition whitespace-nowrap"
            >
              <span className="text-[12px] font-semibold text-white/90 whitespace-nowrap">
                {displayName}
              </span>

              {profile?.role === 'super_admin' && (
                <span className="bg-red-500 px-2 py-0.5 rounded text-white text-[10px] font-extrabold whitespace-nowrap">
                  SA
                </span>
              )}

              <span className="text-white/60 text-[10px]">▾</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-[13px] font-bold text-slate-800 truncate">
                    {displayName}
                  </div>
                </div>

                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-3 text-[13px] font-medium text-red-500 hover:bg-red-50"
                >
                  로그아웃
                </button>
              </div>
            )}
          </>
        ) : (
          <Link
            href="/auth/login"
            className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-[12px] font-bold whitespace-nowrap shrink-0"
          >
            로그인
          </Link>
        )}
      </div>
    </div>
  )
}
