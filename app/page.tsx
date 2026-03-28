'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, CATEGORIES, CAT_ICONS, CAT_BG, type Business } from '@/lib/supabase'
import { Heart, Phone, Globe, Star, Search } from 'lucide-react'

function CategoryGrid({ selected, onSelect, counts }) {
  return (
    <div className="bg-white border-b border-slate-200 px-3.5 py-3.5">
      <div className="text-[11px] font-bold text-slate-400 tracking-widest mb-2.5">카테고리</div>
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat.name} onClick={() => onSelect(cat.name)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-[1.5px] transition-all active:scale-[.97] text-left ${
              selected === cat.name ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'
            }`}>
            <span className="text-[21px] w-6 text-center flex-shrink-0">{cat.icon}</span>
            <span className="min-w-0">
              <span className={`text-[13px] font-bold block truncate ${selected === cat.name ? 'text-indigo-600' : 'text-slate-800'}`}>{cat.name}</span>
              <span className={`text-[10px] block mt-0.5 ${selected === cat.name ? 'text-indigo-400' : 'text-slate-400'}`}>{counts[cat.name] ?? 0}개</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BusinessCard({ b, fav, onFav, onClick }) {
  const addrShort = b.address?.split(',').slice(0,-2).join(',').trim() ?? b.address
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border px-4 py-3.5 flex gap-3 cursor-pointer active:scale-[.99] transition-all ${b.is_vip ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200'}`}>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${CAT_BG[b.category_main] ?? 'bg-slate-50'}`}>{CAT_ICONS[b.category_main] ?? '📋'}</div>
      <div className="flex-1 min-w-0">
        {(b.is_vip || b.category_sub) && (
          <div className="flex gap-1 mb-1 flex-wrap">
            {b.is_vip && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-amber-800 ${b.vip_tier==='premium'?'bg-amber-400':b.vip_tier==='pro'?'bg-amber-300':'bg-amber-200'}`}>⭐ {(b.vip_tier??'').toUpperCase()}</span>}
            {b.category_sub && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{b.category_sub}</span>}
          </div>
        )}
        <div className="text-[16px] font-bold text-slate-900 truncate">{b.name_kr || b.name_en}</div>
        {addrShort && <div className="text-[12px] text-slate-500 truncate mt-0.5">{addrShort}</div>}
        <div className="flex items-center gap-2.5 mt-1 flex-wrap">
          {b.rating > 0 && <span className="flex items-center gap-0.5 text-[12px] font-bold text-slate-800"><Star size={11} className="fill-amber-400 stroke-amber-400" />{b.rating.toFixed(1)}<span className="text-[11px] font-normal text-slate-400 ml-0.5">({b.review_count?.toLocaleString()})</span></span>}
          {b.phone && <span className="text-[12px] font-bold text-indigo-600">{b.phone}</span>}
        </div>
      </div>
      <button className="flex-shrink-0 self-start pt-0.5" onClick={e=>{e.stopPropagation();onFav()}}>
        <Heart size={20} className={fav ? 'fill-red-500 stroke-red-500' : 'stroke-slate-300'} />
      </button>
    </div>
  )
}

