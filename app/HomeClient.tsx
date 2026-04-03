'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import HomeCommunityLatest from '@/components/home/HomeCommunityLatest'
import HomeCategoryGrid from '@/components/home/HomeCategoryGrid'
import HomeVipBusinesses from '@/components/home/HomeVipBusinesses'
import HomeBusinessList from '@/components/home/HomeBusinessList'
import HomeBusinessModal from '@/components/home/HomeBusinessModal'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

type Category = {
  id: string
  name: string
  icon: string
  sort_order: number
}

type CommunityPreviewPost = {
  id: string
  region: string
  post_type: 'general' | 'question' | 'recommend' | 'news'
  title: string
  like_count?: number | null
  comment_count?: number | null
  created_at?: string | null
  business_id?: string | null
}

type SortType = 'rating' | 'review_count' | 'name_en'

type HomeSection = {
  id: string
  section_key: string
  section_label: string
  is_enabled: boolean
  sort_order: number
}

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasInitializedFromUrl = useRef(false)
  const hasWrittenUrl = useRef(false)

  const [sections, setSections] = useState<HomeSection[]>([])

  const [biz, setBiz] = useState<any[]>([])
  const [vipBiz, setVipBiz] = useState<any[]>([])
  const [communityPosts, setCommunityPosts] = useState<CommunityPreviewPost[]>([])
  const [relatedCommunityPosts, setRelatedCommunityPosts] = useState<CommunityPreviewPost[]>([])

  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('전체')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortType>('rating')
  const [sel, setSel] = useState<any>(null)
  const [favs, setFavs] = useState<string[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [user, setUser] = useState<any>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [region, setRegion] = useState('houston')

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
  const [relatedPostsLoading, setRelatedPostsLoading] = useState(false)

  useEffect(() => {
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

    loadSections()

    return () => subscription.unsubscribe()
  }, [])

  const loadSections = async () => {
    const { data, error } = await sb
      .from('home_sections')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      setSections([
        { id: '1', section_key: 'community_latest', section_label: '커뮤니티 최신글', is_enabled: true, sort_order: 1 },
        { id: '2', section_key: 'category_grid', section_label: '업소 카테고리', is_enabled: true, sort_order: 2 },
        { id: '3', section_key: 'vip_businesses', section_label: '지역 추천업소', is_enabled: true, sort_order: 3 },
        { id: '4', section_key: 'business_list', section_label: '일반 업소 리스트', is_enabled: true, sort_order: 4 },
      ])
      return
    }

    setSections(data as HomeSection[])
  }

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
    if (
      urlSort === 'rating' ||
      urlSort === 'review_count' ||
      urlSort === 'name_en'
    ) {
      setSort(urlSort)
    }

    hasInitializedFromUrl.current = true
  }, [searchParams])

  useEffect(() => {
    try {
      localStorage.setItem('gj_region', region)
      window.dispatchEvent(
        new CustomEvent('gj_region_changed', { detail: region })
      )
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
  const loadCounts = async () => {
    try {
      // 전체 업소 수
      const { count: total, error: totalError } = await sb
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('metro_area', region)

      if (!totalError && total !== null) {
        setTotalCount(total)
      }

      // 카테고리별 개수
      // cats가 아직 없으면 전체만 반영
      if (!cats || cats.length === 0) {
        setCounts({ 전체: total || 0 })
        return
      }

      const nextCounts: Record<string, number> = {
        전체: total || 0,
      }

      const realCategories = cats.filter((c) => c.name !== '전체')

      const results = await Promise.all(
        realCategories.map(async (category) => {
          const { count, error } = await sb
            .from('businesses')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .eq('metro_area', region)
            .eq('category_main', category.name)

          return {
            name: category.name,
            count: !error && count !== null ? count : 0,
          }
        })
      )

      results.forEach((item) => {
        nextCounts[item.name] = item.count
      })

      setCounts(nextCounts)
    } catch (e) {
      console.error('loadCounts error:', e)
    }
  }

  loadCounts()
}, [region, cats])

  const loadVipBusinesses = useCallback(async () => {
  let q = sb
    .from('businesses')
    .select('*')
    .eq('is_active', true)
    .eq('approved', true)
    .eq('metro_area', region)
    .eq('is_vip', true)

  // ✅ 카테고리 필터 추가
  if (cat !== '전체') {
    q = q.eq('category_main', cat)
  }

  const { data, error } = await q
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(6)

  if (error) {
    console.error(error)
    setVipBiz([])
    return
  }

  setVipBiz(data || [])
}, [region, cat])

  const loadCommunityPreview = useCallback(async () => {
    const { data, error } = await sb
      .from('community_posts')
      .select('id, region, post_type, title, like_count, comment_count, created_at')
      .eq('region', region)
      .eq('is_active', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('community preview load error:', error)
      setCommunityPosts([])
      return
    }

    setCommunityPosts((data || []) as CommunityPreviewPost[])
  }, [region])

  const loadRelatedCommunityPosts = useCallback(
    async (businessId: string) => {
      setRelatedPostsLoading(true)

      const { data, error } = await sb
        .from('community_posts')
        .select('id, region, post_type, title, like_count, comment_count, created_at, business_id')
        .eq('region', region)
        .eq('is_active', true)
        .eq('business_id', businessId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4)

      if (error) {
        console.error('related community posts load error:', error)
        setRelatedCommunityPosts([])
        setRelatedPostsLoading(false)
        return
      }

      setRelatedCommunityPosts((data || []) as CommunityPreviewPost[])
      setRelatedPostsLoading(false)
    },
    [region]
  )

  const load = useCallback(async () => {
    setLoading(true)

    let q = sb
      .from('businesses')
      .select('*')
      .eq('is_active', true)
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
      .order('is_vip', { ascending: true })
      .order('rating', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false, nullsFirst: false })

    if (sort === 'name_en') {
      q = q.order('name_en', { ascending: true })
    } else {
      q = q.order(sort, { ascending: false, nullsFirst: false })
    }

    const { data, error } = await q.limit(20)

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
    loadCommunityPreview()
    loadVipBusinesses()
    load()
  }, [loadCommunityPreview, loadVipBusinesses, load])

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

  const closeModal = () => {
    setSel(null)
    setReviews([])
    setMyReview(null)
    setRelatedCommunityPosts([])
    setReviewForm({
      rating: 5,
      review_text: '',
      tags: [],
    })
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
      : 0

  const regionLabel = REGIONS.find((r) => r.value === region)?.label || region

  const openBusiness = async (b: any) => {
    setSel(b)
    await loadReviews(b.id)
    await loadRelatedCommunityPosts(b.id)
  }

  const enabledSectionKeys = useMemo(
    () => sections.filter((s) => s.is_enabled).sort((a, b) => a.sort_order - b.sort_order),
    [sections]
  )

  const sectionMap: Record<string, React.ReactNode> = {
    community_latest: (
      <HomeCommunityLatest
        posts={communityPosts}
        region={region}
        regionLabel={regionLabel}
      />
    ),
    category_grid: (
      <HomeCategoryGrid
        cats={cats}
        selected={cat}
        counts={counts}
        onSelectCategory={(name) => setCat(name)}
      />
    ),
    vip_businesses: (
      <HomeVipBusinesses vipBiz={vipBiz} onOpenBusiness={openBusiness} />
    ),
    business_list: (
      <div className="px-3 py-3 pb-44">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <HomeBusinessList
            biz={biz}
            cats={cats}
            favs={favs}
            onToggleFav={toggleFav}
            onOpenBusiness={openBusiness}
          />
        )}
      </div>
    ),
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto">
      <div className="bg-white border-b border-slate-200 px-3 py-3 sticky top-[56px] z-20">
        <div className="flex gap-2">
          <select
            value={region}
            onChange={(e) => {
              const nextRegion = e.target.value
              setRegion(nextRegion)
              setCat('전체')
            }}
            className="h-10 border border-slate-200 rounded-lg px-3 text-[12px] font-bold text-slate-700 bg-white whitespace-nowrap"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <div className="flex-1 border border-slate-200 rounded-lg flex items-center px-3 gap-2 bg-white">
            <span className="text-slate-300">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="업소명, 업종, 주소, 전화번호 검색"
              className="w-full bg-transparent border-none outline-none text-[13px] text-slate-700 py-2.5 placeholder:text-slate-400"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="h-10 border border-slate-200 rounded-lg px-3 text-[12px] font-bold text-slate-700 bg-white whitespace-nowrap"
          >
            <option value="rating">평점순</option>
            <option value="review_count">리뷰순</option>
            <option value="name_en">이름순</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400 mt-2">
          총 {totalCount}개 업소
        </div>
      </div>

      {enabledSectionKeys.map((section) => (
        <div key={section.id} className={section.section_key === 'business_list' ? '' : 'px-3 pt-3'}>
          {sectionMap[section.section_key]}
        </div>
      ))}

      <HomeBusinessModal
  sel={sel}
  onClose={closeModal}
/>
    </div>
  )
}
