'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TYPE_STYLE: Record<string, string> = {
  general: 'bg-slate-100 text-slate-600',
  question: 'bg-blue-50 text-blue-600',
  recommend: 'bg-amber-50 text-amber-700',
  news: 'bg-emerald-50 text-emerald-700',
}

const TYPE_LABEL: Record<string, string> = {
  general: '일반',
  question: '질문',
  recommend: '추천',
  news: '소식',
}

export default function CommunityDetailPage({
  params,
}: {
  params: { region: string; id: string }
}) {
  const router = useRouter()
  const { region, id } = params

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const makeNickname = (userId: string) => `이웃-${userId.slice(0, 6)}`

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await sb.auth.getUser()
      setUser(userData.user)

      if (userData.user) {
        const { data: profileData } = await sb
          .from('user_profiles')
          .select('id, name, email, role')
          .eq('id', userData.user.id)
          .maybeSingle()

        setProfile(profileData || null)

        if (
          profileData?.role === 'admin' ||
          profileData?.role === 'super_admin'
        ) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      }

      const { data: postData, error: postError } = await sb
        .from('community_posts')
        .select('*')
        .eq('id', id)
        .eq('region', region)
        .single()

      if (postError || !postData) {
        alert('글을 찾을 수 없습니다.')
        router.push(`/community/${region}`)
        return
      }

      setPost(postData)

      if (postData.business_id) {
        const { data: biz } = await sb
          .from('businesses')
          .select(`
            id,
            name_kr,
            name_en,
            category_main,
            category_sub,
            phone,
            address,
            city,
            website,
            rating,
            review_count,
            is_vip,
            vip_tier
          `)
          .eq('id', postData.business_id)
          .single()

        setBusiness(biz)
      } else {
        setBusiness(null)
      }

      const { data: commentData } = await sb
        .from('community_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: false })

      setComments(commentData || [])
      setLoading(false)
    }

    load()
  }, [id, region, router])

  const submitComment = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/auth/login')
      return
    }

    if (!commentText.trim()) {
      alert('댓글을 입력하세요.')
      return
    }

    setSaving(true)

    const nickname = profile?.name || makeNickname(user.id)

    const { data, error } = await sb
      .from('community_comments')
      .insert({
        post_id: id,
        user_id: user.id,
        nickname,
        content: commentText.trim(),
      })
      .select()
      .single()

    if (error) {
      setSaving(false)
      alert('댓글 실패: ' + error.message)
      return
    }

    await sb.rpc('increment_comment', { pid: id })

    setComments((prev) => [data, ...prev])
    setCommentText('')
    setPost((prev: any) =>
      prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : prev
    )
    setSaving(false)
  }

  const deleteComment = async (commentId: string) => {
    if (!isAdmin) {
      alert('관리자만 댓글을 삭제할 수 있습니다.')
      return
    }

    if (!confirm('이 댓글을 삭제하시겠습니까?')) return

    setDeletingId(commentId)

    const { error } = await sb
      .from('community_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      setDeletingId('')
      alert('댓글 삭제 실패: ' + error.message)
      return
    }

    await sb.rpc('decrement_comment', { pid: id })

    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setPost((prev: any) =>
      prev
        ? { ...prev, comment_count: Math.max((prev.comment_count || 0) - 1, 0) }
        : prev
    )

    setDeletingId('')
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  if (loading) return <div className="p-10 text-center">로딩중...</div>

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4 bg-slate-100 min-h-screen">
      <Link
        href={`/community/${region}`}
        className="text-sm text-indigo-600 font-bold"
      >
        ← {region.toUpperCase()} 커뮤니티
      </Link>

      <div className="bg-white p-5 rounded-2xl border space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span
            className={`px-2 py-1 rounded-full font-bold ${
              TYPE_STYLE[post.post_type]
            }`}
          >
            {TYPE_LABEL[post.post_type]}
          </span>

          {post.is_pinned && (
            <span className="px-2 py-1 rounded-full font-bold bg-red-50 text-red-600">
              공지
            </span>
          )}

          <span className="text-gray-400">{formatDate(post.created_at)}</span>
        </div>

        <div className="text-xl font-extrabold text-slate-900 leading-snug">
          {post.title}
        </div>

        <div className="text-xs text-slate-400">
          {post.nickname || makeNickname(post.user_id)}
        </div>

        <div className="text-[14px] text-slate-700 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>

        {business && (
          <div className="mt-2 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                    연결 업소
                  </span>

                  {business.is_vip && (
                    <span className="text-[10px] font-bold bg-amber-300 text-amber-900 px-2 py-1 rounded-full">
                      ⭐ {business.vip_tier?.toUpperCase() || 'VIP'}
                    </span>
                  )}
                </div>

                <div className="text-[18px] font-extrabold text-slate-900">
                  {business.name_kr || business.name_en}
                </div>

                {business.name_kr && business.name_en && (
                  <div className="text-[12px] text-slate-400 mt-1">
                    {business.name_en}
                  </div>
                )}

                <div className="text-[12px] text-slate-500 mt-2 flex flex-wrap gap-2">
                  {business.category_main && <span>{business.category_main}</span>}
                  {business.category_sub && <span>· {business.category_sub}</span>}
                  {business.city && <span>· {business.city}</span>}
                </div>

                {(business.rating > 0 || business.review_count > 0) && (
                  <div className="text-[12px] text-slate-600 mt-2">
                    ★ {Number(business.rating || 0).toFixed(1)} · 리뷰{' '}
                    {(business.review_count || 0).toLocaleString()}개
                  </div>
                )}

                {business.address && (
                  <div className="text-[12px] text-slate-500 mt-2 leading-relaxed">
                    {business.address}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 min-w-[96px]">
                {business.website ? (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-center bg-indigo-600 text-white text-[12px] font-bold px-3 py-2 rounded-lg"
                  >
                    홈페이지
                  </a>
                ) : (
                  <Link
                    href={`/?region=${region}&search=${encodeURIComponent(
                      business.name_kr || business.name_en || ''
                    )}`}
                    className="text-center bg-indigo-600 text-white text-[12px] font-bold px-3 py-2 rounded-lg"
                  >
                    업소 보기
                  </Link>
                )}

                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="text-center bg-white border border-slate-200 text-slate-700 text-[12px] font-bold px-3 py-2 rounded-lg"
                  >
                    전화하기
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400">
          댓글 {post.comment_count || 0}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border shadow-sm">
        <div className="font-bold mb-3">댓글</div>

        {comments.length === 0 ? (
          <div className="text-sm text-gray-400">댓글 없음</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="border-b py-3 last:border-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-400 mb-1">
                    {c.nickname} · {formatDate(c.created_at)}
                  </div>
                  <div className="text-sm text-slate-700">{c.content}</div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    disabled={deletingId === c.id}
                    className="text-xs text-red-500 font-bold whitespace-nowrap"
                  >
                    {deletingId === c.id ? '삭제중' : '삭제'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitComment()
            }}
            placeholder="댓글을 입력하세요"
            className="flex-1 border border-slate-200 p-2 rounded-lg text-sm"
          />
          <button
            onClick={submitComment}
            disabled={saving}
            className="bg-indigo-600 text-white px-4 rounded-lg text-sm font-bold"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  )
}
