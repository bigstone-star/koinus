'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const CATS = ['식당·카페','마트·식품','의료','치과','법률','자동차','미용','교육','금융·보험','커뮤니티','부동산','세탁소','한의원','기타']
export default function RegisterPage() {
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({name_kr:'',name_en:'',category_main:'',address:'',phone:'',website:'',description_kr:''})
  useEffect(()=>{sb.auth.getUser().then(({data})=>{if(!data.user)window.location.href='/auth/login';else setUser(data.user)});},[])
  const upd = (k:string,v:string) => setForm(f=>({...f,[k]:v}))
  const submit = async () => {
    if (!form.name_kr&&!form.name_en){alert('업소명 입력');return}
    if (!form.category_main){alert('카테고리 선택');return}
    setLoading(true)
    const {error} = await sb.from('businesses').insert({
      place_id:'user_'+Date.now()+'_'+user.id.slice(0,8),
      name_kr:form.name_kr||null, name_en:form.name_en||null,
      category_main:form.category_main, address:form.address||null,
      city:'Houston', state:'TX', phone:form.phone||null, website:form.website||null,
      description_kr:form.description_kr||null, owner_id:user.id,
      is_active:true, approved:false, is_vip:false, data_source:'user_registered',
    })
    setLoading(false)
    if(error){alert('오류: '+error.message);return}
    setStep(3)
  }
  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto">
      <header className="bg-[#1a1a2e] px-4 py-4 flex items-center gap-3">
        <button onClick={()=>step>1?setStep(s=>s-1):window.location.href='/'} className="text-white/60 text-2xl">←</button>
        <h1 className="text-[18px] font-extrabold text-white">업소 등록</h1>
      </header>
      <div className="px-4 py-5">
        {step===1&&<div className="space-y-4">
          <div className="bg-white rounded-xl p-4 space-y-4">
            {[{k:'name_kr',l:'업소명(한국어)',p:'고려원 한식당'},{k:'name_en',l:'업소명(영어)',p:'Korea Garden'},{k:'phone',l:'전화',p:'(713) 000-0000'},{k:'address',l:'주소',p:'9501 Long Point Rd, Houston, TX'}].map(f=>(
              <div key={f.k}><label className="text-[12px] font-bold text-slate-500 block mb-1.5">{f.l}</label>
                <input value={(form as any)[f.k]} onChange={e=>upd(f.k,e.target.value)} placeholder={f.p} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400"/></div>))}
            <div><label className="text-[12px] font-bold text-slate-500 block mb-1.5">카테고리 *</label>
              <select value={form.category_main} onChange={e=>upd('category_main',e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400 bg-white">
                <option value="">선택하세요</option>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <button onClick={()=>setStep(2)} disabled={!form.category_main} className="w-full bg-indigo-600 text-white rounded-xl py-4 text-[15px] font-bold disabled:opacity-50">다음 단계 →</button>
        </div>}
        {step===2&&<div className="space-y-4">
          <div className="bg-white rounded-xl p-4 space-y-4">
            <div><label className="text-[12px] font-bold text-slate-500 block mb-1.5">웹사이트</label>
              <input value={form.website} onChange={e=>upd('website',e.target.value)} placeholder="https://" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400"/></div>
            <div><label className="text-[12px] font-bold text-slate-500 block mb-1.5">소개글</label>
              <textarea value={form.description_kr} onChange={e=>upd('description_kr',e.target.value)} rows={4} placeholder="업소 소개 (Pro/Premium에서 노출)" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400 resize-none"/></div>
          </div>
          <button onClick={submit} disabled={loading} className="w-full bg-indigo-600 text-white rounded-xl py-4 text-[15px] font-bold disabled:opacity-60">{loading?'등록 중...':'업소 등록 완료'}</button>
        </div>}
        {step===3&&<div className="text-center py-10">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-[22px] font-extrabold text-slate-800 mb-2">등록 완료!</h2>
          <p className="text-[14px] text-slate-500 mb-6">관리자 승인 후 사이트에 노출됩니다</p>
          <a href="/pricing" className="block bg-amber-500 text-white rounded-xl py-4 text-[15px] font-bold mb-3">⭐ VIP 업그레이드</a>
          <a href="/" className="block bg-white border-2 border-slate-200 text-slate-700 rounded-xl py-4 text-[15px] font-bold">홈으로</a>
        </div>}
      </div>
    </div>
  )
}