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
    .select('onboarding_done, scuola, classe, materie')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    onboarding_done: data?.onboarding_done || false,
    scuola: data?.scuola || null,
    classe: data?.classe || null,
    materie: data?.materie || []
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
    .update({
      onboarding_done: body.onboarding_done ?? true,
      scuola: body.scuola,
      classe: body.classe,
      materie: body.materie
    })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
