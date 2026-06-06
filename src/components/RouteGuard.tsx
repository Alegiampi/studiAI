'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { Loader2 } from 'lucide-react'

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  const { 
    user, 
    authLoading, 
    showOnboarding, 
    showPersonalizzazione, 
    initAuth 
  } = useStore()

  // Inizializza l'ascoltatore di auth Supabase una sola volta
  useEffect(() => {
    const unsubscribe = initAuth()
    return () => {
      unsubscribe()
    }
  }, [initAuth])

  useEffect(() => {
    if (authLoading) return

    // Definiamo le rotte pubbliche
    const isPublicRoute = pathname === '/' || pathname.startsWith('/s/')

    if (!user) {
      // Se non loggato e tenta di accedere ad una rotta privata
      if (!isPublicRoute) {
        router.replace('/')
      }
    } else {
      // Se loggato
      if (showOnboarding) {
        if (pathname !== '/onboarding') {
          router.replace('/onboarding')
        }
      } else if (showPersonalizzazione) {
        if (pathname !== '/personalize') {
          router.replace('/personalize')
        }
      } else {
        // Se onboarding e personalizzazione completati, impedisci l'accesso a rotte di configurazione o login
        if (pathname === '/' || pathname === '/onboarding' || pathname === '/personalize') {
          router.replace('/home')
        }
      }
    }
  }, [user, authLoading, showOnboarding, showPersonalizzazione, pathname, router])

  // Mostriamo un loader durante il caricamento dell'autenticazione su rotte private
  const isPublicRoute = pathname === '/' || pathname.startsWith('/s/')
  if (authLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <div className="text-foreground-muted font-medium text-sm animate-pulse">Caricamento in corso...</div>
      </div>
    )
  }

  return <>{children}</>
}
