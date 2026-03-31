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
  is_active?: boolean | null
  approved?: boolean | null
  is_vip?: boolean | null
  vip_tier?: string | null
  owner_id?: string | null
}

type UserProfile = {
  id: string
  email?: string | null
  name?: string | null
  role?: string | null
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [businesses, setBusinesses] = useState<BusinessRow[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [requestingId, setRequestingId] = useState('')
  const [claimLoading, setClaimLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await sb.auth.getUser()

        if (!data.user) {
          window.location.href = '/auth/login'
          return
        }

        setUser(data.user)

        const { data: profileData, error: profileError } = await sb
          .from('user_profiles')
          .select('id, email, name, role')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) {
          setErrorMsg('회원 정보를 불러오지 못했습니다.')
          setLoading(false)
          return
        }

        setProfile(profileData)

        const { data: biz, error } = await sb
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
            is_active,
            approved,
            is_vip,
            vip_tier,
            owner_id
          `)
          .eq('owner_id', data.user.id)
          .order('created_at', { ascending: false })

        if (error) {
          setErrorMsg('업소 정보를 불러오지 못했습니다.')
        } else {
          setBusinesses(biz || [])
        }
      } catch (e) {
        console.error(e)
        setErrorMsg('대시보드 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const requestPhoneEdit = async (b: BusinessRow) => {
    if (!user?.id) return

    const newPhone = prompt(
      `새 전화번호를 입력하세요\n\n현재 전화번호: ${b.phone || '없음'}`
    )

    if (!newPhone) return

    const trimmed = newPhone.trim()
    if (!trimmed) return

    try {
      setRequestingId(b.id)

      const { error } = await sb.from('business_edits').insert({
        business_id: b.id,
        user_id: user.id,
        phone: trimmed,
        status: 'pending',
        original_data: {
          phone: b.phone || null,
        },
      })

      if (error) {
        alert('수정 요청 실패: ' + error.message)
        return
      }

      alert('✅ 수정 요청이 접수되었습니다. 관리자 승인 후 반영됩니다.')
    } finally {
      setRequestingId('')
    }
  }

  const requestOwnerClaimFromDashboard = async () => {
    if (!user?.id) return

    const businessName = prompt('오너 자격을 요청할 업소명을 입력하세요')
    if (!businessName || !businessName.trim()) return

    const message = prompt(
      '요청 메시지를 입력하세요.\n예: 안녕하세요. 이 업소의 실제 운영자입니다. 확인 후 오너 권한 부탁드립니다.'
    )
    if (!message || !message.trim()) return

    try {
      setClaimLoading(true)

      const searchTerm = businessName.trim()

      const { data: foundBusinesses, error: findError } = await sb
        .from('businesses')
        .select('id, name_kr, name_en')
        .or(
          [
            `name_kr.ilike.%${searchTerm}%`,
            `name_en.ilike.%${searchTerm}%`,
          ].join(',')
        )
        .limit(10)

      if (findError) {
        alert('업소 검색 실패: ' + findError.message)
        return
      }

      if (!foundBusinesses || foundBusinesses.length === 0) {
        alert('해당 업소를 찾지 못했습니다. 업소명을 더 정확히 입력해 주세요.')
        return
      }

      if (foundBusinesses.length > 1) {
        const names = foundBusinesses
          .map((b, i) => `${i + 1}. ${b.name_kr || b.name_en}`)
          .join('\n')

        alert(
          `동일하거나 유사한 업소가 여러 개 있습니다.\n\n${names}\n\n먼저 홈 화면에서 해당 업소 상세를 연 뒤 "이 업소는 제 것입니다" 버튼으로 요청해 주세요.`
        )
        return
      }

      const business = foundBusinesses[0]

      const { data: existing, error: existingError } = await sb
        .from('business_claim_requests')
        .select('id, status')
        .eq('business_id', business.id)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(1)

      if (existingError) {
        alert('기존 요청 확인 실패: ' + existingError.message)
        return
      }

      if (existing && existing.length > 0) {
        alert('이미 대기 중인 오너 자격 요청이 있습니다.')
        return
      }

      const { error } = await sb
        .from('business_claim_requests')
        .insert({
          business_id: business.id,
          user_id: user.id,
          message: message.trim(),
          status: 'pending',
        })

      if (error) {
        alert('오너 자격 요청 실패: ' + error.message)
        return
      }

      alert('✅ 오너 자격 요청이 접수되었습니다. 관리자 확인 후 승인됩니다.')
    } finally {
      setClaimLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-[20px] font-extrabold text-white">내 업소 관리</h1>
          <p className="text-white/40 text-[12px] mt-1">
            내 업소 정보 확인 및 수정 요청
          </p>
        </div>

        <a
          href="/"
          className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
        >
          홈
        </a>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {errorMsg && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        {profile && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-[14px] font-bold text-slate-800">
              {profile.name || '이름 없음'}
            </div>
            <div className="text-[12px] text-slate-500 mt-1">
              {profile.email || '이메일 없음'}
            </div>
            <div className="mt-2">
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded">
                현재 권한: {profile.role || 'user'}
              </span>
            </div>
          </div>
        )}

        {businesses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <div className="text-[14px] font-bold text-slate-700">
              연결된 업소가 없습니다
            </div>
            <div className="text-[12px] text-slate-400 mt-2">
              아직 이 계정에 연결된 업소가 없습니다.
            </div>

            <div className="mt-4">
              <button
                onClick={requestOwnerClaimFromDashboard}
                disabled={claimLoading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-[13px] font-bold disabled:opacity-50"
              >
                {claimLoading ? '요청 중...' : '오너 자격 요청하기'}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              홈 화면에서 해당 업소 상세를 열고
              <br />
              <span className="font-bold text-slate-500">
                “이 업소는 제 것입니다”
              </span>
              버튼으로도 요청할 수 있습니다.
            </div>
          </div>
        ) : (
          businesses.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="text-[16px] font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>{b.name_kr || b.name_en}</span>

                {b.is_vip && (
                  <span className="text-[10px] bg-amber-300 text-amber-900 px-2 py-0.5 rounded font-bold">
                    ⭐ {b.vip_tier?.toUpperCase() || 'VIP'}
                  </span>
                )}
              </div>

              <div className="text-[12px] text-slate-500 mt-2 space-y-1">
                {b.category_main && <div>{b.category_main}</div>}
                {b.category_sub && <div>{b.category_sub}</div>}
                {b.phone && <div>전화: {b.phone}</div>}
                {b.address && <div>{b.address}</div>}
                {b.website && <div>{b.website}</div>}
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {!b.approved && (
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">
                    승인 대기
                  </span>
                )}

                {b.is_active === false && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold">
                    비활성
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <a
                  href={`/business/${b.id}`}
                  className="flex-1 text-center bg-indigo-50 text-indigo-600 py-2 rounded-lg text-[13px] font-bold"
                >
                  보기
                </a>

                <button
                  onClick={() => requestPhoneEdit(b)}
                  disabled={requestingId === b.id}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-[13px] font-bold disabled:opacity-50"
                >
                  {requestingId === b.id ? '요청 중...' : '전화 수정 요청'}
                </button>
              </div>
            </div>
          ))
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-bold text-slate-800 mb-2">
            다음 단계
          </div>
          <div className="text-[12px] text-slate-500">
            다음에는 주소, 웹사이트, 설명까지 수정 요청할 수 있게 확장합니다.
          </div>
        </div>
      </div>
    </div>
  )
}
