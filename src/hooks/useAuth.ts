import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('loggedin')) {
      supabase.auth.refreshSession().then(() => {
        window.history.replaceState({}, '', '/')
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return {
    user,
    authLoading,
    supabase,
    logout
  }
}
