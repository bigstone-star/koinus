'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Business = {
  id: string
  name_kr?: string
  name_en?: string
  category_main?: string
  city?: string
  is_vip?: boolean
}

type Post = {
  id: string
  title: string
  region: string
  comment_count?: number
  like_count?: number
}

export default function HomePage() {
  const [region, setRegion] = useState('houston')
  const [vipList, setVipList] = useState<Business[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      const saved = localStorage.getItem('gj_region')
      const current = saved || 'houston'
      setRegion(current)

      await loadData(current)
    } catch {
      await loadData('houston')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async (currentRegion: string) => {
    // ✅ VIP 먼저 가져오기
    const { data: vipData } = await sb
      .from('businesses')
      .select('id, name_kr, name_en, category_main, city, is_vip')
      .eq('metro_area', currentRegion)
      .eq('is_vip', true)
      .limit(12)

    let finalList = vipData || []

    // ✅ 부족하면 일반 업소 채우기
    if (finalList.length < 12) {
      const { data: normalData } = await sb
        .from('businesses')
        .select('id, name_kr, name_en, category_main, city, is_vip')
        .eq('metro_area', currentRegion)
        .eq('is_vip', false)
        .limit(12 - finalList.length)

      finalList = [...finalList, ...(normalData || [])]
    }

    setVipList(finalList)

    // ✅ 최신 커뮤니티 글
    const { data: postData } = await sb
      .from('community_posts')
      .select('id, title, region, comment_count, like_count')
      .eq('region', currentRegion)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3)

    setPosts(postData || [])
  }

  const handleRegionChange = async (nextRegion: string) => {
    setRegion(nextRegion)

    try {
      localStorage.setItem('gj_region', nextRegion)
      window.dispatchEvent(
        new CustomEvent('gj_region_changed', { detail: nextRegion })
      )
    } catch {}

    setLoading(true)
    await loadData(nextRegion)
    setLoading(false)
  }

  if (loading) {
    return <div className="p-10 text-center">로딩중...</div>
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 bg-slate-100 min-h-screen">
      
      {/* 지역 선택 */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">업소록</h1>

        <select
          value={region}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="houston">Houston</option>
          <option value="dallas">Dallas</option>
          <option value="fort_worth">Fort Worth</option>
          <option value="central_texas">Central Texas</option>
        </select>
      </div>

      {/* 🔥 VIP 업소 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="font-bold mb-3">⭐ 추천 업소</div>

        {vipList.map((b) => (
          <div
            key={b.id}
            className="py-2 border-b last:border-none"
          >
            <div className="font-bold text-[14px]">
              {b.name_kr || b.name_en}
            </div>
            <div className="text-[12px] text-slate-400">
              {b.category_main} · {b.city}
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 커뮤니티 최신 글 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="font-bold mb-3">📢 커뮤니티 최신 글</div>

        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/community/${p.region}/${p.id}`}
            className="block py-2 border-b last:border-none"
          >
            <div className="text-[13px] font-bold text-slate-800">
              {p.title}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              댓글 {p.comment_count || 0} · ❤️ {p.like_count || 0}
            </div>
          </Link>
        ))}

        <Link
          href={`/community/${region}`}
          className="block mt-3 text-indigo-600 text-[12px] font-bold"
        >
          커뮤니티 더보기 →
        </Link>
      </div>
    </div>
  )
}
