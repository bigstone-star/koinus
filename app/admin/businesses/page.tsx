'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Category = {
  id: string
  name: string
  icon?: string
  is_active?: boolean
}

export default function AdminBusinessesPage() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [tab, setTab] = useState<'pending' | 'vip' | 'all'>('all')

  const [list, setList] = useState<any[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCat, setBulkCat] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    vip: 0,
    pending: 0,
  })

  useEffect(() => {
    const init = async () => {
      try {
        const { data: authData } = await sb.auth.getUser()

        if (!authData.user) {
          window.location.href = '/auth/login'
          return
        }

        const { data: profile, error: profileError } = await sb
          .from('user_profiles')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (profileError) {
          setErrorMsg('권한 정보를 불러오지 못했습니다.')
          setLoading(false)
          return
        }

        if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
          window.location.href = '/'
          return
        }

        await Promise.all([loadStats(), loadCats(), loadBusinesses()])
      } catch (e) {
        setErrorMsg('관리자 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  useEffect(() => {
    loadBusinesses()
  }, [tab])

  const loadStats = async () => {
    const [t, v, p] = await Promise.all([
      sb
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      sb
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('is_vip', true),

      sb
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('approved', false),
    ])

    setStats({
      total: t.count || 0,
      vip: v.count || 0,
      pending: p.count || 0,
    })
  }

  const loadCats = async () => {
    const { data, error } = await sb
      .from('categories')
      .select('id, name, icon, is_active')
      .order('sort_order', { ascending: true })

    if (!error) {
      setCats(data || [])
    }
  }

  const loadBusinesses = async (termArg?: string) => {
    setLoading(true)
    setSelected(new Set())

    const term = termArg !== undefined ? termArg : search

    let q = sb.from('businesses').select('*').eq('is_active', true)

    if (tab === 'pending') q = q.eq('approved', false)
    if (tab === 'vip') q = q.eq('is_vip', true)

    if (term.trim()) {
      q = q.or(
        `name_kr.ilike.%${term}%,name_en.ilike.%${term}%,category_main.ilike.%${term}%,address.ilike.%${term}%,phone.ilike.%${term}%`
      )
    }

    const { data, error } = await q
      .order('created_at', { ascending: false })
      .limit(150)

    if (error) {
      setErrorMsg('업소 목록을 불러오지 못했습니다.')
      setList([])
    } else {
      setList(data || [])
    }

    setLoading(false)
  }

  const handleSearch = () => {
    loadBusinesses(search)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === list.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(list.map((b) => b.id)))
    }
  }

  const bulkChangeCategory = async () => {
    if (!bulkCat) return alert('변경할 카테고리를 선택하세요.')
    if (selected.size === 0) return alert('업소를 먼저 선택하세요.')
    if (!confirm(`선택한 ${selected.size}개 업소의 카테고리를 "${bulkCat}"로 변경할까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ category_main: bulkCat })
      .in('id', Array.from(selected))

    setBulkLoading(false)

    if (error) {
      alert('일괄 변경 실패: ' + error.message)
      return
    }

    alert(`✅ ${selected.size}개 업소의 카테고리가 변경됐습니다.`)
    setSelected(new Set())
    setBulkCat('')
    loadBusinesses()
  }

  const approve = async (id: string) => {
    const { error } = await sb
      .from('businesses')
      .update({ approved: true })
      .eq('id', id)

    if (error) {
      alert('승인 실패: ' + error.message)
      return
    }

    loadBusinesses()
    loadStats()
  }

  const toggleVip = async (b: any) => {
    const { error } = await sb
      .from('businesses')
      .update({
        is_vip: !b.is_vip,
        vip_tier: !b.is_vip ? 'pro' : null,
      })
      .eq('id', b.id)

    if (error) {
      alert('VIP 변경 실패: ' + error.message)
      return
    }

    loadBusinesses()
    loadStats()
  }

  const deactivate = async (id: string) => {
    if (!confirm('이 업소를 비활성화할까요?')) return

    const { error } = await sb
      .from('businesses')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      alert('비활성화 실패: ' + error.message)
      return
    }

    loadBusinesses()
    loadStats()
  }

  const activeCats = useMemo(
    () => cats.filter((c) => c.is_active),
    [cats]
  )

  if (loading && list.length === 0 && !errorMsg) {
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
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-white">🏢 업소 관리</h1>
            <p className="text-white/40 text-[12px] mt-0.5">
              업소 검색, 승인, VIP 설정, 카테고리 변경
            </p>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <a
              href="/admin"
              className="text-white/70 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
            >
              관리자 홈
            </a>
            <a
              href="/"
              className="text-white/70 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
            >
              홈
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        {[
          { l: '전체 업소', v: stats.total, c: 'text-slate-700' },
          { l: 'VIP 업소', v: stats.vip, c: 'text-amber-600' },
          { l: '승인 대기', v: stats.pending, c: 'text-red-500' },
        ].map((s) => (
          <div
            key={s.l}
            className="bg-white rounded-xl border border-slate-200 p-3 text-center"
          >
            <div className={`text-[22px] font-extrabold ${s.c}`}>{s.v}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="px-4 flex gap-2 mb-3 flex-wrap">
        {([
          ['pending', '승인 대기'],
          ['vip', 'VIP'],
          ['all', '전체'],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-[12px] font-bold ${
              tab === k
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {l}
          </button>
        ))}

        <button
          onClick={() => {
            loadStats()
            loadBusinesses()
          }}
          className="ml-auto px-3 py-2 rounded-lg text-[12px] font-bold bg-white border border-slate-200 text-slate-500"
        >
          🔄 새로고침
        </button>
      </div>

      <div className="px-4 space-y-2">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && handleSearch()}
              placeholder="업소명, 카테고리, 전화번호, 주소 검색..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
            />

            <button
              onClick={handleSearch}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold"
            >
              🔍 검색
            </button>

            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  loadBusinesses('')
                }}
                className="bg-slate-100 text-slate-500 px-3 py-2 rounded-lg text-[13px] font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {list.length > 0 && (
          <div
            className={`bg-white rounded-xl border p-3 transition-all ${
              selected.size > 0
                ? 'border-indigo-300 bg-indigo-50/40'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === list.length && list.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-[12px] font-bold text-slate-600">
                  {selected.size > 0 ? `${selected.size}개 선택됨` : '전체 선택'}
                </span>
              </label>

              {selected.size > 0 && (
                <>
                  <div className="flex-1 min-w-[180px]">
                    <select
                      value={bulkCat}
                      onChange={(e) => setBulkCat(e.target.value)}
                      className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-[12px] bg-white"
                    >
                      <option value="">카테고리 선택...</option>
                      {activeCats.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.icon || '📋'} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={bulkChangeCategory}
                    disabled={bulkLoading || !bulkCat}
                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-40"
                  >
                    {bulkLoading ? '변경 중...' : '일괄 변경'}
                  </button>

                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-[12px] text-slate-400 px-2 py-1.5"
                  >
                    선택 해제
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400">
            {search ? `"${search}" 검색 결과가 없습니다` : '업소가 없습니다'}
          </div>
        ) : (
          list.map((b) => {
            const isChecked = selected.has(b.id)

            return (
              <div
                key={b.id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  isChecked
                    ? 'border-indigo-400 bg-indigo-50/30'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(b.id)}
                    className="mt-1 w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-[14px] flex items-center gap-2 mb-1 flex-wrap">
                      {b.name_kr || b.name_en}

                      {b.is_vip && (
                        <span className="text-[9px] font-black bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded">
                          {b.vip_tier?.toUpperCase()}
                        </span>
                      )}

                      {!b.approved && (
                        <span className="text-[9px] font-black bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                          승인대기
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 mb-2 flex flex-wrap gap-2">
                      {b.category_main && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {b.category_main}
                        </span>
                      )}
                      {b.phone && <span>{b.phone}</span>}
                      {b.address && <span className="truncate">{b.address}</span>}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {!b.approved && (
                        <button
                          onClick={() => approve(b.id)}
                          className="bg-green-500 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg"
                        >
                          ✅ 승인
                        </button>
                      )}

                      <a
                        href={`/admin/businesses/${b.id}`}
                        className="text-[11px] font-bold py-1.5 px-3 rounded-lg bg-indigo-50 text-indigo-600"
                      >
                        ✏️ 수정
                      </a>

                      <button
                        onClick={() => toggleVip(b)}
                        className={`text-[11px] font-bold py-1.5 px-3 rounded-lg ${
                          b.is_vip
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {b.is_vip ? 'VIP 해제' : '⭐ VIP'}
                      </button>

                      <button
                        onClick={() => deactivate(b.id)}
                        className="text-[11px] font-bold py-1.5 px-3 rounded-lg bg-slate-100 text-slate-500"
                      >
                        🗑 비활성화
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
