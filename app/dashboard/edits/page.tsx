'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_LABELS: Record<string, string> = {
  pending: '검토중',
  approved: '승인됨',
  rejected: '반려됨',
}

export default function DashboardEditsPage() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [list, setList] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: auth } = await sb.auth.getUser()

        if (!auth.user) {
          window.location.href = '/auth/login'
          return
        }

        const { data, error } = await sb
          .from('business_edits')
          .select(`
            *,
            businesses (
              id,
              name_kr,
              name_en,
              category_main
            )
          `)
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false })

        if (error) {
          setErrorMsg('수정 요청 내역을 불러오지 못했습니다.')
          setList([])
        } else {
          setList(data || [])
        }
      } catch (e) {
        setErrorMsg('페이지를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
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

  if (errorMsg) {
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
          <h1 className="text-[20px] font-extrabold text-white">📄 수정 요청 내역</h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            내가 보낸 업소 정보 수정 요청 상태 확인
          </p>
        </div>

        <a
          href="/dashboard"
          className="text-white/40 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
        >
          대시보드
        </a>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {list.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            보낸 수정 요청이 없습니다.
          </div>
        ) : (
          list.map((item) => {
            const business = item.businesses

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[15px] font-extrabold text-slate-800">
                      {business?.name_kr || business?.name_en || '이름 없음'}
                    </div>
                    {business?.category_main && (
                      <div className="text-[12px] text-slate-400 mt-0.5">
                        {business.category_main}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 mt-1">
                      요청일: {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-1 rounded-full ${
                      item.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'rejected'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>

                <div className="space-y-2 text-[13px] text-slate-600">
                  {item.name_kr && <div><b>한글 업소명:</b> {item.name_kr}</div>}
                  {item.name_en && <div><b>영문 업소명:</b> {item.name_en}</div>}
                  {item.category_main && <div><b>대분류:</b> {item.category_main}</div>}
                  {item.category_sub && <div><b>소분류:</b> {item.category_sub}</div>}
                  {item.address && <div><b>주소:</b> {item.address}</div>}
                  {item.phone && <div><b>전화번호:</b> {item.phone}</div>}
                  {item.website && <div><b>웹사이트:</b> {item.website}</div>}
                </div>

                {item.admin_note && (
                  <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="text-[11px] font-bold text-slate-400 mb-1">관리자 메모</div>
                    <div className="text-[13px] text-slate-700">{item.admin_note}</div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
