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
  const visibleCats = cats.filter((c) => {
    if (c.name === '전체') return true
    return (counts?.[c.name] || 0) > 0
  })

  return (
    <div className="bg-white px-3 py-3">

      {/* 🔥 핵심: flex + wrap */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>

        {visibleCats.map((c) => {
          const isActive = selected === c.name

          return (
            <button
              key={c.name}
              onClick={() => onSelectCategory(c.name)}
              style={{
                width: '18%',          // 👉 5개 고정
                height: '62px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive
  ? 'var(--category_active_bg)'
  : '#f8fafc',
                color: isActive ? '#fff' : '#334155',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              <div style={{ fontSize: '18px' }}>{c.icon}</div>
              <div style={{ marginTop: '4px' }}>{c.name}</div>
            </button>
          )
        })}

      </div>
    </div>
  )
}
