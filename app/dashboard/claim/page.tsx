'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  address?: string | null
  phone?: string | null
  owner_id?: string | null
  is_active?: boolean | null
}

type ClaimStatusMap = Record<string, string>

export default function ClaimBusinessPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<BusinessRow[]>([])
  const [selected, setSelected] = useState<BusinessRow | null>(null)

  const [message, setMessage] = useState('')
  const [proofText, setProofText] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error' | ''>('')

  const [claimStatusMap, setClaimStatusMap] = useState<ClaimStatusMap>({})

  useEffect(() => {
    const init = async () => {
      const { data } = await sb.auth.getUser()

      if (!data.user) {
        window.location.href = '/auth/login'
        return
      }

      setUser(data.user)
      setContactEmail(data.user.email || '')

      const { data: existingClaims } = await sb
        .from('business_claim_requests')
        .select('business_id, status')
        .eq('user_id', data.user.id)
        .in('status', ['pending', 'approved'])

      if (existingClaims && existingClaims.length > 0) {
        const nextMap: ClaimStatusMap = {}
        existingClaims.forEach((item: any) => {
          if (item.business_id && item.status) {
            nextMap[item.business_id] = item.status
          }
        })
        setClaimStatusMap(nextMap)
      }

      setLoading(false)
    }

    init()
  }, [])

  const resetMessage = () => {
    setMsg('')
    setMsgType('')
  }

  const searchBusinesses = async () => {
    const term = search.trim()

    if (!term) {
      setResults([])
      setSelected(null)
      return
    }

    resetMessage()
    setSearching(true)

    const { data, error } = await sb
      .from('businesses')
      .select('id, name_kr, name_en, category_main, address, phone, owner_id, is_active')
      .eq('is_active', true)
      .or(
        [
          `name_kr.ilike.%${term}%`,
          `name_en.ilike.%${term}%`,
          `phone.ilike.%${term}%`,
          `address.ilike.%${term}%`,
        ].join(',')
      )
      .order('is_vip', { ascending: false })
      .limit(20)

    setSearching(false)

    if (error) {
      setMsg('검색 중 오류가 발생했습니다.')
      setMsgType('error')
      setResults([])
      return
    }

    const filtered = (data || []).filter((b: any) => !b.owner_id)
    setResults(filtered)

    if (selected && !filtered.find((b: any) => b.id === selected.id)) {
      setSelected(null)
    }
  }

  const submitClaim = async () => {
    if (!user) return

    if (!selected) {
      setMsg('업소를 먼저 선택하세요.')
      setMsgType('error')
      return
    }

    if (claimStatusMap[selected.id] === 'pending') {
      setMsg('이미 이 업소에 대한 소유권 요청이 접수되어 있습니다.')
      setMsgType('error')
      return
    }

    if (claimStatusMap[selected.id] === 'approved') {
      setMsg('이미 승인된 요청 이력이 있습니다. 관리자에게 확인해 주세요.')
      setMsgType('error')
      return
    }

    setSaving(true)
    resetMessage()

    const { data: existing, error: existingError } = await sb
      .from('business_claim_requests')
      .select('id, status')
      .eq('business_id', selected.id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1)

    if (existingError) {
      setSaving(false)
      setMsg('기존 요청 확인 중 오류가 발생했습니다.')
      setMsgType('error')
      return
    }

    if (existing && existing.length > 0) {
      setSaving(false)
      setMsg('이미 같은 업소에 대한 요청이 접수되어 있습니다.')
      setMsgType('error')
      return
    }

    const { error } = await sb.from('business_claim_requests').insert({
      business_id: selected.id,
      user_id: user.id,
      message: message.trim() || null,
      proof_text: proofText.trim() || null,
      contact_phone: contactPhone.trim() || null,
      contact_email: contactEmail.trim() || null,
      status: 'pending',
    })

    setSaving(false)

    if (error) {
      setMsg('요청 저장 중 오류가 발생했습니다: ' + error.message)
      setMsgType('error')
      return
    }

    setClaimStatusMap((prev) => ({
      ...prev,
      [selected.id]: 'pending',
    }))

    setMsg('소유권 요청이 접수되었습니다. 관리자 확인 후 연결됩니다.')
    setMsgType('success')
    setSelected(null)
    setSearch('')
    setResults([])
    setMessage('')
    setProofText('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const fs =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-indigo-400'

  return (
    <div className="min-h-screen bg-slate-100 max-w-2xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-white">🏷️ 내 업소 찾기</h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            기존 업소를 찾아 내 계정으로 연결 요청
          </p>
        </div>

        <Link
          href="/dashboard"
          className="text-white/40 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
        >
          대시보드
        </Link>
      </div>

      {msg && (
        <div
          className={`mx-4 mt-4 rounded-xl px-4 py-3 text-[14px] font-bold ${
            msgType === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          {msg}
        </div>
      )}

      <div className="mx-4 mt-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="text-[14px] font-bold text-slate-700">업소 검색</div>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchBusinesses()}
            placeholder="업소명, 전화번호, 주소로 검색"
            className={fs}
          />
          <button
            onClick={searchBusinesses}
            className="px-4 bg-indigo-600 text-white rounded-lg text-[13px] font-bold min-w-[72px]"
          >
            {searching ? '검색중' : '검색'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 pt-2">
            {results.map((b) => {
              const claimStatus = claimStatusMap[b.id]

              return (
                <button
                  key={b.id}
                  onClick={() => setSelected(b)}
                  disabled={claimStatus === 'pending' || claimStatus === 'approved'}
                  className={`w-full text-left rounded-xl border p-3 transition ${
                    selected?.id === b.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white'
                  } ${
                    claimStatus === 'pending' || claimStatus === 'approved'
                      ? 'opacity-60 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-[14px] text-slate-800">
                        {b.name_kr || b.name_en}
                      </div>

                      {b.category_main && (
                        <div className="text-[12px] text-slate-400 mt-0.5">
                          {b.category_main}
                        </div>
                      )}

                      {b.phone && (
                        <div className="text-[12px] text-slate-500 mt-1">📞 {b.phone}</div>
                      )}

                      {b.address && (
                        <div className="text-[12px] text-slate-500 mt-0.5">📍 {b.address}</div>
                      )}
                    </div>

                    {claimStatus === 'pending' && (
                      <span className="text-[11px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full whitespace-nowrap">
                        요청중
                      </span>
                    )}

                    {claimStatus === 'approved' && (
                      <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                        승인됨
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {search.trim() && !searching && results.length === 0 && (
          <div className="text-[13px] text-slate-400 pt-2">
            검색 결과가 없거나 이미 소유자가 연결된 업소입니다.
          </div>
        )}
      </div>

      <div className="mx-4 mt-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="text-[14px] font-bold text-slate-700">소유권 요청 정보</div>

        {selected ? (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-[13px] text-slate-700">
            선택한 업소:{' '}
            <span className="font-bold">{selected.name_kr || selected.name_en}</span>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-400">
            아직 선택한 업소가 없습니다.
          </div>
        )}

        <input
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="연락 가능한 전화번호"
          className={fs}
        />

        <input
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="연락 가능한 이메일"
          className={fs}
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="간단한 요청 메시지 (예: 이 업소의 실제 운영자입니다)"
          className={fs + ' resize-none'}
        />

        <textarea
          value={proofText}
          onChange={(e) => setProofText(e.target.value)}
          rows={4}
          placeholder="증빙 정보 (예: 사업자명, 가게 전화 확인 가능, 웹사이트 관리자 이메일 등)"
          className={fs + ' resize-none'}
        />

        <button
          onClick={submitClaim}
          disabled={saving || !selected}
          className="w-full bg-indigo-600 text-white rounded-lg py-3 text-[14px] font-bold disabled:opacity-50"
        >
          {saving ? '요청 제출 중...' : '소유권 요청 보내기'}
        </button>
      </div>
    </div>
  )
}
