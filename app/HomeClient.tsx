'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HomeClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [biz, setBiz] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState(searchParams.get('cat') || '전체')
  const [search, setSearch] = useState(searchParams.get('q') || '')

  const load = useCallback(async () => {
    setLoading(true)

    let q = sb.from('businesses').select('*').eq('is_active', true)

    if (cat !== '전체') {
      q = q.eq('category_main', cat)
    }

    if (search.trim()) {
      q = q.or(
        `name_en.ilike.%${search}%,name_kr.ilike.%${search}%,address.ilike.%${search}%`
      )
    }

    const { data } = await q.limit(100)

    setBiz(data || [])
    setLoading(false)
  }, [cat, search])

  useEffect(() => {
    load()
  }, [load])

  const goCategory = (category: string) => {
    setCat(category)
    router.push(`/?cat=${encodeURIComponent(category)}`)
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">교차로 휴스턴</h1>

      {/* 검색 */}
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          router.push(`/?q=${encodeURIComponent(e.target.value)}`)
        }}
        placeholder="검색"
        className="border p-2 w-full mb-4"
      />

      {/* 카테고리 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['전체', '식당·카페', '치과', '한의원', '미용'].map((c) => (
          <button
            key={c}
            onClick={() => goCategory(c)}
            className={`px-3 py-1 rounded ${
              cat === c ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      {loading ? (
        <div>로딩중...</div>
      ) : (
        <div className="space-y-2">
          {biz.map((b) => (
            <div
              key={b.id}
              className="border p-3 rounded cursor-pointer"
            >
              <div className="font-bold">
                {b.name_kr || b.name_en}
              </div>
              <div className="text-sm text-gray-500">
                {b.address}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
