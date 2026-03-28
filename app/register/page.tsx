'use client'
import { useState, useEffect } from 'react'
import { createBrowser, CATEGORIES } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const supabase = createBrowser()
const CATS = CATEGORIES.filter(c => c.name !== '전체')

export default function RegisterPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name_kr: '', name_en: '', category_main: '', category_sub: '',
    address: '', phone: '', website: '', description_kr: '',
    sns_instagram: '', sns_kakao: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login')
      else setUser(data.user)
    })
  }, [router])

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name_kr && !form.name_en) { alert('업소명을 입력해주세요'); return }
    if (!form.category_main) { alert('카테고리를 선택해주세요'); return }
    setLoading(true)
    const { error } = await supabase.from('businesses').insert({
      place_id: `user_${Date.now()}_${user.id.slice(0, 8)}`,
      name_kr: form.name_kr || null, name_en: form.name_en || null,
      category_main: form.category_main, category_sub: form.category_sub || null,
      address: form.address || null, city: 'Houston', state: 'TX',
      phone: form.phone || null, website: form.website || null,
      description_kr: form.description_kr || null,
      sns_instagram: form.sns_instagram || null, sns_kakao: form.sns_kakao || null,
      owner_id: user.id, is_active: true, approved: false, is_vip: false,
      data_source: 'user_registered',
    })
    setLoading(false)
    if (error) { alert('등록 실패: ' + error.message); return }
    setStep(3)
  }

  if (!user) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 max-w-lg mx-auto">
      <header className="bg-[#1a1a2e] px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/60 text-2xl">←</button>
        <div>
          <h1 className="text-[18px] font-extrabold text-white">업소 등록</h1>
          <p className="text-[11px] text-white/40">무료 등록 후 VIP 업그레이드 가능</p>
        </div>
      </header>

      {step < 3 && (
        <div className="bg-white px-5 py-3 flex gap-2 border-b border-slate-200">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full text-[12px] font-bold flex items-center justify-center ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{s}</div>
              <span className={`text-[12px] font-bold ${step >= s ? 'text-indigo-600' : 'text-slate-400'}`}>{s === 1 ? '기본 정보' : '상세 정보'}</span>
              {s < 2 && <div className="w-8 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-5">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 space-y-4">
              <h2 className="font-bold text-slate-700 text-[15px]">기본 정보</h2>
              {[
                { key: 'name_kr', label: '업소명 (한국어)', placeholder: '고려원 한식당' },
                { key: 'name_en', label: '업소명 (영어)', placeholder: 'Korea Garden Restaurant' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[12px] font-bold text-slate-500 block mb-1.5">{f.label}</label>
                  <input value={form[f.key as keyof typeof form]} onChange={e => upd(f.key, e.target.value)}
                    placeholder={f.placeholder} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400" />
                </div>
              ))}
              <div>
                <label className="text-[12px] font-bold text-slate-500 block mb-1.5">카테고리 *</label>
                <select value={form.category_main} onChange={e => upd('category_main', e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400 bg-white">
                  <option value="">카테고리 선택</option>
                  {CATS.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-500 block mb-1.5">세부 업종</label>
                <input value={form.category_sub} onChange={e => upd('category_sub', e.target.value)}
                  placeholder="예: 한식당, 내과, 형사법" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-500 block mb-1.5">전화번호</label>
                <input value={form.phone} onChange={e => upd('phone', e.target.value)}
                  placeholder="(713) 000-0000" type="tel" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-500 block mb-1.5">주소</label>
                <input value={form.address} onChange={e => upd('address', e.target.value)}
                  placeholder="9501 Long Point Rd, Houston, TX 77055" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400" />
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!form.category_main}
              className="w-full bg-indigo-600 text-white rounded-xl py-4 text-[15px] font-bold disabled:opacity-50">
              다음 단계 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 space-y-4">
              <h2 className="font-bold text-slate-700 text-[15px]">상세 정보 (선택)</h2>
              <div>
                <label className="text-[12px] font-bold text-slate-500 block mb-1.5">웹사이트</label>
                <input value={form.website} onChange={e => upd('website', e.target.value)}
                  placeholder="https://yourwebsite.com" type="url" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-500 block mb-1.5">소개글</label>
                <textarea value={form.description_kr} onChange={e => upd('description_kr', e.target.value)}
                  placeholder="업소 소개를 입력해주세요 (Pro/Premium 플랜에서 노출됩니다)" rows={4}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-500 block mb-1.5">📸 인스타그램 아이디</label>
                <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400">
                  <span className="px-3 text-slate-400 text-[14px]">@</span>
                  <input value={form.sns_instagram} onChange={e => upd('sns_instagram', e.target.value)}
                    placeholder="instagram_id" className="flex-1 py-3 pr-4 text-[14px] outline-none bg-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="text-[13px] font-bold text-amber-800 mb-2">⭐ VIP로 업그레이드하면?</div>
              <ul className="text-[12px] text-amber-700 space-y-1">
                <li>• 카테고리 최상단 노출 (Pro $49/월~)</li>
                <li>• 소개글, 사진, SNS 링크 노출</li>
                <li>• 14일 무료 체험 가능</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border-2 border-slate-200 text-slate-600 rounded-xl py-4 text-[15px] font-bold">← 이전</button>
              <button onClick={submit} disabled={loading}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-4 text-[15px] font-bold disabled:opacity-60">
                {loading ? '등록 중...' : '업소 등록 완료'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-[22px] font-extrabold text-slate-800 mb-2">등록 완료!</h2>
            <p className="text-[14px] text-slate-500 mb-6">업소가 성공적으로 등록됐습니다.<br />VIP 업그레이드로 더 많은 고객을 만나보세요!</p>
            <div className="space-y-3">
              <a href="/pricing" className="block bg-amber-500 text-white rounded-xl py-4 text-[15px] font-bold">⭐ VIP 업그레이드 (14일 무료)</a>
              <a href="/dashboard" className="block bg-white border-2 border-slate-200 text-slate-700 rounded-xl py-4 text-[15px] font-bold">대시보드로 이동</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}