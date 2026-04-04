'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ICON_OPTIONS = ['🍽️', '🛒', '🏥', '🦷', '⚖️', '🚗', '💄', '📚', '💳', '⛪', '🏠', '🧺', '🌿', '✈️', '📰', '👓', '📋']

const REGION_LABELS: Record<string, string> = {
  houston: 'Houston',
  dallas: 'Dallas',
  fort_worth: 'Fort Worth',
  central_texas: 'Central TX',
}


const REGIONS = [
  { value: 'all', label: '전체 지역' },
  { value: 'houston', label: 'Houston' },
  { value: 'dallas', label: 'Dallas' },
  { value: 'fort_worth', label: 'Fort Worth' },
  { value: 'central_texas', label: 'Central Texas' },
]

const STORAGE_KEY = 'admin_businesses_state'

type Category = {
  id: string
  name: string
  icon?: string
  sort_order?: number
  is_active?: boolean
}

type BusinessRow = {
  id: string
  name_kr?: string | null
  name_en?: string | null
  category_main?: string | null
  category_sub?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  metro_area?: string | null
  approved?: boolean | null
  is_active?: boolean | null
  is_vip?: boolean | null
  vip_tier?: string | null
  data_source?: string | null
}


function normalizeSearchText(value?: string | null) {
  return (value || '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCompactSearchText(value?: string | null) {
  return normalizeSearchText(value).replace(/[\s\-_,./()]+/g, '')
}

function tokenizeSearchQuery(value?: string) {
  const normalized = normalizeSearchText(value)

  if (!normalized) return []

  return Array.from(
    new Set(
      normalized
        .split(' ')
        .map((token) => token.trim())
        .filter(Boolean)
    )
  )
}

function getBusinessSearchFields(row: BusinessRow) {
  const fields = {
    name_kr: normalizeSearchText(row.name_kr),
    name_en: normalizeSearchText(row.name_en),
    category_main: normalizeSearchText(row.category_main),
    category_sub: normalizeSearchText(row.category_sub),
    address: normalizeSearchText(row.address),
    city: normalizeSearchText(row.city),
    phone: normalizeSearchText(row.phone),
    metro_area: normalizeSearchText(row.metro_area),
  }

  const joined = normalizeSearchText(Object.values(fields).filter(Boolean).join(' '))
  const compact = normalizeCompactSearchText(Object.values(fields).filter(Boolean).join(' '))

  return { fields, joined, compact }
}

function getBusinessSearchScore(row: BusinessRow, rawQuery?: string) {
  const normalizedQuery = normalizeSearchText(rawQuery)
  if (!normalizedQuery) return 0

  const tokens = tokenizeSearchQuery(rawQuery)
  const compactQuery = normalizeCompactSearchText(rawQuery)
  const { fields, joined, compact } = getBusinessSearchFields(row)

  if (!joined) return 0

  let score = 0
  let matchedTokens = 0
  let priorityMatchedTokens = 0

  if (fields.name_kr.includes(normalizedQuery)) score += 900
  if (fields.name_en.includes(normalizedQuery)) score += 850
  if (fields.category_main.includes(normalizedQuery)) score += 700
  if (fields.category_sub.includes(normalizedQuery)) score += 650
  if (joined.includes(normalizedQuery)) score += 260
  if (compactQuery && compact.includes(compactQuery)) score += 220

  for (const token of tokens) {
    const compactToken = normalizeCompactSearchText(token)
    if (!compactToken) continue

    let tokenMatched = false
    let tokenPriorityMatched = false

    if (fields.name_kr.includes(token)) {
      score += 220
      tokenMatched = true
      tokenPriorityMatched = true
    }
    if (fields.name_en.includes(token)) {
      score += 200
      tokenMatched = true
      tokenPriorityMatched = true
    }
    if (fields.category_main.includes(token)) {
      score += 150
      tokenMatched = true
      tokenPriorityMatched = true
    }
    if (fields.category_sub.includes(token)) {
      score += 120
      tokenMatched = true
      tokenPriorityMatched = true
    }
    if (fields.city.includes(token)) {
      score += 45
      tokenMatched = true
    }
    if (fields.metro_area.includes(token)) {
      score += 35
      tokenMatched = true
    }
    if (fields.address.includes(token)) {
      score += 30
      tokenMatched = true
    }
    if (fields.phone.includes(token)) {
      score += 25
      tokenMatched = true
    }

    if (!tokenMatched && compact.includes(compactToken)) {
      score += 30
      tokenMatched = true
    }

    if (tokenMatched) matchedTokens += 1
    if (tokenPriorityMatched) priorityMatchedTokens += 1
  }

  if (tokens.length > 0 && matchedTokens === tokens.length) score += 260
  if (tokens.length >= 2 && matchedTokens >= 2) score += 120
  if (tokens.length >= 2 && priorityMatchedTokens >= 2) score += 180
  if (tokens.length >= 3 && priorityMatchedTokens >= 2) score += 120
  if (!priorityMatchedTokens && (fields.address.includes(normalizedQuery) || fields.city.includes(normalizedQuery) || fields.metro_area.includes(normalizedQuery))) score -= 120

  const minimumMatchedTokens = tokens.length >= 3 ? 2 : 1
  const hasStrongExactMatch =
    fields.name_kr.includes(normalizedQuery) ||
    fields.name_en.includes(normalizedQuery) ||
    fields.category_main.includes(normalizedQuery) ||
    fields.category_sub.includes(normalizedQuery)

  const passes =
    hasStrongExactMatch ||
    joined.includes(normalizedQuery) ||
    (compactQuery && compact.includes(compactQuery)) ||
    (matchedTokens >= minimumMatchedTokens && priorityMatchedTokens >= 1) ||
    (tokens.length === 1 && matchedTokens >= 1)

  return passes ? score : 0
}

function businessMatchesSearch(row: BusinessRow, rawQuery?: string) {
  return getBusinessSearchScore(row, rawQuery) > 0
}

function normalizeCityFromAddress(address?: string | null) {
  if (!address) return ''
  const m = address.match(/,\s*([^,]+),\s*TX\b/i)
  return m?.[1]?.trim() || ''
}

function inferMetroArea(city?: string | null, address?: string | null) {
  const baseCity = (city || normalizeCityFromAddress(address) || '').trim()

  const c = baseCity.toLowerCase()

  const houstonCities = new Set([
    'houston',
    'katy',
    'sugar land',
    'pearland',
    'cypress',
    'spring',
    'tomball',
    'the woodlands',
    'missouri city',
    'stafford',
    'bellaire',
    'humble',
    'pasadena',
    'league city',
    'richmond',
    'rosenberg',
    'fulshear',
    'brookshire',
    'conroe',
    'klein',
    'channelview',
    'la porte',
    'friendswood',
    'webster',
    'deer park',
    'baytown',
  ])

  const dallasCities = new Set([
    'dallas',
    'plano',
    'carrollton',
    'frisco',
    'irving',
    'richardson',
    'coppell',
    'farmers branch',
    'the colony',
    'mesquite',
    'mckinney',
    'garland',
    'flower mound',
    'rockwall',
    'lewisville',
    'addison',
    'allen',
    'rowlett',
    'denton',
  ])

  const fortWorthCities = new Set([
    'fort worth',
    'arlington',
    'euless',
    'bedford',
    'hurst',
    'grapevine',
    'southlake',
    'colleyville',
    'north richland hills',
    'keller',
    'haltom city',
    'grand prairie',
  ])

  const centralTexasCities = new Set([
    'austin',
    'san antonio',
    'killeen',
    'round rock',
    'cedar park',
    'georgetown',
    'pflugerville',
    'temple',
    'belton',
    'harker heights',
    'copperas cove',
    'new braunfels',
    'schertz',
    'cibolo',
    'leander',
  ])

  if (houstonCities.has(c)) return 'houston'
  if (dallasCities.has(c)) return 'dallas'
  if (fortWorthCities.has(c)) return 'fort_worth'
  if (centralTexasCities.has(c)) return 'central_texas'

  return null
}

export default function AdminBusinessesPage() {
  const [tab, setTab] = useState<'pending' | 'vip' | 'all' | 'categories' | 'trash'>('all')
  const [list, setList] = useState<BusinessRow[]>([])
  const [stats, setStats] = useState({
    total: 0,
    vip: 0,
    pending: 0,
  })
  const [loading, setLoading] = useState(true)
  const [ok, setOk] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [restored, setRestored] = useState(false)

  const [cats, setCats] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📋')
  const [catLoading, setCatLoading] = useState(false)
  const [savingCatId, setSavingCatId] = useState('')

  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCat, setBulkCat] = useState('')
  const [bulkSubCat, setBulkSubCat] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const getCatLabel = (c: Category) => c.name || '이름없음'

  useEffect(() => {
    const init = async () => {
      try {
        const { data: authData } = await sb.auth.getUser()

        if (!authData.user) {
          window.location.href = '/auth/login'
          return
        }

        const { data: p, error } = await sb
          .from('user_profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (error) {
          setErrorMsg('권한 정보를 불러오지 못했습니다.')
          return
        }

        if (p?.role !== 'admin' && p?.role !== 'super_admin') {
          window.location.href = '/'
          return
        }

        let savedTab: 'pending' | 'vip' | 'all' | 'categories' | 'trash' = 'all'
        let savedSearch = ''
        let savedRegion = 'all'

        try {
          const saved = sessionStorage.getItem(STORAGE_KEY)
          if (saved) {
            const parsed = JSON.parse(saved)
            if (
  parsed.tab === 'pending' ||
  parsed.tab === 'vip' ||
  parsed.tab === 'all' ||
  parsed.tab === 'categories' ||
  parsed.tab === 'trash'
) {
  savedTab = parsed.tab
}
            if (typeof parsed.search === 'string') {
              savedSearch = parsed.search
            }
            if (typeof parsed.region === 'string') {
              savedRegion = parsed.region
            }
          }
        } catch {}

        setTab(savedTab)
        setSearch(savedSearch)
        setRegion(savedRegion)
        setOk(true)

        await Promise.all([
          loadStats(),
          loadCats(),
          loadList(savedSearch, savedTab, savedRegion),
        ])

        setRestored(true)
      } catch {
        setErrorMsg('관리자 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (!ok) return
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tab,
          search,
          region,
        })
      )
    } catch {}
  }, [tab, search, region, ok])

  const loadList = useCallback(async (
    searchTerm?: string,
    tabOverride?: 'pending' | 'vip' | 'all' | 'categories' | 'trash',
    regionOverride?: string
  ) => {
    const currentTab = tabOverride ?? tab

    if (currentTab === 'categories') {
      await loadCats()
      return
    }

    setLoading(true)
    setSelected(new Set())

    const currentRegion = regionOverride ?? region
    const term = searchTerm !== undefined ? searchTerm : search

    let q =
      currentTab === 'trash'
        ? sb.from('businesses').select('*').eq('is_active', false)
        : sb.from('businesses').select('*').eq('is_active', true)

    if (currentTab === 'pending') q = q.eq('data_source', 'user_registered')
    if (currentTab === 'vip') q = q.eq('is_vip', true)
    if (currentRegion !== 'all') q = q.eq('metro_area', currentRegion)

    const { data, error } = await q
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      setErrorMsg('업소 목록을 불러오지 못했습니다.')
      setList([])
      setLoading(false)
      return
    }

    const rows = ((data || []) as BusinessRow[])
      .filter((row) => businessMatchesSearch(row, term))
      .sort((a, b) => {
        const query = normalizeSearchText(term)

        if (query) {
          const aScore = getBusinessSearchScore(a, term)
          const bScore = getBusinessSearchScore(b, term)
          if (aScore !== bScore) return bScore - aScore
        }

        const aVip = a.is_vip ? 1 : 0
        const bVip = b.is_vip ? 1 : 0
        if (aVip !== bVip) return bVip - aVip

        const aName = normalizeSearchText(a.name_kr || a.name_en)
        const bName = normalizeSearchText(b.name_kr || b.name_en)
        return aName.localeCompare(bName)
      })

    setList(rows)
    setLoading(false)
  }, [tab, search, region])

  async function loadStats() {
    try {
      const [t, v, pd] = await Promise.all([
        sb.from('businesses').select('id', { count: 'exact', head: true }).eq('is_active', true),
        sb.from('businesses').select('id', { count: 'exact', head: true }).eq('is_vip', true),
        sb.from('businesses').select('id', { count: 'exact', head: true }).eq('data_source', 'user_registered').eq('is_active', true),
      ])

      setStats({
        total: t.count || 0,
        vip: v.count || 0,
        pending: pd.count || 0,
      })
    } catch {
      setErrorMsg('통계를 불러오는 중 오류가 발생했습니다.')
    }
  }

  async function load() {
    try {
      setLoading(true)
      await loadStats()
      await loadList()
    } catch {
      setErrorMsg('통계를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function loadCats() {
    try {
      setCatLoading(true)

      const { data, error } = await sb
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        setErrorMsg('카테고리를 불러오지 못했습니다.')
        setCats([])
      } else {
        setCats(data || [])
      }
    } catch {
      setErrorMsg('카테고리 로딩 중 오류가 발생했습니다.')
    } finally {
      setCatLoading(false)
    }
  }

  useEffect(() => {
    if (ok && restored) loadList()
  }, [tab, region, ok, restored, loadList])

  const handleSearch = () => loadList(search)

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === list.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(list.map((b) => b.id)))
    }
  }

  const bulkChangeCategory = async () => {
    if (!bulkCat) return alert('변경할 메인 카테고리를 선택하세요')
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소의 메인 카테고리를 "${bulkCat}"로 변경할까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ category_main: bulkCat })
      .in('id', Array.from(selected))

    setBulkLoading(false)

    if (error) {
      alert('메인 카테고리 변경 실패: ' + error.message)
      return
    }

    alert(`✅ ${selected.size}개 업소의 메인 카테고리가 "${bulkCat}"로 변경되었습니다.`)
    setSelected(new Set())
    setBulkCat('')
    loadList()
  }

  const bulkChangeSubCategory = async () => {
    if (!bulkSubCat.trim()) return alert('변경할 서브카테고리를 입력하세요')
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소의 서브카테고리를 "${bulkSubCat}"로 변경할까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ category_sub: bulkSubCat.trim() })
      .in('id', Array.from(selected))

    setBulkLoading(false)

    if (error) {
      alert('서브카테고리 변경 실패: ' + error.message)
      return
    }

    alert(`✅ ${selected.size}개 업소의 서브카테고리가 "${bulkSubCat}"로 변경되었습니다.`)
    setSelected(new Set())
    setBulkSubCat('')
    loadList()
  }

  const bulkClearSubCategory = async () => {
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소의 서브카테고리를 비울까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ category_sub: null })
      .in('id', Array.from(selected))

    setBulkLoading(false)

    if (error) {
      alert('서브카테고리 초기화 실패: ' + error.message)
      return
    }

    alert(`✅ ${selected.size}개 업소의 서브카테고리가 초기화되었습니다.`)
    setSelected(new Set())
    setBulkSubCat('')
    loadList()
  }

  const bulkApprove = async () => {
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소를 승인할까요?`)) return

    setBulkLoading(true)

    const selectedRows = list.filter((b) => selected.has(b.id))

    for (const b of selectedRows) {
      const metro = inferMetroArea(b.city, b.address)
      const payload: Record<string, any> = { approved: true }
      if (metro) payload.metro_area = metro

      const { error } = await sb
        .from('businesses')
        .update(payload)
        .eq('id', b.id)

      if (error) {
        setBulkLoading(false)
        alert(`승인 실패: ${b.name_kr || b.name_en} / ${error.message}`)
        return
      }
    }

    setBulkLoading(false)
    alert(`✅ ${selected.size}개 업소가 승인되었습니다.`)
    setSelected(new Set())
    loadList()
    loadStats()
  }

  const bulkUnapprove = async () => {
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소의 승인을 취소할까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ approved: false })
      .in('id', Array.from(selected))

    setBulkLoading(false)

    if (error) {
      alert('승인 취소 실패: ' + error.message)
      return
    }

    alert(`✅ ${selected.size}개 업소의 승인이 취소되었습니다.`)
    setSelected(new Set())
    loadList()
    loadStats()
  }

  const bulkSetVip = async () => {
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소를 VIP로 지정할까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ is_vip: true, vip_tier: 'pro' })
      .in('id', Array.from(selected))

    setBulkLoading(false)

    if (error) {
      alert('VIP 지정 실패: ' + error.message)
      return
    }

    alert(`✅ ${selected.size}개 업소가 VIP로 지정되었습니다.`)
    setSelected(new Set())
    loadList()
    loadStats()
  }

  const bulkUnsetVip = async () => {
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소의 VIP를 해제할까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ is_vip: false, vip_tier: null })
      .in('id', Array.from(selected))

    setBulkLoading(false)

    if (error) {
      alert('VIP 해제 실패: ' + error.message)
      return
    }

    alert(`✅ ${selected.size}개 업소의 VIP가 해제되었습니다.`)
    setSelected(new Set())
    loadList()
    loadStats()
  }

  const bulkDeactivate = async () => {
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소를 비활성화할까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ is_active: false })
      .in('id', Array.from(selected))

    setBulkLoading(false)

    if (error) {
      alert('비활성화 실패: ' + error.message)
      return
    }

    alert(`✅ ${selected.size}개 업소가 비활성화되었습니다.`)
    setSelected(new Set())
    loadList()
    loadStats()
  }

  const bulkReactivate = async () => {
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소를 다시 활성화할까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ is_active: true })
      .in('id', Array.from(selected))

    setBulkLoading(false)

    if (error) {
      alert('재활성화 실패: ' + error.message)
      return
    }

    alert(`✅ ${selected.size}개 업소가 다시 활성화되었습니다.`)
    setSelected(new Set())
    loadList()
    loadStats()
  }

  const approve = async (b: BusinessRow) => {
    const metro = inferMetroArea(b.city, b.address)
    const payload: Record<string, any> = { approved: true }
    if (metro) payload.metro_area = metro

    await sb.from('businesses').update(payload).eq('id', b.id)
    loadList()
    loadStats()
  }

  const toggleVip = async (b: BusinessRow) => {
    await sb
      .from('businesses')
      .update({ is_vip: !b.is_vip, vip_tier: !b.is_vip ? 'pro' : null })
      .eq('id', b.id)

    loadList()
    loadStats()
  }

  const deactivate = async (id: string) => {
  if (!confirm('휴지통으로 이동할까요?')) return

  await sb
    .from('businesses')
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  loadList()
  loadStats()
}
  const restoreBusiness = async (id: string) => {
  if (!confirm('복구할까요?')) return

  const { error } = await sb
    .from('businesses')
    .update({
      is_active: true,
      deleted_at: null,
      deleted_reason: null,
    })
    .eq('id', id)

  if (error) {
    alert('복구 실패: ' + error.message)
    return
  }

  alert('✅ 복구되었습니다.')
  loadList()
  loadStats()
}

const hardDeleteBusiness = async (id: string) => {
  if (!confirm('정말 완전 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return

  const { error } = await sb
    .from('businesses')
    .delete()
    .eq('id', id)

  if (error) {
    alert('완전 삭제 실패: ' + error.message)
    return
  }

  alert('✅ 완전 삭제되었습니다.')
  loadList()
  loadStats()
}

  const addCat = async () => {
    if (!newCatName.trim()) return alert('카테고리 이름을 입력하세요')

    const maxOrder = cats.length > 0 ? Math.max(...cats.map((c) => c.sort_order || 0)) : 0

    const { error } = await sb.from('categories').insert({
      name: newCatName.trim(),
      icon: newCatIcon,
      sort_order: maxOrder + 1,
      is_active: true,
    })

    if (error) {
      alert('추가 실패: ' + error.message)
      return
    }

    setNewCatName('')
    setNewCatIcon('📋')
    loadCats()
  }

  const updateCatField = (id: string, field: keyof Category, value: any) => {
    setCats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const saveCat = async (cat: Category) => {
    if (!cat.name?.trim()) return alert('카테고리 이름을 입력하세요')

    setSavingCatId(cat.id)

    const { error } = await sb
      .from('categories')
      .update({
        name: cat.name.trim(),
        icon: cat.icon || '📋',
        sort_order: Number(cat.sort_order || 0),
        is_active: !!cat.is_active,
      })
      .eq('id', cat.id)

    setSavingCatId('')

    if (error) {
      alert('저장 실패: ' + error.message)
      return
    }

    alert('✅ 카테고리가 저장됐습니다')
    loadCats()
  }

  const toggleCat = async (cat: Category) => {
    await sb.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    loadCats()
  }

  const deleteCat = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제할까요?`)) return
    await sb.from('categories').delete().eq('id', id)
    loadCats()
  }

  if (loading && !ok && !errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center max-w-md w-full">
          <div className="text-red-600 font-bold mb-3">{errorMsg}</div>
          <a
            href="/admin"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            관리자 홈
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-2xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-extrabold text-white">업소 관리</h1>
          <p className="text-white/40 text-[12px] mt-0.5">업소 검색, 승인, 수정, 일괄 작업</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <a
            href="/admin/categories"
            className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
          >
            🗂 카테고리
          </a>
          <a
            href="/admin"
            className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
          >
            Admin
          </a>
          <a
            href="/"
            className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
          >
            홈
          </a>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="text-[13px] font-bold text-slate-700">운영 현황</div>

          <div className="text-[12px] text-slate-500">
            전체 <span className="font-extrabold text-slate-800">{stats.total}</span>
          </div>

          <div className="text-[12px] text-slate-500">
            VIP <span className="font-extrabold text-amber-600">{stats.vip}</span>
          </div>

          <div className="text-[12px] text-slate-500">
            신규 <span className="font-extrabold text-red-500">{stats.pending}</span>
          </div>
        </div>
      </div>

      <div className="px-4 flex gap-2 mb-3 flex-wrap">
  {([
    ['pending', '신규 대기'],
    ['vip', 'VIP'],
    ['all', '전체'],
    ['trash', '🗑 휴지통'],
    ['categories', '🗂 카테고리'],
  ] as const).map(([k, l]) => (
    <button
      key={k}
      onClick={() => setTab(k)}
      className={`px-4 py-2 rounded-lg text-[12px] font-bold ${
        tab === k
          ? 'bg-indigo-600 text-white'
          : 'bg-white border border-slate-200 text-slate-600'
      }`}
    >
      {l}
    </button>
  ))}

  <button
    onClick={load}
    className="ml-auto px-3 py-2 rounded-lg text-[12px] font-bold bg-white border border-slate-200 text-slate-500"
  >
    🔄
  </button>
</div>
      
      {tab === 'categories' ? (
        <div className="px-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-[13px] font-bold text-slate-700 mb-3">새 카테고리 추가</div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">아이콘</label>
                <input
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="아이콘"
                  className="w-20 border border-slate-200 rounded-lg px-2 py-2 text-center text-[18px] mb-2"
                />
                <div className="flex flex-wrap gap-1">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCatIcon(icon)}
                      className={`w-9 h-9 rounded-lg border text-[18px] ${
                        newCatIcon === icon ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">이름</label>
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="카테고리 이름"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                  onKeyDown={(e: any) => e.key === 'Enter' && addCat()}
                />
              </div>

              <button
                onClick={addCat}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold"
              >
                추가
              </button>
            </div>
          </div>

          {catLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cats.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-400">카테고리가 없습니다.</div>
          ) : (
            cats.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 md:col-span-3">
                    <label className="text-[11px] text-slate-400 block mb-1">아이콘</label>
                    <input
                      value={c.icon || ''}
                      onChange={(e) => updateCatField(c.id, 'icon', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-2 text-center text-[18px] mb-2"
                    />
                    <div className="flex flex-wrap gap-1">
                      {ICON_OPTIONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => updateCatField(c.id, 'icon', icon)}
                          className={`w-9 h-9 rounded-lg border text-[18px] ${
                            c.icon === icon ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-5">
                    <label className="text-[11px] text-slate-400 block mb-1">이름</label>
                    <input
                      value={c.name || ''}
                      onChange={(e) => updateCatField(c.id, 'name', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">순서</label>
                    <input
                      type="number"
                      value={c.sort_order || 0}
                      onChange={(e) => updateCatField(c.id, 'sort_order', Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">상태</label>
                    <div className="text-[12px] font-bold text-slate-600 py-2">
                      {c.is_active ? '표시중' : '숨김'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => saveCat(c)}
                    disabled={savingCatId === c.id}
                    className="text-[12px] font-bold px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                  >
                    {savingCatId === c.id ? '저장 중...' : '저장'}
                  </button>

                  <button
                    onClick={() => toggleCat(c)}
                    className={`text-[12px] font-bold px-4 py-2 rounded-lg ${
                      c.is_active ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {c.is_active ? '숨기기' : '보이기'}
                  </button>

                  <button
                    onClick={() => deleteCat(c.id, getCatLabel(c))}
                    className="text-[12px] font-bold px-4 py-2 rounded-lg bg-red-50 text-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="px-4 space-y-2">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="flex gap-2 flex-wrap">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-[13px] bg-white"
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e: any) => e.key === 'Enter' && handleSearch()}
                placeholder="업소명, 카테고리, 서브카테고리, 주소, 전화, 지역 검색..."
                className="flex-1 min-w-[220px] border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
              />
              <button
                onClick={handleSearch}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold"
              >
                🔍 검색
              </button>
              {search && (
                <button
                  onClick={() => {
                    setSearch('')
                    loadList('')
                  }}
                  className="bg-slate-100 text-slate-500 px-3 py-2 rounded-lg text-[13px] font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {list.length > 0 && (
            <div className={`bg-white rounded-xl border p-3 transition-all ${selected.size > 0 ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.size === list.length && list.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className="text-[12px] font-bold text-slate-600">
                    {selected.size > 0 ? `${selected.size}개 선택됨` : '전체 선택'}
                  </span>
                </label>

                {selected.size > 0 && (
                  <>
                    <div className="flex-1 min-w-[140px]">
                      <select
                        value={bulkCat}
                        onChange={(e) => setBulkCat(e.target.value)}
                        className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-[12px] bg-white"
                      >
                        <option value="">메인 카테고리 선택...</option>
                        {cats.filter((c) => c.is_active).map((c) => (
                          <option key={c.id} value={getCatLabel(c)}>
                            {c.icon || '📋'} {getCatLabel(c)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={bulkChangeCategory}
                      disabled={bulkLoading || !bulkCat}
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                    >
                      {bulkLoading ? '처리 중...' : '메인 변경'}
                    </button>

                    <div className="min-w-[160px]">
                      <input
                        value={bulkSubCat}
                        onChange={(e) => setBulkSubCat(e.target.value)}
                        placeholder="서브카테고리 입력"
                        className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-[12px] bg-white"
                      />
                    </div>

                    <button
                      onClick={bulkChangeSubCategory}
                      disabled={bulkLoading || !bulkSubCat.trim()}
                      className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                    >
                      {bulkLoading ? '처리 중...' : '서브 변경'}
                    </button>

                    <button
                      onClick={bulkClearSubCategory}
                      disabled={bulkLoading}
                      className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                    >
                      서브 비우기
                    </button>

                    <button
                      onClick={bulkApprove}
                      disabled={bulkLoading}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                    >
                      승인
                    </button>

                    <button
                      onClick={bulkUnapprove}
                      disabled={bulkLoading}
                      className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                    >
                      승인취소
                    </button>

                    <button
                      onClick={bulkSetVip}
                      disabled={bulkLoading}
                      className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                    >
                      VIP 지정
                    </button>

                    <button
                      onClick={bulkUnsetVip}
                      disabled={bulkLoading}
                      className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                    >
                      VIP 해제
                    </button>

                    <button
                      onClick={bulkDeactivate}
                      disabled={bulkLoading}
                      className="bg-red-100 text-red-600 px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                    >
                      비활성화
                    </button>

                    <button
                      onClick={bulkReactivate}
                      disabled={bulkLoading}
                      className="bg-green-100 text-green-700 px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                    >
                      재활성화
                    </button>

                    <button
                      onClick={() => setSelected(new Set())}
                      className="text-[12px] text-slate-400 px-2 py-1.5"
                    >
                      선택 해제
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-400">
              {search ? `"${search}" 검색 결과가 없습니다` : '항목 없음'}
            </div>
          ) : (
            list.map((b) => {
              const isChecked = selected.has(b.id)
              const regionLabel = REGION_LABELS[b.metro_area || ''] || b.metro_area || '지역없음'

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-xl border p-4 transition-all ${isChecked ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(b.id)}
                      className="mt-1 w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-[14px] flex items-center gap-2 mb-1 flex-wrap">
                        {b.name_kr || b.name_en}

                        {b.is_vip && (
                          <span className="text-[9px] font-black bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded">
                            {b.vip_tier?.toUpperCase() || 'VIP'}
                          </span>
                        )}

                        {!b.approved && (
                          <span className="text-[9px] font-black bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                            승인대기
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-2 flex-wrap">
                        {b.category_main && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            {b.category_main}
                          </span>
                        )}

                        {b.category_sub && (
                          <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                            {b.category_sub}
                          </span>
                        )}

                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                          {regionLabel}
                        </span>

                        {b.city && (
                          <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                            {b.city}
                          </span>
                        )}

                        {b.phone && <span>{b.phone}</span>}
                      </div>

                      <div className="flex gap-2 flex-wrap">
  {tab !== 'trash' ? (
    <>
      {!b.approved && (
        <button
          onClick={() => approve(b)}
          className="bg-green-500 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg"
        >
          ✅ 승인
        </button>
      )}

      <a
        href={`/admin/businesses/${b.id}`}
        className="text-[11px] font-bold py-1.5 px-3 rounded-lg bg-indigo-50 text-indigo-600"
      >
        ✏️ 수정
      </a>

      <button
        onClick={() => toggleVip(b)}
        className={`text-[11px] font-bold py-1.5 px-3 rounded-lg ${
          b.is_vip ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
        }`}
      >
        {b.is_vip ? 'VIP 해제' : '⭐ VIP'}
      </button>

      <button
        onClick={() => deactivate(b.id)}
        className="text-[11px] font-bold py-1.5 px-3 rounded-lg bg-slate-100 text-slate-500"
      >
        🗑 비활성화
      </button>
    </>
  ) : (
    <>
      <button
        onClick={() => restoreBusiness(b.id)}
        className="text-[11px] font-bold py-1.5 px-3 rounded-lg bg-green-100 text-green-700"
      >
        ♻️ 복구
      </button>

      <button
        onClick={() => hardDeleteBusiness(b.id)}
        className="text-[11px] font-bold py-1.5 px-3 rounded-lg bg-red-100 text-red-600"
      >
        ❌ 완전삭제
      </button>
    </>
  )}
</div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
