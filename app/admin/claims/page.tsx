'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ClaimRow = {
  id: string
  business_id: string
  user_id: string
  message?: string | null
  status?: string | null
  created_at?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null

  business?: {
    id: string
    name_kr?: string | null
    name_en?: string | null
    phone?: string | null
    address?: string | null
    owner_id?: string | null
  } | null

  user?: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
}

export default function AdminClaimsPage() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [rows, setRows] = useState<ClaimRow[]>([])
  const [actingId, setActingId] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const { data: authData } = await sb.auth.getUser()

        if (!authData.user) {
          window.location.href = '/auth/login'
          return
        }

        const { data: me, error: meError } = await sb
          .from('user_profiles')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (meError) {
          setErrorMsg('권한 정보를 불러오지 못했습니다.')
          setLoading(false)
          return
        }

        if (!me || !['admin', 'super_admin'].includes(me.role || '')) {
          window.location.href = '/'
          return
        }

        await loadRows()
      } catch (e) {
        console.error(e)
        setErrorMsg('소유권 요청 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const loadRows = async () => {
    try {
      const { data, error } = await sb
        .from('business_claim_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('claim load error:', error)
        setErrorMsg('소유권 요청 목록을 불러오지 못했습니다.')
        return
      }

      const claimRows = (data || []) as ClaimRow[]

      const businessIds = Array.from(
        new Set(claimRows.map((r) => r.business_id).filter(Boolean))
      )

      const userIds = Array.from(
        new Set(claimRows.map((r) => r.user_id).filter(Boolean))
      )

      let businessMap: Record<string, any> = {}
      let userMap: Record<string, any> = {}

      if (businessIds.length > 0) {
        const { data: bizData } = await sb
          .from('businesses')
          .select('id, name_kr, name_en, phone, address, owner_id')
          .in('id', businessIds)

        ;(bizData || []).forEach((b: any) => {
          businessMap[b.id] = b
        })
      }

      if (userIds.length > 0) {
        const { data: userData } = await sb
          .from('user_profiles')
          .select('id, name, email, role')
          .in('id', userIds)

        ;(userData || []).forEach((u: any) => {
          userMap[u.id] = u
        })
      }

      const merged = claimRows.map((r) => ({
        ...r,
        business: businessMap[r.business_id] || null,
        user: userMap[r.user_id] || null,
      }))

      setRows(merged)
    } catch (e) {
      console.error('loadRows catch:', e)
      setErrorMsg('소유권 요청 목록 로딩 중 오류가 발생했습니다.')
    }
  }

  const approveClaim = async (row: ClaimRow) => {
    const { data: authData } = await sb.auth.getUser()
    if (!authData.user) return

    if (!confirm('이 오너 자격 요청을 승인할까요?')) return

    try {
      setActingId(row.id)

      const { error: roleError } = await sb
        .from('user_profiles')
        .update({ role: 'owner' })
        .eq('id', row.user_id)

      if (roleError) {
        alert('회원 role 변경 실패: ' + roleError.message)
        return
      }

      const { error: ownerError } = await sb
        .from('businesses')
        .update({ owner_id: row.user_id })
        .eq('id', row.business_id)

      if (ownerError) {
        alert('업소 owner 연결 실패: ' + ownerError.message)
        return
      }

      const { error: claimError } = await sb
        .from('business_claim_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: authData.user.id,
        })
        .eq('id', row.id)

      if (claimError) {
        alert('요청 상태 변경 실패: ' + claimError.message)
        return
      }

      alert('✅ 오너 자격 요청이 승인되었습니다.')
      await loadRows()
    } finally {
      setActingId('')
    }
  }

  const rejectClaim = async (row: ClaimRow) => {
    const { data: authData } = await sb.auth.getUser()
    if (!authData.user) return

    if (!confirm('이 오너 자격 요청을 반려할까요?')) return

    try {
      setActingId(row.id)

      const { error } = await sb
        .from('business_claim_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: authData.user.id,
        })
        .eq('id', row.id)

      if (error) {
        alert('반려 실패: ' + error.message)
        return
      }

      alert('✅ 오너 자격 요청이 반려되었습니다.')
      await loadRows()
    } finally {
      setActingId('')
    }
  }

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
            href="/admin"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            관리자 홈
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-4xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-extrabold text-white">소유권 요청 관리</h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            업소 오너 자격 요청 승인 / 반려
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <a
            href="/admin"
            className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
          >
            Admin
          </a>
          <a
            href="/admin/users"
            className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
          >
            회원
          </a>
          <a
            href="/admin/businesses"
            className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
          >
            업소
          </a>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            소유권 요청이 없습니다.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-slate-900">
                    {row.business?.name_kr || row.business?.name_en || '업소명 없음'}
                  </div>

                  <div className="text-[12px] text-slate-500 mt-1">
                    요청자: {row.user?.name || '이름 없음'} · {row.user?.email || '이메일 없음'}
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    요청일: {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                  </div>

                  {row.business?.phone && (
                    <div className="text-[12px] text-slate-500 mt-2">
                      전화: {row.business.phone}
                    </div>
                  )}

                  {row.business?.address && (
                    <div className="text-[12px] text-slate-500 mt-1">
                      주소: {row.business.address}
                    </div>
                  )}

                  {row.message && (
                    <div className="bg-slate-50 rounded-lg p-3 mt-3">
                      <div className="text-[11px] font-bold text-slate-400 mb-1">
                        요청 메시지
                      </div>
                      <div className="text-[12px] text-slate-700 whitespace-pre-wrap">
                        {row.message}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <span
                      className={`text-[11px] px-2 py-1 rounded font-bold ${
                        row.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : row.status === 'rejected'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {row.status === 'approved'
                        ? '승인됨'
                        : row.status === 'rejected'
                        ? '반려됨'
                        : '대기중'}
                    </span>

                    <a
                      href={`/admin/businesses/${row.business_id}`}
                      className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold"
                    >
                      업소 보기
                    </a>

                    <a
                      href={`/admin/users/${row.user_id}`}
                      className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold"
                    >
                      회원 보기
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[120px]">
                  <button
                    onClick={() => approveClaim(row)}
                    disabled={actingId === row.id || row.status !== 'pending'}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-[12px] font-bold disabled:opacity-50"
                  >
                    승인
                  </button>

                  <button
                    onClick={() => rejectClaim(row)}
                    disabled={actingId === row.id || row.status !== 'pending'}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[12px] font-bold disabled:opacity-50"
                  >
                    반려
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
