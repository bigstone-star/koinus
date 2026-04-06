'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowser } from '@/lib/supabase'
import HomeCommunityLatest from '@/components/home/HomeCommunityLatest'
import HomeCategoryGrid from '@/components/home/HomeCategoryGrid'
import HomeVipBusinesses from '@/components/home/HomeVipBusinesses'
import HomeBusinessList from '@/components/home/HomeBusinessList'
import HomeBusinessModal from '@/components/home/HomeBusinessModal'

const sb = createBrowser()

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

function normalizeText(value: any) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeSearch(value: string) {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
}

function getSortableName(business: any) {
  return normalizeText(business?.name_kr || business?.name_en || '')
}

function applyBusinessSort(list: any[], sort: SortType) {
  const copied = [...list]

  copied.sort((a, b) => {
    const aVip = a?.is_vip ? 1 : 0
    const bVip = b?.is_vip ? 1 : 0
    if (bVip !== aVip) return bVip - aVip

    if (sort === 'name_en') {
      const byName = getSortableName(a).localeCompare(getSortableName(b), 'ko')
      if (byName !== 0) return byName
    } else if (sort === 'review_count') {
      const byReviewCount = Number(b?.review_count || 0) - Number(a?.review_count || 0)
      if (byReviewCount !== 0) return byReviewCount

      const byRating = Number(b?.rating || 0) - Number(a?.rating || 0)
      if (byRating !== 0) return byRating
    } else {
      const byRating = Number(b?.rating || 0) - Number(a?.rating || 0)
      if (byRating !== 0) return byRating

      const byReviewCount = Number(b?.review_count || 0) - Number(a?.review_count || 0)
      if (byReviewCount !== 0) return byReviewCount
    }

    const fallbackByName = getSortableName(a).localeCompare(getSortableName(b), 'ko')
    if (fallbackByName !== 0) return fallbackByName

    return 0
  })

  return copied
}

function getSearchScore(business: any, rawSearch: string) {
  const normalizedSearch = normalizeText(rawSearch)
  const tokens = tokenizeSearch(rawSearch)

  if (!normalizedSearch || tokens.length === 0) return 0

  const nameKr = normalizeText(business?.name_kr)
  const nameEn = normalizeText(business?.name_en)
  const categoryMain = normalizeText(business?.category_main)
  const categorySub = normalizeText(business?.category_sub)
  const address = normalizeText(business?.address)
  const city = normalizeText(business?.city)
  const phone = normalizeText(business?.phone)
  const metroArea = normalizeText(business?.metro_area)

  const strongText = [nameKr, nameEn, categoryMain, categorySub].join(' ')
  const weakText = [address, city, phone, metroArea].join(' ')

  let score = 0
  let matchedTokens = 0
  let strongMatchedTokens = 0

  if (nameKr === normalizedSearch || nameEn === normalizedSearch) score += 1000
  if (nameKr.includes(normalizedSearch)) score += 450
  if (nameEn.includes(normalizedSearch)) score += 420
  if (categoryMain.includes(normalizedSearch)) score += 260
  if (categorySub.includes(normalizedSearch)) score += 240
  if (address.includes(normalizedSearch)) score += 90
  if (city.includes(normalizedSearch)) score += 70
  if (phone.includes(normalizedSearch)) score += 60
  if (metroArea.includes(normalizedSearch)) score += 40

  for (const token of tokens) {
    let tokenMatched = false
    let tokenStrongMatched = false

    if (nameKr.includes(token)) {
      score += 220
      tokenMatched = true
      tokenStrongMatched = true
    } else if (nameEn.includes(token)) {
      score += 200
      tokenMatched = true
      tokenStrongMatched = true
    } else if (categoryMain.includes(token)) {
      score += 140
      tokenMatched = true
      tokenStrongMatched = true
    } else if (categorySub.includes(token)) {
      score += 120
      tokenMatched = true
      tokenStrongMatched = true
    } else if (address.includes(token)) {
      score += 28
      tokenMatched = true
    } else if (city.includes(token)) {
      score += 22
      tokenMatched = true
    } else if (phone.includes(token)) {
      score += 20
      tokenMatched = true
    } else if (metroArea.includes(token)) {
      score += 16
      tokenMatched = true
    }

    if (tokenMatched) matchedTokens += 1
    if (tokenStrongMatched) strongMatchedTokens += 1
  }

  if (matchedTokens === tokens.length) {
    score += 180
  } else if (matchedTokens >= Math.max(1, Math.ceil(tokens.length / 2))) {
    score += 70
  }

  if (strongMatchedTokens === tokens.length) {
    score += 240
  } else if (strongMatchedTokens >= Math.max(1, Math.ceil(tokens.length / 2))) {
    score += 110
  }

  if (strongText.includes(normalizedSearch)) {
    score += 150
  }

  if (strongMatchedTokens === 0 && matchedTokens > 0) {
    score -= 80
  }

  if (strongMatchedTokens === 0 && weakText.includes(normalizedSearch)) {
    score -= 40
  }

  return Math.max(score, 0)
}

