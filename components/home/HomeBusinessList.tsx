'use client'

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
  cats: any[]
  favs: string[]
  onToggleFav: (id: string, e: any) => void
  onOpenBusiness: (b: any) => void
  isAdmin?: boolean
  onToggleApproved?: (id: string, current: boolean) => void
}) {
  if (!Array.isArray(biz) || biz.length === 0) {
    return <div className="text-center py-20 text-slate-400">검색 결과 없음</div>
  }

  return (
    <div className="space-y-2">
      {biz.map((b) => {
        const name = b?.name_kr || b?.name_en || '업소'
        const phone = b?.phone || ''
        const city = b?.city || ''
        const isFav = favs?.includes(b?.id)

        return (
          <div
            key={b?.id || Math.random()}
            onClick={() => onOpenBusiness(b)}
            className="bg-white rounded-xl border px-4 py-3 flex gap-3 cursor-pointer"
          >
            <div className="flex-1">
              <div className="font-bold">{name}</div>

              {!b?.approved && (
                <div className="text-[10px] text-red-500">검토중</div>
              )}

              <div className="text-[12px] text-slate-400">{city}</div>

              {phone && (
                <div className="text-[12px] text-indigo-600">{phone}</div>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleApproved?.(b.id, b.approved)
                }}
                className="text-xs px-2 py-1 rounded bg-gray-200"
              >
                {b?.approved ? '승인' : '미승인'}
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
