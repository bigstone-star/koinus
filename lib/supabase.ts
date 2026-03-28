import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function createBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON)
}

export async function createServer() {
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cs: any[]) { cs.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options)) },
    },
  })
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export type Business = {
  id: string; place_id: string; name_en: string | null; name_kr: string | null;
  address: string | null; city: string; phone: string | null; website: string | null;
  category_main: string; category_sub: string | null; rating: number | null;
  review_count: number; is_vip: boolean; vip_tier: 'basic' | 'pro' | 'premium' | null;
  vip_expires_at: string | null; is_active: boolean; owner_id: string | null;
  description_kr: string | null; photo_url: string | null;
  sns_instagram: string | null; sns_kakao: string | null; approved: boolean;
}

export type UserProfile = {
  id: string; email: string | null; name: string | null; phone: string | null;
  avatar_url: string | null; role: 'user' | 'business_owner' | 'admin';
}

export type Subscription = {
  id: string; business_id: string; tier: 'basic' | 'pro' | 'premium';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_end: string | null; amount: number | null;
}

export const CATEGORIES = [
  { name: '전체', icon: '🏠' }, { name: '식당·카페', icon: '🍽️' },
  { name: '마트·식품', icon: '🛒' }, { name: '의료', icon: '🏥' },
  { name: '치과', icon: '🦷' }, { name: '법률', icon: '⚖️' },
  { name: '자동차', icon: '🚗' }, { name: '미용', icon: '💇' },
  { name: '교육', icon: '📚' }, { name: '금융·보험', icon: '💰' },
  { name: '커뮤니티', icon: '🏠' }, { name: '부동산', icon: '🏡' },
  { name: '세탁소', icon: '🧺' }, { name: '한의원', icon: '🌿' },
  { name: '기타', icon: '📋' },
]

export const CAT_ICONS: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.name, c.icon]))
export const CAT_BG: Record<string, string> = {
  '식당·카페': 'bg-orange-50', '마트·식품': 'bg-yellow-50', '의료': 'bg-blue-50',
  '치과': 'bg-emerald-50', '법률': 'bg-violet-50', '자동차': 'bg-amber-50',
  '미용': 'bg-pink-50', '교육': 'bg-green-50', '금융·보험': 'bg-sky-50',
  '커뮤니티': 'bg-slate-50', '부동산': 'bg-orange-50', '세탁소': 'bg-teal-50',
  '한의원': 'bg-lime-50', '기타': 'bg-slate-100',
}

export const PLANS = [
  { tier: 'basic' as const, name: 'Basic', price: 29, priceId: process.env.STRIPE_BASIC_MONTHLY || '',
    color: 'border-slate-200', badge: '',
    features: ['카테고리 상단 노출','BASIC 배지','업소 정보 관리','전화/지도/웹 버튼','월간 통계'] },
  { tier: 'pro' as const, name: 'Pro', price: 49, priceId: process.env.STRIPE_PRO_MONTHLY || '',
    color: 'border-indigo-500', badge: '인기',
    features: ['최상단 노출','PRO 배지+하이라이트','소개글 500자','사진 1장','주간 통계','SNS 연동'] },
  { tier: 'premium' as const, name: 'Premium', price: 79, priceId: process.env.STRIPE_PREMIUM_MONTHLY || '',
    color: 'border-amber-400', badge: '최고',
    features: ['전체 최상단','PREMIUM 골드 배지','소개글 무제한','사진 5장','실시간 통계','배너 노출','전용 담당자'] },
]