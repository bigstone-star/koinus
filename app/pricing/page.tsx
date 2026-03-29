'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PLANS = [
  { tier:'basic', name:'Basic', price:29, yp:24, color:'border-slate-200', badge:'', features:['카테고리 상단 노출','BASIC 배지','업소 정보 관리','전화/지도/웹 버튼','월간 통계'] },
  { tier:'pro', name:'Pro', price:49, yp:41, color:'border-indigo-500', badge:'인기', features:['카테고리 최상단 노출','PRO 배지','한국어 소개글','사진 1장','주간 통계','SNS 연동'] },
  { tier:'premium', name:'Premium', price:79, yp:66, color:'border-amber-400', badge:'최고', features:['전체 최상단 노출','PREMIUM 배지','소개글 무제한','사진 5장','실시간 통계','홈 배너','전용 담당자'] },
]

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly')
  const [loading, setLoading] = useState('')
  const [msg, setMsg] = useState('')

  const go = async (tier: string) => {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { window.location.href = '/auth/login?redirect=/pricing'; return }
    const { data: biz } = await sb.from('businesses').select('id,is_vip,vip_tier').eq('owner_id', user.id).single()
    if (!biz) { setMsg('먼저 업소를 등록해주세요!'); setTimeout(() => window.location.href = '/register', 2000); return }
    if (biz.is_vip && biz.vip_tier === tier) { setMsg('이미 ' + tier.toUpperCase() + ' 플랜 사용 중'); setTimeout(() => setMsg(''), 3000); return }
    setLoading(tier)
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier, billing, businessId: biz.id, userId: user.id }) })
      const { url, error } = await res.json()
      if (error) { setMsg('오류: ' + error); setTimeout(() => setMsg(''), 3000); return }
      window.location.href = url
    } catch (err: any) { setMsg('오류: ' + err.message) }
    finally { setLoading('') }
  }
  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-12 pb-8 text-center relative">
        <a href="/" className="absolute left-4 top-4 text-white/60 text-xl">←</a>
        <h1 className="text-[24px] font-extrabold text-white mb-2">⭐ VIP 플러</h1>
        <p className="text-[13px] text-white/60">상단 노출로 더 많은 고객을 만나세요</p>
        <div className="mt-4 inline-block bg-green-500/20 border border-green-400/30 rounded-full px-4 py-1.5 text-[12px] font-bold text-green-400">🎁 14일 무료 체험</div>
      </div>
      {msg && <div className="mx-4 mt-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-[14px] font-bold text-indigo-700 text-center">{msg}</div>}
      <div className="flex justify-center mt-5 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-1 flex">
          <button onClick={()=>setBilling('monthly')} className={`px-5 py-2 rounded-lg text-[13px] font-bold ${billing==='monthly'?'bg-indigo-600 text-white':'text-slate-500'}`}>월간</button>
          <button onClick={()=>setBilling('yearly')} className={`px-5 py-2 rounded-lg text-[13px] font-bold flex items-center gap-2 ${billing==='yearly'?'bg-indigo-600 text-white':'text-slate-500'}`}>연간 <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">-17%</span></button>
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
            <ul className="space-y-2 mb-5">{p.features.map(f=><li key={f} className="flex items-start gap-2 text-[13px] text-slate-600"><span className="text-indigo-500 mt-0.5">✓</span>{f}</li>)}</ul>
            <button onClick={()=>go(p.tier)} disabled={loading===p.tier} className={`w-full py-3.5 rounded-xl text-[14px] font-bold disabled:opacity-60 ${p.tier==='pro'?'bg-indigo-600 text-white':p.tier==='premium'?'bg-amber-500 text-white':'bg-slate-100 text-slate-700'}`}>
              {loading===p.tier?'연결 중...':p.name+' 시작하기 (14일 무료)'}
            </button>
          </div>
        ))}
      </div>
      <div className="px-4 mt-6 bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-[12px] font-bold text-slate-500 mb-2">자주 묻는 질문</div>
        <ul className="space-y-1.5 text-[12px] text-slate-600">
          <li>✓ 14일 무료 체험 중 취소 시 요금 미청수</li>
          <li>✓ 언제든지 취소 가능</li>
          <li>✓ 취소 후에도 만료일까지 이용 가능</li>
          <li>✓ 문의: kyocharo.houston@gmail.com</li>
        </ul>
      </div>
    </div>
  )
}
