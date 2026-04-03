'use client'

type Category = {
  id: string
  name: string
  icon: string
}

export default function HomeCategoryGrid({
  cats,
  selected,
  onSelectCategory,
}: {
  cats: Category[]
  selected: string
  onSelectCategory: (name: string) => void
}) {
  return (
    <div className="bg-white px-3 py-3">

      {/* 👉 flex wrap 강제 */}
      <div className="flex flex-wrap gap-2">

        {cats.map((c) => {
          const isActive = selected === c.name

          return (
            <button
              key={c.name}
              onClick={() => onSelectCategory(c.name)}
              className={`
                flex flex-col items-center justify-center
                rounded-xl border
                h-[62px]
                text-center
                transition-all

                /* 👉 핵심: 5개 고정 */
                w-[18%]

                ${isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                  : 'bg-slate-50 text-slate-700 border-slate-200'}
              `}
            >
              <div className="text-[18px] leading-none">
                {c.icon}
              </div>

              <div className="text-[10px] font-bold mt-1 leading-tight break-keep">
                {c.name}
              </div>
            </button>
          )
        })}

      </div>
    </div>
  )
}
