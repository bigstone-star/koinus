'use client'

export default function HomeVipBusinesses({
  vipBiz,
  onOpenBusiness,
}: {
  vipBiz: any[]
  onOpenBusiness: (b: any) => void
}) {
  if (!Array.isArray(vipBiz) || vipBiz.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[14px] font-extrabold text-slate-900">
            ⭐ 지역 추천 업소
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            선택된 지역의 추천 업소입니다
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {vipBiz.map((b, index) => {
          const id = b?.id || `vip-${index}`
          const name = b?.name_kr || b?.name_en || '업소'
          const categoryMain = b?.category_main || ''
          const categorySub = b?.category_sub || ''
          const vipTier =
            typeof b?.vip_tier === 'string' && b.vip_tier.trim()
              ? b.vip_tier.toUpperCase()
              : 'VIP'

          return (
            <button
              key={id}
              onClick={() => onOpenBusiness(b)}
              className="w-full text-left rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-slate-900 truncate">
                    {name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">
                    {categoryMain}
                    {categorySub ? ` · ${categorySub}` : ''}
                  </div>
                </div>

                <div className="text-[10px] font-black px-2 py-1 rounded bg-amber-300 text-amber-900 whitespace-nowrap">
                  ⭐ {vipTier}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
