import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search   = searchParams.get('search')
  const sort     = searchParams.get('sort') || 'rating'
  const limit    = parseInt(searchParams.get('limit') || '200')

  let q = supabase.from('businesses').select('*').eq('is_active', true)
  if (category && category !== '전체') q = q.eq('category_main', category)
  if (search) q = q.or(`name_en.ilike.%${search}%,name_kr.ilike.%${search}%,address.ilike.%${search}%`)
  q = q.order('is_vip', { ascending: false })
  if (sort === 'name_en') { q = q.order('name_en', { ascending: true }) }
  else { q = q.order(sort as any, { ascending: false, nullsFirst: false }) }
  q = q.limit(limit)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}