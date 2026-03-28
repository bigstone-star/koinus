'use client'
import { useState, useEffect } from 'react'
import { createBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BarChart2, Eye, Phone, Globe, Edit, LogOut, ChevronRight } from 'lucide-react'

const supabase = createBrowser()

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [analytics, setAnalytics] = useState({ views: 0, phone_clicks: 0, web_clicks: 0 })
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      setSuccessMsg(`🎉 ${params.get('tier')?.toUpperCase()} 플랜이 시작됐습니다!`)
      setTimeout(() => setSuccessMsg(''), 5000)
    }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser(data.user)
      const { data: prof } = await supabase.from('user_profiles').select('*').eq('id', data.user.id).single()
      setProfile(prof)
      const { data: biz } = await supabase.from('businesses').select('*').eq('owner_id', data.user.id).single()
      setBusiness(biz)
      if (biz) {
        const { data: sub } = await supabase.from('subscriptions')
          .select('*').eq('business_id', biz.id).eq('status', 'active').single()
        setSubscription(sub)
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const { data: stats } = await supabase.from('business_analytics')
          .select('views,phone_clicks,web_clicks').eq('business_id', biz.id)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        if (stats) setAnalytics({
          views: stats.reduce((s, r) => s + r.views, 0),
          phone_clicks: stats.reduce((s, r) => s + r.phone_clicks, 0),
          web_clicks: stats.reduce((s, r) => s + r.web_clicks, 0),
        })
      }
      setLoading(false)
    })
  }, [router])

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold text-white">대시보드</h1>
            <p className="text-[12px] text-white/50 mt-0.5">{profile?.name || user?.email}</p>
          </div>
          <button onClick={signOut} className="text-white/40 flex items-center gap-1 text-[12px]">
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[14px] font-bold text-green-700">{successMsg}</div>
        )}

        {!business ? (
          <div className="bg-white rounded-xl p-5 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <div className="text-[16px] font-bold text-slate-700 mb-2">등록된 업소가 없습니다</div>
            <p className="text-[13px] text-slate-400 mb-4">업소를 등록하고 더 많은 고객을 만나세요</p>
            <a href="/register" className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl text-[14px]">업소 등록하기</a>
          </div>
        ) : (
          <>
            <div className={`rounded-xl p-4 ${subscription ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-slate-500 mb-1">구독 플랜</div>
                  {subscription ? (
                    <>
                      <div className="text-[20px] font-extrabold text-amber-700">⭐ {subscription.tier.toUpperCase()} 플랜</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('ko-KR') + ' 갱신' : '무료 체험 중'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[16px] font-bold text-slate-700">무료 플랜</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">VIP 업그레이드로 상단 노출</div>
                    </>
                  )}
                </div>
                <a href="/pricing" className={`px-4 py-2.5 rounded-lg text-[13px] font-bold ${subscription ? 'bg-amber-100 text-amber-700' : 'bg-indigo-600 text-white'}`}>
                  {subscription ? '플랜 변경' : 'VIP 시작'}
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-700 text-[15px]">내 업소</h2>
                <a href="/dashboard/profile" className="text-[12px] text-indigo-600 font-bold flex items-center gap-1"><Edit size={13} /> 수정</a>
              </div>
              <div className="font-bold text-slate-800 text-[16px]">{business.name_kr || business.name_en}</div>
              <div className="text-[12px] text-slate-400 mt-0.5">{business.category_main}{business.category_sub ? ` · ${business.category_sub}` : ''}</div>
              {business.address && <div className="text-[12px] text-slate-500 mt-1">📍 {business.address}</div>}
              {business.phone && <div className="text-[12px] text-slate-500 mt-0.5">📞 {business.phone}</div>}
              {!business.approved && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-[11px] text-yellow-700 font-bold">
                  ⏳ 검토 중 — 관리자 승인 후 사이트에 노출됩니다
                </div>
              )}
            </div>

            <div>
              <div className="text-[12px] font-bold text-slate-400 mb-2 flex items-center gap-1"><BarChart2 size={14} /> 이번 달 통계</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '조회수', value: analytics.views, icon: <Eye size={18} /> },
                  { label: '전화 클릭', value: analytics.phone_clicks, icon: <Phone size={18} /> },
                  { label: '웹 클릭', value: analytics.web_clicks, icon: <Globe size={18} /> },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <div className="text-slate-400 flex justify-center mb-1">{stat.icon}</div>
                    <div className="text-[20px] font-extrabold text-slate-800">{stat.value.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {!subscription && (
              <a href="/pricing" className="block bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 text-center">
                <div className="text-white font-bold text-[15px]">⭐ VIP로 업그레이드하면</div>
                <div className="text-white/70 text-[12px] mt-1">카테고리 최상단 노출 · 소개글 · 사진 · 통계</div>
                <div className="mt-3 bg-white/20 text-white text-[13px] font-bold px-5 py-2 rounded-lg inline-block">14일 무료 체험 →</div>
              </a>
            )}
          </>
        )}

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {[
            { href: '/dashboard/profile', label: '업소 정보 수정', icon: '✏️' },
            { href: '/pricing', label: 'VIP 요금제', icon: '⭐' },
          ].map(item => (
            <a key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50">
              <span className="text-xl">{item.icon}</span>
              <span className="text-[14px] font-bold text-slate-700 flex-1">{item.label}</span>
              <ChevronRight size={16} className="text-slate-300" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}