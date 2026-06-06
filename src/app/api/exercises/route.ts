import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ExerciseCreateSchema, ExerciseUpdateSchema } from '@/lib/schemas'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const { data } = await supabase
    .from('exercises')
    .select('id, question, explanation, created_at, subject, is_favorite, shared_id')
    .eq('user_id', user.id)
    .order('is_favorite', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const parsed = ExerciseCreateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Richiesta non valida', details: parsed.error.issues }, { status: 400 })
  }
  const { question, explanation, subject } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not logged in' })

  const { data } = await supabase.from('exercises').insert({
    user_id: user.id,
    question,
    explanation,
    subject: subject || 'Altro',
  }).select().single()

  return NextResponse.json({ ok: true, data })
}

export async function PATCH(req: NextRequest) {
  const parsed = ExerciseUpdateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Richiesta non valida', details: parsed.error.issues }, { status: 400 })
  }
  const { id, is_favorite, shared_id } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'not logged in' }, { status: 401 })

  const updates: { is_favorite?: boolean; shared_id?: string } = {}
  if (is_favorite !== undefined) updates.is_favorite = is_favorite
  if (shared_id !== undefined) updates.shared_id = shared_id

  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    console.error('SUPABASE UPDATE ERROR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'No exercise found or not authorized' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, data: data[0] })
}
