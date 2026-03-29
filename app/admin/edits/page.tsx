'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FIELD_LABELS: Record<string, string> = {
  name_kr: '한글 업소명',
  name_en: '영문 업소명',
  category_main: '대분류',
  category_sub: '소분류',
  address: '주소',
  phone: '전화번호',
  website: '웹사이트',
  description_kr: '한글 소개글',
  sns_instagram: '인스타그램',
  sns_kakao: '카카오톡/오픈채팅',
}

const EDIT_FIELDS = [
  'name_kr',
  'name_en',
  'category_main',
  'category_sub',
  'address',
  'phone',
  'website',
  'description_kr',
  'sns_instagram',
  'sns_kakao',
]

export default function AdminEditsPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    init()
  }, [])

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

    load()
  }

  const load = async () => {
    setLoading(true)

    const { data, error } = await sb
      .from('business_edits')
      .select(`
        *,
        businesses (
          id,
          name_kr,
          name_en,
          category_main,
          category_sub,
          address,
          phone,
          website,
          description_kr,
          sns_instagram,
          sns_kakao
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      setMsg('수정 요청 목록을 불러오는 중 오류가 발생했습니다.')
      setList([])
    } else {
      setList(data || [])
    }

    setLoading(false)
  }

  const approve = async (edit: any) => {
    if (!confirm('이 수정 요청을 승인할까요?')) return

    const business = edit.businesses
    if (!business?.id) {
      alert('업소 정보가 올바르지 않습니다.')
      return
    }

    const payload: Record<string, any> = {}
    EDIT_FIELDS.forEach((field) => {
      payload[field] = edit[field]
    })

    const { error: updateBusinessError } = await sb
      .from('businesses')
      .update(payload)
      .eq('id', business.id)

    if (updateBusinessError) {
      alert('업소 업데이트 실패: ' + updateBusinessError.message)
      return
    }

    const { error: updateEditError } = await sb
      .from('business_edits')
      .update({
        status: 'approved',
        admin_note: '수정 승인 완료',
        updated_at: new Date().toISOString(),
      })
      .eq('id', edit.id)

    if (updateEditError) {
      alert('요청 상태 업데이트 실패: ' + updateEditError.message)
      return
    }

    setMsg('수정 요청을 승인했습니다.')
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  const reject = async (edit: any) => {
    const note = window.prompt('반려 사유를 입력하세요.', edit.admin_note || '')
    if (note === null) return

    const { error } = await sb
      .from('business_edits')
      .update({
        status: 'rejected',
        admin_note: note || '반려됨',
        updated_at: new Date().toISOString(),
      })
      .eq('id', edit.id)

    if (error) {
      alert('반려 처리 실패: ' + error.message)
      return
    }

    setMsg('수정 요청을 반려했습니다.')
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  const renderFieldDiff = (field: string, currentValue: any, requestedValue: any) => {
    const currentText = currentValue ?? ''
    const requestedText = requestedValue ?? ''
    const changed = String(currentText) !== String(requestedText)

    return (
      <div
        key={field}
        className={`rounded-lg border p-3 ${
          changed ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="text-[11px] font-bold text-slate-400 mb-2">
          {FIELD_LABELS[field] || field}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-bold text-slate-400 mb-1">현재값</div>
            <div className="text-[13px] text-slate-700 whitespace-pre-wrap break-words">
              {currentText || '—'}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-indigo-500 mb-1">요청값</div>
            <div
              className={`text-[13px] whitespace-pre-wrap break-words ${
                changed ? 'text-indigo-700 font-semibold' : 'text-slate-500'
              }`}
            >
              {requestedText || '—'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const pendingList = list.filter((item) => item.status === 'pending')
  const doneList = list.filter((item) => item.status !== 'pending')

  return (
    <div className="min-h-screen bg-slate-100 max-w-4xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-white">✏️ 업소 수정 요청 관리</h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            업주가 보낸 수정 요청을 승인하거나 반려합니다
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
            대기 요청 {pendingList.length}건
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingList.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            대기 중인 수정 요청이 없습니다.
          </div>
        ) : (
          pendingList.map((edit) => {
            const business = edit.businesses

            return (
              <div key={edit.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-[15px] font-extrabold text-slate-800">
                      {business?.name_kr || business?.name_en || '이름 없음'}
                    </div>
                    <div className="text-[12px] text-slate-400 mt-1">
                      요청일: {new Date(edit.created_at).toLocaleString()}
                    </div>
                  </div>

                  <span className="text-[10px] font-black px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    대기중
                  </span>
                </div>

                <div className="space-y-3">
                  {EDIT_FIELDS.map((field) =>
                    renderFieldDiff(field, business?.[field], edit?.[field])
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => approve(edit)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold"
                  >
                    승인
                  </button>

                  <button
                    onClick={() => reject(edit)}
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
          {doneList.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
              처리 완료된 요청이 없습니다.
            </div>
          ) : (
            doneList.map((edit) => {
              const business = edit.businesses

              return (
                <div
                  key={edit.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 opacity-80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-bold text-slate-800">
                        {business?.name_kr || business?.name_en || '이름 없음'}
                      </div>
                      <div className="text-[12px] text-slate-400 mt-0.5">
                        요청일: {new Date(edit.created_at).toLocaleString()}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-full ${
                        edit.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {edit.status === 'approved' ? '승인됨' : '반려됨'}
                    </span>
                  </div>

                  {edit.admin_note && (
                    <div className="mt-3 text-[12px] text-slate-500">
                      관리자 메모: {edit.admin_note}
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
