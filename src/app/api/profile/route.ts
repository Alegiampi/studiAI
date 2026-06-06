import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ProfileSchema } from '@/lib/schemas'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ onboarding_done: false })

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_done, scuola, classe, materie, is_premium')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    onboarding_done: data?.onboarding_done ?? false,
    scuola: data?.scuola || null,
    classe: data?.classe || null,
    materie: data?.materie || [],
    is_premium: data?.is_premium || false,
  })
}

export async function POST(req: NextRequest) {
  const parsed = ProfileSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Richiesta non valida', details: parsed.error.issues }, { status: 400 })
  }
  const body = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const updateData: {
    id: string
    onboarding_done?: boolean
    scuola?: string
    classe?: string
    materie?: string[]
  } = { id: user.id }
  if (body.onboarding_done !== undefined) updateData.onboarding_done = body.onboarding_done
  else updateData.onboarding_done = true

  if (body.scuola !== undefined) updateData.scuola = body.scuola
  if (body.classe !== undefined) updateData.classe = body.classe
  if (body.materie !== undefined) updateData.materie = body.materie

  const { error } = await supabase
    .from('profiles')
    .upsert(updateData, { onConflict: 'id' })
    .select()

  if (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
