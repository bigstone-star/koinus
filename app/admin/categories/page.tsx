'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ICON_OPTIONS = [
  '🍽️', '🛒', '🏥', '🦷', '⚖️', '🚗', '💄', '📚', '💳',
  '⛪', '🏠', '🧺', '🌿', '✈️', '📰', '👓', '📋'
]

type Category = {
  id: string
  name: string
  icon?: string
  sort_order?: number
  is_active?: boolean
}

export default function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [cats, setCats] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📋')
  const [savingCatId, setSavingCatId] = useState('')

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

        await loadCats()
      } catch (e) {
        setErrorMsg('카테고리 페이지를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const loadCats = async () => {
    const { data, error } = await sb
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      setErrorMsg('카테고리를 불러오지 못했습니다.')
      setCats([])
      return
    }

    setCats(data || [])
  }

  const addCat = async () => {
    if (!newCatName.trim()) {
      alert('카테고리 이름을 입력하세요.')
      return
    }

    const maxOrder =
      cats.length > 0 ? Math.max(...cats.map((c) => c.sort_order || 0)) : 0

    const { error } = await sb.from('categories').insert({
      name: newCatName.trim(),
      icon: newCatIcon,
      sort_order: maxOrder + 1,
      is_active: true,
    })

    if (error) {
      alert('추가 실패: ' + error.message)
      return
    }

    setNewCatName('')
    setNewCatIcon('📋')
    loadCats()
  }

  const updateCatField = (id: string, field: keyof Category, value: any) => {
    setCats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const saveCat = async (cat: Category) => {
    if (!cat.name?.trim()) {
      alert('카테고리 이름을 입력하세요.')
      return
    }

    setSavingCatId(cat.id)

    const { error } = await sb
      .from('categories')
      .update({
        name: cat.name.trim(),
        icon: cat.icon || '📋',
        sort_order: Number(cat.sort_order || 0),
        is_active: !!cat.is_active,
      })
      .eq('id', cat.id)

    setSavingCatId('')

    if (error) {
      alert('저장 실패: ' + error.message)
      return
    }

    alert('✅ 카테고리가 저장됐습니다.')
    loadCats()
  }

  const toggleCat = async (cat: Category) => {
    const { error } = await sb
      .from('categories')
      .update({ is_active: !cat.is_active })
      .eq('id', cat.id)

    if (error) {
      alert('상태 변경 실패: ' + error.message)
      return
    }

    loadCats()
  }

  const deleteCat = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제할까요?`)) return

    const { error } = await sb.from('categories').delete().eq('id', id)

    if (error) {
      alert('삭제 실패: ' + error.message)
      return
    }

    loadCats()
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
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-white">🗂️ 카테고리 관리</h1>
            <p className="text-white/40 text-[12px] mt-0.5">
              카테고리 이름, 아이콘, 순서, 노출 상태 관리
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

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[14px] font-bold text-slate-700 mb-3">새 카테고리 추가</div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">아이콘</label>
              <input
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="아이콘"
                className="w-20 border border-slate-200 rounded-lg px-2 py-2 text-center text-[18px] mb-2"
              />
              <div className="flex flex-wrap gap-1">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCatIcon(icon)}
                    className={`w-9 h-9 rounded-lg border text-[18px] ${
                      newCatIcon === icon
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">이름</label>
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="카테고리 이름"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                onKeyDown={(e: any) => e.key === 'Enter' && addCat()}
              />
            </div>

            <button
              onClick={addCat}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold"
            >
              추가
            </button>
          </div>
        </div>

        {cats.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400">
            카테고리가 없습니다.
          </div>
        ) : (
          cats.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-12 md:col-span-3">
                  <label className="text-[11px] text-slate-400 block mb-1">아이콘</label>
                  <input
                    value={c.icon || ''}
                    onChange={(e) => updateCatField(c.id, 'icon', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-center text-[18px] mb-2"
                  />
                  <div className="flex flex-wrap gap-1">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => updateCatField(c.id, 'icon', icon)}
                        className={`w-9 h-9 rounded-lg border text-[18px] ${
                          c.icon === icon
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-5">
                  <label className="text-[11px] text-slate-400 block mb-1">이름</label>
                  <input
                    value={c.name || ''}
                    onChange={(e) => updateCatField(c.id, 'name', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">순서</label>
                  <input
                    type="number"
                    value={c.sort_order || 0}
                    onChange={(e) =>
                      updateCatField(c.id, 'sort_order', Number(e.target.value))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">상태</label>
                  <div className="text-[12px] font-bold text-slate-600 py-2">
                    {c.is_active ? '표시중' : '숨김'}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => saveCat(c)}
                  disabled={savingCatId === c.id}
                  className="text-[12px] font-bold px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                >
                  {savingCatId === c.id ? '저장 중...' : '저장'}
                </button>

                <button
                  onClick={() => toggleCat(c)}
                  className={`text-[12px] font-bold px-4 py-2 rounded-lg ${
                    c.is_active
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {c.is_active ? '숨기기' : '보이기'}
                </button>

                <button
                  onClick={() => deleteCat(c.id, c.name)}
                  className="text-[12px] font-bold px-4 py-2 rounded-lg bg-red-50 text-red-500"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
