import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRICE_IDS: Record<string, string> = {
  'basic-monthly':   process.env.STRIPE_BASIC_MONTHLY   || '',
  'pro-monthly':     process.env.STRIPE_PRO_MONTHLY     || '',
  'premium-monthly': process.env.STRIPE_PREMIUM_MONTHLY || '',
  'basic-yearly':    process.env.STRIPE_BASIC_YEARLY    || '',
  'pro-yearly':      process.env.STRIPE_PRO_YEARLY      || '',
  'premium-yearly':  process.env.STRIPE_PREMIUM_YEARLY  || '',
}

export async function POST(req: NextRequest) {
  try {
    const { tier, billing, businessId, userId } = await req.json()

    // 입력값 검증
    if (!tier || !billing || !businessId || !userId) {
      return NextResponse.json({ error: '필수 정보가 없습니다' }, { status: 400 })
    }

    // 유저 존재 확인
    const { data: profile } = await sb
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single()
    if (!profile) {
      return NextResponse.json({ error: '유저를 찾을 수 없습니다' }, { status: 401 })
    }

    // Price ID 확인
    const priceKey = tier + '-' + billing
    const priceId = PRICE_IDS[priceKey]
    if (!priceId) {
      return NextResponse.json({ error: '잘못된 플랜입니다: ' + priceKey }, { status: 400 })
    }

    // Stripe Checkout 세션 생성 (14일 무료 체험 포함)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { businessId, userId, tier, billing },
      },
      metadata: { businessId, userId, tier, billing },
      success_url: process.env.NEXT_PUBLIC_URL + '/dashboard?success=true&tier=' + tier,
      cancel_url: process.env.NEXT_PUBLIC_URL + '/pricing?cancelled=true',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
