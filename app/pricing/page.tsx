'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const PLANS = [
  { tier:'basic', name:'Basic', price:29, yp:24, color:'border-slate-200', badge:'',
    features:['카테고리 상단 노출','BASIC 배지','업소 정보 관리','전화/지도/웹 버튼','월간 통계'] },
  { tier:'pro', name:'Pro', price:49, yp:41, color:'border-indigo-500', badge:'인기',
    features:['카테고리 최상단 노출','PRO 배지','한국어 소개글','사진 1장','주간 통계','SNS 연동'] },
  { tier:'premium', name:'Premium', price:79, yp:66, color:'border-amber-400', badge:'최고',
    features:['전체 최상단 노출','PREMIUM 배지','소개글 무제한','사진 5장','실시간 통계','홈 배너','전용 담당자'] },
]

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly')
  const go = async (tier: string) => {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    alert(tier.toUpperCase() + ' 플랜 신청이 접수됩니다.\n담당자가 연락드릴 예정입니다.')
  }
  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-12 pb-8 text-center relative">
        <a href="/" className="absolute left-4 top-4 text-white/60 text-xl">←</a>
        <h1 className="text-[24px] font-extrabold text-white mb-2">⭐ VIP 플랜</h1>
        <p className="text-[13px] text-white/60">상단 노출로 더 많은 고객을 만나세요</p>
        <div className="mt-4 inline-block bg-green-500/20 border border-green-400/30 rounded-full px-4 py-1.5 text-[12px] font-bold text-green-400">🎁 14일 무료 체험</div>
      </div>
      <div className="flex justify-center mt-5 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex">
          <button onClick={()=>setBilling('monthly')} className={`px-5 py-2 rounded-lg text-[13px] font-bold ${billing==='monthly'?'bg-indigo-600 text-white':'text-slate-500'}`}>월간</button>
          <button onClick={()=>setBilling('yearly')} className={`px-5 py-2 rounded-lg text-[13px] font-bold flex items-center gap-2 ${billing==='yearly'?'bg-indigo-600 text-white':'text-slate-500'}`}>
            연간 <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">-17%</span>
          </button>
        </div>
      </div>
      <div className="px-4 space-y-4">
        {PLANS.map(p => (
          <div key={p.tier} className={`bg-white rounded-2xl border-2 p-5 relative ${p.color}`}>
            {p.badge && <div className={`absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full ${p.badge==='인기'?'bg-indigo-600 text-white':'bg-amber-400 text-amber-900'}`}>{p.badge}</div>}
            <div className="mb-4">
              <div className="text-[18px] font-extrabold">{p.name}</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[32px] font-black">${billing==='monthly'?p.price:p.yp}</span>
                <span className="text-[13px] text-slate-400">/{billing==='monthly'?'월':'월(연간)'}</span>
              </div>
            </div>
            <ul className="space-y-2 mb-5">
              {p.features.map(f => <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600"><span className="text-indigo-500 mt-0.5">✓</span>{f}</li>)}
            </ul>
            <button onClick={()=>go(p.tier)} className={`w-full py-3.5 rounded-xl text-[14px] font-bold ${p.tier==='pro'?'bg-indigo-600 text-white':p.tier==='premium'?'bg-amber-500 text-white':'bg-slate-100 text-slate-700'}`}>
              {p.name} 시작하기 (14일 무료)
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}