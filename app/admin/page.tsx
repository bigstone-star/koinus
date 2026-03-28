'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export default function AdminPage() {
  const [tab,setTab]=useState<'pending'|'vip'|'all'>('pending')
  const [list,setList]=useState<any[]>([])
  const [stats,setStats]=useState({total:0,vip:0,pending:0})
  const [loading,setLoading]=useState(true)
  const [ok,setOk]=useState(false)
  useEffect(()=>{
    sb.auth.getUser().then(async({data})=>{
      if(!data.user){window.location.href='/auth/login';return}
      const{data:p}=await sb.from('user_profiles').select('role').eq('id',data.user.id).single()
      if(p?.role!=='admin'){window.location.href='/';return}
      setOk(true);load()
    })
  },[])
  async function load(){
    setLoading(true)
    const[t,v,pd]=await Promise.all([
      sb.from('businesses').select('id',{count:'exact'}).eq('is_active',true),
      sb.from('businesses').select('id',{count:'exact'}).eq('is_vip',true),
      sb.from('businesses').select('id').eq('data_source','user_registered').eq('is_active',true),
    ])
    setStats({total:t.count||0,vip:v.count||0,pending:pd.data?.length||0})
    await loadList();setLoading(false)
  }
  async function loadList(){
    let q=sb.from('businesses').select('*').eq('is_active',true)
    if(tab==='pending')q=q.eq('data_source','user_registered')
    if(tab==='vip')q=q.eq('is_vip',true)
    const{data}=await q.order('created_at',{ascending:false}).limit(50)
    setList(data||[])
  }
  useEffect(()=>{if(ok)loadList()},[tab,ok])
  const approve=async(id:string)=>{await sb.from('businesses').update({approved:true}).eq('id',id);loadList()}
  const toggleVip=async(b:any)=>{await sb.from('businesses').update({is_vip:!b.is_vip,vip_tier:!b.is_vip?'pro':null}).eq('id',b.id);loadList();load()}
  const deactivate=async(id:string)=>{if(!confirm('비활성화?'))return;await sb.from('businesses').update({is_active:false}).eq('id',id);loadList();load()}
  if(!ok)return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
  return (
    <div className="min-h-screen bg-slate-100 max-w-2xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6 flex items-center justify-between">
        <div><h1 className="text-[22px] font-extrabold text-white">🛠 관리자</h1><p className="text-white/40 text-[12px] mt-0.5">교차로 휴스턴 운영 관리</p></div>
        <a href="/" className="text-white/40 text-[13px] border border-white/20 px-3 py-1.5 rounded-lg">홈</a>
      </div>
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        {[{l:'전체 업소',v:stats.total,c:'text-slate-700'},{l:'VIP 업소',v:stats.vip,c:'text-amber-600'},{l:'신규 등록',v:stats.pending,c:'text-red-500'}].map(s=>(
          <div key={s.l} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className={`text-[22px] font-extrabold ${s.c}`}>{s.v}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{s.l}</div>
          </div>))}
      </div>
      <div className="px-4 flex gap-2 mb-3">
        {([['pending','신규 대기'],['vip','VIP'],['all','전체']] as const).map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-lg text-[12px] font-bold ${tab===k?'bg-indigo-600 text-white':'bg-white border border-slate-200 text-slate-600'}`}>{l}</button>))}
        <button onClick={load} className="ml-auto px-3 py-2 rounded-lg text-[12px] font-bold bg-white border border-slate-200 text-slate-500">🔄</button>
      </div>
      <div className="px-4 space-y-2">
        {loading?<div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
        :list.length===0?<div className="bg-white rounded-xl p-8 text-center text-slate-400">항목 없음</div>
        :list.map(b=>(
          <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="font-bold text-slate-800 text-[14px] flex items-center gap-2 mb-1 flex-wrap">
              {b.name_kr||b.name_en}
              {b.is_vip&&<span className="text-[9px] font-black bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded">{b.vip_tier?.toUpperCase()}</span>}
              {!b.approved&&<span className="text-[9px] font-black bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">대기중</span>}
            </div>
            <div className="text-[11px] text-slate-400 mb-3">{b.category_main} · {b.phone||'-'}</div>
            <div className="flex gap-2 flex-wrap">
              {!b.approved&&<button onClick={()=>approve(b.id)} className="flex-1 bg-green-500 text-white text-[12px] font-bold py-2 rounded-lg min-w-[70px]">✅ 승인</button>}
              <button onClick={()=>toggleVip(b)} className={`flex-1 text-[12px] font-bold py-2 rounded-lg min-w-[70px] ${b.is_vip?'bg-red-50 text-red-600':'bg-amber-50 text-amber-700'}`}>{b.is_vip?'VIP 해제':'⭐ VIP 지정'}</button>
              <button onClick={()=>deactivate(b.id)} className="px-3 text-[12px] font-bold py-2 rounded-lg bg-slate-100 text-slate-500">🗑</button>
            </div>
          </div>))}
      </div>
    </div>
  )
}