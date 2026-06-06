import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ShareSchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
  const parsed = ShareSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Richiesta non valida', details: parsed.error.issues }, { status: 400 })
  }
  const { question, explanation, scuola, classe, grafico } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data, error } = await supabase
    .from('shared_explanations')
    .insert({ question, explanation, scuola, classe, grafico })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id })
}
