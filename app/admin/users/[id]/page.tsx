'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type UserProfile = {
  id: string
  email?: string | null
  name?: string | null
  phone?: string | null
  avatar_url?: string | null
  role?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type BusinessRow = {
  id: string
  name_kr?: string | null
  name_en?: string | null
  category_main?: string | null
  category_sub?: string | null
  phone?: string | null
  address?: string | null
  is_active?: boolean | null
  approved?: boolean | null
  is_vip?: boolean | null
  vip_tier?: string | null
}

export default function AdminUserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const userId = params.id

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [businesses, setBusinesses] = useState<BusinessRow[]>([])

  const [searchBiz, setSearchBiz] = useState('')
  const [bizResults, setBizResults] = useState<BusinessRow[]>([])
  const [bizSearching, setBizSearching] = useState(false)
  const [bizAssigningId, setBizAssigningId] = useState('')
  const [bizActionId, setBizActionId] = useState('')

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

        await loadDetail()
      } catch (e) {
        console.error(e)
        setErrorMsg('회원 상세 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [userId])

  const loadDetail = async () => {
    try {
      const { data: profileData, error: profileError } = await sb
        .from('user_profiles')
        .select('id, email, name, phone, avatar_url, role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle()

      if (profileError || !profileData) {
        console.error('profile load error:', profileError)
        setErrorMsg('회원 정보를 찾을 수 없습니다.')
        return
      }

      const { data: businessesData, error: businessesError } = await sb
        .from('businesses')
        .select(`
          id,
          name_kr,
          name_en,
          category_main,
          category_sub,
          phone,
          address,
          is_active,
          approved,
          is_vip,
          vip_tier
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (businessesError) {
        console.error('businesses load error:', businessesError)
        setErrorMsg('연결 업소를 불러오지 못했습니다.')
        return
      }

      setProfile(profileData)
      setBusinesses(businessesData || [])
    } catch (e) {
      console.error('loadDetail catch:', e)
      setErrorMsg('상세 정보 로딩 중 오류가 발생했습니다.')
    }
  }

  const updateRole = async (nextRole: string) => {
    if (!profile) return
    if (!confirm(`이 회원의 권한을 "${nextRole}"로 변경할까요?`)) return

    try {
      setSaving(true)

      const { error } = await sb
        .from('user_profiles')
        .update({ role: nextRole })
        .eq('id', profile.id)

      if (error) {
        alert('권한 변경 실패: ' + error.message)
        return
      }

      alert('✅ 권한이 변경되었습니다.')
      await loadDetail()
    } finally {
      setSaving(false)
    }
  }

  const searchBusinesses = async () => {
    if (!searchBiz.trim()) {
      setBizResults([])
      return
    }

    try {
      setBizSearching(true)

      const term = searchBiz.trim()

      const { data, error } = await sb
        .from('businesses')
        .select(`
          id,
          name_kr,
          name_en,
          category_main,
          category_sub,
          phone,
          address,
          is_active,
          approved,
          is_vip,
          vip_tier
        `)
        .or([
          `name_kr.ilike.%${term}%`,
          `name_en.ilike.%${term}%`,
          `category_main.ilike.%${term}%`,
          `category_sub.ilike.%${term}%`,
          `address.ilike.%${term}%`,
        ].join(','))
        .order('is_vip', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        alert('업소 검색 실패: ' + error.message)
        setBizResults([])
        return
      }

      setBizResults(data || [])
    } finally {
      setBizSearching(false)
    }
  }

  const assignBusiness = async (bizId: string) => {
    if (!confirm('이 업소를 이 회원에게 연결할까요?')) return

    try {
      setBizAssigningId(bizId)

      const { error } = await sb
        .from('businesses')
        .update({ owner_id: userId })
        .eq('id', bizId)

      if (error) {
        alert('연결 실패: ' + error.message)
        return
      }

      alert('✅ 업소가 연결되었습니다.')
      await loadDetail()
      await searchBusinesses()
    } finally {
      setBizAssigningId('')
    }
  }

  const unassignBusiness = async (bizId: string) => {
    if (!confirm('이 업소 연결을 해제할까요?')) return

    try {
      setBizActionId(bizId)

      const { error } = await sb
        .from('businesses')
        .update({ owner_id: null })
        .eq('id', bizId)

      if (error) {
        alert('해제 실패: ' + error.message)
        return
      }

      alert('✅ 업소 연결이 해제되었습니다.')
      await loadDetail()
      await searchBusinesses()
    } finally {
      setBizActionId('')
    }
  }

  const toggleVip = async (b: BusinessRow) => {
    try {
      setBizActionId(b.id)

      const { error } = await sb
        .from('businesses')
        .update({
          is_vip: !b.is_vip,
          vip_tier: b.is_vip ? null : 'pro',
        })
        .eq('id', b.id)

      if (error) {
        alert('VIP 변경 실패: ' + error.message)
        return
      }

      await loadDetail()
      await searchBusinesses()
    } finally {
      setBizActionId('')
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
            href="/admin/users"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            회원 목록
          </a>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-slate-100 max-w-4xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-extrabold text-white">회원 상세</h1>
          <p className="text-white/40 text-[12px] mt-0.5">
            회원 정보, 권한, 연결 업소 확인
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <a
            href="/admin/users"
            className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
          >
            회원 목록
          </a>
          <a
            href="/admin"
            className="text-white/70 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg"
          >
            Admin
          </a>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || 'profile'}
                    className="w-14 h-14 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-lg font-bold">
                    {(profile.name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-[18px] font-extrabold text-slate-900">
                    {profile.name || '이름 없음'}
                  </div>

                  <div className="text-[13px] text-slate-500 mt-1 break-all">
                    {profile.email || '이메일 없음'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-4">
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  권한: {profile.role || 'user'}
                </span>

                <span className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                  연결 업소 {businesses.length}개
                </span>
              </div>

              {profile.phone && (
                <div className="text-[12px] text-slate-500 mt-3">
                  전화: {profile.phone}
                </div>
              )}

              {profile.created_at && (
                <div className="text-[11px] text-slate-400 mt-3">
                  가입일: {new Date(profile.created_at).toLocaleDateString()}
                </div>
              )}

              {profile.updated_at && (
                <div className="text-[11px] text-slate-400 mt-1">
                  수정일: {new Date(profile.updated_at).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 min-w-[160px]">
              <select
                value={profile.role || 'user'}
                disabled={saving}
                onChange={(e) => updateRole(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-[12px] bg-white"
              >
                <option value="user">user</option>
                <option value="owner">owner</option>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-[14px] font-bold text-slate-800">연결된 업소</div>
          </div>

          {businesses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-[13px]">
              연결된 업소가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {businesses.map((b) => (
                <div key={b.id} className="px-4 py-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-slate-800 truncate flex items-center gap-2 flex-wrap">
                      <span>{b.name_kr || b.name_en}</span>

                      {b.is_vip && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-300 text-amber-900">
                          ⭐ {(b.vip_tier || 'vip').toUpperCase()}
                        </span>
                      )}

                      {!b.approved && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-800">
                          승인대기
                        </span>
                      )}

                      {b.is_active === false && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                          비활성
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      {b.category_main && <span>{b.category_main}</span>}
                      {b.category_sub && <span>{b.category_sub}</span>}
                      {b.phone && <span>{b.phone}</span>}
                    </div>

                    {b.address && (
                      <div className="text-[11px] text-slate-400 mt-1 truncate">
                        {b.address}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <a
                      href={`/admin/businesses/${b.id}`}
                      className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600"
                    >
                      보기
                    </a>

                    <button
                      onClick={() => toggleVip(b)}
                      disabled={bizActionId === b.id}
                      className="text-[11px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold disabled:opacity-50"
                    >
                      {b.is_vip ? 'VIP 해제' : 'VIP'}
                    </button>

                    <button
                      onClick={() => unassignBusiness(b.id)}
                      disabled={bizActionId === b.id}
                      className="text-[11px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold disabled:opacity-50"
                    >
                      {bizActionId === b.id ? '처리 중...' : '해제'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[14px] font-bold text-slate-800 mb-2">업소 연결</div>

          <div className="flex gap-2 mb-3">
            <input
              value={searchBiz}
              onChange={(e) => setSearchBiz(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && searchBusinesses()}
              placeholder="업소 이름 검색"
              className="flex-1 border border-slate-200 px-3 py-2 rounded-lg text-[13px]"
            />
            <button
              onClick={searchBusinesses}
              disabled={bizSearching}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-[12px] font-bold disabled:opacity-50"
            >
              {bizSearching ? '검색 중...' : '검색'}
            </button>
          </div>

          <div className="space-y-2">
            {searchBiz.trim() === '' ? (
              <div className="text-[12px] text-slate-400">
                연결할 업소 이름을 입력하고 검색하세요.
              </div>
            ) : bizResults.length === 0 ? (
              <div className="text-[12px] text-slate-400">
                검색 결과가 없습니다.
              </div>
            ) : (
              bizResults.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between border border-slate-200 p-3 rounded-lg"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-[13px] font-bold text-slate-800 truncate">
                      {b.name_kr || b.name_en}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex gap-2 flex-wrap">
                      {b.category_main && <span>{b.category_main}</span>}
                      {b.category_sub && <span>{b.category_sub}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => assignBusiness(b.id)}
                    disabled={bizAssigningId === b.id}
                    className="text-[12px] bg-green-100 text-green-700 px-3 py-1.5 rounded font-bold disabled:opacity-50"
                  >
                    {bizAssigningId === b.id ? '연결 중...' : '연결'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-[14px] font-bold text-slate-800 mb-2">다음 확장 자리</div>
          <div className="text-[12px] text-slate-500 leading-relaxed">
            여기에 나중에 최근 활동, 리뷰 작성 내역, 업소 수정 요청, 소유권 요청 기록을 연결하면 됩니다.
          </div>
        </div>
      </div>
    </div>
  )
}
