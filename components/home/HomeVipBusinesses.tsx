'use client'

import Link from 'next/link'

export default function HomeVipBusinesses({
  vipBiz,
  onOpenBusiness,
}: {
  vipBiz: any[]
  onOpenBusiness: (b: any) => void
}) {
  if (!vipBiz.length) return null

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[14px] font-extrabold text-slate-900">
            ⭐ 지역 추천 업소
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            선택된 지역 VIP 업소를 먼저 보여드립니다
          </div>
        </div>

        <Link
          href="/pricing"
          className="text-[11px] font-bold text-amber-700 whitespace-nowrap"
        >
          VIP 안내
        </Link>
      </div>

      <div className="space-y-2">
        {vipBiz.map((b) => (
          <button
            key={b.id}
            onClick={() => onOpenBusiness(b)}
            className="w-full text-left rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-slate-900 truncate">
                  {b.name_kr || b.name_en}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  {b.category_main}
                  {b.category_sub ? ` · ${b.category_sub}` : ''}
                </div>
              </div>

              <div className="text-[10px] font-black px-2 py-1 rounded bg-amber-300 text-amber-900 whitespace-nowrap">
                ⭐ {b.vip_tier?.toUpperCase() || 'VIP'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
