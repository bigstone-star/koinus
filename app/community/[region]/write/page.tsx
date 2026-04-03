'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const POST_TYPES = [
  { value: 'general', label: '일반' },
  { value: 'question', label: '질문' },
  { value: 'recommend', label: '추천' },
  { value: 'news', label: '소식' },
] as const

const REGION_LABELS: Record<string, string> = {
  houston: 'Houston',
  dallas: 'Dallas',
  fort_worth: 'Fort Worth',
  central_texas: 'Central Texas',
}

export default function CommunityWritePage({
  params,
}: {
  params: { region: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const region = params.region

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'general' | 'question' | 'recommend' | 'news'>('general')

  const [businessSearch, setBusinessSearch] = useState('')
  const [businessResults, setBusinessResults] = useState<any[]>([])
  const [businessSearching, setBusinessSearching] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await sb.auth.getUser()

      if (!data.user) {
        alert('로그인이 필요합니다.')
        router.push('/auth/login')
        return
      }

      setUser(data.user)

      const initialType = searchParams.get('type')
      if (
        initialType === 'general' ||
        initialType === 'question' ||
        initialType === 'recommend' ||
        initialType === 'news'
      ) {
        setType(initialType)
      }

      setLoading(false)
    }

    init()
  }, [router, searchParams])

  const typeGuide = useMemo(() => {
    if (type === 'question') return '궁금한 점을 물어보세요. 예: 휴스턴 치과 추천 부탁드립니다.'
    if (type === 'recommend') return '좋았던 업소나 경험을 추천해보세요.'
    if (type === 'news') return '지역 소식이나 공지성 내용을 올려보세요.'
    return '자유롭게 글을 작성해보세요.'
  }, [type])

  const searchBusiness = async () => {
    const keyword = businessSearch.trim()

    if (!keyword) {
      setBusinessResults([])
      return
    }

    setBusinessSearching(true)

    const { data, error } = await sb
      .from('businesses')
      .select('id, name_kr, name_en, category_main, city, address, metro_area')
      .eq('is_active', true)
      .eq('approved', true)
      .eq('metro_area', region)
      .or(
        [
          `name_kr.ilike.%${keyword}%`,
          `name_en.ilike.%${keyword}%`,
          `category_main.ilike.%${keyword}%`,
          `address.ilike.%${keyword}%`,
        ].join(',')
      )
      .limit(8)

    setBusinessSearching(false)

    if (error) {
      alert('업소 검색 실패: ' + error.message)
      setBusinessResults([])
      return
    }

    setBusinessResults(data || [])
  }

  const clearSelectedBusiness = () => {
    setSelectedBusiness(null)
  }

  const submit = async () => {
    if (!title.trim()) {
      alert('제목을 입력하세요.')
      return
    }

    if (!content.trim()) {
      alert('내용을 입력하세요.')
      return
    }

    setSaving(true)

    const nickname = `이웃-${user.id.slice(0, 6)}`

    const { error } = await sb.from('community_posts').insert({
      region,
      post_type: type,
      user_id: user.id,
      nickname,
      title: title.trim(),
      content: content.trim(),
      business_id: selectedBusiness?.id || null,
      is_active: true,
    })

    setSaving(false)

    if (error) {
      alert('글 등록 실패: ' + error.message)
      return
    }

    alert('등록 완료')
    router.push(`/community/${region}`)
  }

  if (loading) {
    return <div className="p-10 text-center">로딩중...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto p-4 space-y-4">
      <div>
        <div className="text-[22px] font-extrabold text-slate-900">글 작성</div>
        <div className="text-[12px] text-slate-500 mt-1">
          {REGION_LABELS[region] || region} 커뮤니티에 글을 작성합니다
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
        <div>
          <div className="text-[12px] font-bold text-slate-500 mb-2">글 종류</div>
          <div className="grid grid-cols-4 gap-2">
            {POST_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setType(item.value)}
                className={`rounded-lg px-3 py-2 text-[12px] font-bold border ${
                  type === item.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">{typeGuide}</div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-slate-500 mb-2">제목</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] bg-white outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <div className="text-[12px] font-bold text-slate-500 mb-2">내용</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={8}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] bg-white outline-none focus:border-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div>
          <div className="text-[13px] font-bold text-slate-800">관련 업소 연결</div>
          <div className="text-[11px] text-slate-400 mt-1">
            추천글이나 질문글에 관련 업소를 연결할 수 있습니다
          </div>
        </div>

        {!selectedBusiness ? (
          <>
            <div className="flex gap-2">
              <input
                value={businessSearch}
                onChange={(e) => setBusinessSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchBusiness()
                }}
                placeholder="업소명, 업종, 주소로 검색"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] bg-white outline-none focus:border-indigo-400"
              />
              <button
                onClick={searchBusiness}
                className="px-4 rounded-lg bg-slate-100 text-slate-700 text-[13px] font-bold"
              >
                검색
              </button>
            </div>

            {businessSearching && (
              <div className="text-[12px] text-slate-400">업소 검색 중...</div>
            )}

            {businessResults.length > 0 && (
              <div className="space-y-2">
                {businessResults.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBusiness(b)
                      setBusinessResults([])
                      setBusinessSearch('')
                    }}
                    className="w-full text-left rounded-xl border border-slate-200 px-3 py-3 hover:bg-slate-50"
                  >
                    <div className="text-[14px] font-bold text-slate-800">
                      {b.name_kr || b.name_en}
                    </div>
                    <div className="text-[12px] text-slate-500 mt-1">
                      {b.category_main}
                      {b.city ? ` · ${b.city}` : ''}
                    </div>
                    {b.address && (
                      <div className="text-[11px] text-slate-400 mt-1 truncate">
                        {b.address}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {businessSearch.trim() && !businessSearching && businessResults.length === 0 && (
              <div className="text-[12px] text-slate-400">
                검색 결과가 없습니다.
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
            <div className="text-[11px] font-bold text-indigo-500 mb-1">선택된 업소</div>
            <div className="text-[14px] font-bold text-slate-800">
              {selectedBusiness.name_kr || selectedBusiness.name_en}
            </div>
            <div className="text-[12px] text-slate-500 mt-1">
              {selectedBusiness.category_main}
              {selectedBusiness.city ? ` · ${selectedBusiness.city}` : ''}
            </div>

            <button
              type="button"
              onClick={clearSelectedBusiness}
              className="mt-3 text-[12px] font-bold text-red-500"
            >
              선택 해제
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/community/${region}`)}
          className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl text-[14px] font-bold"
        >
          취소
        </button>

        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-[14px] font-bold disabled:opacity-50"
        >
          {saving ? '등록 중...' : '등록하기'}
        </button>
      </div>
    </div>
  )
}
