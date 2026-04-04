'use client'

const CAT_BG: Record<string, string> = {
  '식당·카페': 'bg-orange-50',
  '마트·식품': 'bg-yellow-50',
  의료: 'bg-blue-50',
  치과: 'bg-emerald-50',
  법률: 'bg-violet-50',
  자동차: 'bg-amber-50',
  미용: 'bg-pink-50',
  교육: 'bg-green-50',
  '금융·보험': 'bg-sky-50',
  커뮤니티: 'bg-slate-50',
  부동산: 'bg-orange-50',
  세탁소: 'bg-teal-50',
  한의원: 'bg-lime-50',
  종교: 'bg-fuchsia-50',
  'CPA·회계사': 'bg-cyan-50',
  여행: 'bg-blue-50',
  언론사: 'bg-zinc-100',
  '기관·단체': 'bg-purple-50',
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
  if (!biz || biz.length === 0) {
    return <div className="text-center py-20 text-slate-400">검색 결과가 없습니다</div>
  }

  return (
    <div className="space-y-2">
      {biz.map((b) => {
        const catInfo =
          cats.find((c) => c.name === b.category_main) || cats[cats.length - 1]

        const isFav = favs.includes(b.id)

        return (
          <div
            key={b.id}
            onClick={() => onOpenBusiness(b)}
            className={`bg-white rounded-xl border px-4 py-3 flex gap-3 cursor-pointer ${
              b.is_vip ? 'border-amber-300' : 'border-slate-200'
            }`}
          >
            <div className={`w-10 h-10 flex items-center justify-center ${CAT_BG[b.category_main]}`}>
              {catInfo?.icon || '📋'}
            </div>

            <div className="flex-1">
              <div className="font-bold">{b.name_kr || b.name_en}</div>

              {!b.approved && (
                <div className="text-[10px] text-red-500 font-bold">검토중</div>
              )}

              <div className="text-[12px] text-slate-400">{b.city}</div>

              {b.phone && (
                <div className="text-[12px] text-indigo-600">{b.phone}</div>
              )}
            </div>

            {/* ⭐ 관리자 전용 승인 토글 */}
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleApproved?.(b.id, b.approved)
                }}
                className={`text-xs px-2 py-1 rounded ${
                  b.approved
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {b.approved ? '승인' : '미승인'}
              </button>
            )}

            <button onClick={(e) => onToggleFav(b.id, e)}>
              {isFav ? '♥' : '♡'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
