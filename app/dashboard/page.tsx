'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data } = await sb.auth.getUser()

      if (!data.user) {
        window.location.href = '/auth/login'
        return
      }

      setUser(data.user)

      // 👉 내 업소 가져오기
      const { data: biz, error } = await sb
        .from('businesses')
        .select('*')
        .eq('owner_id', data.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMsg('업소 정보를 불러오지 못했습니다.')
      } else {
        setBusinesses(biz || [])
      }

      setLoading(false)
    }

    init()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto pb-10">
      
      {/* 헤더 */}
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-[20px] font-extrabold text-white">내 업소 관리</h1>
          <p className="text-white/40 text-[12px] mt-1">
            내 업소 정보 확인 및 수정
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

        {/* 에러 */}
        {errorMsg && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        {/* 업소 없음 */}
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
              {/* 제목 */}
              <div className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                {b.name_kr || b.name_en}

                {b.is_vip && (
                  <span className="text-[10px] bg-amber-300 text-amber-900 px-2 py-0.5 rounded font-bold">
                    ⭐ {b.vip_tier?.toUpperCase() || 'VIP'}
                  </span>
                )}
              </div>

              {/* 정보 */}
              <div className="text-[12px] text-slate-500 mt-2 space-y-1">
                {b.category_main && <div>{b.category_main}</div>}
                {b.phone && <div>{b.phone}</div>}
                {b.address && <div>{b.address}</div>}
              </div>

              {/* 상태 */}
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

              {/* 버튼 */}
              <div className="flex gap-2 mt-4">
                <a
                  href={`/business/${b.id}`}
                  className="flex-1 text-center bg-indigo-50 text-indigo-600 py-2 rounded-lg text-[13px] font-bold"
                >
                  보기
                </a>

                <button
                  onClick={() =>
                    alert('다음 단계에서 수정 요청 기능 연결 예정')
                  }
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-[13px] font-bold"
                >
                  수정 요청
                </button>
              </div>
            </div>
          ))
        )}

        {/* 다음 확장 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[13px] font-bold text-slate-800 mb-2">
            다음 단계
          </div>
          <div className="text-[12px] text-slate-500">
            리뷰 관리, VIP 결제, 업소 통계 기능이 여기에 추가됩니다.
          </div>
        </div>

      </div>
    </div>
  )
}
