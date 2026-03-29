'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type DashboardStats = {
  totalBusinesses: number
  vipBusinesses: number
  pendingBusinesses: number
  pendingClaims: number
  pendingEdits: number
  activeBanners: number
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    vipBusinesses: 0,
    pendingBusinesses: 0,
    pendingClaims: 0,
    pendingEdits: 0,
    activeBanners: 0,
  })
  const [recentBusinesses, setRecentBusinesses] = useState<any[]>([])

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

        await loadDashboard()
      } catch (e) {
        setErrorMsg('관리자 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const loadDashboard = async () => {
    try {
      const [
        totalBusinessesRes,
        vipBusinessesRes,
        pendingBusinessesRes,
        pendingClaimsRes,
        pendingEditsRes,
        activeBannersRes,
        recentBusinessesRes,
      ] = await Promise.all([
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
          .eq('data_source', 'user_registered')
          .eq('is_active', true)
          .eq('approved', false),

        sb
          .from('business_claim_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        sb
          .from('business_edits')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        sb
          .from('banners')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),

        sb
          .from('businesses')
          .select('id, name_kr, name_en, category_main, phone, approved, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      setStats({
        totalBusinesses: totalBusinessesRes.count || 0,
        vipBusinesses: vipBusinessesRes.count || 0,
        pendingBusinesses: pendingBusinessesRes.count || 0,
        pendingClaims: pendingClaimsRes.count || 0,
        pendingEdits: pendingEditsRes.count || 0,
        activeBanners: activeBannersRes.count || 0,
      })

      setRecentBusinesses(recentBusinessesRes.data || [])
    } catch (e) {
      setErrorMsg('대시보드 정보를 불러오는 중 오류가 발생했습니다.')
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
            href="/"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            홈으로
          </a>
        </div>
      </div>
    )
  }

  const quickMenus = [
    {
      href: '/admin/businesses',
      icon: '🏢',
      title: '업소 관리',
      desc: '전체 업소 검색, 수정, 승인',
    },
    {
      href: '/admin/categories',
      icon: '🗂️',
      title: '카테고리 관리',
      desc: '카테고리, 아이콘, 순서 관리',
    },
    {
      href: '/admin/banners',
      icon: '📢',
      title: '배너 관리',
      desc: '홈 상단·중간·하단 광고 관리',
    },
    {
      href: '/admin/claims',
      icon: '🏷️',
      title: '업소 소유권 요청 관리',
      desc: '기존 업소 소유권 승인/반려',
    },
    {
      href: '/admin/edits',
      icon: '✏️',
      title: '업소 수정 요청 관리',
      desc: '업주가 보낸 수정 요청 승인/반려',
    },
    {
      href: '/',
      icon: '🏠',
      title: '사이트 보기',
      desc: '실제 홈 화면으로 이동',
    },
  ]

  const taskCards = [
    {
      label: '신규 승인 대기',
      value: stats.pendingBusinesses,
      color: 'text-red-500',
      href: '/admin/businesses?tab=pending',
    },
    {
      label: '소유권 요청 대기',
      value: stats.pendingClaims,
      color: 'text-indigo-600',
      href: '/admin/claims',
    },
    {
      label: '수정 요청 대기',
      value: stats.pendingEdits,
      color: 'text-violet-600',
      href: '/admin/edits',
    },
    {
      label: '활성 배너',
      value: stats.activeBanners,
      color: 'text-amber-600',
      href: '/admin/banners',
    },
  ]

  const statCards = [
    {
      label: '전체 업소',
      value: stats.totalBusinesses,
      color: 'text-slate-700',
    },
    {
      label: 'VIP 업소',
      value: stats.vipBusinesses,
      color: 'text-amber-600',
    },
    {
      label: '신규 승인 대기',
      value: stats.pendingBusinesses,
      color: 'text-red-500',
    },
    {
      label: '소유권 요청 대기',
      value: stats.pendingClaims,
      color: 'text-indigo-600',
    },
    {
      label: '수정 요청 대기',
      value: stats.pendingEdits,
      color: 'text-violet-600',
    },
    {
      label: '활성 배너',
      value: stats.activeBanners,
      color: 'text-amber-600',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-100 max-w-5xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold text-white">🛠 관리자 대시보드</h1>
            <p className="text-white/40 text-[12px] mt-1">
              교차로 휴스턴 운영 현황과 빠른 관리 메뉴
            </p>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            <a
              href="/admin/businesses"
              className="text-white/70 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
            >
              🏢 업소
            </a>
            <a
              href="/admin/banners"
              className="text-white/70 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
            >
              📢 배너
            </a>
            <a
              href="/admin/claims"
              className="text-white/70 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
            >
              🏷️ 소유권 요청
            </a>
            <a
              href="/admin/edits"
              className="text-white/70 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg"
            >
              ✏️ 수정 요청
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

      <div className="px-4 pt-4">
        <div className="text-[13px] font-bold text-slate-500 mb-3">운영 현황</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200 p-4 text-center"
            >
              <div className={`text-[24px] font-extrabold ${card.color}`}>
                {card.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="text-[13px] font-bold text-slate-500 mb-3">지금 처리할 일</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {taskCards.map((task) => (
            <a
              key={task.label}
              href={task.href}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
            >
              <div className={`text-[26px] font-extrabold ${task.color}`}>
                {task.value}
              </div>
              <div className="text-[13px] font-bold text-slate-700 mt-1">
                {task.label}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">바로 이동</div>
            </a>
          ))}
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="text-[13px] font-bold text-slate-500 mb-3">빠른 메뉴</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickMenus.map((menu) => (
            <a
              key={menu.href}
              href={menu.href}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{menu.icon}</div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-slate-800">
                    {menu.title}
                  </div>
                  <div className="text-[12px] text-slate-400 mt-1">{menu.desc}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-bold text-slate-500">최근 등록 업소</div>
          <a
            href="/admin/businesses"
            className="text-[12px] font-bold text-indigo-600"
          >
            전체 보기
          </a>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {recentBusinesses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-[13px]">
              최근 업소가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentBusinesses.map((b) => (
                <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-slate-800 truncate">
                      {b.name_kr || b.name_en}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      {b.category_main && <span>{b.category_main}</span>}
                      {b.phone && <span>{b.phone}</span>}
                      {!b.approved && (
                        <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          승인대기
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={`/admin/businesses/${b.id}`}
                    className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600"
                  >
                    보기
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
