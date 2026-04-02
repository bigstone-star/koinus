'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const REGION_META: Record<string, { title: string; subtitle: string }> = {
  houston: {
    title: 'Houston 커뮤니티',
    subtitle: '휴스턴 지역 한인 커뮤니티',
  },
  dallas: {
    title: 'Dallas 커뮤니티',
    subtitle: '달라스 지역 한인 커뮤니티',
  },
  fort_worth: {
    title: 'Fort Worth 커뮤니티',
    subtitle: '포트워스 지역 한인 커뮤니티',
  },
  central_texas: {
    title: 'Central Texas 커뮤니티',
    subtitle: '텍사스 중부 한인 커뮤니티',
  },
}

const POST_TYPE_LABELS: Record<string, string> = {
  general: '전체',
  question: '질문',
  recommend: '추천',
  news: '소식',
}

const POST_TYPE_BADGE: Record<string, string> = {
  general: 'bg-slate-100 text-slate-600',
  question: 'bg-blue-50 text-blue-600',
  recommend: 'bg-amber-50 text-amber-700',
  news: 'bg-emerald-50 text-emerald-700',
}

type CommunityPostRow = {
  id: string
  region: string
  post_type: 'general' | 'question' | 'recommend' | 'news'
  user_id: string
  nickname?: string | null
  title: string
  content: string
  business_id?: string | null
  is_active: boolean
  is_pinned?: boolean | null
  like_count?: number | null
  comment_count?: number | null
  created_at?: string | null
  updated_at?: string | null
}

type BusinessMini = {
  id: string
  name_kr?: string | null
  name_en?: string | null
  category_main?: string | null
}

export default function CommunityRegionPage({
  params,
}: {
  params: { region: string }
}) {
  const region = params.region

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [posts, setPosts] = useState<CommunityPostRow[]>([])
  const [businessMap, setBusinessMap] = useState<Record<string, BusinessMini>>({})
  const [filter, setFilter] = useState<'all' | 'general' | 'question' | 'recommend' | 'news'>('all')

  const regionMeta = REGION_META[region]

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setErrorMsg('')

        if (!regionMeta) {
          setErrorMsg('잘못된 지역 주소입니다.')
          setLoading(false)
          return
        }

        const { data: postData, error: postError } = await sb
          .from('community_posts')
          .select(`
            id,
            region,
            post_type,
            user_id,
            nickname,
            title,
            content,
            business_id,
            is_active,
            is_pinned,
            like_count,
            comment_count,
            created_at,
            updated_at
          `)
          .eq('region', region)
          .eq('is_active', true)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(50)

        if (postError) {
          setErrorMsg('커뮤니티 글을 불러오지 못했습니다.')
          setLoading(false)
          return
        }

        const postRows = (postData || []) as CommunityPostRow[]
        setPosts(postRows)

        const businessIds = Array.from(
          new Set(
            postRows
              .map((p) => p.business_id)
              .filter((id): id is string => !!id)
          )
        )

        if (businessIds.length > 0) {
          const { data: businessData, error: businessError } = await sb
            .from('businesses')
            .select('id, name_kr, name_en, category_main')
            .in('id', businessIds)

          if (!businessError && businessData) {
            const nextMap: Record<string, BusinessMini> = {}
            ;(businessData as BusinessMini[]).forEach((b) => {
              nextMap[b.id] = b
            })
            setBusinessMap(nextMap)
          } else {
            setBusinessMap({})
          }
        } else {
          setBusinessMap({})
        }
      } catch (e) {
        console.error(e)
        setErrorMsg('커뮤니티 페이지를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [region, regionMeta])

  const filteredPosts = useMemo(() => {
    if (filter === 'all') return posts
    return posts.filter((p) => p.post_type === filter)
  }, [posts, filter])

  const formatDate = (value?: string | null) => {
    if (!value) return ''
    try {
      return new Date(value).toLocaleDateString()
    } catch {
      return ''
    }
  }

  const makeFallbackNickname = (userId: string) => {
    return `이웃-${userId.slice(0, 6)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-100 max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <div className="text-red-600 font-bold">{errorMsg}</div>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-3xl mx-auto pb-12">
      <header className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-white">
            {regionMeta.title}
          </h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            {regionMeta.subtitle}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          <Link
            href="/"
            className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
          >
            홈
          </Link>
          <Link
            href={`/community/${region}/write`}
            className="bg-amber-400 text-[#1a1a2e] text-[12px] font-bold px-3 py-1.5 rounded-lg"
          >
            글쓰기
          </Link>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="flex gap-2 flex-wrap">
            {[
              ['all', '전체'],
              ['question', '질문'],
              ['recommend', '추천'],
              ['news', '소식'],
              ['general', '일반'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-lg text-[12px] font-bold ${
                  filter === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <div className="text-[15px] font-bold text-slate-700">
              아직 등록된 글이 없습니다
            </div>
            <div className="text-[12px] text-slate-400 mt-2">
              첫 글을 남겨 지역 커뮤니티를 시작해보세요.
            </div>
            <div className="mt-4">
              <Link
                href={`/community/${region}/write`}
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold"
              >
                글쓰기
              </Link>
            </div>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const linkedBusiness = post.business_id
              ? businessMap[post.business_id]
              : null

            return (
              <div
                key={post.id}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {post.is_pinned ? (
                        <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-full">
                          고정
                        </span>
                      ) : null}

                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          POST_TYPE_BADGE[post.post_type] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {POST_TYPE_LABELS[post.post_type] || post.post_type}
                      </span>
                    </div>

                    <div className="text-[17px] font-bold text-slate-900 leading-snug">
                      {post.title}
                    </div>

                    <div className="text-[12px] text-slate-400 mt-1">
                      {post.nickname || makeFallbackNickname(post.user_id)} · {formatDate(post.created_at)}
                    </div>

                    <div className="text-[13px] text-slate-600 mt-3 leading-relaxed whitespace-pre-wrap">
                      {post.content.length > 220
                        ? `${post.content.slice(0, 220)}...`
                        : post.content}
                    </div>

                    {linkedBusiness && (
                      <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3">
                        <div className="text-[11px] font-bold text-indigo-500 mb-1">
                          연결 업소
                        </div>
                        <div className="text-[13px] font-bold text-slate-800">
                          {linkedBusiness.name_kr || linkedBusiness.name_en}
                        </div>
                        {linkedBusiness.category_main && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {linkedBusiness.category_main}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-4 text-[11px] text-slate-400">
                      <span>좋아요 {post.like_count || 0}</span>
                      <span>댓글 {post.comment_count || 0}</span>
                    </div>
                  </div>

                  <Link
                    href={`/community/${region}/${post.id}`}
                    className="text-[12px] font-bold text-indigo-600 whitespace-nowrap"
                  >
                    보기
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
