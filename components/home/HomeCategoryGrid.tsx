'use client'

type Category = {
  id: string
  name: string
  icon: string
  sort_order: number
}

export default function HomeCategoryGrid({
  cats,
  counts,
  onSelectCategory,
}: {
  cats: Category[]
  counts: Record<string, number>
  onSelectCategory: (name: string) => void
}) {
  if (!cats.length) {
    return (
      <div className="bg-white border-b border-slate-200 px-3.5 py-3.5">
        <div className="text-[12px] text-slate-400 py-2">
          카테고리 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-b border-slate-200 px-3.5 py-3.5">
      <div className="text-[11px] font-bold text-slate-400 tracking-widest mb-2.5">
        카테고리
      </div>

      <div className="grid grid-cols-3 gap-2">
        {cats.map((c) => (
          <button
            key={c.name}
            onClick={() => onSelectCategory(c.name)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-[1.5px] border-slate-200 bg-white transition-all active:scale-[.97] text-left hover:bg-slate-50"
          >
            <span className="text-[20px] w-6 text-center flex-shrink-0">
              {c.icon}
            </span>
            <span className="min-w-0">
              <span className="text-[13px] font-bold block truncate text-slate-800">
                {c.name}
              </span>
              <span className="text-[10px] block mt-0.5 text-slate-400">
                {counts[c.name] ?? 0}개
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
