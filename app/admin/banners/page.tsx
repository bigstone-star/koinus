'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const POSITION_LABELS: Record<string, string> = {
  home_top: '홈 상단',
  home_middle: '홈 중간',
  home_bottom: '홈 하단',
  category_top: '카테고리 상단',
}

type BannerForm = {
  title: string
  subtitle: string
  image_url: string
  link_url: string
  position: string
  is_active: boolean
  price_paid: number
  ends_at: string
}

const EMPTY_FORM: BannerForm = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  position: 'home_top',
  is_active: true,
  price_paid: 0,
  ends_at: '',
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([])
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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

      load()
    }

    init()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await sb
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false })

    setBanners(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.title.trim()) {
      setMsg('제목을 입력하세요')
      return
    }

    const payload = {
      ...form,
      ends_at: form.ends_at || null,
    }

    if (editing) {
      await sb.from('banners').update(payload).eq('id', editing)
      setMsg('수정됐습니다')
    } else {
      await sb.from('banners').insert(payload)
      setMsg('배너가 추가됐습니다')
    }

    setForm(EMPTY_FORM)
    setEditing(null)
    setTimeout(() => setMsg(''), 3000)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await sb.from('banners').delete().eq('id', id)
    load()
  }

  const toggle = async (banner: any) => {
    await sb
      .from('banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id)
    load()
  }

  const startEdit = (banner: any) => {
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      position: banner.position || 'home_top',
      is_active: !!banner.is_active,
      price_paid: Number(banner.price_paid || 0),
      ends_at: banner.ends_at?.slice(0, 16) || '',
    })
    setEditing(banner.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
  }

  const fs =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400'

  return (
    <div className="min-h-screen bg-slate-100 max-w-2xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-white">배너 광고 관리</h1>
          <p className="text-white/40 text-[12px] mt-0.5">광고비: $200~500/월 per 배너</p>
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

      <div className="mx-4 mt-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="text-[14px] font-bold text-slate-700">
          {editing ? '배너 수정' : '새 배너 등록'}
        </div>

        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="제목 *"
          className={fs}
        />

        <input
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          placeholder="부제목"
          className={fs}
        />

        <input
          value={form.image_url}
          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
          placeholder="이미지 URL (선택)"
          className={fs}
        />

        <input
          value={form.link_url}
          onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
          placeholder="링크 URL"
          className={fs}
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            className={fs + ' bg-white'}
          >
            <option value="home_top">홈 상단</option>
            <option value="home_middle">홈 중간</option>
            <option value="home_bottom">홈 하단</option>
            <option value="category_top">카테고리 상단</option>
          </select>

          <input
            type="number"
            value={form.price_paid}
            onChange={(e) =>
              setForm((f) => ({ ...f, price_paid: Number(e.target.value) }))
            }
            placeholder="광고비 ($)"
            className={fs}
          />
        </div>

        <input
          type="datetime-local"
          value={form.ends_at}
          onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
          className={fs}
        />

        <div className="flex gap-2">
          <button
            onClick={save}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-[13px] font-bold"
          >
            {editing ? '수정 저장' : '배너 추가'}
          </button>

          {editing && (
            <button
              onClick={cancelEdit}
              className="px-4 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-bold"
            >
              취소
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            등록된 배너가 없습니다.
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white rounded-xl border p-4 ${
                banner.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[14px] font-bold">{banner.title}</div>
                  {banner.subtitle && (
                    <div className="text-[12px] text-slate-400">{banner.subtitle}</div>
                  )}
                </div>

                <span
                  className={`text-[10px] font-black px-2 py-1 rounded-full ${
                    banner.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {banner.is_active ? '노출중' : '숨김'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 mb-3">
                위치: {POSITION_LABELS[banner.position] || banner.position} | 광고비: $
                {banner.price_paid} | 클릭: {banner.click_count}회
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(banner)}
                  className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600"
                >
                  수정
                </button>

                <button
                  onClick={() => toggle(banner)}
                  className={`text-[12px] font-bold px-3 py-1.5 rounded-lg ${
                    banner.is_active
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  {banner.is_active ? '숨기기' : '보이기'}
                </button>

                <button
                  onClick={() => del(banner.id)}
                  className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-500"
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
