'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ClaimBusinessPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  const [message, setMessage] = useState('')
  const [proofText, setProofText] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data } = await sb.auth.getUser()
      if (!data.user) {
        window.location.href = '/auth/login'
        return
      }
      setUser(data.user)
      setContactEmail(data.user.email || '')
      setLoading(false)
    }
    init()
  }, [])

  const searchBusinesses = async () => {
    const term = search.trim()
    if (!term) {
      setResults([])
      return
    }

    const { data, error } = await sb
      .from('businesses')
      .select('id, name_kr, name_en, category_main, address, phone, owner_id')
      .eq('is_active', true)
      .or(
        `name_kr.ilike.%${term}%,name_en.ilike.%${term}%,phone.ilike.%${term}%,address.ilike.%${term}%`
      )
      .order('is_vip', { ascending: false })
      .limit(20)

    if (error) {
      setMsg('검색 중 오류가 발생했습니다.')
      return
    }

    setResults((data || []).filter((b: any) => !b.owner_id))
  }

  const submitClaim = async () => {
    if (!user) return
    if (!selected) {
      setMsg('업소를 먼저 선택하세요.')
      return
    }

    setSaving(true)
    setMsg('')

    const { error } = await sb.from('business_claim_requests').insert({
      business_id: selected.id,
      user_id: user.id,
      message: message || null,
      proof_text: proofText || null,
      contact_phone: contactPhone || null,
      contact_email: contactEmail || null,
    })

    setSaving(false)

    if (error) {
      setMsg('요청 저장 중 오류가 발생했습니다: ' + error.message)
      return
    }

    setMsg('소유권 요청이 접수되었습니다. 관리자 확인 후 연결됩니다.')
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
          <h1 className="text-[20px] font-extrabold text-white">내 업소 찾기</h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            기존 업소를 찾아 소유권을 요청하세요
          </p>
        </div>
        <a
          href="/dashboard"
          className="text-white/40 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
        >
          대시보드
        </a>
      </div>

      {msg && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[14px] font-bold text-green-700">
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
            className="px-4 bg-indigo-600 text-white rounded-lg text-[13px] font-bold"
          >
            검색
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 pt-2">
            {results.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className={`w-full text-left rounded-xl border p-3 ${
                  selected?.id === b.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="font-bold text-[14px] text-slate-800">
                  {b.name_kr || b.name_en}
                </div>
                {b.category_main && (
                  <div className="text-[12px] text-slate-400 mt-0.5">{b.category_main}</div>
                )}
                {b.phone && (
                  <div className="text-[12px] text-slate-500 mt-1">📞 {b.phone}</div>
                )}
                {b.address && (
                  <div className="text-[12px] text-slate-500 mt-0.5">📍 {b.address}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {search.trim() && results.length === 0 && (
          <div className="text-[13px] text-slate-400 pt-2">
            검색 결과가 없거나 이미 소유자가 연결된 업소입니다.
          </div>
        )}
      </div>

      <div className="mx-4 mt-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="text-[14px] font-bold text-slate-700">소유권 요청 정보</div>

        {selected ? (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-[13px] text-slate-700">
            선택한 업소: <span className="font-bold">{selected.name_kr || selected.name_en}</span>
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
          placeholder="증빙 정보 (예: 사업자명, 웹사이트 관리자 이메일, 가게 전화로 확인 가능 등)"
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
