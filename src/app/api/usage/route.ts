import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { DAILY_LIMIT } from '@/lib/rate-limit'

function getAdminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0, isPremium: false, isAdmin: false, isLimited: false })

  const isAdmin = getAdminEmails().includes(user.email ?? '')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single()

  const isPremium = profile?.is_premium ?? false

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('daily_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  const count = data?.count ?? 0
  const isLimited = !isAdmin && !isPremium && count >= DAILY_LIMIT

  return NextResponse.json({ count, isPremium, isAdmin, isLimited })
}

export async function POST() {
  const supabase = await createSupabaseServerClient()
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
    return NextResponse.json({ count: updated?.count ?? 0 })
  } else {
    await supabase
      .from('daily_usage')
      .insert({ user_id: user.id, date: today, count: 1 })
    return NextResponse.json({ count: 1 })
  }
}
