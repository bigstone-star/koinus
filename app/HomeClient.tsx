'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CAT_BG: Record<string, string> = {
  '식당·카페': 'bg-orange-50',
  '마트·식품': 'bg-yellow-50',
  의료: 'bg-blue-50',
  치과: 'bg-emerald-50',
  법률: 'bg-violet-50',
  자동차: 'bg-amber-50',
  미용: 'bg-pink-50',
  교육: 'bg-green-50',
  '금융·보험': 'bg-sky-50',
  커뮤니티: 'bg-slate-50',
  부동산: 'bg-orange-50',
  세탁소: 'bg-teal-50',
  한의원: 'bg-lime-50',
  기타: 'bg-slate-100',
}

const REVIEW_TAGS = [
  '친절함',
  '가격 좋음',
  '깨끗함',
  '주차 편함',
  '맛있음',
  '재방문 의사',
  '전문적임',
  '응답 빠름',
]

const REGIONS = [
  { value: 'houston', label: 'Houston' },
  { value: 'dallas', label: 'Dallas' },
  { value: 'fort_worth', label: 'Fort Worth' },
  { value: 'central_texas', label: 'Central Texas' },
]

const REGION_META: Record<string, { title: string; subtitle: string }> = {
  houston: {
    title: '교차로 휴스턴',
    subtitle: 'Houston, TX · 한인 비즈니스 디렉토리',
  },
  dallas: {
    title: '교차로 달라스',
    subtitle: 'Dallas, TX · 한인 비즈니스 디렉토리',
  },
  fort_worth: {
    title: '교차로 포트워스',
    subtitle: 'Fort Worth, TX · 한인 비즈니스 디렉토리',
  },
  central_texas: {
  title: '교차로 텍사스 중부',
  subtitle: 'Central Texas · 한인 비즈니스 디렉토리',
},
}

type Category = {
  id: string
  name: string
  icon: string
  sort_order: number
}

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasInitializedFromUrl = useRef(false)
  const hasWrittenUrl = useRef(false)

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
  const [totalCount, setTotalCount] = useState(0)
  const [region, setRegion] = useState('houston')

const [topBanners, setTopBanners] = useState<any[]>([])
const [middleBanners, setMiddleBanners] = useState<any[]>([])
const [bottomBanners, setBottomBanners] = useState<any[]>([])
const [categoryTopBanners, setCategoryTopBanners] = useState<any[]>([])

const [topBannerIndex, setTopBannerIndex] = useState(0)
const [middleBannerIndex, setMiddleBannerIndex] = useState(0)
const [bottomBannerIndex, setBottomBannerIndex] = useState(0)
const [categoryTopBannerIndex, setCategoryTopBannerIndex] = useState(0)

  const [reviews, setReviews] = useState<any[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [myReview, setMyReview] = useState<any>(null)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review_text: '',
    tags: [] as string[],
  })

  const [claimLoading, setClaimLoading] = useState(false)

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

    sb.from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const allCat: Category = {
          id: 'all',
          name: '전체',
          icon: '🏠',
          sort_order: 0,
        }
        setCats([allCat, ...(data || [])])
      })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (hasInitializedFromUrl.current) return

    const urlRegion = searchParams.get('region')
    const urlSearch = searchParams.get('search')
    const urlCat = searchParams.get('cat')
    const urlSort = searchParams.get('sort')

    if (urlRegion) {
      setRegion(urlRegion)
    } else {
      try {
        const savedRegion = localStorage.getItem('gj_region')
        if (savedRegion) setRegion(savedRegion)
      } catch {}
    }

    if (urlSearch) setSearch(urlSearch)
    if (urlCat) setCat(urlCat)
    if (urlSort && SORTS.includes(urlSort)) setSort(urlSort)

    hasInitializedFromUrl.current = true
  }, [searchParams])

  useEffect(() => {
    try {
      localStorage.setItem('gj_region', region)
    } catch {}
  }, [region])

  useEffect(() => {
    if (!hasInitializedFromUrl.current) return

    const params = new URLSearchParams()

    if (region) params.set('region', region)
    if (search.trim()) params.set('search', search.trim())
    if (cat && cat !== '전체') params.set('cat', cat)
    if (sort && sort !== 'rating') params.set('sort', sort)

    const qs = params.toString()
    const nextUrl = qs ? `/?${qs}` : '/'

    if (!hasWrittenUrl.current) {
      hasWrittenUrl.current = true
      return
    }

    router.replace(nextUrl, { scroll: false })
  }, [region, search, cat, sort, router])

  useEffect(() => {
    sb.from('businesses')
      .select('category_main')
      .eq('is_active', true)
      .eq('approved', true)
      .eq('metro_area', region)
      .then(({ data }) => {
        if (!data) return
        const c: Record<string, number> = { 전체: data.length }
        data.forEach((b: any) => {
          c[b.category_main] = (c[b.category_main] || 0) + 1
        })
        setCounts(c)
      })

    sb.from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('approved', true)
      .eq('metro_area', region)
      .then(({ count, error }) => {
        if (!error && count !== null) setTotalCount(count)
      })
  }, [region])

