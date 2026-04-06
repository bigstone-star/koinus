'use client'

export default function HomeBusinessModal({
  sel,
  onClose,
}: {
  sel: any
  onClose: () => void
}) {
  if (!sel) return null

  const name = sel?.name_kr || sel?.name_en || '업소'
  const address = sel?.address || ''
  const phone = sel?.phone || ''
  const website = sel?.website || ''
  const rating = Number(sel?.rating || 0)
  const reviewCount = Number(sel?.review_count || 0)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
      }}
      onClick={(e:any)=>{ if(e.target===e.currentTarget) onClose() }}
    >
      <div className="bg-white p-5 rounded-t-2xl absolute bottom-0 w-full max-h-[90vh] overflow-y-auto">
        <div className="font-bold text-lg">{name}</div>

        <div className="text-sm text-slate-400">
          {sel?.category_main} {sel?.category_sub}
        </div>

        {rating > 0 && (
          <div className="mt-2">
            ⭐ {rating} ({reviewCount})
          </div>
        )}

        {address && <div className="mt-2">{address}</div>}

        {phone && <div className="mt-2">📞 {phone}</div>}

        {website && (
          <a href={website} target="_blank" className="text-blue-500 mt-2 block">
            홈페이지
          </a>
        )}

        <button onClick={onClose} className="mt-4">
          닫기
        </button>
      </div>
    </div>
  )
}
