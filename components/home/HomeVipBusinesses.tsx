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
      <div className="mb-3">
        <div className="text-[14px] font-extrabold text-slate-900">
          ⭐ 지역 추천 업소
        </div>
      </div>

      <div className="space-y-2">
        {vipBiz.map((b) => {
          const name = b?.name_kr || b?.name_en || '업소'
          const category =
            b?.category_sub
              ? `${b?.category_main || ''} · ${b?.category_sub}`
              : b?.category_main || ''

          return (
            <button
              key={b?.id || Math.random()}
              onClick={() => onOpenBusiness(b)}
              className="w-full text-left rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-3"
            >
              <div className="flex justify-between">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold truncate">
                    {name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {category}
                  </div>
                </div>

                <div className="text-[10px] px-2 py-1 rounded bg-amber-300">
                  ⭐ {(b?.vip_tier || 'VIP').toUpperCase()}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
