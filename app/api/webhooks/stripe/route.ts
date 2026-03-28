import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const { businessId, userId, tier } = session.metadata!
      const subId = session.subscription as string
      const sub = await stripe.subscriptions.retrieve(subId)
      await admin.from('subscriptions').upsert({
        business_id: businessId, user_id: userId, tier, status: 'active',
        stripe_subscription_id: subId, stripe_customer_id: session.customer as string,
        amount: sub.items.data[0].price.unit_amount,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_subscription_id' })
      await admin.from('businesses').update({
        is_vip: true, vip_tier: tier, approved: true,
        vip_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('id', businessId)
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string
      const sub = await stripe.subscriptions.retrieve(subId)
      const businessId = sub.metadata?.businessId
      await admin.from('subscriptions').update({
        status: 'active',
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('stripe_subscription_id', subId)
      if (businessId) {
        await admin.from('businesses').update({
          vip_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('id', businessId)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const businessId = sub.metadata?.businessId
      await admin.from('subscriptions').update({ status: 'cancelled' }).eq('stripe_subscription_id', sub.id)
      if (businessId) {
        await admin.from('businesses').update({ is_vip: false, vip_tier: null }).eq('id', businessId)
      }
      break
    }
  }
  return NextResponse.json({ received: true })
}