function matchesCategory(business: any, selectedCategory: string) {
  if (!selectedCategory || selectedCategory === '전체') return true

  return (
    normalizeText(business?.category_main) === normalizeText(selectedCategory) ||
    normalizeText(business?.category_sub) === normalizeText(selectedCategory)
  )
}

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasInitializedFromUrl = useRef(false)
  const hasWrittenUrl = useRef(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

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
  const [userRole, setUserRole] = useState<string | null>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [region, setRegion] = useState('houston')
  const [approvalSavingId, setApprovalSavingId] = useState<string | null>(null)

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

  const isAdmin = userRole === 'admin' || userRole === 'super_admin'

  const loadAuthUser = useCallback(async () => {
    const { data } = await sb.auth.getUser()
    const currentUser = data.user ?? null
    setUser(currentUser)

    if (!currentUser) {
      setUserRole(null)
      return
    }

    const { data: profile } = await sb
      .from('user_profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    setUserRole(profile?.role || null)
  }, [])

  const loadSections = useCallback(async () => {
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
  }, [])

    const loadVipBusinesses = useCallback(async () => {
    let q = sb
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .eq('metro_area', region)
      .eq('is_vip', true)

    if (!isAdmin) {
      q = q
        .eq('approved', true)
        .neq('source', 'Google Places API (New)')
    }

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
  }, [region, cat, isAdmin])

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

    const normalizedSearch = normalizeText(search)
    const hasSearch = normalizedSearch.length > 0

    let q = sb
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .eq('metro_area', region)

    if (!isAdmin) {
      q = q
        .eq('approved', true)
        .neq('source', 'Google Places API (New)')
    }

    if (cat !== '전체') {
      q = q.eq('category_main', cat)
    }

    q = q
      .order('is_vip', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false, nullsFirst: false })

    const fetchLimit = hasSearch ? 1000 : 200
    const { data, error } = await q.range(0, fetchLimit - 1)

    if (error) {
      console.error('business load error:', error)
      setBiz([])
      setLoading(false)
      return
    }

    const sourceList = data || []

    let filtered = hasSearch
      ? sourceList
      : sourceList.filter((business) => matchesCategory(business, cat))

    if (hasSearch) {
      filtered = filtered
        .map((business) => ({
          business,
          score: getSearchScore(business, normalizedSearch),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score

          const aVip = a.business?.is_vip ? 1 : 0
          const bVip = b.business?.is_vip ? 1 : 0
          if (bVip !== aVip) return bVip - aVip

          if (sort === 'review_count') {
            const byReviewCount =
              Number(b.business?.review_count || 0) - Number(a.business?.review_count || 0)
            if (byReviewCount !== 0) return byReviewCount

            const byRating =
              Number(b.business?.rating || 0) - Number(a.business?.rating || 0)
            if (byRating !== 0) return byRating
          } else if (sort === 'name_en') {
            const byName = getSortableName(a.business).localeCompare(
              getSortableName(b.business),
              'ko'
            )
            if (byName !== 0) return byName
          } else {
            const byRating =
              Number(b.business?.rating || 0) - Number(a.business?.rating || 0)
            if (byRating !== 0) return byRating

            const byReviewCount =
              Number(b.business?.review_count || 0) - Number(a.business?.review_count || 0)
            if (byReviewCount !== 0) return byReviewCount
          }

          return getSortableName(a.business).localeCompare(getSortableName(b.business), 'ko')
        })
        .map((item) => item.business)
    } else {
      filtered = applyBusinessSort(filtered, sort)
    }

    setBiz(filtered.slice(0, 20))
    setLoading(false)
  }, [cat, search, sort, region, isAdmin])

  const toggleApprovedFromHome = useCallback(
    async (business: any) => {
      if (!isAdmin) return
      if (!business?.id) return

      const nextApproved = !business.approved
      const confirmMessage = nextApproved
        ? '이 업소를 승인하시겠습니까?'
        : '이 업소의 승인을 해제하시겠습니까? 일반 사용자 홈에서는 숨겨집니다.'

      const ok = window.confirm(confirmMessage)
      if (!ok) return

      setApprovalSavingId(business.id)

      const { error } = await sb
        .from('businesses')
        .update({ approved: nextApproved })
        .eq('id', business.id)

      setApprovalSavingId(null)

      if (error) {
        alert('승인 상태 변경 실패: ' + error.message)
        return
      }

      setBiz((prev) =>
        prev
          .map((item) =>
            item.id === business.id ? { ...item, approved: nextApproved } : item
          )
          .filter((item) => (isAdmin ? true : item.approved === true))
      )

      setVipBiz((prev) =>
        prev
          .map((item) =>
            item.id === business.id ? { ...item, approved: nextApproved } : item
          )
          .filter((item) => (isAdmin ? true : item.approved === true))
      )
    },
    [isAdmin]
  )

  useEffect(() => {
    try {
      setFavs(JSON.parse(localStorage.getItem('gj_favs') || '[]'))
    } catch {}

    loadAuthUser()

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async () => {
      await loadAuthUser()
    })

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
  }, [loadAuthUser, loadSections])

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
  let cancelled = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const loadCounts = async () => {
    try {
      let totalQuery = sb
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('metro_area', region)

      if (!isAdmin) {
        totalQuery = totalQuery
          .eq('approved', true)
          .neq('source', 'Google Places API (New)')
      }

      const { count: total, error: totalError } = await totalQuery

      if (!cancelled && !totalError && total !== null) {
        setTotalCount(total)
      }

      if (!cats || cats.length === 0) {
        if (!cancelled) {
          setCounts({ 전체: total || 0 })
        }
        return
      }

      const nextCounts: Record<string, number> = {
        전체: total || 0,
      }

      const realCategories = cats.filter((c) => c.name !== '전체')

      const results = await Promise.all(
        realCategories.map(async (category) => {
          let countQuery = sb
            .from('businesses')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .eq('metro_area', region)
            .eq('category_main', category.name)

          if (!isAdmin) {
            countQuery = countQuery
                .eq('approved', true)
                .neq('source', 'Google Places API (New)')
          }

          const { count, error } = await countQuery

          return {
            name: category.name,
            count: !error && count !== null ? count : 0,
          }
        })
      )

      if (cancelled) return

      results.forEach((item) => {
        nextCounts[item.name] = item.count
      })

      setCounts(nextCounts)
    } catch (e) {
      console.error('loadCounts error:', e)
    }
  }

  // 첫 화면은 업소 리스트/VIP/기본 섹션을 먼저 보여주고,
  // 카운트는 조금 늦게 로드해서 체감 속도를 높임
  timeoutId = setTimeout(() => {
    loadCounts()
  }, 800)

  return () => {
    cancelled = true
    if (timeoutId) clearTimeout(timeoutId)
  }
}, [region, cats, isAdmin])

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

  const openBusiness = (b: any) => {
    setSel(b)
    loadReviews(b.id)
    loadRelatedCommunityPosts(b.id)
  }

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
            isAdmin={isAdmin}
            approvalSavingId={approvalSavingId}
            onToggleApproved={toggleApprovedFromHome}
          />
        )}
      </div>
    ),
  }

  const enabledSectionKeys = sections
    .filter((s) => s.is_enabled)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto">
      <div className="bg-white border-b border-slate-200 px-3 py-3 sticky top-[60px] z-20">
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
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchInputRef.current?.blur()
                  setTimeout(() => {
                    window.scrollTo({ top: window.scrollY, behavior: 'auto' })
                  }, 50)
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  window.scrollTo({ top: window.scrollY, behavior: 'auto' })
                }, 50)
              }}
              inputMode="search"
              enterKeyHint="search"
              placeholder="업소명, 업종, 주소, 전화번호 검색"
              className="w-full bg-transparent border-none outline-none text-slate-700 py-2.5 placeholder:text-slate-400 md:text-[13px]"
              style={{ fontSize: '16px' }}
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
        <div key={section.section_key}>
          {sectionMap[section.section_key]}
        </div>
      ))}

      <HomeBusinessModal
        sel={sel}
        onClose={closeModal}
        user={user}
        reviews={reviews}
        reviewLoading={reviewLoading}
        reviewSaving={reviewSaving}
        myReview={myReview}
        reviewForm={reviewForm}
        setReviewForm={setReviewForm}
        relatedCommunityPosts={relatedCommunityPosts}
        relatedPostsLoading={relatedPostsLoading}
        claimLoading={claimLoading}
        avgRating={avgRating}
        onToggleReviewTag={toggleReviewTag}
        onSaveReview={saveReview}
        onRequestOwnerClaim={requestOwnerClaim}
      />
    </div>
  )
}
