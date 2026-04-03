'use client'

import Link from 'next/link'

const REVIEW_TAGS = [
  '친절함',
  '가격 좋음',
  '깨끗함',
  '주차 편함',
  '맛있음',
  '재방문 의사',
  '전문적임',
  '응답 빠름',
]

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

export default function HomeBusinessModal({
  sel,
  onClose,
  user,
  reviews = [],
  reviewLoading = false,
  reviewSaving = false,
  myReview,
  reviewForm,
  setReviewForm,
  relatedCommunityPosts = [],
  relatedPostsLoading = false,
  claimLoading = false,
  avgRating = 0,
  onToggleReviewTag,
  onSaveReview,
  onRequestOwnerClaim,
}: {
  sel: any
  onClose: () => void
  user: any
  reviews?: any[]
  reviewLoading?: boolean
  reviewSaving?: boolean
  myReview: any
  reviewForm: { rating: number; review_text: string; tags: string[] }
  setReviewForm: React.Dispatch<
    React.SetStateAction<{ rating: number; review_text: string; tags: string[] }>
  >
  relatedCommunityPosts?: CommunityPreviewPost[]
  relatedPostsLoading?: boolean
  claimLoading?: boolean
  avgRating?: number
  onToggleReviewTag: (tag: string) => void
  onSaveReview: () => void
  onRequestOwnerClaim: () => void
}) {
  if (!sel) return null

  const safeReviews = Array.isArray(reviews) ? reviews : []
  const safeRelatedPosts = Array.isArray(relatedCommunityPosts)
    ? relatedCommunityPosts
    : []

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex items-end"
      onClick={(e: any) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto pb-10">
        <div className="flex justify-end px-5 pt-4">
          <button onClick={onClose} className="text-slate-400 text-2xl">
            ✕
          </button>
        </div>

        <div className="px-5 pb-4 border-b border-slate-100">
          <div className="text-[12px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full inline-block mb-2">
            {sel.category_main || '업소'}
            {sel.category_sub ? ` · ${sel.category_sub}` : ''}
          </div>

          <h2 className="text-[22px] font-extrabold text-slate-900">
            {sel.name_kr || sel.name_en || '업소 상세'}
          </h2>

          {sel.name_kr && sel.name_en && (
            <p className="text-[13px] text-slate-400">{sel.name_en}</p>
          )}

          {Number(sel.rating || 0) > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">
                  {'★'.repeat(Math.max(1, Math.round(Number(sel.rating || 0))))}
                </span>
                <span className="font-bold">
                  {Number(sel.rating || 0).toFixed(1)}
                </span>
                <span className="text-[13px] text-slate-400">
                  외부 평점 · {(sel.review_count || 0).toLocaleString()}개
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-2 space-y-3">
          {sel.address && (
            <div className="flex gap-3 py-2">
              <span>📍</span>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  주소
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    sel.address
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline text-[14px] font-semibold text-indigo-600 underline"
                >
                  {sel.address}
                </a>
              </div>
            </div>
          )}

          {sel.phone && (
            <div className="flex gap-3 py-2">
              <span>📞</span>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  전화
                </div>
                <a
                  href={`tel:${sel.phone}`}
                  className="text-[14px] font-semibold text-indigo-600"
                >
                  {sel.phone}
                </a>
              </div>
            </div>
          )}

          {sel.website && (
            <div className="flex gap-3 py-2">
              <span>🌐</span>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  웹사이트
                </div>
                <a
                  href={sel.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[14px] font-semibold text-indigo-600"
                >
                  방문하기 →
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pt-4 border-t border-slate-100 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[16px] font-extrabold text-slate-900">
                관련 커뮤니티 글
              </div>
              <div className="text-[12px] text-slate-400 mt-0.5">
                이 업소와 연결된 글을 바로 볼 수 있습니다
              </div>
            </div>
          </div>

          {relatedPostsLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : safeRelatedPosts.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-[13px] text-slate-400 mb-4">
              아직 연결된 커뮤니티 글이 없습니다.
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {safeRelatedPosts.map((p) => (
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
                    <div className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                      💬 {p.comment_count || 0} ❤️ {p.like_count || 0}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[16px] font-extrabold text-slate-900">리뷰</div>
              <div className="text-[12px] text-slate-400 mt-0.5">
                {safeReviews.length > 0
                  ? `평균 ★${Number(avgRating || 0).toFixed(1)} · ${safeReviews.length}개`
                  : '아직 리뷰가 없습니다'}
              </div>
            </div>
          </div>

          {user ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
              <div className="text-[13px] font-bold text-slate-700 mb-3">
                {myReview ? '내 리뷰 수정' : '리뷰 작성'}
              </div>

              <div className="mb-3">
                <div className="text-[11px] font-bold text-slate-400 mb-2">별점</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating: n }))}
                      className={`text-2xl ${
                        n <= reviewForm.rating ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-[11px] font-bold text-slate-400 mb-2">한 줄 리뷰</div>
                <textarea
                  value={reviewForm.review_text}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      review_text: e.target.value,
                    }))
                  }
                  rows={3}
                  maxLength={120}
                  placeholder="예: 친절하고 빠르게 응대해줘요"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400 resize-none bg-white"
                />
              </div>

              <div className="mb-4">
                <div className="text-[11px] font-bold text-slate-400 mb-2">태그</div>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_TAGS.map((tag) => {
                    const active = reviewForm.tags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onToggleReviewTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={onSaveReview}
                disabled={reviewSaving}
                className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-[13px] font-bold disabled:opacity-50"
              >
                {reviewSaving
                  ? '저장 중...'
                  : myReview
                    ? '리뷰 수정하기'
                    : '리뷰 등록하기'}
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="block bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4 text-[13px] text-slate-600"
            >
              리뷰 작성은 로그인 후 가능합니다.
            </Link>
          )}

          {reviewLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : safeReviews.length === 0 ? (
            <div className="text-[13px] text-slate-400 py-4">첫 리뷰를 남겨보세요.</div>
          ) : (
            <div className="space-y-3 pb-2">
              {safeReviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[13px] font-bold text-slate-800">
                      {'★'.repeat(Number(r.rating || 0))}
                      <span className="ml-2 text-slate-500">
                        {Number(r.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>

                  {r.review_text && (
                    <div className="text-[13px] text-slate-700 leading-relaxed mb-2">
                      {r.review_text}
                    </div>
                  )}

                  {Array.isArray(r.tags) && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {r.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pt-2">
          {sel.phone && (
            <a
              href={`tel:${sel.phone}`}
              className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl text-[14px] font-bold text-center"
            >
              📞 전화하기
            </a>
          )}

          {sel.website && (
            <a
              href={sel.website}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-indigo-50 text-indigo-600 py-3.5 rounded-xl text-[14px] font-bold text-center"
            >
              🌐 홈페이지
            </a>
          )}
        </div>

        <div className="px-5 pt-3">
          <button
            onClick={onRequestOwnerClaim}
            disabled={claimLoading}
            className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl text-[13px] font-bold disabled:opacity-50"
          >
            {claimLoading ? '요청 중...' : '이 업소는 제 것입니다'}
          </button>
        </div>
      </div>
    </div>
  )
}
