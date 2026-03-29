import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const obj = event.data.object as any
  const meta = obj.metadata || {}
  const { businessId, userId, tier } = meta

  try {
    // 1. 체크아웃 완료 - 14일 무료체험 시작
    if (event.type === 'checkout.session.completed') {
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      await sb.from('subscriptions').upsert({
        business_id: businessId,
        user_id: userId,
        stripe_subscription_id: obj.subscription,
        stripe_customer_id: obj.customer,
        tier: tier,
        status: 'trialing',
        current_period_end: trialEnd.toISOString(),
        amount: tier === 'basic' ? 2900 : tier === 'pro' ? 4900 : 7900,
      }, { onConflict: 'business_id' })
      await sb.from('businesses').update({
        is_vip: true, vip_tier: tier, vip_expires_at: trialEnd.toISOString(),
      }).eq('id', businessId)
    }

    // 2. 정기 결제 성공
    if (event.type === 'invoice.payment_succeeded') {
      const subId = obj.subscription
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId)
        const periodEnd = new Date(sub.current_period_end * 1000)
        const bizId = sub.metadata?.businessId || businessId
        await sb.from('subscriptions').update({
          status: 'active', current_period_end: periodEnd.toISOString(),
        }).eq('stripe_subscription_id', subId)
        await sb.from('businesses').update({
          is_vip: true, vip_expires_at: periodEnd.toISOString(),
        }).eq('id', bizId)
      }
    }

    // 3. 결제 실패
    if (event.type === 'invoice.payment_failed') {
      const subId = obj.subscription
      if (subId) {
        await sb.from('subscriptions').update({ status: 'past_due' })
          .eq('stripe_subscription_id', subId)
      }
    }

    // 4. 구독 취소
    if (event.type === 'customer.subscription.deleted') {
      const bizId = obj.metadata?.businessId || businessId
      await sb.from('subscriptions').update({ status: 'cancelled' })
        .eq('stripe_subscription_id', obj.id)
      await sb.from('businesses').update({
        is_vip: false, vip_tier: null, vip_expires_at: null,
      }).eq('id', bizId)
    }

    // 5. 플랜 변경
    if (event.type === 'customer.subscription.updated') {
      const newTier = obj.metadata?.tier
      const bizId = obj.metadata?.businessId || businessId
      const status = obj.status === 'trialing' ? 'trialing' : obj.status === 'active' ? 'active' : 'past_due'
      await sb.from('subscriptions').update({ status, tier: newTier })
        .eq('stripe_subscription_id', obj.id)
      if (newTier) {
        await sb.from('businesses').update({ vip_tier: newTier }).eq('id', bizId)
      }
    }

  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