useEffect(() => {
  sb.from('banners')
    .select('*')
    .eq('is_active', true)
    .eq('metro_area', region)
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (error || !data) {
        setTopBanners([])
        setMiddleBanners([])
        setBottomBanners([])
        setCategoryTopBanners([])
        return
      }

      const top = data.filter((b: any) => b.position === 'home_top')
      const middle = data.filter((b: any) => b.position === 'home_middle')
      const bottom = data.filter((b: any) => b.position === 'home_bottom')
      const categoryTop = data.filter((b: any) => b.position === 'category_top')

      setTopBanners(top)
      setMiddleBanners(middle)
      setBottomBanners(bottom)
      setCategoryTopBanners(categoryTop)

      setTopBannerIndex(0)
      setMiddleBannerIndex(0)
      setBottomBannerIndex(0)
      setCategoryTopBannerIndex(0)
    })
}, [region])

  useEffect(() => {
    if (topBanners.length <= 1) return
    const timer = setInterval(() => {
      setTopBannerIndex((prev) => (prev + 1) % topBanners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [topBanners])

  useEffect(() => {
    if (middleBanners.length <= 1) return
    const timer = setInterval(() => {
      setMiddleBannerIndex((prev) => (prev + 1) % middleBanners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [middleBanners])

  useEffect(() => {
    if (bottomBanners.length <= 1) return
    const timer = setInterval(() => {
      setBottomBannerIndex((prev) => (prev + 1) % bottomBanners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [bottomBanners])

  useEffect(() => {
  if (categoryTopBanners.length <= 1) return
  const timer = setInterval(() => {
    setCategoryTopBannerIndex((prev) => (prev + 1) % categoryTopBanners.length)
  }, 4000)
  return () => clearInterval(timer)
}, [categoryTopBanners])
  
  const load = useCallback(async () => {
    setLoading(true)

    let q = sb
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .eq('approved', true)
      .eq('metro_area', region)

    if (cat !== '전체') q = q.eq('category_main', cat)

    const normalizedSearch = search.replace(/\s+/g, ' ').trim()

    if (normalizedSearch) {
      q = q.or(
        [
          `name_en.ilike.%${normalizedSearch}%`,
          `name_kr.ilike.%${normalizedSearch}%`,
          `category_main.ilike.%${normalizedSearch}%`,
          `category_sub.ilike.%${normalizedSearch}%`,
          `address.ilike.%${normalizedSearch}%`,
          `phone.ilike.%${normalizedSearch}%`,
          `city.ilike.%${normalizedSearch}%`,
        ].join(',')
      )
    }

q = q
  .order('is_vip', { ascending: false })
  .order('korean_score', { ascending: false, nullsFirst: false })
  .order('rating', { ascending: false, nullsFirst: false })
  .order('review_count', { ascending: false, nullsFirst: false })

if (sort === 'name_en') {
  q = q.order('name_en', { ascending: true })
}

    const { data, error } = await q.limit(300)

    if (error) {
      console.error('business load error:', error)
      setBiz([])
    } else {
      setBiz(data || [])
    }

    setLoading(false)
  }, [cat, search, sort, region])

  useEffect(() => {
    if (!hasInitializedFromUrl.current) return
    load()
  }, [load])

  const loadReviews = useCallback(
    async (businessId: string) => {
      setReviewLoading(true)

      const { data, error } = await sb
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('reviews load error:', error)
        setReviews([])
        setMyReview(null)
        setReviewLoading(false)
        return
      }

      const list = data || []
      setReviews(list)

      if (user) {
        const mine = list.find((r: any) => r.user_id === user.id) || null
        setMyReview(mine)

        if (mine) {
          setReviewForm({
            rating: mine.rating || 5,
            review_text: mine.review_text || '',
            tags: mine.tags || [],
          })
        } else {
          setReviewForm({
            rating: 5,
            review_text: '',
            tags: [],
          })
        }
      } else {
        setMyReview(null)
        setReviewForm({
          rating: 5,
          review_text: '',
          tags: [],
        })
      }

      setReviewLoading(false)
    },
    [user]
  )

  const toggleReviewTag = (tag: string) => {
    setReviewForm((prev) => {
      const exists = prev.tags.includes(tag)
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      }
    })
  }

  const saveReview = async () => {
    if (!user) {
      alert('리뷰 작성은 로그인 후 가능합니다.')
      return
    }

    if (!sel?.id) return

    if (!reviewForm.review_text.trim()) {
      alert('한 줄 리뷰를 입력하세요.')
      return
    }

    setReviewSaving(true)

    const payload = {
      business_id: sel.id,
      user_id: user.id,
      rating: reviewForm.rating,
      review_text: reviewForm.review_text.trim(),
      tags: reviewForm.tags,
      is_active: true,
    }

    let error = null

    if (myReview) {
      const res = await sb.from('reviews').update(payload).eq('id', myReview.id)
      error = res.error
    } else {
      const res = await sb.from('reviews').insert(payload)
      error = res.error
    }

    setReviewSaving(false)

    if (error) {
      alert('리뷰 저장 실패: ' + error.message)
      return
    }

    await loadReviews(sel.id)
    alert(myReview ? '리뷰가 수정되었습니다.' : '리뷰가 등록되었습니다.')
  }

  const requestOwnerClaim = async () => {
    if (!user) {
      alert('오너 자격 요청은 로그인 후 가능합니다.')
      return
    }

    if (!sel?.id) return

    const message = prompt(
      '오너 자격 요청 메시지를 입력하세요.\n예: 안녕하세요. 이 업소의 실제 운영자입니다. 확인 후 오너 권한 부탁드립니다.'
    )

    if (!message || !message.trim()) return

    try {
      setClaimLoading(true)

      const { data: existing, error: existingError } = await sb
        .from('business_claim_requests')
        .select('id, status')
        .eq('business_id', sel.id)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(1)

      if (existingError) {
        alert('기존 요청 확인 실패: ' + existingError.message)
        return
      }

      if (existing && existing.length > 0) {
        alert('이미 대기 중인 오너 자격 요청이 있습니다.')
        return
      }

      const { error } = await sb.from('business_claim_requests').insert({
        business_id: sel.id,
        user_id: user.id,
        message: message.trim(),
        status: 'pending',
      })

      if (error) {
        alert('오너 자격 요청 실패: ' + error.message)
        return
      }

      alert('✅ 오너 자격 요청이 접수되었습니다. 관리자 확인 후 승인됩니다.')
    } finally {
      setClaimLoading(false)
    }
  }

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
    router.push('/')
  }

  const handleBannerClick = async (banner: any) => {
    if (!banner?.id) return

    try {
      await sb
        .from('banners')
        .update({ click_count: (banner.click_count || 0) + 1 })
        .eq('id', banner.id)
    } catch (error) {
      console.error('banner click count update failed:', error)
    }
  }

  const closeModal = () => {
    setSel(null)
    setReviews([])
    setMyReview(null)
    setReviewForm({
      rating: 5,
      review_text: '',
      tags: [],
    })
  }

  const currentTopBanner =
  topBanners.length > 0 ? topBanners[topBannerIndex] : null

const currentMiddleBanner =
  middleBanners.length > 0 ? middleBanners[middleBannerIndex] : null

const currentBottomBanner =
  bottomBanners.length > 0 ? bottomBanners[bottomBannerIndex] : null

const currentCategoryTopBanner =
  categoryTopBanners.length > 0 ? categoryTopBanners[categoryTopBannerIndex] : null

  const renderBanner = (banner: any, className = '') => {
    if (!banner) return null

    return (
      <a
        href={banner.link_url || '#'}
        target="_blank"
        rel="noreferrer"
        onClick={() => handleBannerClick(banner)}
        className={`block rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white ${className}`}
      >
        {banner.image_url ? (
          <img
            src={banner.image_url}
            alt={banner.title || '배너'}
            className="w-full h-20 object-cover"
          />
        ) : (
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
            <div className="text-[14px] font-extrabold">
              {banner.title || '광고 배너'}
            </div>
            {banner.subtitle && (
              <div className="text-[12px] text-white/80 mt-0.5">
                {banner.subtitle}
              </div>
            )}
          </div>
        )}
      </a>
    )
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
        reviews.length
      : 0

  const regionMeta = REGION_META[region] || REGION_META.houston
  const displaySiteName =
    headerLogoUrl && !showTextLogo ? siteName : regionMeta.title

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
                {displaySiteName.startsWith('교차로 ') ? (
                  <>
                    <span className="text-amber-400">교차로</span>{' '}
                    {displaySiteName.replace('교차로 ', '')}
                  </>
                ) : (
                  displaySiteName
                )}
              </h1>
            )}

            <p className="text-[11px] text-white/40 mt-0.5">
              {regionMeta.subtitle}
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

                <Link
                  href="/dashboard"
                  className="text-[12px] font-bold text-[#1a1a2e] bg-amber-400 px-3 py-1.5 rounded-lg"
                >
                  내정보
                </Link>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-[12px] font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15"
              >
                로그인
              </Link>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-2">
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value)
              setCat('전체')
            }}
            className="bg-white/10 border border-white/15 rounded-lg px-3 text-[12px] font-bold text-white/80 h-10"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value} className="text-black">
                {r.label}
              </option>
            ))}
          </select>

          <div className="flex-1 bg-white/10 border border-white/15 rounded-lg flex items-center px-3 gap-2">
            <span className="text-white/40">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="업소명, 한글명, 업종, 주소, 전화번호 검색..."
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

      {currentTopBanner && (
        <div className="px-3 pt-3">{renderBanner(currentTopBanner)}</div>
      )}

      {cat === '전체' ? (
        <div className="bg-white border-b border-slate-200 px-3.5 py-3.5 mt-3">
          <div className="text-[11px] font-bold text-slate-400 tracking-widest mb-2.5">
            카테고리
          </div>

          {cats.length === 0 ? (
            <div className="text-[12px] text-slate-400 py-2">
              카테고리 불러오는 중...
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {cats.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setCat(c.name)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-[1.5px] border-slate-200 bg-white transition-all active:scale-[.97] text-left hover:bg-slate-50"
                >
                  <span className="text-[20px] w-6 text-center flex-shrink-0">
                    {c.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="text-[13px] font-bold block truncate text-slate-800">
                      {c.name}
                    </span>
                    <span className="text-[10px] block mt-0.5 text-slate-400">
                      {counts[c.name] ?? 0}개
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
     ) : (
  <>
    <div className="bg-white border-b border-slate-200 px-4 py-3 mt-3">
      <button
        onClick={() => setCat('전체')}
        className="text-[13px] font-bold text-slate-700 truncate text-left"
      >
        <span className="text-indigo-600">전체</span>
        <span className="text-slate-300 mx-1">&gt;</span>
        <span>{cat}</span>
      </button>
    </div>

    {currentCategoryTopBanner && (
      <div className="px-3 pt-3">{renderBanner(currentCategoryTopBanner)}</div>
    )}
  </>
)}

      <main className="px-3 py-2.5 pb-44 space-y-2">
        {!user && (
  <Link
    href="/auth/login"
    className="block bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl px-4 py-3 mb-2"
  >
    <div className="text-white font-bold text-[14px]">
      🏢 내 업소를 무료로 등록하세요!
    </div>
    <div className="text-white/70 text-[12px] mt-0.5">
      Google 로그인 → 업소 등록 → VIP 업그레이드
    </div>
  </Link>
)}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : biz.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            검색 결과가 없습니다
          </div>
        ) : (
          biz.map((b, index) => {
            const catInfo =
              cats.find((c) => c.name === b.category_main) || cats[cats.length - 1]
            const isFav = favs.includes(b.id)
            const addr =
              b.address?.split(',').slice(0, -2).join(',').trim() || b.address

            return (
              <div key={b.id}>
                <div
                  onClick={async () => {
                    setSel(b)
                    await loadReviews(b.id)
                  }}
                  className={`bg-white rounded-xl border px-4 py-3.5 flex gap-3 cursor-pointer active:scale-[.99] transition-all ${
                    b.is_vip
                      ? 'border-amber-300 bg-amber-50/30'
                      : 'border-slate-200'
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
                      <div className="text-[12px] text-slate-500 truncate mt-0.5">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            addr
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline underline"
                        >
                          {addr}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                      {b.city && (
                        <span className="text-[11px] font-bold text-slate-400">
                          {b.city}
                        </span>
                      )}
                      {b.rating > 0 && (
                        <span className="text-[12px] font-bold text-slate-800">
                          ★{Number(b.rating).toFixed(1)}{' '}
                          <span className="text-[11px] font-normal text-slate-400">
                            ({(b.review_count || 0).toLocaleString()})
                          </span>
                        </span>
                      )}
                      {b.phone && (
                        <span className="text-[12px] font-bold text-indigo-600">
                          {b.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e: any) => toggleFav(b.id, e)}
                    className="flex-shrink-0 self-start pt-0.5 p-1"
                  >
                    <span
                      className={`text-xl ${
                        isFav ? 'text-red-500' : 'text-slate-300'
                      }`}
                    >
                      {isFav ? '♥' : '♡'}
                    </span>
                  </button>
                </div>

                {currentMiddleBanner && index === 3 && (
                  <div className="pt-2">{renderBanner(currentMiddleBanner)}</div>
                )}
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
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${
              item.active ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        ))}
      </nav>

      {sel && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={(e: any) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto pb-10">
            <div className="flex justify-end px-5 pt-4">
              <button
                onClick={closeModal}
                className="text-slate-400 text-2xl"
              >
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
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">
                      {'★'.repeat(Math.max(1, Math.round(Number(sel.rating))))}
                    </span>
                    <span className="font-bold">
                      {Number(sel.rating).toFixed(1)}
                    </span>
                    <span className="text-[13px] text-slate-400">
                      외부 평점 · {(sel.review_count || 0).toLocaleString()}개
                    </span>
                  </div>
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
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      주소
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        sel.address
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline text-[14px] font-semibold text-indigo-600 underline"
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
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      전화
                    </div>
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

            <div className="px-5 pt-4 border-t border-slate-100 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[16px] font-extrabold text-slate-900">
                    리뷰
                  </div>
                  <div className="text-[12px] text-slate-400 mt-0.5">
                    {reviews.length > 0
                      ? `평균 ★${avgRating.toFixed(1)} · ${reviews.length}개`
                      : '아직 리뷰가 없습니다'}
                  </div>
                </div>
              </div>

              {user ? (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
                  <div className="text-[13px] font-bold text-slate-700 mb-3">
                    {myReview ? '내 리뷰 수정' : '리뷰 작성'}
                  </div>

                  <div className="mb-3">
                    <div className="text-[11px] font-bold text-slate-400 mb-2">
                      별점
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            setReviewForm((prev) => ({ ...prev, rating: n }))
                          }
                          className={`text-2xl ${
                            n <= reviewForm.rating
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-[11px] font-bold text-slate-400 mb-2">
                      한 줄 리뷰
                    </div>
                    <textarea
                      value={reviewForm.review_text}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          review_text: e.target.value,
                        }))
                      }
                      rows={3}
                      maxLength={120}
                      placeholder="예: 친절하고 빠르게 응대해줘요"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400 resize-none bg-white"
                    />
                  </div>

                  <div className="mb-4">
                    <div className="text-[11px] font-bold text-slate-400 mb-2">
                      태그
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {REVIEW_TAGS.map((tag) => {
                        const active = reviewForm.tags.includes(tag)
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleReviewTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    onClick={saveReview}
                    disabled={reviewSaving}
                    className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-[13px] font-bold disabled:opacity-50"
                  >
                    {reviewSaving
                      ? '저장 중...'
                      : myReview
                        ? '리뷰 수정하기'
                        : '리뷰 등록하기'}
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="block bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4 text-[13px] text-slate-600"
                >
                  리뷰 작성은 로그인 후 가능합니다.
                </Link>
              )}

              {reviewLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-[13px] text-slate-400 py-4">
                  첫 리뷰를 남겨보세요.
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[13px] font-bold text-slate-800">
                          {'★'.repeat(Number(r.rating || 0))}
                          <span className="ml-2 text-slate-500">
                            {Number(r.rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {r.review_text && (
                        <div className="text-[13px] text-slate-700 leading-relaxed mb-2">
                          {r.review_text}
                        </div>
                      )}

                      {r.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {r.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
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

            <div className="px-5 pt-3">
              <button
                onClick={requestOwnerClaim}
                disabled={claimLoading}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl text-[13px] font-bold disabled:opacity-50"
              >
                {claimLoading ? '요청 중...' : '이 업소는 제 것입니다'}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentBottomBanner && (
        <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto z-40 px-3">
          {renderBanner(currentBottomBanner)}
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
