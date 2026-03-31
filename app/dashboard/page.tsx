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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [businesses, setBusinesses] = useState<BusinessRow[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [requestingId, setRequestingId] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await sb.auth.getUser()

        if (!data.user) {
          window.location.href = '/auth/login'
          return
        }

        setUser(data.user)

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

        {businesses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <div className="text-[14px] font-bold text-slate-700">
              연결된 업소가 없습니다
            </div>
            <div className="text-[12px] text-slate-400 mt-2">
              관리자에게 업소 연결 요청을 해주세요
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
