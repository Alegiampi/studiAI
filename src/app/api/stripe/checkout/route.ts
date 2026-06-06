import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CheckoutSchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
  const parsed = CheckoutSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Richiesta non valida', details: parsed.error.issues }, { status: 400 })
  }
  const { priceId } = parsed.data

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=cancelled`,
    customer_email: user.email,
    metadata: { user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
