'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CAT_BG: Record<string, string> = {
  '식당·카페': 'bg-orange-50',
  '마트·식품': 'bg-yellow-50',
  '의료': 'bg-blue-50',
  '치과': 'bg-emerald-50',
  '법률': 'bg-violet-50',
  '자동차': 'bg-amber-50',
  '미용': 'bg-pink-50',
  '교육': 'bg-green-50',
  '금융·보험': 'bg-sky-50',
  '커뮤니티': 'bg-slate-50',
  '부동산': 'bg-orange-50',
  '세탁소': 'bg-teal-50',
  '한의원': 'bg-lime-50',
  '기타': 'bg-slate-100',
}

type Category = {
  id: string
  name: string
  icon: string
  sort_order: number
}

export default function Home() {
  const [biz, setBiz] = useState<any[]>([])
  const [siteName, setSiteName] = useState('교차로 휴스턴')
  const [headerLogoUrl, setHeaderLogoUrl] = useState('')
  const [headerLogoWidth, setHeaderLogoWidth] = useState(140)
  const [showTextLogo, setShowTextLogo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('전체')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('rating')
  const [sel, setSel] = useState<any>(null)
  const [favs, setFavs] = useState<string[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [user, setUser] = useState<any>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [bottomBanners, setBottomBanners] = useState<any[]>([])
  const [bottomBannerIndex, setBottomBannerIndex] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const SORTS = ['rating', 'review_count', 'name_en']
  const SORT_LABELS: Record<string, string> = {
    rating: '평점순',
    review_count: '리뷰순',
    name_en: '이름순',
  }

  useEffect(() => {
    sb.from('site_settings')
      .select('site_name, header_logo_url, header_logo_width, show_text_logo')
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return
        setSiteName(data.site_name || '교차로 휴스턴')
        setHeaderLogoUrl(data.header_logo_url || '')
        setHeaderLogoWidth(data.header_logo_width || 140)
        setShowTextLogo(!!data.show_text_logo)
      })

    try {
      setFavs(JSON.parse(localStorage.getItem('gj_favs') || '[]'))
    } catch {}

    sb.auth.getUser().then(({ data }) => setUser(data.user))

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))

    sb.from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(({ count, error }) => {
        if (!error && count !== null) setTotalCount(count)
      })

    sb.from('businesses')
      .select('category_main')
      .eq('is_active', true)
      .then(({ data }) => {
        if (!data) return
        const c: Record<string, number> = { 전체: data.length }
        data.forEach((b: any) => {
          c[b.category_main] = (c[b.category_main] || 0) + 1
        })
        setCounts(c)
      })

    sb.from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const allCat: Category = { id: 'all', name: '전체', icon: '🏠', sort_order: 0 }
        setCats([allCat, ...(data || [])])
      })

    sb.from('banners')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return

        const bottom = data.filter(
          (b: any) =>
            b.position === 'home_top' ||
            b.position === 'home_bottom' ||
            b.position === 'bottom' ||
            b.position === 'footer'
        )

        setBottomBanners(bottom)
      })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (bottomBanners.length <= 1) return
    const timer = setInterval(() => {
      setBottomBannerIndex((prev) => (prev + 1) % bottomBanners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [bottomBanners])

  const load = useCallback(async () => {
    setLoading(true)

    let q = sb.from('businesses').select('*').eq('is_active', true)

    if (cat !== '전체') q = q.eq('category_main', cat)

    if (search.trim()) {
      q = q.or(
        'name_en.ilike.%' +
          search +
          '%,name_kr.ilike.%' +
          search +
          '%,address.ilike.%' +
          search +
          '%'
      )
    }

    q = q.order('is_vip', { ascending: false })

    if (sort === 'name_en') q = q.order('name_en', { ascending: true })
    else q = q.order(sort as any, { ascending: false, nullsFirst: false })

    const { data } = await q.limit(300)
    setBiz(data || [])
    setLoading(false)
  }, [cat, search, sort])

  useEffect(() => {
    load()
  }, [load])

  const toggleFav = (id: string, e: any) => {
    e.stopPropagation()
    setFavs((prev) => {
      const next = prev.includes(id)
        ? prev.filter((f: string) => f !== id)
        : [...prev, id]
      localStorage.setItem('gj_favs', JSON.stringify(next))
      return next
    })
  }

  const signOut = async () => {
    await sb.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const currentBottomBanner =
    bottomBanners.length > 0 ? bottomBanners[bottomBannerIndex] : null

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto">
      <header className="bg-[#1a1a2e] sticky top-0 z-40 shadow-xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            {headerLogoUrl && !showTextLogo ? (
              <img
                src={headerLogoUrl}
                alt={siteName}
                className="h-8 w-auto"
                style={{ maxWidth: `${headerLogoWidth}px` }}
              />
            ) : (
              <h1 className="text-[20px] font-extrabold text-white">
                <span className="text-amber-400">교차로</span> 휴스턴
              </h1>
            )}

            <p className="text-[11px] text-white/40 mt-0.5">
              Houston, TX · 한인 비즈니스 디렉토리
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-amber-400 bg-amber-400/15 px-3 py-1 rounded-full">
              {totalCount}개
            </span>

            {user ? (
              <>
                <button
                  onClick={signOut}
                  className="text-[12px] font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15"
                >
                  로그아웃
                </button>

                <a
                  href="/dashboard"
                  className="text-[12px] font-bold text-[#1a1a2e] bg-amber-400 px-3 py-1.5 rounded-lg"
                >
                  내정보
                </a>
              </>
            ) : (
              <a
                href="/auth/login"
                className="text-[12px] font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15"
              >
                로그인
              </a>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-2">
          <div className="flex-1 bg-white/10 border border-white/15 rounded-lg flex items-center px-3 gap-2">
            <span className="text-white/40">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="업소명, 업종, 주소 검색..."
              className="bg-transparent border-none outline-none text-white text-[14px] w-full py-2.5 placeholder:text-white/30"
            />
          </div>

          <button
            onClick={() =>
              setSort((prev) => SORTS[(SORTS.indexOf(prev) + 1) % SORTS.length])
            }
            className="bg-white/10 border border-white/15 rounded-lg px-3 text-[12px] font-bold text-white/70 h-10"
          >
            {SORT_LABELS[sort]}
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-3.5 py-3.5">
        <div className="text-[11px] font-bold text-slate-400 tracking-widest mb-2.5">
          카테고리
        </div>

        {cats.length === 0 ? (
          <div className="text-[12px] text-slate-400 py-2">카테고리 불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {cats.map((c) => (
              <button
                key={c.name}
                onClick={() => setCat(c.name)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-[1.5px] transition-all active:scale-[.97] text-left ${
                  cat === c.name
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-[20px] w-6 text-center flex-shrink-0">{c.icon}</span>
                <span className="min-w-0">
                  <span
                    className={`text-[13px] font-bold block truncate ${
                      cat === c.name ? 'text-indigo-600' : 'text-slate-800'
                    }`}
                  >
                    {c.name}
                  </span>
                  <span
                    className={`text-[10px] block mt-0.5 ${
                      cat === c.name ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  >
                    {counts[c.name] ?? 0}개
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <main className="px-3 py-2.5 pb-44 space-y-2">
        {!user && (
          <a
            href="/auth/login"
            className="block bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl px-4 py-3 mb-2"
          >
            <div className="text-white font-bold text-[14px]">🏢 내 업소를 무료로 등록하세요!</div>
            <div className="text-white/70 text-[12px] mt-0.5">
              Google 로그인 → 업소 등록 → VIP 업그레이드
            </div>
          </a>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : biz.length === 0 ? (
          <div className="text-center py-20 text-slate-400">검색 결과가 없습니다</div>
        ) : (
          biz.map((b) => {
            const catInfo =
              cats.find((c) => c.name === b.category_main) || cats[cats.length - 1]
            const isFav = favs.includes(b.id)
            const addr =
              b.address?.split(',').slice(0, -2).join(',').trim() || b.address

            return (
              <div
                key={b.id}
                onClick={() => setSel(b)}
                className={`bg-white rounded-xl border px-4 py-3.5 flex gap-3 cursor-pointer active:scale-[.99] transition-all ${
                  b.is_vip ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${
                    CAT_BG[b.category_main] || 'bg-slate-50'
                  }`}
                >
                  {catInfo?.icon || '📋'}
                </div>

                <div className="flex-1 min-w-0">
                  {(b.is_vip || b.category_sub) && (
                    <div className="flex gap-1 mb-1 flex-wrap">
                      {b.is_vip && b.vip_tier && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-300 text-amber-900">
                          ⭐ {b.vip_tier.toUpperCase()}
                        </span>
                      )}
                      {b.category_sub && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {b.category_sub}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-[16px] font-bold text-slate-900 truncate">
                    {b.name_kr || b.name_en}
                  </div>

                  {addr && (
                    <div className="text-[12px] text-slate-500 truncate mt-0.5">{addr}</div>
                  )}

                  <div className="flex items-center gap-2.5 mt-1">
                    {b.rating > 0 && (
                      <span className="text-[12px] font-bold text-slate-800">
                        ★{Number(b.rating).toFixed(1)}{' '}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({(b.review_count || 0).toLocaleString()})
                        </span>
                      </span>
                    )}
                    {b.phone && (
                      <span className="text-[12px] font-bold text-indigo-600">{b.phone}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e: any) => toggleFav(b.id, e)}
                  className="flex-shrink-0 self-start pt-0.5 p-1"
                >
                  <span className={`text-xl ${isFav ? 'text-red-500' : 'text-slate-300'}`}>
                    {isFav ? '♥' : '♡'}
                  </span>
                </button>
              </div>
            )
          })
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-200 flex z-30">
        {[
          { href: '/', icon: '🏠', label: '홈', active: true },
          { href: '/register', icon: '➕', label: '업소등록', active: false },
          { href: '/pricing', icon: '⭐', label: 'VIP', active: false },
          {
            href: user ? '/dashboard' : '/auth/login',
            icon: '👤',
            label: user ? '내정보' : '로그인',
            active: false,
          },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${
              item.active ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </a>
        ))}
      </nav>

      {sel && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={(e: any) => e.target === e.currentTarget && setSel(null)}
        >
          <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto pb-10">
            <div className="flex justify-end px-5 pt-4">
              <button onClick={() => setSel(null)} className="text-slate-400 text-2xl">
                ✕
              </button>
            </div>

            <div className="px-5 pb-4 border-b border-slate-100">
              <div className="text-[12px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-2">
                {sel.category_main}
                {sel.category_sub ? ' · ' + sel.category_sub : ''}
              </div>

              <h2 className="text-[22px] font-extrabold text-slate-900">
                {sel.name_kr || sel.name_en}
              </h2>

              {sel.name_kr && sel.name_en && (
                <p className="text-[13px] text-slate-400">{sel.name_en}</p>
              )}

              {sel.rating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-amber-400">
                    {'★'.repeat(Math.round(Number(sel.rating)))}
                  </span>
                  <span className="font-bold">{Number(sel.rating).toFixed(1)}</span>
                  <span className="text-[13px] text-slate-400">
                    ({(sel.review_count || 0).toLocaleString()}개)
                  </span>
                </div>
              )}

              {sel.description_kr && (
                <p className="text-[13px] text-slate-600 mt-3 leading-relaxed bg-slate-50 rounded-lg px-3 py-2.5">
                  {sel.description_kr}
                </p>
              )}
            </div>

            <div className="px-5 py-2 space-y-3">
              {sel.address && (
                <div className="flex gap-3 py-2">
                  <span>📍</span>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">주소</div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sel.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[14px] font-semibold text-indigo-600 underline"
                    >
                      {sel.address}
                    </a>
                  </div>
                </div>
              )}

              {sel.phone && (
                <div className="flex gap-3 py-2">
                  <span>📞</span>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">전화</div>
                    <a
                      href={'tel:' + sel.phone}
                      className="text-[14px] font-semibold text-indigo-600"
                    >
                      {sel.phone}
                    </a>
                  </div>
                </div>
              )}

              {sel.website && (
                <div className="flex gap-3 py-2">
                  <span>🌐</span>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      웹사이트
                    </div>
                    <a
                      href={sel.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[14px] font-semibold text-indigo-600"
                    >
                      방문하기 →
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 px-5 pt-2">
              {sel.phone && (
                <a
                  href={'tel:' + sel.phone}
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl text-[14px] font-bold text-center"
                >
                  📞 전화하기
                </a>
              )}

              {sel.website && (
                <a
                  href={sel.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-indigo-50 text-indigo-600 py-3.5 rounded-xl text-[14px] font-bold text-center"
                >
                  🌐 홈페이지
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {currentBottomBanner && (
        <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto z-40 px-3">
          <a
            href={currentBottomBanner.link_url || '#'}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white"
          >
            {currentBottomBanner.image_url ? (
              <img
                src={currentBottomBanner.image_url}
                alt={currentBottomBanner.title || '배너'}
                className="w-full h-20 object-cover"
              />
            ) : (
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                <div className="text-[14px] font-extrabold">
                  {currentBottomBanner.title || '광고 배너'}
                </div>
                {currentBottomBanner.subtitle && (
                  <div className="text-[12px] text-white/80 mt-0.5">
                    {currentBottomBanner.subtitle}
                  </div>
                )}
              </div>
            )}
          </a>
        </div>
      )}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-24 right-4 w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
      >
        ↑
      </button>
    </div>
  )
}
