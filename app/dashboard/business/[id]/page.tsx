'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BusinessEditPage({ params }: any) {
  const [biz, setBiz] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data } = await sb.auth.getUser()

      if (!data.user) {
        window.location.href = '/auth/login'
        return
      }

      setUser(data.user)

      const { data: business } = await sb
        .from('businesses')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!business || business.owner_id !== data.user.id) {
        window.location.href = '/dashboard'
        return
      }

      setBiz(business)
      setLoading(false)
    }

    init()
  }, [params.id])

  const save = async () => {
    setSaving(true)

    const { error } = await sb
      .from('businesses')
      .update({
        name_kr: biz.name_kr,
        name_en: biz.name_en,
        phone: biz.phone,
        address: biz.address,
        website: biz.website,
        description_kr: biz.description_kr,
      })
      .eq('id', biz.id)

    setSaving(false)

    if (error) {
      alert('저장 실패')
      return
    }

    alert('저장 완료')
  }

  if (loading) return <div className="p-10">로딩중...</div>

  return (
    <div className="max-w-lg mx-auto p-4 space-y-3">
      <h1 className="text-xl font-bold">업소 수정</h1>

      <input value={biz.name_kr || ''} onChange={(e) => setBiz({ ...biz, name_kr: e.target.value })} placeholder="업소명(한글)" className="border p-2 w-full" />
      <input value={biz.name_en || ''} onChange={(e) => setBiz({ ...biz, name_en: e.target.value })} placeholder="업소명(영문)" className="border p-2 w-full" />
      <input value={biz.phone || ''} onChange={(e) => setBiz({ ...biz, phone: e.target.value })} placeholder="전화번호" className="border p-2 w-full" />
      <input value={biz.address || ''} onChange={(e) => setBiz({ ...biz, address: e.target.value })} placeholder="주소" className="border p-2 w-full" />
      <input value={biz.website || ''} onChange={(e) => setBiz({ ...biz, website: e.target.value })} placeholder="웹사이트" className="border p-2 w-full" />

      <textarea value={biz.description_kr || ''} onChange={(e) => setBiz({ ...biz, description_kr: e.target.value })} placeholder="소개글" className="border p-2 w-full" />

      <button
        onClick={save}
        className="bg-indigo-600 text-white w-full py-3 rounded"
      >
        {saving ? '저장중...' : '저장'}
      </button>
    </div>
  )
}
