import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ onboarding_done: false })

  const { data } = await supabase
    .from('profiles')
    .select('onboarding_done, scuola, classe, materie, is_premium')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
  onboarding_done: data?.onboarding_done || false,
  scuola: data?.scuola || null,
  classe: data?.classe || null,
  materie: data?.materie || [],
  is_premium: data?.is_premium || false  // ← aggiungi
})
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false })

  const body = await req.json()

  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      onboarding_done: body.onboarding_done ?? true,
      scuola: body.scuola,
      classe: body.classe,
      materie: body.materie
    }, { onConflict: 'id' })

  return NextResponse.json({ ok: true })
}