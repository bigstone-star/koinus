'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Category = {
  id: string
  name?: string
  name_ko?: string
  icon?: string
  sort_order?: number
  is_active?: boolean
}

export default function AdminPage() {
  const [tab, setTab] = useState<'pending' | 'vip' | 'all' | 'categories'>('all')
  const [list, setList] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, vip: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [ok, setOk] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [cats, setCats] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📋')
  const [catLoading, setCatLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCat, setBulkCat] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const getCatLabel = (c: Category) => c.name || c.name_ko || '이름없음'

  useEffect(() => {
    const init = async () => {
      try {
        const { data: authData } = await sb.auth.getUser()

        if (!authData.user) {
          window.location.href = '/auth/login'
          return
        }

        const { data: p, error } = await sb
          .from('user_profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (error) {
          setErrorMsg('권한 정보를 불러오지 못했습니다.')
          return
        }

        if (p?.role !== 'admin' && p?.role !== 'super_admin') {
          window.location.href = '/'
          return
        }

        setOk(true)
        await Promise.all([load(), loadCats()])
      } catch (e) {
        setErrorMsg('관리자 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const loadList = useCallback(async (searchTerm?: string) => {
    if (tab === 'categories') {
      await loadCats()
      return
    }

    setLoading(true)
    setSelected(new Set())

    let q = sb.from('businesses').select('*').eq('is_active', true)

    if (tab === 'pending') q = q.eq('data_source', 'user_registered')
    if (tab === 'vip') q = q.eq('is_vip', true)

    const term = searchTerm !== undefined ? searchTerm : search
    if (term.trim()) {
      q = q.or(
        `name_kr.ilike.%${term}%,name_en.ilike.%${term}%,category_main.ilike.%${term}%,address.ilike.%${term}%`
      )
    }

    const { data, error } = await q.order('created_at', { ascending: false }).limit(100)

    if (error) {
      setErrorMsg('업소 목록을 불러오지 못했습니다.')
      setList([])
    } else {
      setList(data || [])
    }

    setLoading(false)
  }, [tab, search])

  async function load() {
    try {
      setLoading(true)

      const [t, v, pd] = await Promise.all([
        sb.from('businesses').select('id', { count: 'exact', head: true }).eq('is_active', true),
        sb.from('businesses').select('id', { count: 'exact', head: true }).eq('is_vip', true),
        sb.from('businesses').select('id', { count: 'exact', head: true }).eq('data_source', 'user_registered').eq('is_active', true),
      ])

      setStats({
        total: t.count || 0,
        vip: v.count || 0,
        pending: pd.count || 0,
      })

      await loadList()
    } catch (e) {
      setErrorMsg('통계를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function loadCats() {
    try {
      setCatLoading(true)
      const { data, error } = await sb
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
        setErrorMsg('카테고리를 불러오지 못했습니다.')
        setCats([])
      } else {
        setCats(data || [])
      }
    } catch (e) {
      setErrorMsg('카테고리 로딩 중 오류가 발생했습니다.')
    } finally {
      setCatLoading(false)
    }
  }

  useEffect(() => {
    if (ok) loadList()
  }, [tab, ok, loadList])

  const handleSearch = () => loadList(search)

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
    if (!bulkCat) return alert('변경할 카테고리를 선택하세요')
    if (selected.size === 0) return alert('업소를 먼저 선택하세요')
    if (!confirm(`선택한 ${selected.size}개 업소의 카테고리를 "${bulkCat}"로 변경할까요?`)) return

    setBulkLoading(true)

    const { error } = await sb
      .from('businesses')
      .update({ category_main: bulkCat })
      .in('id', Array.from(selected))

    if (error) {
      alert('변경 실패: ' + error.message)
    } else {
      alert(`✅ ${selected.size}개 업소의 카테고리가 "${bulkCat}"로 변경됐습니다!`)
      setSelected(new Set())
      setBulkCat('')
      loadList()
    }

    setBulkLoading(false)
  }

  const approve = async (id: string) => {
    await sb.from('businesses').update({ approved: true }).eq('id', id)
    loadList()
  }

  const toggleVip = async (b: any) => {
    await sb
      .from('businesses')
      .update({ is_vip: !b.is_vip, vip_tier: !b.is_vip ? 'pro' : null })
      .eq('id', b.id)

    loadList()
    load()
  }

  const deactivate = async (id: string) => {
    if (!confirm('비활성화할까요?')) return
    await sb.from('businesses').update({ is_active: false }).eq('id', id)
    loadList()
    load()
  }

  const addCat = async () => {
    if (!newCatName.trim()) return alert('카테고리 이름을 입력하세요')

    const maxOrder = cats.length > 0 ? Math.max(...cats.map((c) => c.sort_order || 0)) : 0

    const payload = {
      name: newCatName.trim(),
      icon: newCatIcon,
      sort_order: maxOrder + 1,
      is_active: true,
    }

    let { error } = await sb.from('categories').insert(payload)

    if (error) {
      const fallbackPayload = {
        name_ko: newCatName.trim(),
        icon: newCatIcon,
        sort_order: maxOrder + 1,
        is_active: true,
      }

      const retry = await sb.from('categories').insert(fallbackPayload)
      error = retry.error
    }

    if (error) {
      alert('추가 실패: ' + error.message)
      return
    }

    setNewCatName('')
    setNewCatIcon('📋')
    loadCats()
  }

  const toggleCat = async (cat: Category) => {
    await sb.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    loadCats()
  }

  const deleteCat = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제할까요?`)) return
    await sb.from('categories').delete().eq('id', id)
    loadCats()
  }

  if (loading && !ok && !errorMsg) {
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
          <a href="/" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
            홈으로
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-2xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-white">🛠 관리자</h1>
          <p className="text-white/40 text-[12px] mt-0.5">교차로 휴스턴 운영 관리</p>
        </div>
        <a href="/" className="text-white/40 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg">
          홈
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        {[
          { l: '전체 업소', v: stats.total, c: 'text-slate-700' },
          { l: 'VIP 업소', v: stats.vip, c: 'text-amber-600' },
          { l: '신규 등록', v: stats.pending, c: 'text-red-500' },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className={`text-[22px] font-extrabold ${s.c}`}>{s.v}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="px-4 flex gap-2 mb-3 flex-wrap">
        {([
          ['pending', '신규 대기'],
          ['vip', 'VIP'],
          ['all', '전체'],
          ['categories', '🗂 카테고리'],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-[12px] font-bold ${
              tab === k ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {l}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto px-3 py-2 rounded-lg text-[12px] font-bold bg-white border border-slate-200 text-slate-500"
        >
          🔄
        </button>
      </div>

      {tab === 'categories' ? (
        <div className="px-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-[13px] font-bold text-slate-700 mb-3">새 카테고리 추가</div>
            <div className="flex gap-2">
              <input
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="아이콘"
                className="w-14 border border-slate-200 rounded-lg px-2 py-2 text-center text-[18px]"
              />
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="카테고리 이름"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                onKeyDown={(e: any) => e.key === 'Enter' && addCat()}
              />
              <button onClick={addCat} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold">
                추가
              </button>
            </div>
          </div>

          {catLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cats.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-400">카테고리가 없습니다.</div>
          ) : (
            cats.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${
                  !c.is_active ? 'opacity-50 border-slate-100' : 'border-slate-200'
                }`}
              >
                <span className="text-2xl w-9 text-center flex-shrink-0">{c.icon || '📋'}</span>
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-slate-800">{getCatLabel(c)}</div>
                  <div className="text-[11px] text-slate-400">
                    순서: {c.sort_order || 0} · {c.is_active ? '표시중' : '숨김'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleCat(c)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${
                      c.is_active ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {c.is_active ? '숨기기' : '보이기'}
                  </button>
                  <button
                    onClick={() => deleteCat(c.id, getCatLabel(c))}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="px-4 space-y-2">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e: any) => e.key === 'Enter' && handleSearch()}
                placeholder="업소명, 카테고리, 주소 검색..."
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
                    loadList('')
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
                selected.size > 0 ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200'
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
                    <div className="flex-1 min-w-[140px]">
                      <select
                        value={bulkCat}
                        onChange={(e) => setBulkCat(e.target.value)}
                        className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-[12px] bg-white"
                      >
                        <option value="">카테고리 선택...</option>
                        {cats
                          .filter((c) => c.is_active)
                          .map((c) => (
                            <option key={c.id} value={getCatLabel(c)}>
                              {c.icon || '📋'} {getCatLabel(c)}
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
              {search ? `"${search}" 검색 결과가 없습니다` : '항목 없음'}
            </div>
          ) : (
            list.map((b) => {
              const isChecked = selected.has(b.id)
              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-xl border p-4 transition-all ${
                    isChecked ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200'
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
                            대기중
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mb-2">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">{b.category_main}</span>
                        {b.phone && <span className="ml-2">{b.phone}</span>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {!b.approved && (
                          <button onClick={() => approve(b.id)} className="bg-green-500 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg">
                            ✅ 승인
                          </button>
                        )}
                        <button
                          onClick={() => toggleVip(b)}
                          className={`text-[11px] font-bold py-1.5 px-3 rounded-lg ${
                            b.is_vip ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {b.is_vip ? 'VIP 해제' : '⭐ VIP'}
                        </button>
                        <button
                          onClick={() => deactivate(b.id)}
                          className="text-[11px] font-bold py-1.5 px-3 rounded-lg bg-slate-100 text-slate-500"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
