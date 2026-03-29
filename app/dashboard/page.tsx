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
  const [bizCount, setBizCount] = useState(0)
  const [vipCount, setVipCount] = useState(0)
  const [pendingEdits, setPendingEdits] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await sb.auth.getUser()

      if (!auth.user) {
        window.location.href = '/auth/login'
        return
      }

      setUser(auth.user)

      // 내 업소
      const { count } = await sb
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', auth.user.id)

      // VIP 업소
      const { count: vip } = await sb
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', auth.user.id)
        .eq('is_vip', true)

      // 수정 요청
      const { count: edits } = await sb
        .from('business_edits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.id)
        .eq('status', 'pending')

      setBizCount(count || 0)
      setVipCount(vip || 0)
      setPendingEdits(edits || 0)

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
        <h1 className="text-[20px] font-extrabold text-white">👤 내 대시보드</h1>
        <p className="text-white/40 text-[12px] mt-1">
          내 업소 관리 및 광고 관리
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-4">
        <div className="bg-white rounded-xl border p-3 text-center">
          <div className="text-[20px] font-extrabold text-slate-800">{bizCount}</div>
          <div className="text-[10px] text-slate-400">내 업소</div>
        </div>

        <div className="bg-white rounded-xl border p-3 text-center">
          <div className="text-[20px] font-extrabold text-amber-600">{vipCount}</div>
          <div className="text-[10px] text-slate-400">VIP</div>
        </div>

        <div className="bg-white rounded-xl border p-3 text-center">
          <div className="text-[20px] font-extrabold text-indigo-600">
            {pendingEdits}
          </div>
          <div className="text-[10px] text-slate-400">수정 대기</div>
        </div>
      </div>

      {/* 메뉴 */}
      <div className="px-4 mt-4 space-y-3">

        {/* 내 업소 */}
        <a
          href="/dashboard/businesses"
          className="block bg-white rounded-xl border px-4 py-4"
        >
          <div className="flex gap-3">
            <div className="text-2xl">🏢</div>
            <div>
              <div className="text-[14px] font-bold">내 업소 관리</div>
              <div className="text-[12px] text-slate-400 mt-1">
                등록된 업소 수정 및 관리
              </div>
            </div>
          </div>
        </a>

        {/* 업소 찾기 */}
        <a
          href="/dashboard/find"
          className="block bg-white rounded-xl border px-4 py-4"
        >
          <div className="flex gap-3">
            <div className="text-2xl">🔍</div>
            <div>
              <div className="text-[14px] font-bold">내 업소 찾기</div>
              <div className="text-[12px] text-slate-400 mt-1">
                기존 업소 소유권 요청
              </div>
            </div>
          </div>
        </a>

        {/* 수정 요청 */}
        <a
          href="/dashboard/edits"
          className="block bg-white rounded-xl border px-4 py-4"
        >
          <div className="flex gap-3">
            <div className="text-2xl">📄</div>
            <div>
              <div className="text-[14px] font-bold">
                수정 요청 내역
              </div>
              <div className="text-[12px] text-slate-400 mt-1">
                요청 상태 확인
              </div>
            </div>
          </div>
        </a>

        {/* VIP */}
        <a
          href="/pricing"
          className="block bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl px-4 py-4"
        >
          <div className="flex gap-3 text-white">
            <div className="text-2xl">⭐</div>
            <div>
              <div className="text-[14px] font-extrabold">
                VIP 업그레이드
              </div>
              <div className="text-[12px] text-white/80 mt-1">
                상단 노출 + 광고 효과
              </div>
            </div>
          </div>
        </a>

      </div>

    </div>
  )
}
