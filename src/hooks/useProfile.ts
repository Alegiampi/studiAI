import { useState, useEffect, useCallback } from 'react'

type Profilo = {
  scuola?: string
  classe?: string
  materie?: string[]
}

const EMPTY_PROFILE: Profilo = {}

export function useProfile(user: any) {
  const [rawProfile, setRawProfile] = useState<Profilo>(EMPTY_PROFILE)
  const [rawIsPremium, setRawIsPremium] = useState(false)
  const [rawShowOnboarding, setRawShowOnboarding] = useState(false)
  const [rawShowPersonalizzazione, setRawShowPersonalizzazione] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!user) return

    const d = await fetch('/api/profile').then(r => r.json())
    if (!d.onboarding_done) setRawShowOnboarding(true)
    if (!d.scuola) setRawShowPersonalizzazione(true)
    setRawProfile({ scuola: d.scuola, classe: d.classe, materie: d.materie })
    setRawIsPremium(d.is_premium ?? false)
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile()
  }, [fetchProfile])

  // Derived state: quando user cambia, i valori tornano ai default
  const profilo = user ? rawProfile : EMPTY_PROFILE
  const isPremium = user ? rawIsPremium : false
  const showOnboarding = user ? rawShowOnboarding : false
  const showPersonalizzazione = user ? rawShowPersonalizzazione : false

  return {
    profilo,
    setProfilo: setRawProfile,
    isPremium,
    setIsPremium: setRawIsPremium,
    showOnboarding,
    setShowOnboarding: setRawShowOnboarding,
    showPersonalizzazione,
    setShowPersonalizzazione: setRawShowPersonalizzazione
  }
}
