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
  기타: 'bg-slate-100',
}

type Category = {
  id: string
  name: string
  icon: string
  sort_order?: number
}

export default function HomeBusinessList({
  biz,
  cats,
  favs,
  onToggleFav,
  onOpenBusiness,
}: {
  biz: any[]
  cats: Category[]
  favs: string[]
  onToggleFav: (id: string, e: any) => void
  onOpenBusiness: (b: any) => void
}) {
  if (!biz.length) {
    return (
      <div className="text-center py-20 text-slate-400">
        검색 결과가 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {biz.map((b) => {
        const catInfo =
          cats.find((c) => c.name === b.category_main) || cats[cats.length - 1]

        const isFav = favs.includes(b.id)
        const addr =
          b.address?.split(',').slice(0, -2).join(',').trim() || b.address

        return (
          <div
            key={b.id}
            onClick={() => onOpenBusiness(b)}
            className={`bg-white rounded-xl border px-4 py-3.5 flex gap-3 cursor-pointer active:scale-[.99] transition-all ${
              b.is_vip ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${
                CAT_BG[b.category_main] || 'bg-slate-50'
              }`}
            >
              {catInfo?.icon || '📋'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex gap-1 mb-1 flex-wrap">
                {!b.approved && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-300 text-slate-700">
                    검토중
                  </span>
                )}

                {b.is_vip && b.vip_tier && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-300 text-amber-900">
                    ⭐ {b.vip_tier.toUpperCase()}
                  </span>
                )}

                {b.category_sub && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {b.category_sub}
                  </span>
                )}
              </div>

              <div className="text-[16px] font-bold text-slate-900 truncate">
                {b.name_kr || b.name_en}
              </div>

              {addr && (
                <div className="text-[12px] text-slate-500 truncate mt-0.5">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      addr
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline underline"
                  >
                    {addr}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                {b.city && (
                  <span className="text-[11px] font-bold text-slate-400">
                    {b.city}
                  </span>
                )}

                {b.rating > 0 && (
                  <span className="text-[12px] font-bold text-slate-800">
                    ★{Number(b.rating).toFixed(1)}{' '}
                    <span className="text-[11px] font-normal text-slate-400">
                      ({(b.review_count || 0).toLocaleString()})
                    </span>
                  </span>
                )}

                {b.phone && (
                  <span className="text-[12px] font-bold text-indigo-600">
                    {b.phone}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={(e: any) => onToggleFav(b.id, e)}
              className="flex-shrink-0 self-start pt-0.5 p-1"
            >
              <span
                className={`text-xl ${isFav ? 'text-red-500' : 'text-slate-300'}`}
              >
                {isFav ? '♥' : '♡'}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
