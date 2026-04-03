'use client'

export default function HomeBusinessModal({
  sel,
  onClose,
}: {
  sel: any
  onClose: () => void
}) {
  if (!sel) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 flex items-end"
      onClick={(e: any) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-t-2xl w-full p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[18px] font-extrabold text-slate-900">
            {sel.name_kr || sel.name_en || '업소 상세'}
          </div>
          <button onClick={onClose} className="text-slate-500">
            닫기
          </button>
        </div>

        <div className="text-[14px] text-slate-700 space-y-2">
          <div>카테고리: {sel.category_main || '-'}</div>
          {sel.phone && <div>전화: {sel.phone}</div>}
          {sel.address && <div>주소: {sel.address}</div>}
          {!sel.approved && (
            <div className="inline-block px-2 py-1 rounded bg-slate-200 text-[12px] font-bold text-slate-700">
              검토중
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
