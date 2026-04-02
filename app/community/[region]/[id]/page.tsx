'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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

  const [commentText, setCommentText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await sb.auth.getUser()
      setUser(userData.user)

      // 글
      const { data: postData } = await sb
        .from('community_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (!postData) {
        alert('글을 찾을 수 없습니다')
        router.push(`/community/${region}`)
        return
      }

      setPost(postData)

      // 업소 연결
      if (postData.business_id) {
        const { data: biz } = await sb
          .from('businesses')
          .select('id, name_kr, name_en, category_main')
          .eq('id', postData.business_id)
          .single()

        setBusiness(biz)
      }

      // 댓글
      const { data: commentData } = await sb
        .from('community_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: false })

      setComments(commentData || [])

      setLoading(false)
    }

    load()
  }, [id])

  const submitComment = async () => {
    if (!user) {
      alert('로그인이 필요합니다')
      router.push('/auth/login')
      return
    }

    if (!commentText.trim()) {
      alert('댓글을 입력하세요')
      return
    }

    setSaving(true)

    const nickname = `이웃-${user.id.slice(0, 6)}`

    const { error } = await sb.from('community_comments').insert({
      post_id: id,
      user_id: user.id,
      nickname,
      content: commentText,
    })

    setSaving(false)

    if (error) {
      alert('댓글 실패')
      return
    }

    setCommentText('')
    location.reload()
  }

  if (loading) return <div className="p-10">로딩중...</div>

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <Link href={`/community/${region}`} className="text-sm text-indigo-600">
        ← 목록
      </Link>

      {/* 글 */}
      <div className="bg-white p-4 rounded-xl border space-y-3">
        <div className="text-xs text-gray-400">
          {TYPE_LABEL[post.post_type]} ·{' '}
          {new Date(post.created_at).toLocaleDateString()}
        </div>

        <div className="text-lg font-bold">{post.title}</div>

        <div className="text-sm text-gray-500">
          {post.nickname}
        </div>

        <div className="text-sm whitespace-pre-wrap">
          {post.content}
        </div>

        {/* 업소 */}
        {business && (
          <div className="mt-3 p-3 bg-indigo-50 rounded">
            <div className="text-xs text-indigo-500">연결 업소</div>
            <div className="font-bold">
              {business.name_kr || business.name_en}
            </div>
            <div className="text-xs text-gray-500">
              {business.category_main}
            </div>
          </div>
        )}
      </div>

      {/* 댓글 */}
      <div className="bg-white p-4 rounded-xl border">
        <div className="font-bold mb-3">댓글</div>

        {comments.length === 0 ? (
          <div className="text-sm text-gray-400">댓글 없음</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="border-b py-2">
              <div className="text-xs text-gray-400">
                {c.nickname} · {new Date(c.created_at).toLocaleDateString()}
              </div>
              <div className="text-sm">{c.content}</div>
            </div>
          ))
        )}

        {/* 입력 */}
        <div className="mt-3 flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글 작성"
            className="flex-1 border p-2 rounded"
          />
          <button
            onClick={submitComment}
            className="bg-indigo-600 text-white px-4 rounded"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  )
}
