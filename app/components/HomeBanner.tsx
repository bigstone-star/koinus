'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Banner = {
  id: string
  title: string
  subtitle?: string
  image_url?: string
  link_url?: string
  position: string
}

export default function HomeBanner({ position = 'home_top' }: { position?: string }) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    sb.from('banners')
      .select('*')
      .eq('position', position)
      .eq('is_active', true)
      .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
      .then(({ data }) => { if (data && data.length > 0) setBanners(data) })
  }, [position])

  // 자동 슬라이드 (3초마다)
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 3000)
    return () => clearInterval(t)
  }, [banners.length])

  if (banners.length === 0) return null

  const b = banners[idx]

  const handleClick = async () => {
    // 클릭 카운트 증가
    await sb.rpc('increment_banner_click', { banner_id: b.id })
    if (b.link_url) window.open(b.link_url, '_blank')
  }

  return (
    <div className="mx-3 mb-2">
      <div
        onClick={handleClick}
        className="relative rounded-xl overflow-hidden cursor-pointer active:scale-[.99] transition-all"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        {b.image_url ? (
          <img src={b.image_url} alt={b.title} className="w-full h-[100px] object-cover" />
        ) : (
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-amber-400 mb-0.5">📢 광고</div>
              <div className="text-[15px] font-extrabold text-white">{b.title}</div>
              {b.subtitle && (
                <div className="text-[12px] text-white/60 mt-0.5">{b.subtitle}</div>
              )}
            </div>
            <div className="text-white/40 text-xl">›</div>
          </div>
        )}
        {/* 광고 표시 */}
        <div className="absolute top-2 right-2 bg-black/40 text-white/60 text-[9px] px-1.5 py-0.5 rounded">광고</div>
      </div>
      {/* 다수 배너 인디케이터 */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1 mt-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-indigo-500' : 'bg-slate-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
