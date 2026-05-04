import { useState } from 'react'

export type Screen = 'home' | 'explanation' | 'paywall' | 'storico' | 'profilo'

export function useNavigation() {
  const [screen, setScreen] = useState<Screen>('home')
  const [showAuth, setShowAuth] = useState(false)

  function goHome() {
    setScreen('home')
  }

  return {
    screen,
    setScreen,
    showAuth,
    setShowAuth,
    goHome
  }
}
