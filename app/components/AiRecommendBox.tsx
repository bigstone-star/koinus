'use client'

import { useState } from 'react'

type Business = {
  id: string
  name_kr?: string | null
  name_en?: string | null
  category_main?: string | null
  category_sub?: string | null
  address?: string | null
  phone?: string | null
  rating?: number | null
  review_count?: number | null
  is_vip?: boolean | null
  vip_tier?: string | null
}

export default function AiRecommendBox() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [error, setError] = useState('')

  const runRecommend = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSummary('')
    setBusinesses([])

    try {
      const res = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || '추천 요청 실패')
      }

      setSummary(json.summary || '')
      setBusinesses(json.businesses || [])
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div>
        <div className="text-[15px] font-extrabold text-slate-900">
          AI 추천 검색
        </div>
        <div className="text-[12px] text-slate-400 mt-1">
          예: 휴스턴 한인 치과 추천해줘
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runRecommend()}
          placeholder="자연어로 입력하세요"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
        />
        <button
          onClick={runRecommend}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold disabled:opacity-50"
        >
          {loading ? '분석 중...' : '추천'}
        </button>
      </div>

      {error && (
        <div className="text-[12px] text-red-500">{error}</div>
      )}

      {summary && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
          <div className="text-[12px] font-bold text-indigo-700 mb-1">
            AI 추천 요약
          </div>
          <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      )}

      {businesses.length > 0 && (
        <div className="space-y-2">
          <div className="text-[12px] font-bold text-slate-500">
            추천 업소 {businesses.length}개
          </div>

          {businesses.map((b) => (
            <div
              key={b.id}
              className="border border-slate-200 rounded-lg p-3 bg-white"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-[14px] font-bold text-slate-900">
                  {b.name_kr || b.name_en}
                </div>

                {b.is_vip && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-300 text-amber-900">
                    ⭐ {(b.vip_tier || 'vip').toUpperCase()}
                  </span>
                )}

                {b.category_sub && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {b.category_sub}
                  </span>
                )}
              </div>

              <div className="text-[12px] text-slate-500 mt-1">
                {b.category_main || '-'}
              </div>

              {b.address && (
                <div className="text-[12px] text-slate-500 mt-1">
                  {b.address}
                </div>
              )}

              <div className="flex items-center gap-3 mt-2 text-[12px]">
                {b.rating ? (
                  <span className="font-bold text-slate-800">
                    ★{Number(b.rating).toFixed(1)}
                    <span className="text-slate-400 font-normal ml-1">
                      ({b.review_count || 0})
                    </span>
                  </span>
                ) : null}

                {b.phone ? (
                  <a
                    href={`tel:${b.phone}`}
                    className="text-indigo-600 font-bold"
                  >
                    {b.phone}
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
