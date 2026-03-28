'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const FB = ['식당·카페','마트·식품','의료','치과','법률','자동차','미용','교육','금융·보험','커뮤니티','부동산','세탁소','한의원','여행·관광','기타']
export default function ProfilePage() {
  const [biz,setBiz]=useState<any>(null)
  const [loading,setLoading]=useState(false)
  const [saved,setSaved]=useState(false)
  const [cats,setCats]=useState<string[]>(FB)
  useEffect(()=>{
    sb.auth.getUser().then(async({data})=>{
      if(!data.user){window.location.href='/auth/login';return}
      const{data:b}=await sb.from('businesses').select('*').eq('owner_id',data.user.id).single()
      if(b)setBiz(b)
    })
    sb.from('categories').select('name').eq('is_active',true).order('sort_order').then(({data})=>{if(data&&data.length>0)setCats(data.map(c=>c.name))})
  },[])
  const upd=(k:string,v:string)=>setBiz((b:any)=>({...b,[k]:v}))
  const save=async()=>{
    setLoading(true)
    const{error}=await sb.from('businesses').update({
      name_kr:biz.name_kr,name_en:biz.name_en,category_main:biz.category_main,
      category_sub:biz.category_sub,address:biz.address,phone:biz.phone,
      website:biz.website,description_kr:biz.description_kr,
      sns_instagram:biz.sns_instagram,sns_kakao:biz.sns_kakao,
    }).eq('id',biz.id)
    setLoading(false)
    if(!error){setSaved(true);setTimeout(()=>setSaved(false),3000)}else alert('저장 실패: '+error.message)
  }
  if(!biz)return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
  const fs="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400"
  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto pb-10">
      <header className="bg-[#1a1a2e] px-4 py-4 flex items-center gap-3">
        <button onClick={()=>window.location.href='/dashboard'} className="text-white/60 text-2xl">←</button>
        <h1 className="text-[18px] font-extrabold text-white">업소 정보 수정</h1>
      </header>
      <div className="px-4 py-5 space-y-4">
        {saved&&<div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[14px] font-bold text-green-700">✅ 저장됐습니다!</div>}
        <div className="bg-white rounded-xl p-4 space-y-4">
          {[{k:'name_kr',l:'업소명(한국어)'},{k:'name_en',l:'업소명(영어)'},{k:'phone',l:'전화번호'},{k:'address',l:'주소'},{k:'website',l:'웹사이트'},{k:'sns_instagram',l:'인스타그램 ID'},{k:'sns_kakao',l:'카카오 오픈채팅'}].map(f=>(
            <div key={f.k}><label className="text-[12px] font-bold text-slate-500 block mb-1.5">{f.l}</label>
              <input value={biz[f.k]||''} onChange={e=>upd(f.k,e.target.value)} className={fs}/></div>))}
          <div><label className="text-[12px] font-bold text-slate-500 block mb-1.5">카테고리</label>
            <select value={biz.category_main||''} onChange={e=>upd('category_main',e.target.value)} className={fs+' bg-white'}>
              {cats.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="text-[12px] font-bold text-slate-500 block mb-1.5">소개글</label>
            <textarea value={biz.description_kr||''} onChange={e=>upd('description_kr',e.target.value)} rows={4} className={fs+' resize-none'}/></div>
        </div>
        <button onClick={save} disabled={loading} className="w-full bg-indigo-600 text-white rounded-xl py-4 text-[15px] font-bold disabled:opacity-60">
          {loading?'저장 중...':'저장하기'}
        </button>
      </div>
    </div>
  )
}