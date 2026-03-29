'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminClaimsPage() {
  const [loading, setLoading] = useState(true)
  const [claims, setClaims] = useState<any[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await sb.auth.getUser()
      if (!auth.user) {
        window.location.href = '/auth/login'
        return
      }

      const { data: profile } = await sb
        .from('user_profiles')
        .select('role')
        .eq('id', auth.user.id)
        .maybeSingle()

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        window.location.href = '/'
        return
      }

      await load()
    }

    init()
  }, [])

  const load = async () => {
    setLoading(true)

    const { data, error } = await sb
      .from('business_claim_requests')
      .select(`
        *,
        businesses (
          id,
          name_kr,
          name_en,
          category_main,
          address,
          phone,
          owner_id
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      setMsg('요청 목록을 불러오는 중 오류가 발생했습니다.')
      setLoading(false)
      return
    }

    setClaims(data || [])
    setLoading(false)
  }

  const approveClaim = async (claim: any) => {
    const business = claim.businesses
    if (!business?.id || !claim.user_id) {
      alert('요청 데이터가 올바르지 않습니다.')
      return
    }

    if (!confirm('이 요청을 승인할까요?')) return

    const { error: ownerError } = await sb
      .from('businesses')
      .update({ owner_id: claim.user_id })
      .eq('id', business.id)

    if (ownerError) {
      alert('업소 owner 연결 실패: ' + ownerError.message)
      return
    }

    const { error: claimError } = await sb
      .from('business_claim_requests')
      .update({
        status: 'approved',
        admin_note: '소유권 승인 완료',
        updated_at: new Date().toISOString(),
      })
      .eq('id', claim.id)

    if (claimError) {
      alert('요청 상태 업데이트 실패: ' + claimError.message)
      return
    }

    setMsg('소유권 요청을 승인했습니다.')
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  const rejectClaim = async (claim: any) => {
    const note = window.prompt('반려 사유를 입력하세요.', claim.admin_note || '')
    if (note === null) return

    const { error } = await sb
      .from('business_claim_requests')
      .update({
        status: 'rejected',
        admin_note: note || '반려됨',
        updated_at: new Date().toISOString(),
      })
      .eq('id', claim.id)

    if (error) {
      alert('반려 처리 실패: ' + error.message)
      return
    }

    setMsg('소유권 요청을 반려했습니다.')
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  const pendingClaims = claims.filter((c) => c.status === 'pending')
  const processedClaims = claims.filter((c) => c.status !== 'pending')

  return (
    <div className="min-h-screen bg-slate-100 max-w-3xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-white">업소 소유권 요청 관리</h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            기존 업소에 대한 업주 소유권 요청 승인 / 반려
          </p>
        </div>
        <a
          href="/admin"
          className="text-white/40 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
        >
          관리자
        </a>
      </div>

      {msg && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[14px] font-bold text-green-700">
          {msg}
        </div>
      )}

      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[14px] font-bold text-slate-700">
            대기 요청 {pendingClaims.length}건
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingClaims.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            대기 중인 소유권 요청이 없습니다.
          </div>
        ) : (
          pendingClaims.map((claim) => {
            const business = claim.businesses
            return (
              <div key={claim.id} className="bg-white rounded-xl border border-slate-200 p-4">
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
                  </div>

                  <span className="text-[10px] font-black px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    대기중
                  </span>
                </div>

                <div className="space-y-1 text-[12px] text-slate-600 mb-3">
                  {business?.phone && <div>📞 업소 전화: {business.phone}</div>}
                  {business?.address && <div>📍 업소 주소: {business.address}</div>}
                  {claim.contact_phone && <div>📱 요청자 연락처: {claim.contact_phone}</div>}
                  {claim.contact_email && <div>✉️ 요청자 이메일: {claim.contact_email}</div>}
                </div>

                {claim.message && (
                  <div className="mb-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="text-[11px] font-bold text-slate-400 mb-1">요청 메시지</div>
                    <div className="text-[13px] text-slate-700">{claim.message}</div>
                  </div>
                )}

                {claim.proof_text && (
                  <div className="mb-3 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
                    <div className="text-[11px] font-bold text-indigo-400 mb-1">증빙 정보</div>
                    <div className="text-[13px] text-slate-700 whitespace-pre-wrap">
                      {claim.proof_text}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => approveClaim(claim)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => rejectClaim(claim)}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-[13px] font-bold"
                  >
                    반려
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="px-4 mt-6">
        <div className="text-[13px] font-bold text-slate-500 mb-3">처리 완료 요청</div>
        <div className="space-y-3">
          {processedClaims.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
              처리 완료된 요청이 없습니다.
            </div>
          ) : (
            processedClaims.map((claim) => {
              const business = claim.businesses
              return (
                <div key={claim.id} className="bg-white rounded-xl border border-slate-200 p-4 opacity-80">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-bold text-slate-800">
                        {business?.name_kr || business?.name_en || '이름 없음'}
                      </div>
                      <div className="text-[12px] text-slate-400 mt-0.5">
                        요청자: {claim.contact_email || '이메일 없음'}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-full ${
                        claim.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {claim.status === 'approved' ? '승인됨' : '반려됨'}
                    </span>
                  </div>

                  {claim.admin_note && (
                    <div className="mt-3 text-[12px] text-slate-500">
                      관리자 메모: {claim.admin_note}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
