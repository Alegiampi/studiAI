import type { SupabaseClient } from '@supabase/supabase-js'

export const DAILY_LIMIT = 5

const BURST_WINDOW_MS = 60_000
const BURST_MAX_REQUESTS = 20

function getAdminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || []
}

const burstMap = new Map<string, { count: number; resetAt: number }>()

export function checkBurstLimit(key: string): boolean {
  const now = Date.now()
  const entry = burstMap.get(key)

  if (!entry || now > entry.resetAt) {
    burstMap.set(key, { count: 1, resetAt: now + BURST_WINDOW_MS })
    return true
  }

  if (entry.count >= BURST_MAX_REQUESTS) return false

  entry.count++
  return true
}

export async function checkDailyLimit(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (userEmail && getAdminEmails().includes(userEmail)) {
    return { allowed: true, remaining: Infinity }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', userId)
    .single()

  if (profile?.is_premium) {
    return { allowed: true, remaining: Infinity }
  }

  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await supabase
    .from('daily_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const count = usage?.count ?? 0
  const remaining = DAILY_LIMIT - count

  if (count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining }
}

export async function incrementDailyUsage(supabase: SupabaseClient, userId: string) {
  await supabase.rpc('increment_daily_usage', { p_user_id: userId })
}
