'use client'

type Category = {
  id: string
  name: string
  icon: string
  sort_order?: number
}

export default function HomeCategoryGrid({
  cats,
  selected,
  counts,
  onSelectCategory,
}: {
  cats: Category[]
  selected: string
  counts: Record<string, number>
  onSelectCategory: (name: string) => void
}) {
  const visibleCats = cats.filter((c) => {
    if (c.name === '전체') return true
    return (counts?.[c.name] || 0) > 0
  })

  return (
    <div className="bg-white px-3 py-3">
      <div className="grid grid-cols-5 gap-2">
        {visibleCats.map((c) => {
          const isActive = selected === c.name

          return (
            <button
              key={c.name}
              onClick={() => onSelectCategory(c.name)}
              className={[
                'h-[62px] rounded-lg border flex flex-col items-center justify-center text-center px-1 transition-all',
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200',
              ].join(' ')}
            >
              <div className="text-[18px] leading-none">{c.icon}</div>
              <div className="mt-1 text-[10px] font-bold leading-tight break-keep">
                {c.name}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
