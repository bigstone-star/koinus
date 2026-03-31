'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type BusinessRow = {
  id: string
  name_kr?: string | null
  name_en?: string | null
  category_main?: string | null
  category_sub?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  description_kr?: string | null
  is_active?: boolean | null
  approved?: boolean | null
  is_vip?: boolean | null
  vip_tier?: string | null
  owner_id?: string | null
}

export default function OwnerBusinessDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const businessId = params.id

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [user, setUser] = useState<any>(null)
  const [business, setBusiness] = useState<BusinessRow | null>(null)
  const [requesting, setRequesting] = useState(false)

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [website, setWebsite] = useState('')
  const [desc, setDesc] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const { data: authData } = await sb.auth.getUser()

        if (!authData.user) {
          window.location.href = '/auth/login'
          return
        }

        setUser(authData.user)

        const { data, error } = await sb
          .from('businesses')
          .select(`
            id,
            name_kr,
            name_en,
            category_main,
            category_sub,
            phone,
            address,
            website,
            description_kr,
            is_active,
            approved,
            is_vip,
            vip_tier,
            owner_id
          `)
          .eq('id', businessId)
          .eq('owner_id', authData.user.id)
          .maybeSingle()

        if (error || !data) {
          setErrorMsg('내 업소 정보를 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        setBusiness(data)

        setPhone(data.phone || '')
        setAddress(data.address || '')
        setWebsite(data.website || '')
        setDesc(data.description_kr || '')
      } catch (e) {
        console.error(e)
        setErrorMsg('업소 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [businessId])

  const handleSubmit = async () => {
    if (!user?.id || !business) return

    const trimmedPhone = phone.trim()
    const trimmedAddress = address.trim()
    const trimmedWebsite = website.trim()
    const trimmedDesc = desc.trim()
    const trimmedComment = comment.trim()

    const changedPhone = trimmedPhone !== (business.phone || '')
    const changedAddress = trimmedAddress !== (business.address || '')
    const changedWebsite = trimmedWebsite !== (business.website || '')
    const changedDesc = trimmedDesc !== (business.description_kr || '')

    if (!changedPhone && !changedAddress && !changedWebsite && !changedDesc) {
      alert('수정할 내용을 입력하세요')
      return
    }

    if (!trimmedComment) {
      alert('관리자에게 전달할 코멘트를 입력하세요')
      return
    }

    try {
      setRequesting(true)

      const { error } = await sb.from('business_edits').insert({
        business_id: business.id,
        user_id: user.id,
        phone: changedPhone ? trimmedPhone : null,
        address: changedAddress ? trimmedAddress : null,
        website: changedWebsite ? trimmedWebsite : null,
        description_kr: changedDesc ? trimmedDesc : null,
        message: trimmedComment,
        status: 'pending',
        original_data: {
          phone: business.phone || null,
          address: business.address || null,
          website: business.website || null,
          description_kr: business.description_kr || null,
        },
      })

      if (error) {
        alert('수정 요청 실패: ' + error.message)
        return
      }

      alert('✅ 수정 요청이 접수되었습니다. 관리자 승인 후 반영됩니다.')
      setComment('')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (errorMsg || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center max-w-md w-full">
          <div className="text-red-600 font-bold mb-3">
            {errorMsg || '업소 정보를 찾을 수 없습니다.'}
          </div>
          <a
            href="/dashboard"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            내 업소 관리
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-[20px] font-extrabold text-white">내 업소 상세</h1>
          <p className="text-white/40 text-[12px] mt-1">
            업소 정보 확인 및 수정 요청
          </p>
        </div>

        <a
          href="/dashboard"
          className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
        >
          내 업소 관리
        </a>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[18px] font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
            <span>{business.name_kr || business.name_en}</span>

            {business.is_vip && (
              <span className="text-[10px] bg-amber-300 text-amber-900 px-2 py-0.5 rounded font-bold">
                ⭐ {business.vip_tier?.toUpperCase() || 'VIP'}
              </span>
            )}
          </div>

          <div className="text-[12px] text-slate-500 mt-3 space-y-2">
            {business.category_main && <div>카테고리: {business.category_main}</div>}
            {business.category_sub && <div>서브카테고리: {business.category_sub}</div>}
            {business.phone && <div>전화: {business.phone}</div>}
            {business.address && <div>주소: {business.address}</div>}
            {business.website && <div>웹사이트: {business.website}</div>}
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {!business.approved && (
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">
                승인 대기
              </span>
            )}

            {business.is_active === false && (
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold">
                비활성
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-bold text-slate-800 mb-3">정보 수정 요청</div>

          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-1">전화번호</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                placeholder="전화번호 입력"
              />
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-1">주소</div>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                placeholder="주소 입력"
              />
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-1">웹사이트</div>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                placeholder="웹사이트 입력"
              />
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-1">설명</div>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] resize-none"
                placeholder="업소 설명 입력"
              />
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-1">
                관리자에게 전달할 코멘트
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] resize-none"
                placeholder="예: 전화번호와 주소를 최신 정보로 변경 요청드립니다."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={requesting}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-50"
            >
              {requesting ? '요청 중...' : '수정 요청 제출'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
