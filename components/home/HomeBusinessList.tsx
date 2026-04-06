'use client'

const CAT_BG: Record<string, string> = {
  '식당·카페': 'bg-orange-50',
  '마트·식품': 'bg-yellow-50',
  의료: 'bg-blue-50',
  병원: 'bg-blue-50',
  치과: 'bg-emerald-50',
  한의원: 'bg-lime-50',
  법률: 'bg-violet-50',
  자동차: 'bg-amber-50',
  미용: 'bg-pink-50',
  교육: 'bg-green-50',
  '금융·보험': 'bg-sky-50',
  '은행/금융': 'bg-sky-50',
  커뮤니티: 'bg-slate-50',
  부동산: 'bg-orange-50',
  세탁소: 'bg-teal-50',
  종교: 'bg-fuchsia-50',
  'CPA·회계사': 'bg-cyan-50',
  전문직: 'bg-cyan-50',
  여행: 'bg-blue-50',
  언론사: 'bg-zinc-100',
  '기관·단체': 'bg-purple-50',
  쇼핑: 'bg-rose-50',
  기타: 'bg-slate-100',
}

type Category = {
  id: string
  name: string
  icon: string
}

export default function HomeBusinessList({
  biz,
  cats,
  favs,
  onToggleFav,
  onOpenBusiness,
  isAdmin,
  onToggleApproved,
}: {
  biz: any[]
  cats: Category[]
  favs: string[]
  onToggleFav: (id: string, e: any) => void
  onOpenBusiness: (b: any) => void
  isAdmin?: boolean
  onToggleApproved?: (id: string, current: boolean) => void
}) {
  if (!Array.isArray(biz) || biz.length === 0) {
    return <div className="text-center py-20 text-slate-400">검색 결과가 없습니다</div>
  }

  return (
    <div className="space-y-2">
      {biz.map((b, index) => {
        const id = b?.id || `biz-${index}`
        const categoryMain = b?.category_main || '기타'
        const catInfo =
          cats.find((c) => c.name === categoryMain) || cats[cats.length - 1]

        const isFav = favs.includes(id)
        const name = b?.name_kr || b?.name_en || '업소'
        const city = b?.city || ''
        const phone = b?.phone || ''
        const approved = !!b?.approved
        const isVip = !!b?.is_vip
        const categoryBg = CAT_BG[categoryMain] || 'bg-slate-100'

        return (
          <div
            key={id}
            onClick={() => onOpenBusiness(b)}
            className={`bg-white rounded-xl border px-4 py-3 flex gap-3 cursor-pointer ${
              isVip ? 'border-amber-300' : 'border-slate-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryBg}`}>
              {catInfo?.icon || '📋'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{name}</div>

              {!approved && (
                <div className="text-[10px] text-red-500 font-bold">검토중</div>
              )}

              {city && <div className="text-[12px] text-slate-400 truncate">{city}</div>}

              {phone && (
                <div className="text-[12px] text-indigo-600 truncate">{phone}</div>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleApproved?.(id, approved)
                }}
                className={`text-xs px-2 py-1 rounded ${
                  approved
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {approved ? '승인' : '미승인'}
              </button>
            )}

            <button onClick={(e) => onToggleFav(id, e)} className="shrink-0">
              {isFav ? '♥' : '♡'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
