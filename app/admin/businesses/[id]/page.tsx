'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Category = {
  id: string
  name: string
  is_active?: boolean
}

function normalizeCityFromAddress(address?: string | null) {
  if (!address) return ''
  const m = address.match(/,\s*([^,]+),\s*TX\b/i)
  return m?.[1]?.trim() || ''
}

function inferMetroArea(city?: string | null, address?: string | null) {
  const baseCity = (city || normalizeCityFromAddress(address) || '').trim()
  const c = baseCity.toLowerCase()

  const houstonCities = new Set([
    'houston',
    'katy',
    'sugar land',
    'pearland',
    'cypress',
    'spring',
    'tomball',
    'the woodlands',
    'missouri city',
    'stafford',
    'bellaire',
    'humble',
    'pasadena',
    'league city',
    'richmond',
    'rosenberg',
    'fulshear',
    'brookshire',
    'conroe',
    'klein',
    'channelview',
    'la porte',
    'friendswood',
    'webster',
    'deer park',
    'baytown',
  ])

  const dallasCities = new Set([
    'dallas',
    'plano',
    'carrollton',
    'frisco',
    'irving',
    'richardson',
    'coppell',
    'farmers branch',
    'the colony',
    'mesquite',
    'mckinney',
    'garland',
    'flower mound',
    'rockwall',
    'lewisville',
    'addison',
    'allen',
    'rowlett',
    'denton',
  ])

  const fortWorthCities = new Set([
    'fort worth',
    'arlington',
    'euless',
    'bedford',
    'hurst',
    'grapevine',
    'southlake',
    'colleyville',
    'north richland hills',
    'keller',
    'haltom city',
    'grand prairie',
  ])

  const centralTexasCities = new Set([
    'austin',
    'san antonio',
    'killeen',
    'round rock',
    'cedar park',
    'georgetown',
    'pflugerville',
    'temple',
    'belton',
    'harker heights',
    'copperas cove',
    'new braunfels',
    'schertz',
    'cibolo',
    'leander',
  ])

  if (houstonCities.has(c)) return 'houston'
  if (dallasCities.has(c)) return 'dallas'
  if (fortWorthCities.has(c)) return 'fort_worth'
  if (centralTexasCities.has(c)) return 'central_texas'

  return null
}

