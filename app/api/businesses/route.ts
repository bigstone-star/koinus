import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'rating'

  const supabase = createAdminClient()
  let q = supabase.from('businesses').select('*').eq('is_active', true)
  if (category && category !== '전체') q = q.eq('category_main', category)
  if (search) q = q.or(`name_en.ilike.%${search}%,name_kr.ilike.%${search}%`)
  q = q.order('is_vip', { ascending: false })
  if (sort === 'name_en') q = q.order('name_en', { ascending: true })
  else q = q.order(sort as any, { ascending: false, nullsFirst: false })
  q = q.limit(300)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
