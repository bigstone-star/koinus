'use client'

const REVIEW_TAGS = ['친절함','가격 좋음','깨끗함','주차 편함','맛있음','재방문 의사','전문적임','응답 빠름']

export default function HomeBusinessModal({
  sel, onClose, user, reviews, reviewLoading, reviewSaving,
  myReview, reviewForm, setReviewForm, onToggleReviewTag, onSaveReview,
  relatedCommunityPosts, relatedPostsLoading, avgRating, claimLoading, onRequestOwnerClaim,
}: {
  sel: any; onClose: () => void; user?: any; reviews?: any[]
  reviewLoading?: boolean; reviewSaving?: boolean; myReview?: any
  reviewForm?: { rating: number; review_text: string; tags: string[] }
  setReviewForm?: (fn: any) => void; onToggleReviewTag?: (tag: string) => void
  onSaveReview?: () => void; relatedCommunityPosts?: any[]
  relatedPostsLoading?: boolean; avgRating?: number
  claimLoading?: boolean; onRequestOwnerClaim?: () => void
}) {
  if (!sel) return null
  const addr = sel.address?.split(',').slice(0,-2).join(',').trim() || sel.address
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sel.address||sel.name_en||'')}`
  const displayRating = (avgRating&&avgRating>0) ? avgRating : Number(sel.rating||0)

  return (
    <div
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'flex-end',
  }}
  onClick={(e:any)=>{ if(e.target===e.currentTarget) onClose() }}
>
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 pt-5 pb-3 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {sel.is_vip&&sel.vip_tier&&(<span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-300 text-amber-900">⭐ {sel.vip_tier.toUpperCase()}</span>)}
              {!sel.approved&&(<span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">검토중</span>)}
            </div>
            <div className="text-[19px] font-extrabold text-slate-900">{sel.name_kr||sel.name_en||'업소 상세'}</div>
            {sel.name_kr&&sel.name_en&&(<div className="text-[12px] text-slate-400 mt-0.5">{sel.name_en}</div>)}
            <div className="text-[12px] text-indigo-600 font-bold mt-0.5">{sel.category_sub?`${sel.category_main} · ${sel.category_sub}`:sel.category_main}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 text-[13px] font-bold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">닫기</button>
        </div>
        <div className="px-5 pt-4 pb-8 space-y-4">
          {displayRating>0&&(<div className="flex items-center gap-2"><span className="text-[24px] font-black text-slate-800">★{displayRating.toFixed(1)}</span><span className="text-[13px] text-slate-400">({reviews&&reviews.length>0?reviews.length:(sel.review_count||0).toLocaleString()}개 리뷰)</span></div>)}
          <div className="grid grid-cols-3 gap-2">
            {sel.phone?(<a href={`tel:${sel.phone}`} className="flex flex-col items-center gap-1 bg-green-50 border border-green-200 rounded-xl py-3 text-green-700"><span className="text-[22px]">📞</span><span className="text-[11px] font-bold">전화하기</span></a>):<div/>}
            {sel.address?(<a href={mapsUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 bg-blue-50 border border-blue-200 rounded-xl py-3 text-blue-700"><span className="text-[22px]">📍</span><span className="text-[11px] font-bold">지도보기</span></a>):<div/>}
            {sel.website?(<a href={sel.website} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl py-3 text-slate-700"><span className="text-[22px]">🌐</span><span className="text-[11px] font-bold">홈페이지</span></a>):<div/>}
          </div>
          {addr&&(<div className="flex items-start gap-2 text-[13px] text-slate-600"><span className="flex-shrink-0">📍</span><a href={mapsUrl} target="_blank" rel="noreferrer" className="underline">{addr}</a></div>)}
          {sel.phone&&(<div className="flex items-center gap-2 text-[13px] text-slate-600"><span>📞</span><a href={`tel:${sel.phone}`} className="text-indigo-600 font-bold">{sel.phone}</a></div>)}
          {sel.description_kr&&(<div className="bg-slate-50 rounded-xl p-4 text-[13px] text-slate-700 leading-relaxed">{sel.description_kr}</div>)}
          <div className="h-px bg-slate-100"/>
          <div>
            <div className="text-[15px] font-bold text-slate-800 mb-3">리뷰</div>
            {reviewLoading?(<div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>):(<>
              {!user&&(<a href="/auth/login" className="block text-center text-[13px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 rounded-xl py-3 mb-4">로그인 후 리뷰를 남길 수 있습니다 →</a>)}
              {user&&setReviewForm&&onSaveReview&&(
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 space-y-3">
                  <div className="text-[13px] font-bold text-indigo-800">{myReview?'내 리뷰 수정':'리뷰 작성'}</div>
                  <div className="flex gap-1">{[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>setReviewForm((p:any)=>({...p,rating:n}))} className={`text-[26px] ${n<=(reviewForm?.rating||5)?'text-amber-400':'text-slate-200'}`}>★</button>))}</div>
                  <div className="flex flex-wrap gap-1.5">{REVIEW_TAGS.map(tag=>{const on=reviewForm?.tags?.includes(tag);return(<button key={tag} onClick={()=>onToggleReviewTag?.(tag)} className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${on?'bg-indigo-600 text-white border-indigo-600':'bg-white text-slate-600 border-slate-200'}`}>{tag}</button>)})}</div>
                  <textarea value={reviewForm?.review_text||''} onChange={e=>setReviewForm((p:any)=>({...p,review_text:e.target.value}))} placeholder="한 줄 리뷰를 남겨주세요" rows={2} className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-[13px] outline-none resize-none bg-white"/>
                  <button onClick={onSaveReview} disabled={reviewSaving} className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-[13px] font-bold disabled:opacity-60">{reviewSaving?'저장 중...':myReview?'리뷰 수정':'리뷰 등록'}</button>
                </div>
              )}
              {reviews&&reviews.length>0?(<div className="space-y-3">{reviews.map((r:any)=>(<div key={r.id} className="border border-slate-100 rounded-xl p-3"><div className="flex items-center gap-2 mb-1"><span className="text-amber-400 font-bold text-[13px]">{'★'.repeat(Number(r.rating)||5)}</span><span className="text-[11px] text-slate-400">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span></div>{r.tags?.length>0&&(<div className="flex flex-wrap gap-1 mb-1.5">{r.tags.map((t:string)=>(<span key={t} className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">{t}</span>))}</div>)}{r.review_text&&(<div className="text-[13px] text-slate-700">{r.review_text}</div>)}</div>))}</div>):(<div className="text-center text-[13px] text-slate-400 py-6">아직 리뷰가 없습니다</div>)}
            </>)}
          </div>
          {user&&onRequestOwnerClaim&&(<button onClick={onRequestOwnerClaim} disabled={claimLoading} className="w-full border border-slate-200 rounded-xl py-3 text-[12px] text-slate-500 font-bold hover:bg-slate-50 disabled:opacity-50">{claimLoading?'처리 중...':'🏢 이 업소의 오너입니다 (자격 요청)'}</button>)}
        </div>
      </div>
    </div>
  )
} 
