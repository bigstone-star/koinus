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

const REGION_META: Record<string, { title: string; label: string }> = {
  houston: { title: 'Houston 커뮤니티', label: 'Houston' },
  dallas: { title: 'Dallas 커뮤니티', label: 'Dallas' },
  fort_worth: { title: 'Fort Worth 커뮤니티', label: 'Fort Worth' },
  central_texas: { title: 'Central Texas 커뮤니티', label: 'Central Texas' },
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
  const [profile, setProfile] = useState<any>(null)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [reportedMap, setReportedMap] = useState<Record<string, boolean>>({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [showHidden, setShowHidden] = useState(false)

  useEffect(() => {
    init()
  }, [region, showHidden])

  const init = async () => {
    setLoading(true)

    const { data: userData } = await sb.auth.getUser()
    setUser(userData.user || null)

    let admin = false

    if (userData.user) {
      const { data: profileData } = await sb
        .from('user_profiles')
        .select('id, name, email, role')
        .eq('id', userData.user.id)
        .maybeSingle()

      setProfile(profileData || null)

      if (profileData?.role === 'admin' || profileData?.role === 'super_admin') {
        admin = true
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } else {
      setProfile(null)
      setIsAdmin(false)
    }

    await loadPosts(userData.user || null, admin)
    setLoading(false)
  }

  const loadPosts = async (currentUser?: any, adminFlag?: boolean) => {
    const admin = typeof adminFlag === 'boolean' ? adminFlag : isAdmin

    let query = sb
      .from('community_posts')
      .select('*')
      .eq('region', region)

    if (!admin || !showHidden) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
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
      const { data: likes } = await sb
        .from('community_likes')
        .select('post_id')
        .eq('user_id', currentUser.id)

      const likeMap: Record<string, boolean> = {}
      ;(likes || []).forEach((l: any) => {
        if (l.post_id) likeMap[l.post_id] = true
      })
      setLikedMap(likeMap)

      const { data: reports } = await sb
        .from('community_reports')
        .select('post_id')
        .eq('user_id', currentUser.id)

      const reportMap: Record<string, boolean> = {}
      ;(reports || []).forEach((r: any) => {
        if (r.post_id) reportMap[r.post_id] = true
      })
      setReportedMap(reportMap)
    } else {
      setLikedMap({})
      setReportedMap({})
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

      await sb.rpc('decrement_like', { pid: postId })
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

      await sb.rpc('increment_like', { pid: postId })
    }

    await loadPosts(user, isAdmin)
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

    await loadPosts(user, isAdmin)
    alert('글이 숨김 처리되었습니다.')
  }

  const restorePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()

    if (!isAdmin) return
    if (!confirm('이 글을 복구하시겠습니까?')) return

    const { error } = await sb
      .from('community_posts')
      .update({ is_active: true })
      .eq('id', postId)

    if (error) {
      alert('복구 실패: ' + error.message)
      return
    }

    await loadPosts(user, isAdmin)
    alert('글이 복구되었습니다.')
  }

  const togglePinned = async (e: React.MouseEvent, postId: string, nextPinned: boolean) => {
    e.stopPropagation()

    if (!isAdmin) return

    const { error } = await sb
      .from('community_posts')
      .update({ is_pinned: nextPinned })
      .eq('id', postId)

    if (error) {
      alert('공지 설정 실패: ' + error.message)
      return
    }

    await loadPosts(user, isAdmin)
    alert(nextPinned ? '공지글로 고정되었습니다.' : '공지글 고정이 해제되었습니다.')
  }

  const reportPost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()

    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (reportedMap[postId]) {
      alert('이미 신고한 글입니다.')
      return
    }

    const reason = prompt('신고 사유를 입력하세요.\n예: 광고성, 욕설, 허위 정보')
    if (!reason || !reason.trim()) return

    const { error } = await sb
      .from('community_reports')
      .insert({
        post_id: postId,
        user_id: user.id,
        reason: reason.trim(),
      })

    if (error) {
      alert('신고 실패: ' + error.message)
      return
    }

    setReportedMap((prev) => ({ ...prev, [postId]: true }))
    alert('신고가 접수되었습니다.')
  }

  const goDetail = (postId: string) => {
    router.push(`/community/${region}/${postId}`)
  }

  const handleRegionChange = (nextRegion: string) => {
  try {
    localStorage.setItem('gj_region', nextRegion)
    window.dispatchEvent(
      new CustomEvent('gj_region_changed', { detail: nextRegion })
    )
  } catch {}

  router.push(`/community/${nextRegion}`)
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

  const regionTitle = REGION_META[region]?.title || '커뮤니티'

  if (loading) {
    return <div className="p-10 text-center">로딩중...</div>
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4 bg-slate-100 min-h-screen">
      <div className="flex justify-between items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">{regionTitle}</h1>
          {user && (
            <div className="text-xs text-slate-500 mt-1">
              {profile?.name || '회원'}
              {profile?.role ? ` · ${profile.role}` : ''}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={region}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm"
          >
            {Object.entries(REGION_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>

          <Link
            href={`/community/${region}/write?type=${filter === 'all' ? 'general' : filter}`}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-bold"
          >
            글쓰기
          </Link>
        </div>
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

        {isAdmin && (
          <button
            onClick={() => setShowHidden((prev) => !prev)}
            className="px-3 py-1.5 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-100"
          >
            {showHidden ? '숨김 숨기기' : '숨김 보기'}
          </button>
        )}
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

              {!p.is_active && (
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                  숨김됨
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

              {!isAdmin && (
                <button
                  onClick={(e) => reportPost(e, p.id)}
                  className={`text-xs font-bold ${
                    reportedMap[p.id] ? 'text-slate-400' : 'text-orange-500'
                  }`}
                >
                  {reportedMap[p.id] ? '신고완료' : '신고'}
                </button>
              )}

              {isAdmin && p.is_active !== false && (
                <button
                  onClick={(e) => hidePost(e, p.id)}
                  className="text-xs text-red-500 font-bold"
                >
                  숨김
                </button>
              )}

              {isAdmin && p.is_active === false && (
                <button
                  onClick={(e) => restorePost(e, p.id)}
                  className="text-xs text-green-600 font-bold"
                >
                  복구
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={(e) => togglePinned(e, p.id, !p.is_pinned)}
                  className={`text-xs font-bold ${
                    p.is_pinned ? 'text-indigo-600' : 'text-slate-500'
                  }`}
                >
                  {p.is_pinned ? '공지해제' : '공지고정'}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
