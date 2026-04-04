'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminBusinessesPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [region, setRegion] = useState('Fort Worth')
  const [tab, setTab] = useState<'all' | 'vip' | 'pending' | 'trash'>('all')

  // 🔥 데이터 로드
  const load = async () => {
    setLoading(true)

    let q =
      tab === 'trash'
        ? sb.from('businesses').select('*').eq('is_active', false)
        : sb.from('businesses').select('*').eq('is_active', true)

    if (tab === 'vip') q = q.eq('is_vip', true)
    if (tab === 'pending') q = q.eq('approved', false)

    if (region !== 'all') {
      q = q.eq('metro_area', region)
    }

    // 🔥 카테고리 필터 (핵심)
    if (category !== 'all') {
      q = q.or(
        `category_main.ilike.%${category}%,category_sub.ilike.%${category}%`
      )
    }

    const { data, error } = await q
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error(error)
      setList([])
      setLoading(false)
      return
    }

    let result = data || []

    // 🔥 검색 (텍스트만)
    const term = search.trim().toLowerCase()

    if (term) {
      const terms = term.split(' ').filter(Boolean)

      result = result.filter((b) => {
        const text = [
          b.name_kr,
          b.name_en,
          b.address,
          b.phone,
          b.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return terms.every((t) => text.includes(t))
      })
    }

    setList(result)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [search, category, region, tab])

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-[22px] font-bold mb-4">업소 관리</h1>

      {/* 🔥 필터 영역 */}
      <div className="bg-white border rounded-xl p-4 mb-4 flex flex-wrap gap-2">

        {/* 지역 */}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="Fort Worth">Fort Worth</option>
          <option value="Dallas">Dallas</option>
          <option value="Houston">Houston</option>
          <option value="all">전체</option>
        </select>

        {/* 검색 */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="업소명 / 주소 / 전화"
          className="border px-3 py-2 rounded-lg text-sm flex-1 min-w-[200px]"
        />

        {/* 카테고리 */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="all">전체 카테고리</option>
          <option value="교회">교회</option>
          <option value="식당">식당</option>
          <option value="병원">병원</option>
          <option value="치과">치과</option>
          <option value="CPA">CPA</option>
          <option value="부동산">부동산</option>
        </select>
      </div>

      {/* 🔥 탭 */}
      <div className="flex gap-2 mb-4">
        {['all', 'vip', 'pending', 'trash'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-3 py-1 rounded-lg text-sm ${
              tab === t
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 🔥 리스트 */}
      <div className="bg-white border rounded-xl divide-y">
        {loading ? (
          <div className="p-6 text-center">로딩 중...</div>
        ) : list.length === 0 ? (
          <div className="p-6 text-center text-gray-400">데이터 없음</div>
        ) : (
          list.map((b) => (
            <div key={b.id} className="p-4">
              <div className="font-bold">{b.name_kr || b.name_en}</div>
              <div className="text-sm text-gray-500">
                {b.category_main} / {b.category_sub}
              </div>
              <div className="text-sm text-gray-400">
                {b.address}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
