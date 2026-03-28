import { NextRequest, NextResponse } from 'next/server'
import { createBrowser, createAdminClient } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = createBrowser()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tier, priceId, businessId } = await req.json()

  if (!tier || !priceId || !businessId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: business } = await admin
    .from('businesses')
    .select('id, owner_id')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: '업소를 찾을 수 없습니다' }, { status: 403 })
  }

  try {
    const session = await createCheckoutSession({
      businessId,
      userId: user.id,
      tier,
      priceId,
      customerEmail: user.email!,
    })
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
