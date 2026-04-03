'use client'

type Category = {
  id: string
  name: string
  icon: string
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

  // 👉 실제 데이터 있는 카테고리만 표시 (안전)
  const visibleCats = cats.filter((c) => {
    if (c.name === '전체') return true
    return (counts?.[c.name] || 0) > 0
  })

  return (
    <div className="bg-white px-3 py-3">

      {/* 🔥 핵심: grid 확실히 적용 */}
      <div className="grid grid-cols-5 gap-2">

        {visibleCats.map((c) => {
          const isActive = selected === c.name

          return (
            <button
              key={c.name}
              onClick={() => onSelectCategory(c.name)}
              className={`
                flex flex-col items-center justify-center
                rounded-lg border
                h-[60px]
                text-center
                transition-all

                ${isActive
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'}
              `}
            >
              <div className="text-[18px] leading-none">
                {c.icon}
              </div>

              <div className="text-[10px] font-bold mt-1 leading-tight px-1 break-keep">
                {c.name}
              </div>
            </button>
          )
        })}

      </div>
    </div>
  )
}
