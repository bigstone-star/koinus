import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Business = {
  id: string
  place_id: string
  name_en: string | null
  name_kr: string | null
  address: string | null
  city: string
  state: string
  phone: string | null
  website: string | null
  category_main: string
  category_sub: string | null
  rating: number | null
  review_count: number
  is_vip: boolean
  vip_tier: string | null
  is_active: boolean
}

export const CATEGORIES = [
  { name: '전체',    icon: '🏠', color: '#EEF2FF' },
  { name: '식당·카페', icon: '🍽️', color: '#FFF7ED' },
  { name: '마트·식품', icon: '🛒', color: '#FEF9C3' },
  { name: '의료',    icon: '🏥', color: '#EFF6FF' },
  { name: '치과',    icon: '🦷', color: '#ECFDF5' },
  { name: '법률',    icon: '⚖️', color: '#F5F3FF' },
  { name: '자동차',  icon: '🚗', color: '#FFFBEB' },
  { name: '미용',    icon: '💇', color: '#FDF2F8' },
  { name: '교육',    icon: '📚', color: '#F0FDF4' },
  { name: '금융·보험',icon: '💰', color: '#F0F9FF' },
  { name: '커뮤니티', icon: '🏠', color: '#F8FAFC' },
  { name: '부동산',  icon: '🏡', color: '#FFF7F0' },
  { name: '세탁소',  icon: '🧺', color: '#E0FFF4' },
  { name: '한의원',  icon: '🌿', color: '#F0FFF4' },
  { name: '기타',    icon: '📋', color: '#F1F5F9' },
]

export const CAT_ICONS: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.name, c.icon]))
export const CAT_BG: Record<string, string> = {
  '식당·카페':'bg-orange-50','마트·식품':'bg-yellow-50','의료':'bg-blue-50',
  '치과':'bg-emerald-50','법률':'bg-violet-50','자동차':'bg-amber-50',
  '미용':'bg-pink-50','교육':'bg-green-50','금융·보험':'bg-sky-50',
  '커뮤니티':'bg-slate-50','부동산':'bg-orange-50','세탁소':'bg-teal-50',
  '한의원':'bg-lime-50','기타':'bg-slate-100',
}