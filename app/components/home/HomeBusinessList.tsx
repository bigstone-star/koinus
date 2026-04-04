'use client'

import React from 'react'

type Business = {
  id: string
  name_kr?: string | null
  name_en?: string | null
  category_main?: string | null
  category_sub?: string | null
  address?: string | null
  city?: string | null
  phone?: string | null
  metro_area?: string | null
  rating?: number | null
  review_count?: number | null
  approved?: boolean | null
  is_active?: boolean | null
  is_vip?: boolean | null
}

type Props = {
  biz: Business[]
  cats?: any[]
  favs: string[]
  onToggleFav: (id: string, e: React.MouseEvent) => void
  onOpenBusiness: (business: Business) => void
  isAdmin?: boolean
  approvalSavingId?: string | null
  onToggleApproved?: (business: Business, e?: React.MouseEvent) => void
}

function regionLabel(value?: string | null) {
  if (!value) return ''
  if (value === 'houston') return 'Houston'
  if (value === 'dallas') return 'Dallas'
  if (value === 'fort_worth') return 'Fort Worth'
  if (value === 'central_texas') return 'Central Texas'
  return value
}

function displayName(b: Business) {
  return b.name_kr || b.name_en || '이름 없음'
}

function displayCategory(b: Business) {
  return b.category_sub || b.category_main || '기타'
}

export default function HomeBusinessList({
  biz,
  favs,
  onToggleFav,
  onOpenBusiness,
  isAdmin = false,
  approvalSavingId = null,
  onToggleApproved,
}: Props) {
  if (!biz || biz.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-8 text-center text-sm text-slate-500">
        검색 결과가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {biz.map((b) => {
        const isFav = favs.includes(b.id)
        const isApprovalSaving = approvalSavingId === b.id

        return (
          <div
            key={b.id}
            onClick={() => onOpenBusiness(b)}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">
                💰
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {!b.approved && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                          승인대기
                        </span>
                      )}
                      {b.is_vip && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-700">
                          VIP
                        </span>
                      )}
                      {b.is_active === false && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                          비활성
                        </span>
                      )}
                    </div>

                    <div className="font-extrabold text-[16px] leading-6 text-slate-900 break-words">
                      {displayName(b)}
                    </div>
                    <div className="text-[14px] text-slate-600 mt-1 break-words">
                      {b.address || ''}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[13px] mt-2 text-slate-500">
                      {b.metro_area && (
                        <span className="font-bold text-teal-700">{regionLabel(b.metro_area)}</span>
                      )}
                      {typeof b.rating === 'number' && (
                        <span className="font-bold text-slate-700">★{Number(b.rating).toFixed(1)}</span>
                      )}
                      {typeof b.review_count === 'number' && (
                        <span>({b.review_count})</span>
                      )}
                      {b.phone && (
                        <a
                          href={`tel:${b.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-indigo-600"
                        >
                          {b.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => onToggleFav(b.id, e)}
                    className="shrink-0 text-2xl leading-none text-slate-300 hover:text-rose-400"
                    aria-label="즐겨찾기"
                  >
                    {isFav ? '♥' : '♡'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-1.5">
                    {b.category_main || '기타'}
                  </span>

                  {displayCategory(b) !== b.category_main && (
                    <span className="inline-flex items-center rounded-lg bg-indigo-50 text-indigo-600 text-[11px] font-bold px-2.5 py-1.5">
                      {displayCategory(b)}
                    </span>
                  )}

                  {b.city && (
                    <span className="inline-flex items-center rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1.5">
                      {b.city}
                    </span>
                  )}

                  {b.metro_area && (
                    <span className="inline-flex items-center rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1.5">
                      {regionLabel(b.metro_area)}
                    </span>
                  )}
                </div>

                {isAdmin && onToggleApproved && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={(e) => onToggleApproved(b, e)}
                      disabled={isApprovalSaving}
                      className={[
                        'text-[12px] font-bold px-3 py-2 rounded-xl border',
                        b.approved
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-green-500 text-white border-green-500',
                        isApprovalSaving ? 'opacity-60 cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      {isApprovalSaving ? '처리중...' : b.approved ? '승인취소' : '승인하기'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
