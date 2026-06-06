import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook invalido' }, { status: 400 })
  }

  // Pagamento iniziale completato → attiva premium
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    if (userId) {
      await supabase.from('profiles').update({
        is_premium: true,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      }).eq('id', userId)
    }
  }

  // Rinnovo mensile/annuale → mantieni premium attivo
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id
    if (subscriptionId) {
      await supabase.from('profiles')
        .update({ is_premium: true })
        .eq('stripe_subscription_id', subscriptionId)
    }
  }

  // Pagamento fallito → rimuovi premium
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id
    if (subscriptionId) {
      await supabase.from('profiles')
        .update({ is_premium: false })
        .eq('stripe_subscription_id', subscriptionId)
    }
  }

  // Abbonamento cancellato → rimuovi premium
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase.from('profiles')
      .update({ is_premium: false })
      .eq('stripe_subscription_id', subscription.id)
  }

  return NextResponse.json({ ok: true })
}