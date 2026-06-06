import { StateCreator } from 'zustand'
import { createClient } from '@/lib/supabase'
import type { AuthSlice } from './authSlice'
import type { UsageSlice } from './usageSlice'
import type { ExerciseSlice } from './exerciseSlice'

const supabase = createClient()

export type Profilo = {
  scuola?: string
  classe?: string
  materie?: string[]
}

export interface ProfileSlice {
  profilo: Profilo
  isPremium: boolean
  showOnboarding: boolean
  showPersonalizzazione: boolean
  setProfilo: (p: Profilo) => void
  setIsPremium: (isPremium: boolean) => void
  setShowOnboarding: (show: boolean) => void
  setShowPersonalizzazione: (show: boolean) => void
  fetchProfile: () => Promise<void>
  saveProfile: (nome: string, profileData: { scuola: string; classe: string; materie: string[]; onboarding_done?: boolean }) => Promise<void>
}

export type StoreApi = AuthSlice & ProfileSlice & UsageSlice & ExerciseSlice

const EMPTY_PROFILE: Profilo = {}

export const createProfileSlice: StateCreator<StoreApi, [], [], ProfileSlice> = (set, get) => ({
  profilo: EMPTY_PROFILE,
  isPremium: false,
  showOnboarding: false,
  showPersonalizzazione: false,
  setProfilo: (p) => set({ profilo: p }),
  setIsPremium: (isPremium) => set({ isPremium }),
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  setShowPersonalizzazione: (show) => set({ showPersonalizzazione: show }),
  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      const d = await fetch('/api/profile').then(r => r.json())
      set({
        showOnboarding: !d.onboarding_done,
        showPersonalizzazione: !d.scuola,
        profilo: { scuola: d.scuola, classe: d.classe, materie: d.materie },
        isPremium: d.is_premium ?? false
      })
    } catch (e) {
      console.error('Error fetching profile:', e)
    }
  },
  saveProfile: async (nome, profileData) => {
    const { user } = get()
    if (!user) return

    if (nome.trim() && nome.trim() !== (user?.user_metadata?.full_name || user?.user_metadata?.name)) {
      await supabase.auth.updateUser({ data: { full_name: nome.trim() } })
    }

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    })

    if (res.ok) {
      await get().fetchProfile()
    } else {
      throw new Error('Impossibile salvare il profilo')
    }
  },
})