function BusinessDrawer({ b, fav, onFav, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto pb-8">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3.5" />
        <div className="px-5 pt-4 pb-3.5 border-b border-slate-100">
          <span className="text-[12px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{b.category_main}{b.category_sub ? ` · ${b.category_sub}` : ''}</span>
          <div className="text-[22px] font-extrabold text-slate-900 mt-2 leading-tight">{b.name_kr || b.name_en}</div>
          {b.rating > 0 && <div className="flex items-center gap-2 mt-2"><span className="text-amber-400 text-[16px]">{'★'.repeat(Math.round(b.rating))}</span><span className="text-[16px] font-bold">{b.rating.toFixed(1)}</span><span className="text-[13px] text-slate-400">리뷰 {b.review_count?.toLocaleString()}개</span></div>}
        </div>
        <div className="px-5 py-3 space-y-0">
          {b.address && <div className="flex gap-3 py-3 border-b border-slate-50"><div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">📍</div><div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1">주소</div><div className="text-[14px] text-slate-800">{b.address}</div></div></div>}
          {b.phone && <div className="flex gap-3 py-3 border-b border-slate-50"><div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">📞</div><div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1">전화</div><a href={`tel:${b.phone}`} className="text-[14px] font-semibold text-indigo-600">{b.phone}</a></div></div>}
          {b.website && <div className="flex gap-3 py-3"><div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">🌐</div><div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1">웹사이트</div><a href={b.website} target="_blank" rel="noreferrer" className="text-[14px] font-semibold text-indigo-600">방문하기 →</a></div></div>}
        </div>
        <div className="flex gap-2 px-5 pt-2">
          {b.phone && <a href={`tel:${b.phone}`} className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl text-[14px] font-bold text-center flex items-center justify-center gap-2"><Phone size={16}/>전화하기</a>}
          {b.website && <a href={b.website} target="_blank" rel="noreferrer" className="flex-1 bg-indigo-50 text-indigo-600 py-3.5 rounded-xl text-[14px] font-bold text-center flex items-center justify-center gap-2"><Globe size={16}/>홈페이지</a>}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('전체')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('rating')
  const [selected, setSelected] = useState(null)
  const [favs, setFavs] = useState([])
  const [counts, setCounts] = useState({})
  const SORTS = ['rating','review_count','name_en']
  const SORT_LABELS = {rating:'평점순',review_count:'리뷰순',name_en:'이름순'}

  useEffect(() => {
    try { setFavs(JSON.parse(localStorage.getItem('kyocharo_favs')||'[]')) } catch {}
    supabase.from('businesses').select('category_main').eq('is_active',true).then(({data}) => {
      if (!data) return
      const c = {'전체': data.length}
      data.forEach(b => { c[b.category_main] = (c[b.category_main]||0)+1 })
      setCounts(c)
    })
  }, [])

  const fetchBusinesses = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('businesses').select('*').eq('is_active',true)
    if (category !== '전체') q = q.eq('category_main', category)
    if (search.trim()) q = q.or(`name_en.ilike.%${search}%,name_kr.ilike.%${search}%,address.ilike.%${search}%,category_sub.ilike.%${search}%`)
    q = q.order('is_vip',{ascending:false})
    if (sort==='name_en') { q = q.order('name_en',{ascending:true}) }
    else { q = q.order(sort,{ascending:false,nullsFirst:false}) }
    q = q.limit(300)
    const {data} = await q
    setBusinesses(data||[])
    setLoading(false)
  }, [category, search, sort])

  useEffect(() => { fetchBusinesses() }, [fetchBusinesses])

  const toggleFav = (id) => {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(f=>f!==id) : [...prev,id]
      localStorage.setItem('kyocharo_favs', JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto">
      <header className="bg-[#1a1a2e] sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <h1 className="text-[20px] font-extrabold text-white tracking-tight"><span className="text-amber-400">교차로</span> 휴스턴</h1>
            <p className="text-[11px] text-white/40 mt-0.5">Houston, TX · 한인 비즈니스 디렉토리</p>
          </div>
          <span className="text-[12px] font-bold text-amber-400 bg-amber-400/15 px-3 py-1 rounded-full">{businesses.length}개</span>
        </div>
        <div className="px-4 pb-3 flex gap-2">
          <div className="flex-1 bg-white/10 border border-white/15 rounded-lg flex items-center px-3 gap-2">
            <Search size={14} className="text-white/40 flex-shrink-0"/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="업소명, 업종, 주소 검색..." className="bg-transparent border-none outline-none text-white text-[14px] w-full py-2.5 placeholder:text-white/30"/>
          </div>
          <button onClick={()=>setSort(prev=>SORTS[(SORTS.indexOf(prev)+1)%SORTS.length])} className="bg-white/10 border border-white/15 rounded-lg px-3 text-[12px] font-bold text-white/70 whitespace-nowrap h-10">{SORT_LABELS[sort]}</button>
        </div>
      </header>
      <CategoryGrid selected={category} onSelect={setCategory} counts={counts}/>
      <main className="px-3 py-2.5 pb-24 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-[15px]">검색 결과가 없습니다</div>
        ) : businesses.map(b => (
          <BusinessCard key={b.id} b={b} fav={favs.includes(b.id)} onFav={()=>toggleFav(b.id)} onClick={()=>setSelected(b)}/>
        ))}
      </main>
      {selected && <BusinessDrawer b={selected} fav={favs.includes(selected.id)} onFav={()=>toggleFav(selected.id)} onClose={()=>setSelected(null)}/>}
    </div>
  )
}