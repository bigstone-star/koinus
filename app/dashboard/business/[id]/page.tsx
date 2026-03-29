'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardBusinessEditPage() {
  const params = useParams()
  const businessId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [business, setBusiness] = useState<any>(null)

  const [form, setForm] = useState({
    name_kr: '',
    name_en: '',
    category_main: '',
    category_sub: '',
    address: '',
    phone: '',
    website: '',
    description_kr: '',
    sns_instagram: '',
    sns_kakao: '',
  })

  useEffect(() => {
    const init = async () => {
      try {
        const { data: auth } = await sb.auth.getUser()

        if (!auth.user) {
          window.location.href = '/auth/login'
          return
        }

        const { data, error } = await sb
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .maybeSingle()

        if (error || !data) {
          setErrorMsg('업소 정보를 불러오지 못했습니다.')
          setLoading(false)
          return
        }

        if (data.owner_id !== auth.user.id) {
          setErrorMsg('이 업소를 수정할 권한이 없습니다.')
          setLoading(false)
          return
        }

        setBusiness(data)
        setForm({
          name_kr: data.name_kr || '',
          name_en: data.name_en || '',
          category_main: data.category_main || '',
          category_sub: data.category_sub || '',
          address: data.address || '',
          phone: data.phone || '',
          website: data.website || '',
          description_kr: data.description_kr || '',
          sns_instagram: data.sns_instagram || '',
          sns_kakao: data.sns_kakao || '',
        })
      } catch (e) {
        setErrorMsg('페이지를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (businessId) init()
  }, [businessId])

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submitEditRequest = async () => {
    if (!business) return

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    const { data: auth } = await sb.auth.getUser()

    if (!auth.user) {
      setSaving(false)
      setErrorMsg('로그인이 필요합니다.')
      return
    }

    const payload = {
      business_id: business.id,
      user_id: auth.user.id,
      name_kr: form.name_kr || null,
      name_en: form.name_en || null,
      category_main: form.category_main || null,
      category_sub: form.category_sub || null,
      address: form.address || null,
      phone: form.phone || null,
      website: form.website || null,
      description_kr: form.description_kr || null,
      sns_instagram: form.sns_instagram || null,
      sns_kakao: form.sns_kakao || null,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }

    const { error } = await sb.from('business_edits').insert(payload)

    setSaving(false)

    if (error) {
      setErrorMsg('수정 요청 저장 중 오류가 발생했습니다: ' + error.message)
      return
    }

    setSuccessMsg('수정 요청이 접수되었습니다. 관리자 승인 후 반영됩니다.')
  }

  const fs =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-indigo-400'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorMsg && !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center max-w-md w-full">
          <div className="text-red-600 font-bold mb-3">{errorMsg}</div>
          <a
            href="/dashboard"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            대시보드로
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-2xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-white">✏️ 내 업소 수정 요청</h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            정보 변경 내용을 입력하면 관리자 승인 후 반영됩니다
          </p>
        </div>
        <a
          href="/dashboard"
          className="text-white/40 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
        >
          대시보드
        </a>
      </div>

      {errorMsg && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[14px] font-bold text-red-600">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[14px] font-bold text-green-700">
          {successMsg}
        </div>
      )}

      {business && (
        <div className="mx-4 mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-bold text-slate-500 mb-2">현재 연결된 업소</div>
          <div className="text-[16px] font-extrabold text-slate-800">
            {business.name_kr || business.name_en}
          </div>
          {business.category_main && (
            <div className="text-[12px] text-slate-400 mt-1">{business.category_main}</div>
          )}
        </div>
      )}

      <div className="mx-4 mt-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="text-[14px] font-bold text-slate-700">수정 요청 내용</div>

        <input
          value={form.name_kr}
          onChange={(e) => updateField('name_kr', e.target.value)}
          placeholder="한글 업소명"
          className={fs}
        />

        <input
          value={form.name_en}
          onChange={(e) => updateField('name_en', e.target.value)}
          placeholder="영문 업소명"
          className={fs}
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.category_main}
            onChange={(e) => updateField('category_main', e.target.value)}
            placeholder="대분류"
            className={fs}
          />
          <input
            value={form.category_sub}
            onChange={(e) => updateField('category_sub', e.target.value)}
            placeholder="소분류"
            className={fs}
          />
        </div>

        <input
          value={form.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="주소"
          className={fs}
        />

        <input
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="전화번호"
          className={fs}
        />

        <input
          value={form.website}
          onChange={(e) => updateField('website', e.target.value)}
          placeholder="웹사이트"
          className={fs}
        />

        <textarea
          value={form.description_kr}
          onChange={(e) => updateField('description_kr', e.target.value)}
          rows={4}
          placeholder="한글 소개글"
          className={fs + ' resize-none'}
        />

        <input
          value={form.sns_instagram}
          onChange={(e) => updateField('sns_instagram', e.target.value)}
          placeholder="인스타그램"
          className={fs}
        />

        <input
          value={form.sns_kakao}
          onChange={(e) => updateField('sns_kakao', e.target.value)}
          placeholder="카카오톡 / 오픈채팅 링크"
          className={fs}
        />

        <button
          onClick={submitEditRequest}
          disabled={saving}
          className="w-full bg-indigo-600 text-white rounded-lg py-3 text-[14px] font-bold disabled:opacity-50"
        >
          {saving ? '요청 저장 중...' : '수정 요청 보내기'}
        </button>
      </div>
    </div>
  )
}
