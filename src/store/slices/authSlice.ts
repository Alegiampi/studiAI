import { StateCreator } from 'zustand'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import type { ProfileSlice } from './profileSlice'
import type { UsageSlice } from './usageSlice'
import type { ExerciseSlice } from './exerciseSlice'

const supabase = createClient()

export interface AuthSlice {
  user: User | null
  authLoading: boolean
  setSession: (sessionUser: User | null) => void
  setAuthLoading: (loading: boolean) => void
  logout: () => Promise<void>
  initAuth: () => () => void
}

export type StoreApi = AuthSlice & ProfileSlice & UsageSlice & ExerciseSlice

export const createAuthSlice: StateCreator<StoreApi, [], [], AuthSlice> = (set, get) => ({
  user: null,
  authLoading: true,
  setSession: (sessionUser) => set({ user: sessionUser }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profilo: {}, isPremium: false })
  },
  initAuth: () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('loggedin')) {
        supabase.auth.refreshSession().then(() => {
          window.history.replaceState({}, '', '/')
        })
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      set({ user: currentUser, authLoading: false })
      if (currentUser) {
        get().fetchProfile()
        get().fetchUsage()
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      set({ user: currentUser, authLoading: false })
      if (currentUser) {
        get().fetchProfile()
        get().fetchUsage()
      }
    })

    return () => subscription.unsubscribe()
  },
})
