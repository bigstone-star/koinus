import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  let q = sb.from('businesses').select('*').eq('is_active', true)
  const cat = searchParams.get('category')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'rating'
  if (cat && cat !== '전체') q = q.eq('category_main', cat)
  if (search) q = q.or('name_en.ilike.%' + search + '%,name_kr.ilike.%' + search + '%')
  q = q.order('is_vip', { ascending: false })
  if (sort === 'name_en') q = q.order('name_en', { ascending: true })
  else q = q.order(sort as any, { ascending: false, nullsFirst: false })
  const { data, error } = await q.limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}