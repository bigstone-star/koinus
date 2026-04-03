'use client'

import Link from 'next/link'

type CommunityPreviewPost = {
  id: string
  region: string
  post_type: 'general' | 'question' | 'recommend' | 'news'
  title: string
  like_count?: number | null
  comment_count?: number | null
}

function postTypeLabel(type?: string) {
  if (type === 'question') return '질문'
  if (type === 'recommend') return '추천'
  if (type === 'news') return '소식'
  return '일반'
}

export default function HomeCommunityLatest({
  posts,
  region,
  regionLabel,
}: {
  posts: CommunityPreviewPost[]
  region: string
  regionLabel: string
}) {
  if (!posts.length) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[14px] font-extrabold text-slate-900">
            📢 커뮤니티 최신 글
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {regionLabel} 지역 최신 글
          </div>
        </div>

        <Link
          href={`/community/${region}`}
          className="text-[11px] font-bold text-indigo-600 whitespace-nowrap"
        >
          더보기
        </Link>
      </div>

      <div className="space-y-2">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/community/${p.region}/${p.id}`}
            className="block px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-50"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                  {postTypeLabel(p.post_type)}
                </span>

                <span className="text-[13px] font-bold text-slate-800 truncate">
                  {p.title}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 shrink-0">
                💬 {p.comment_count || 0} ❤️ {p.like_count || 0}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
