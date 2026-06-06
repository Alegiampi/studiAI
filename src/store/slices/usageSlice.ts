import { StateCreator } from 'zustand'
import type { AuthSlice } from './authSlice'
import type { ProfileSlice } from './profileSlice'
import type { ExerciseSlice } from './exerciseSlice'

export const DAILY_LIMIT = 5

export interface UsageSlice {
  usedToday: number
  remaining: number
  isLimited: boolean
  fetchUsage: () => Promise<void>
  incrementUsage: () => Promise<void>
  handleCheckout: (priceId: string) => Promise<void>
  handlePortal: () => Promise<void>
}

export type StoreApi = AuthSlice & ProfileSlice & UsageSlice & ExerciseSlice

export const createUsageSlice: StateCreator<StoreApi, [], [], UsageSlice> = (set, get) => ({
  usedToday: 0,
  remaining: DAILY_LIMIT,
  isLimited: false,
  fetchUsage: async () => {
    const { user } = get()
    if (!user) return

    try {
      const d = await fetch('/api/usage').then(r => r.json())

      set({
        usedToday: d.count ?? 0,
        remaining: DAILY_LIMIT - (d.count ?? 0),
        isLimited: d.isLimited ?? false,
        isPremium: d.isPremium ?? false,
      })
    } catch (e) {
      console.error('Error fetching usage:', e)
    }
  },
  incrementUsage: async () => {
    const { user } = get()
    if (user) {
      try {
        const res = await fetch('/api/usage', { method: 'POST' })
        if (res.ok) await get().fetchUsage()
      } catch (err) {
        console.error(err)
      }
    }
  },
  handleCheckout: async (priceId) => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Error initiating checkout:', err)
    }
  },
  handlePortal: async () => {
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
  },
})
