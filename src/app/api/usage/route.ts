import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('daily_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return NextResponse.json({ count: data?.count || 0 })
}

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existing) {
    const { data: updated } = await supabase
      .from('daily_usage')
      .update({ count: existing.count + 1 })
      .eq('user_id', user.id)
      .eq('date', today)
      .select('count')
      .single()
    return NextResponse.json({ count: updated?.count || 0 })
  } else {
    await supabase
      .from('daily_usage')
      .insert({ user_id: user.id, date: today, count: 1 })
    return NextResponse.json({ count: 1 })
  }
}
