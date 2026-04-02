'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TYPE_LABEL: Record<string, string> = {
  general: '일반',
  question: '질문',
  recommend: '추천',
  news: '소식',
}

const TYPE_STYLE: Record<string, string> = {
  general: 'bg-slate-100 text-slate-600',
  question: 'bg-blue-50 text-blue-600',
  recommend: 'bg-amber-50 text-amber-700',
  news: 'bg-emerald-50 text-emerald-700',
}

const REGION_TITLE: Record<string, string> = {
  houston: 'Houston 커뮤니티',
  dallas: 'Dallas 커뮤니티',
  fort_worth: 'Fort Worth 커뮤니티',
  central_texas: 'Central Texas 커뮤니티',
}

type CommunityPost = {
  id: string
  region: string
  post_type: 'general' | 'question' | 'recommend' | 'news'
  user_id: string
  nickname?: string | null
  title: string
  content: string
  business_id?: string | null
  is_active?: boolean | null
  is_pinned?: boolean | null
  like_count?: number | null
  comment_count?: number | null
  created_at?: string | null
}

export default function CommunityRegionPage({
  params,
}: {
  params: { region: string }
}) {
  const router = useRouter()
  const region = params.region

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'question' | 'recommend' | 'news' | 'general'>('all')
  const [user, setUser] = useState<any>(null)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    init()
  }, [region])

  const init = async () => {
    setLoading(true)

    const { data: userData } = await sb.auth.getUser()
    setUser(userData.user || null)

    if (userData.user) {
      const { data: profile } = await sb
        .from('user_profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle()

      if (profile?.role === 'admin' || profile?.role === 'super_admin') {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } else {
      setIsAdmin(false)
    }

    await loadPosts(userData.user || null)
    setLoading(false)
  }

  const loadPosts = async (currentUser?: any) => {
    const { data, error } = await sb
      .from('community_posts')
      .select('*')
      .eq('region', region)
      .eq('is_active', true)
      .order('is_pinned', { ascending: false })
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('community posts load error:', error)
      setPosts([])
      return
    }

    setPosts((data || []) as CommunityPost[])

    if (currentUser) {
      const { data: likes, error: likeError } = await sb
        .from('community_likes')
        .select('post_id')
        .eq('user_id', currentUser.id)

      if (likeError) {
        console.error('community likes load error:', likeError)
        setLikedMap({})
      } else {
        const map: Record<string, boolean> = {}
        ;(likes || []).forEach((l: any) => {
          if (l.post_id) map[l.post_id] = true
        })
        setLikedMap(map)
      }
    } else {
      setLikedMap({})
    }
  }

  const toggleLike = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()

    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    const alreadyLiked = likedMap[postId]

    if (alreadyLiked) {
      const { error: deleteError } = await sb
        .from('community_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (deleteError) {
        alert('좋아요 취소 실패: ' + deleteError.message)
        return
      }

      const { error: rpcError } = await sb.rpc('decrement_like', { pid: postId })
      if (rpcError) {
        console.error('decrement_like error:', rpcError)
      }
    } else {
      const { error: insertError } = await sb
        .from('community_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        })

      if (insertError) {
        alert('좋아요 실패: ' + insertError.message)
        return
      }

      const { error: rpcError } = await sb.rpc('increment_like', { pid: postId })
      if (rpcError) {
        console.error('increment_like error:', rpcError)
      }
    }

    await loadPosts(user)
  }

  const hidePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()

    if (!isAdmin) return
    if (!confirm('이 글을 숨기시겠습니까?')) return

    const { error } = await sb
      .from('community_posts')
      .update({ is_active: false })
      .eq('id', postId)

    if (error) {
      alert('숨김 처리 실패: ' + error.message)
      return
    }

    await loadPosts(user)
    alert('글이 숨김 처리되었습니다.')
  }

  const goDetail = (postId: string) => {
    router.push(`/community/${region}/${postId}`)
  }

  const filteredPosts = useMemo(() => {
    if (filter === 'all') return posts
    return posts.filter((p) => p.post_type === filter)
  }, [posts, filter])

  const formatDate = (date?: string | null) => {
    if (!date) return ''
    try {
      return new Date(date).toLocaleDateString()
    } catch {
      return ''
    }
  }

  const regionTitle = REGION_TITLE[region] || '커뮤니티'

  if (loading) {
    return <div className="p-10 text-center">로딩중...</div>
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4 bg-slate-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">{regionTitle}</h1>
        <Link
          href={`/community/${region}/write`}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-bold"
        >
          글쓰기
        </Link>
      </div>

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
            className={`px-3 py-1.5 rounded text-xs font-bold ${
              filter === key ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="bg-white p-6 rounded-xl border text-center text-sm text-slate-400">
          등록된 글이 없습니다.
        </div>
      ) : (
        filteredPosts.map((p) => (
          <div
            key={p.id}
            onClick={() => goDetail(p.id)}
            className="bg-white p-4 rounded-xl border shadow-sm cursor-pointer hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2 text-xs mb-2 flex-wrap">
              {p.is_pinned && (
                <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full font-bold">
                  공지
                </span>
              )}

              <span className={`px-2 py-1 rounded-full font-bold ${TYPE_STYLE[p.post_type]}`}>
                {TYPE_LABEL[p.post_type]}
              </span>

              <span className="text-gray-400">{formatDate(p.created_at)}</span>
            </div>

            <div className="font-bold text-lg text-slate-900 leading-snug">
              {p.title}
            </div>

            <div className="text-xs text-gray-400 mt-1">
              {p.nickname || `이웃-${p.user_id.slice(0, 6)}`}
            </div>

            <div className="text-sm text-slate-700 mt-2 line-clamp-3 whitespace-pre-wrap leading-relaxed">
              {p.content}
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
              <button
                onClick={(e) => toggleLike(e, p.id)}
                className={`font-bold ${
                  likedMap[p.id] ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                ❤️ {p.like_count || 0}
              </button>

              <Link
                href={`/community/${region}/${p.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-slate-500 font-bold"
              >
                댓글 {p.comment_count || 0}
              </Link>

              {isAdmin && (
                <button
                  onClick={(e) => hidePost(e, p.id)}
                  className="text-xs text-red-500 font-bold"
                >
                  숨김
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