export default function AdminBusinessEditPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [cats, setCats] = useState<Category[]>([])
  const [biz, setBiz] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: authData } = await sb.auth.getUser()

        if (!authData.user) {
          window.location.href = '/auth/login'
          return
        }

        const { data: profile, error: profileError } = await sb
          .from('user_profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
          window.location.href = '/'
          return
        }

        const { data: businessData, error: businessError } = await sb
          .from('businesses')
          .select('*')
          .eq('id', params.id)
          .single()

        if (businessError || !businessData) {
          setErrorMsg('업소 정보를 불러오지 못했습니다.')
          return
        }

        setBiz(businessData)

        const { data: categoryData } = await sb
          .from('categories')
          .select('id, name, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        setCats(categoryData || [])
      } catch (e) {
        setErrorMsg('페이지를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [params.id])

  const upd = (key: string, value: any) => {
    setBiz((prev: any) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    if (!biz) return

    setSaving(true)

    const inferredCity = normalizeCityFromAddress(biz.address || '')
    const nextCity = inferredCity || biz.city || ''
    const nextMetroArea = inferMetroArea(nextCity, biz.address || '') || biz.metro_area || null

    const { error } = await sb
  .from('businesses')
  .update({
    name_kr: biz.name_kr || '',
    name_en: biz.name_en || '',
    category_main: biz.category_main || '',
    category_sub: biz.category_sub || '',
    address: biz.address || '',
    city: nextCity,
    metro_area: nextMetroArea,
    phone: biz.phone || '',
    website: biz.website || '',
    description_kr: biz.description_kr || '',
    sns_instagram: biz.sns_instagram || '',
    sns_kakao: biz.sns_kakao || '',

    approved: !!biz.approved,
    is_vip: !!biz.is_vip,
    is_active: biz.is_active !== false,
    vip_tier: biz.is_vip ? (biz.vip_tier || 'pro') : null,
    owner_id: biz.owner_id || null,
  })
  .eq('id', biz.id)

    setSaving(false)

    if (error) {
      alert('저장 실패: ' + error.message)
      return
    }

    setBiz((prev: any) => ({
      ...prev,
      city: nextCity,
      metro_area: nextMetroArea,
    }))

    alert('✅ 업소 정보가 저장됐습니다.')
  }

  const fs =
    'w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center max-w-md w-full">
          <div className="text-red-600 font-bold mb-3">{errorMsg}</div>
          <a
            href="/admin/businesses"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            업소 목록으로
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-2xl mx-auto pb-10">
      <header className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-white">✏️ 업소 상세 수정</h1>
          <p className="text-white/40 text-[12px] mt-0.5">관리자용 업소 편집 페이지</p>
        </div>
        <a
          href="/admin/businesses"
          className="text-white/40 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
        >
          목록
        </a>
      </header>

      <div className="px-4 py-5 space-y-4">
        <div className="bg-white rounded-xl p-4 space-y-4 border border-slate-200">
          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">업소명(한국어)</label>
            <input
              value={biz?.name_kr || ''}
              onChange={(e) => upd('name_kr', e.target.value)}
              className={fs}
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">업소명(영어)</label>
            <input
              value={biz?.name_en || ''}
              onChange={(e) => upd('name_en', e.target.value)}
              className={fs}
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">카테고리</label>
            <select
              value={biz?.category_main || ''}
              onChange={(e) => upd('category_main', e.target.value)}
              className={fs + ' bg-white'}
            >
              <option value="">카테고리 선택</option>
              {cats.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">서브카테고리</label>
            <input
              value={biz?.category_sub || ''}
              onChange={(e) => upd('category_sub', e.target.value)}
              className={fs}
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">전화번호</label>
            <input
              value={biz?.phone || ''}
              onChange={(e) => upd('phone', e.target.value)}
              className={fs}
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">주소</label>
            <input
              value={biz?.address || ''}
              onChange={(e) => upd('address', e.target.value)}
              className={fs}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-bold text-slate-500 block mb-1.5">도시(자동)</label>
              <input
                value={normalizeCityFromAddress(biz?.address || '') || biz?.city || ''}
                readOnly
                className={fs + ' bg-slate-50 text-slate-500'}
              />
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-500 block mb-1.5">권역(자동)</label>
              <input
                value={inferMetroArea(normalizeCityFromAddress(biz?.address || '') || biz?.city || '', biz?.address || '') || biz?.metro_area || ''}
                readOnly
                className={fs + ' bg-slate-50 text-slate-500'}
              />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">웹사이트</label>
            <input
              value={biz?.website || ''}
              onChange={(e) => upd('website', e.target.value)}
              className={fs}
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">인스타그램</label>
            <input
              value={biz?.sns_instagram || ''}
              onChange={(e) => upd('sns_instagram', e.target.value)}
              className={fs}
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">카카오 오픈채팅</label>
            <input
              value={biz?.sns_kakao || ''}
              onChange={(e) => upd('sns_kakao', e.target.value)}
              className={fs}
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-500 block mb-1.5">소개글</label>
            <textarea
              value={biz?.description_kr || ''}
              onChange={(e) => upd('description_kr', e.target.value)}
              rows={5}
              className={fs + ' resize-none'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-700">
    <input
      type="checkbox"
      checked={!!biz?.approved}
      onChange={(e) => upd('approved', e.target.checked)}
    />
    승인 상태
  </label>

  <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-700">
    <input
      type="checkbox"
      checked={!!biz?.is_vip}
      onChange={(e) => upd('is_vip', e.target.checked)}
    />
    VIP 상태
  </label>

  <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-700">
    <input
      type="checkbox"
      checked={biz?.is_active !== false}
      onChange={(e) => upd('is_active', e.target.checked)}
    />
    활성 상태
  </label>
</div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-indigo-600 text-white rounded-xl py-4 text-[15px] font-bold disabled:opacity-60"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
