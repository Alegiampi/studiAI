'use client'

import AuthModal from '@/components/AuthModal'
import HomeScreen from '@/components/screens/HomeScreen'
import StoricoScreen from '@/components/screens/StoricoScreen'
import OnboardingScreen from '@/components/screens/OnboardingScreen'
import PersonalizzazioneScreen from '@/components/screens/PersonalizzazioneScreen'
import ProfiloScreen from '@/components/screens/ProfiloScreen'
import PaywallScreen from '@/components/screens/PaywallScreen'
import ExplanationScreen from '@/components/screens/ExplanationScreen'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { usePayments, DAILY_LIMIT } from '@/hooks/usePayments'
import { useNavigation } from '@/hooks/useNavigation'
import { useExercises } from '@/hooks/useExercises'
import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'
import ToastContainer from '@/components/Toast'
import { useToast } from '@/hooks/ToastContext'

export default function Home() {
  const { showToast } = useToast()

  // Hook base: autenticazione
  const { user, authLoading, supabase, logout } = useAuth()

  // Hook navigazione
  const navigation = useNavigation()

  // Hook profilo (dipende da user)
  const profile = useProfile(user)

  // Hook pagamenti (dipende da user e isPremium)
  const payments = usePayments(user, profile.isPremium)

  // Hook esercizi (dipende da user, profilo, pagamenti e navigazione)
  const exercises = useExercises(
    user,
    profile.profilo,
    payments.incrementUsage,
    payments.isLimited,
    () => navigation.setScreen('paywall'),
    () => navigation.setScreen('explanation'),
    showToast
  )

  // Loading iniziale
  if (authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 size={40} className="text-primary animate-spin mb-4" />
      <div className="text-foreground-muted font-medium text-sm animate-pulse">Caricamento in corso...</div>
    </div>
  )

  // Utente non loggato — mostra schermata di login
  if (!user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Sfondo dinamico animato */}
      <motion.div 
        animate={{ 
          x: [0, 30, -20, 0], 
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          x: [0, -40, 30, 0], 
          y: [0, 30, -30, 0],
          scale: [1, 0.9, 1.1, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" 
      />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px] text-center z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-2xl">
            <Sparkles size={28} className="text-primary" />
          </div>
          <h1 className="text-[44px] font-extrabold tracking-tight flex items-baseline">
            <span className="font-light text-foreground/60">the</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground-muted">Lemma</span>
          </h1>
        </div>
        <p className="text-[16px] text-foreground-subtle mb-10 font-medium">Il tuo tutor intelligente 24/7</p>
        
        <AuthModal supabase={supabase} isEmbedded={true} />
      </motion.div>
    </div>
  )

  // Schermate di onboarding e personalizzazione
  if (profile.showOnboarding) return <OnboardingScreen onDone={() => profile.setShowOnboarding(false)} />
  if (profile.showPersonalizzazione) return <PersonalizzazioneScreen onDone={(p) => { profile.setProfilo(p); profile.setShowPersonalizzazione(false) }} user={user} />

  // Schermate secondarie
  if (navigation.screen === 'storico') return <StoricoScreen onBack={() => navigation.setScreen('home')} />
  if (navigation.screen === 'profilo') return (
    <ProfiloScreen 
      onBack={() => navigation.setScreen('home')} 
      profiloAttuale={profile.profilo} 
      user={user} 
      onSave={(p) => { profile.setProfilo(p); navigation.setScreen('home') }} 
      isPremium={profile.isPremium}
      onManageSubscription={payments.handlePortal}
    />
  )

  // Paywall
  if (navigation.screen === 'paywall') return (
    <PaywallScreen 
      usedToday={payments.usedToday} 
      DAILY_LIMIT={DAILY_LIMIT} 
      handleCheckout={payments.handleCheckout} 
      onBack={() => navigation.setScreen('home')} 
    />
  )

  // Schermata di spiegazione
  if (navigation.screen === 'explanation') return (
    <ExplanationScreen
      exerciseId={exercises.currentExerciseId}
      exercise={exercises.exercise}
      loading={exercises.loading}
      explanation={exercises.explanation}
      graficoUtile={exercises.graficoUtile}
      grafico={exercises.grafico}
      graficoLoading={exercises.graficoLoading}
      shareUrl={exercises.shareUrl}
      shareLoading={exercises.shareLoading}
      quoteIndex={exercises.quoteIndex}
      onBack={() => { navigation.setScreen('home'); exercises.resetExercise() }}
      handleGrafico={exercises.handleGrafico}
      handleShare={exercises.handleShare}
      isPremium={profile.isPremium}
      chatMessages={exercises.chatMessages}
      chatLoading={exercises.chatLoading}
      handleChatSubmit={exercises.handleChatSubmit}
      setScreen={navigation.setScreen}
    />
  )

   // Schermata principale (Home)
   return (
     <>
        <HomeScreen
       user={user}
       showAuth={navigation.showAuth}
       setShowAuth={navigation.setShowAuth}
       supabase={supabase}
       setScreen={navigation.setScreen}
       logout={logout}
       isLimited={payments.isLimited}
       remaining={payments.remaining}
       image={exercises.image}
       setImage={exercises.setImage}
       imageBase64={exercises.imageBase64}
       setImageBase64={exercises.setImageBase64}
       dragging={false}
       setDragging={() => {}}
       handleFile={exercises.handleFile}
       text={exercises.text}
       setText={exercises.setText}
       handleSubmit={exercises.handleSubmit}
       usedToday={payments.usedToday}
        isPremium={profile.isPremium}
      />
     </>
   )
 }
