'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BusinessDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBusiness()
  }, [])

  async function fetchBusiness() {
    setLoading(true)
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()

    setBusiness(data)
    setLoading(false)
  }

  async function handleSave() {
    if (saving) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('businesses')
        .update(business)
        .eq('id', id)

      if (error) throw error

      alert('저장되었습니다.')
      router.push('/admin/businesses')
    } catch (err: any) {
      alert('저장 실패: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !business) {
    return <div className="p-6">로딩 중...</div>
  }

  return (
    <div className="p-6 space-y-6">

      {/* 🔹 상단 액션바 */}
      <div className="sticky top-0 bg-white z-10 border-b pb-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">업소 수정</h1>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {saving ? '저장중...' : '저장하기'}
        </button>
      </div>

      {/* 🔹 입력 폼 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input
          className="border p-2"
          placeholder="이름 (한글)"
          value={business.name_kr || ''}
          onChange={(e) =>
            setBusiness({ ...business, name_kr: e.target.value })
          }
        />

        <input
          className="border p-2"
          placeholder="이름 (영문)"
          value={business.name_en || ''}
          onChange={(e) =>
            setBusiness({ ...business, name_en: e.target.value })
          }
        />

        <input
          className="border p-2"
          placeholder="카테고리"
          value={business.category_main || ''}
          onChange={(e) =>
            setBusiness({ ...business, category_main: e.target.value })
          }
        />

        <input
          className="border p-2"
          placeholder="전화번호"
          value={business.phone || ''}
          onChange={(e) =>
            setBusiness({ ...business, phone: e.target.value })
          }
        />

        <input
          className="border p-2"
          placeholder="주소"
          value={business.address || ''}
          onChange={(e) =>
            setBusiness({ ...business, address: e.target.value })
          }
        />

        <input
          className="border p-2"
          placeholder="도시"
          value={business.city || ''}
          onChange={(e) =>
            setBusiness({ ...business, city: e.target.value })
          }
        />

      </div>

      {/* 🔹 하단 저장 버튼 */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded"
        >
          {saving ? '저장중...' : '저장하기'}
        </button>
      </div>

    </div>
  )
}
