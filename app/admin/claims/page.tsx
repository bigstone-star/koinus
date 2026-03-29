'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminClaimsPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data: auth } = await sb.auth.getUser()

    if (!auth.user) {
      window.location.href = '/auth/login'
      return
    }

    const { data: p } = await sb
      .from('user_profiles')
      .select('role')
      .eq('id', auth.user.id)
      .single()

    if (!p || !['admin', 'super_admin'].includes(p.role)) {
      window.location.href = '/'
      return
    }

    load()
  }

  const load = async () => {
    setLoading(true)

    const { data } = await sb
      .from('business_claims')
      .select(`
        *,
        businesses(name_kr, name_en),
        user_profiles(email)
      `)
      .order('created_at', { ascending: false })

    setList(data || [])
    setLoading(false)
  }

  // ✅ 승인
  const approve = async (c: any) => {
    if (!confirm('이 요청을 승인할까요?')) return

    // 1️⃣ 업소 owner 연결
    await sb
      .from('businesses')
      .update({ owner_id: c.user_id })
      .eq('id', c.business_id)

    // 2️⃣ 요청 상태 변경
    await sb
      .from('business_claims')
      .update({ status: 'approved' })
      .eq('id', c.id)

    alert('✅ 승인 완료')
    load()
  }

  // ❌ 거절
  const reject = async (id: string) => {
    if (!confirm('거절할까요?')) return

    await sb
      .from('business_claims')
      .update({ status: 'rejected' })
      .eq('id', id)

    load()
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-2xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-white">
            🏢 업소 소유권 요청
          </h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            업주가 요청한 소유권 승인 관리
          </p>
        </div>

        <a
          href="/admin"
          className="text-white/40 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
        >
          관리자
        </a>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-slate-400">
            요청 없음
          </div>
        ) : (
          list.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="mb-2">
                <div className="text-[14px] font-bold text-slate-800">
                  {c.businesses?.name_kr || c.businesses?.name_en}
                </div>

                <div className="text-[12px] text-slate-400 mt-1">
                  요청자: {c.user_profiles?.email || c.user_id}
                </div>

                <div className="text-[11px] text-slate-400 mt-1">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>

              {c.message && (
                <div className="text-[13px] bg-slate-50 p-3 rounded-lg mb-3">
                  {c.message}
                </div>
              )}

              <div className="flex gap-2">
                {c.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => approve(c)}
                      className="bg-green-500 text-white text-[12px] font-bold px-3 py-1.5 rounded-lg"
                    >
                      승인
                    </button>

                    <button
                      onClick={() => reject(c.id)}
                      className="bg-red-500 text-white text-[12px] font-bold px-3 py-1.5 rounded-lg"
                    >
                      거절
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded ${
                      c.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {c.status === 'approved' ? '승인됨' : '거절됨'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
