'use client'

export default function HomeBusinessModal({
  sel,
  onClose,
}: {
  sel: any
  onClose: () => void
}) {
  if (!sel) return null

  // 🔥 안전 처리
  const name = sel?.name_kr || sel?.name_en || '업소'
  const categoryMain = sel?.category_main || ''
  const categorySub = sel?.category_sub || ''
  const address = sel?.address || ''
  const phone = sel?.phone || ''
  const website = sel?.website || ''
  const rating = Number(sel?.rating || 0)
  const reviewCount = Number(sel?.review_count || 0)

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60"
      onClick={(e:any)=>{ if(e.target===e.currentTarget) onClose() }}
    >
      <div className="absolute bottom-0 w-full bg-white rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">

        {/* 제목 */}
        <div className="text-lg font-bold">
          {name}
        </div>

        {/* 카테고리 */}
        <div className="text-sm text-gray-500">
          {categoryMain} {categorySub}
        </div>

        {/* 평점 */}
        {rating > 0 && (
          <div className="mt-2 text-sm">
            ⭐ {rating} ({reviewCount})
          </div>
        )}

        {/* 주소 */}
        {address && (
          <div className="mt-3 text-sm">
            {address}
          </div>
        )}

        {/* 전화 */}
        {phone && (
          <div className="mt-2 text-sm">
            📞 {phone}
          </div>
        )}

        {/* 웹사이트 */}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noreferrer"
            className="mt-2 text-blue-500 text-sm block"
          >
            홈페이지
          </a>
        )}

        {/* 닫기 */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 rounded-lg bg-gray-100"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
