'use client'
import { useState, useEffect } from 'react'
import { createBrowser, PLANS } from '@/lib/supabase'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

const supabase = createBrowser()

export default function PricingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [myBusiness, setMyBusiness] = useState<any>(null)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user)
        const { data: biz } = await supabase
          .from('businesses').select('id,name_kr,name_en,is_vip,vip_tier')
          .eq('owner_id', data.user.id).single()
        setMyBusiness(biz)
      }
    })
  }, [])

  const handleSubscribe = async (tier: string, priceId: string) => {
    if (!user) { router.push('/auth/login'); return }
    if (!myBusiness) { router.push('/register'); return }
    setLoading(tier)
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, priceId, businessId: myBusiness.id }),
    })
    const { url, error } = await res.json()
    if (error) { alert('오류: ' + error); setLoading(null); return }
    window.location.href = url
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-12 pb-8 text-center relative">
        <button onClick={() => router.back()} className="absolute left-4 top-4 text-white/60 text-xl">←</button>
        <h1 className="text-[24px] font-extrabold text-white mb-2">⭐ VIP 플랜</h1>
        <p className="text-[13px] text-white/60">상단 노출로 더 많은 고객을 만나세요</p>
        <div className="mt-4 inline-block bg-green-500/20 border border-green-400/30 rounded-full px-4 py-1.5 text-[12px] font-bold text-green-400">
          🎁 14일 무료 체험 — 카드 등록 없이 시작
        </div>
      </div>

      {myBusiness && (
        <div className="mx-4 mt-4 bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl">🏢</div>
          <div>
            <div className="text-[13px] font-bold text-slate-700">{myBusiness.name_kr || myBusiness.name_en}</div>
            <div className="text-[11px] text-slate-400">{myBusiness.is_vip ? `현재 ${myBusiness.vip_tier?.toUpperCase()} 플랜` : '현재 무료 플랜'}</div>
          </div>
          {myBusiness.is_vip && <span className="ml-auto text-amber-500 text-xl">⭐</span>}
        </div>
      )}

      {user && !myBusiness && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-[13px] font-bold text-amber-800 mb-2">업소를 먼저 등록해주세요</div>
          <a href="/register" className="inline-block bg-amber-500 text-white text-[13px] font-bold px-5 py-2 rounded-lg">업소 등록하기</a>
        </div>
      )}

      <div className="flex justify-center mt-5 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex">
          <button onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-colors ${billing==='monthly'?'bg-indigo-600 text-white':'text-slate-500'}`}>월간</button>
          <button onClick={() => setBilling('yearly')}
            className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-colors flex items-center gap-2 ${billing==='yearly'?'bg-indigo-600 text-white':'text-slate-500'}`}>
            연간 <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">-17%</span>
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {PLANS.map(plan => {
          const isCurrentPlan = myBusiness?.vip_tier === plan.tier
          const monthlyPrice = billing === 'yearly' ? Math.round(plan.price * 0.83) : plan.price
          return (
            <div key={plan.tier} className={`bg-white rounded-2xl border-2 p-5 relative ${plan.color}`}>
              {plan.badge && (
                <div className={`absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full ${plan.badge==='인기'?'bg-indigo-600 text-white':'bg-amber-400 text-amber-900'}`}>
                  {plan.badge}
                </div>
              )}
              <div className="mb-4">
                <div className="text-[18px] font-extrabold text-slate-800">{plan.name}</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[32px] font-black text-slate-900">${monthlyPrice}</span>
                  <span className="text-[13px] text-slate-400">/{billing==='monthly'?'월':'월 (연간 결제)'}</span>
                </div>
                {billing==='yearly' && <div className="text-[12px] text-green-600 font-bold">연간 ${plan.price*12 - monthlyPrice*12} 절약</div>}
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                    <Check size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              {isCurrentPlan ? (
                <div className="w-full py-3.5 rounded-xl text-[14px] font-bold text-center bg-green-50 text-green-700 border-2 border-green-200">✅ 현재 플랜</div>
              ) : (
                <button onClick={() => handleSubscribe(plan.tier, plan.priceId)} disabled={loading===plan.tier}
                  className={`w-full py-3.5 rounded-xl text-[14px] font-bold transition-colors ${
                    plan.tier==='pro'?'bg-indigo-600 text-white hover:bg-indigo-700':
                    plan.tier==='premium'?'bg-amber-500 text-white hover:bg-amber-600':
                    'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } disabled:opacity-60`}>
                  {loading===plan.tier?'처리 중...':`${plan.name} 시작하기 (14일 무료)`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-4 mt-8">
        <h2 className="text-[16px] font-bold text-slate-700 mb-4">자주 묻는 질문</h2>
        {[
          ['14일 무료 체험이란?','신용카드 없이 14일간 모든 기능 무료 체험. 언제든 취소 가능.'],
          ['언제든 취소 가능한가요?','네, 대시보드에서 언제든지 취소 가능합니다.'],
          ['플랜 변경은?','대시보드에서 업그레이드/다운그레이드 가능합니다.'],
        ].map(([q,a]) => (
          <div key={q} className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
            <div className="text-[13px] font-bold text-slate-700 mb-1.5">{q}</div>
            <div className="text-[12px] text-slate-500 leading-relaxed">{a}</div>
          </div>
        ))}
      </div>
    </div>
  )
}