'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [biz, setBiz] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await sb.auth.getUser()

      if (!data.user) {
        window.location.href = '/auth/login'
        return
      }

      setUser(data.user)

      // 내 업소 가져오기
      const { data: businesses } = await sb
        .from('businesses')
        .select('*')
        .eq('owner_id', data.user.id)

      setBiz(businesses || [])
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
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6">
        <h1 className="text-[22px] font-extrabold text-white">👤 내 대시보드</h1>
        <p className="text-white/40 text-[12px] mt-1">
          내 업소 관리 및 등록
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* 내 업소가 있는 경우 */}
        {biz.length > 0 ? (
          <>
            {biz.map((b) => (
              <a
                key={b.id}
                href={`/dashboard/business/${b.id}`}
                className="block bg-white rounded-xl border border-slate-200 px-4 py-4 hover:bg-slate-50"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🏢</div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-slate-800">
                      {b.name_kr || b.name_en}
                    </div>

                    <div className="text-[12px] text-slate-400 mt-1">
                      {b.category_main}
                    </div>

                    {b.is_vip && (
                      <div className="text-[11px] text-amber-600 font-bold mt-1">
                        ⭐ VIP 업소
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </>
        ) : (
          <>
            {/* 업소 없음 안내 */}
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-6 text-center">
              <div className="text-[14px] font-bold text-slate-700">
                아직 등록된 내 업소가 없습니다
              </div>
              <div className="text-[12px] text-slate-400 mt-1">
                새로 등록하거나 기존 업소를 찾아 연결하세요
              </div>
            </div>
          </>
        )}

        {/* 내 업소 등록 */}
        <a
          href="/register"
          className="block bg-indigo-600 text-white rounded-xl px-4 py-4"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">➕</div>
            <div>
              <div className="text-[14px] font-bold">
                새 업소 등록
              </div>
              <div className="text-[12px] text-white/70 mt-1">
                내 업소를 직접 등록합니다
              </div>
            </div>
          </div>
        </a>

        {/* 🔥 핵심: 내 업소 찾기 */}
        <a
          href="/dashboard/claim"
          className="block bg-white rounded-xl border border-slate-200 px-4 py-4 hover:bg-slate-50"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">🏷️</div>
            <div>
              <div className="text-[14px] font-bold text-slate-800">
                내 업소 찾기
              </div>
              <div className="text-[12px] text-slate-400 mt-1">
                이미 등록된 업소를 내 계정으로 연결
              </div>
            </div>
          </div>
        </a>

        {/* VIP 안내 */}
        <a
          href="/pricing"
          className="block bg-amber-50 border border-amber-200 rounded-xl px-4 py-4"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">⭐</div>
            <div>
              <div className="text-[14px] font-bold text-amber-700">
                VIP 업그레이드
              </div>
              <div className="text-[12px] text-amber-600 mt-1">
                상위 노출 및 추가 정보 표시
              </div>
            </div>
          </div>
        </a>

        <a
  href="/dashboard/edits"
  className="block bg-white rounded-xl border border-slate-200 px-4 py-4 hover:bg-slate-50"
>
  <div className="flex items-start gap-3">
    <div className="text-2xl">📄</div>
    <div>
      <div className="text-[14px] font-bold text-slate-800">
        수정 요청 내역
      </div>
      <div className="text-[12px] text-slate-400 mt-1">
        내가 보낸 수정 요청 상태를 확인합니다
      </div>
    </div>
  </div>
</a>
      </div>
    </div>
  )
}
