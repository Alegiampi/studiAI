import { useState, useEffect, useCallback } from 'react'

export const DAILY_LIMIT = 5

export function usePayments(user: any, isPremium: boolean) {
  const [rawCount, setRawCount] = useState(0)

  const fetchUsage = useCallback(async () => {
    if (user) {
      const d = await fetch('/api/usage').then(r => r.json())
      setRawCount(d.count)
    }
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsage()
  }, [fetchUsage])

  const usedToday = user ? rawCount : 0

  const remaining = DAILY_LIMIT - usedToday

  // Admins non hanno limiti
  const admins = ['alegiampi@icloud.com', 'g79750797@gmail.com']
  const isAdmin = admins.includes(user?.email || '')

  async function incrementUsage() {
    if (user) {
      fetch('/api/usage', { method: 'POST' })
      setRawCount(prev => prev + 1)
    }
  }

  async function handleCheckout(priceId: string) {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  async function handlePortal() {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Errore portale:', err)
    }
  }

  return {
    usedToday,
    remaining,
    isLimited: !isAdmin && !isPremium && usedToday >= DAILY_LIMIT,
    incrementUsage,
    handleCheckout,
    handlePortal,
    isAdmin
  }
}
