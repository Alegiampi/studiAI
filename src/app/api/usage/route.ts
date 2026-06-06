import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { DAILY_LIMIT, checkBurstLimit } from '@/lib/rate-limit'

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
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ count: 0 })

    if (!checkBurstLimit(`usage:${user.id}`)) {
      return NextResponse.json({ count: 0 }, { status: 429 })
    }

    const { data: count } = await supabase.rpc('increment_daily_usage', { p_user_id: user.id })
    return NextResponse.json({ count: count ?? 0 })
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e)
    console.error('[usage POST]', errMsg)
    return NextResponse.json({ count: 0 })
  }
}
