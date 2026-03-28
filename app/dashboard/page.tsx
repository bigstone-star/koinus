'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export default function Dashboard() {
  const [user,setUser]=useState<any>(null)
  const [biz,setBiz]=useState<any>(null)
  const [sub,setSub]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [msg,setMsg]=useState('')
  useEffect(()=>{
    const p=new URLSearchParams(location.search)
    if(p.get('login')==='success')setMsg('✅ 로그인 성공!')
    if(p.get('success')==='true')setMsg('🎉 VIP 플랜 시작!')
    setTimeout(()=>setMsg(''),4000)
    sb.auth.getUser().then(async({data})=>{
      if(!data.user){window.location.href='/auth/login';return}
      setUser(data.user)
      const{data:b}=await sb.from('businesses').select('*').eq('owner_id',data.user.id).single()
      setBiz(b)
      if(b){const{data:s}=await sb.from('subscriptions').select('*').eq('business_id',b.id).eq('status','active').single();setSub(s)}
      setLoading(false)
    })
  },[])
  const signOut=async()=>{await sb.auth.signOut();window.location.href='/'}
  if(loading)return<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
  return(
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-12 pb-6 flex items-center justify-between">
        <div><h1 className="text-[18px] font-bold text-white">대시보드</h1><p className="text-[12px] text-white/50 mt-0.5">{user?.email}</p></div>
        <button onClick={signOut} className="text-white/40 text-[12px] border border-white/20 px-3 py-1.5 rounded-lg">로그아웃</button>
      </div>
      <div className="px-4 py-4 space-y-4">
        {msg&&<div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[14px] font-bold text-green-700">{msg}</div>}
        {!biz?(
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <div className="text-[16px] font-bold text-slate-700 mb-2">등록된 업소가 없습니다</div>
            <a href="/register" className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl text-[14px] mt-2">업소 등록하기</a>
          </div>
        ):(
          <>
            <div className={`rounded-xl p-4 ${sub?'bg-amber-50 border border-amber-200':'bg-white border border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-slate-500 mb-1">구독 플랜</div>
                  {sub?<div className="text-[20px] font-extrabold text-amber-700">⭐ {sub.tier?.toUpperCase()} 플랜</div>
                      :<div className="text-[16px] font-bold text-slate-700">무료 플랜</div>}
                </div>
                <a href="/pricing" className={`px-4 py-2.5 rounded-lg text-[13px] font-bold ${sub?'bg-amber-100 text-amber-700':'bg-indigo-600 text-white'}`}>
                  {sub?'플랜 변경':'VIP 시작'}
                </a>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-700">내 업소</h2>
                <a href="/dashboard/profile" className="text-[12px] text-indigo-600 font-bold">✏️ 수정</a>
              </div>
              <div className="font-bold text-slate-800 text-[16px]">{biz.name_kr||biz.name_en}</div>
              <div className="text-[12px] text-slate-400 mt-0.5">{biz.category_main}</div>
              {biz.phone&&<div className="text-[12px] text-slate-500 mt-1">📞 {biz.phone}</div>}
              {!biz.approved&&<div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-[11px] text-yellow-700 font-bold">⏳ 관리자 검토 중</div>}
            </div>
            {!sub&&<a href="/pricing" className="block bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 text-center">
              <div className="text-white font-bold text-[15px]">⭐ VIP로 업그레이드하면</div>
              <div className="text-white/70 text-[12px] mt-1">카테고리 최상단 노출 · 소개글 · 통계</div>
              <div className="mt-3 bg-white/20 text-white text-[13px] font-bold px-5 py-2 rounded-lg inline-block">14일 무료 체험 →</div>
            </a>}
          </>
        )}
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          <a href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3.5"><span className="text-xl">✏️</span><span className="text-[14px] font-bold text-slate-700 flex-1">업소 정보 수정</span><span className="text-slate-300">›</span></a>
          <a href="/pricing" className="flex items-center gap-3 px-4 py-3.5"><span className="text-xl">⭐</span><span className="text-[14px] font-bold text-slate-700 flex-1">VIP 요금제</span><span className="text-slate-300">›</span></a>
        </div>
      </div>
    </div>
  )
}