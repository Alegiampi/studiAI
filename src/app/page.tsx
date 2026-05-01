'use client'

import AuthModal from '@/components/AuthModal'
import HomeScreen from '@/components/screens/HomeScreen'
import StoricoScreen from '@/components/screens/StoricoScreen'
import OnboardingScreen from '@/components/screens/OnboardingScreen'
import PersonalizzazioneScreen from '@/components/screens/PersonalizzazioneScreen'
import ProfiloScreen from '@/components/screens/ProfiloScreen'
import PaywallScreen from '@/components/screens/PaywallScreen'
import ExplanationScreen from '@/components/screens/ExplanationScreen'
import { useHomeLogic, DAILY_LIMIT } from '@/hooks/useHomeLogic'
import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'

export default function Home() {
  const { state, actions } = useHomeLogic()

  if (state.authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 size={40} className="text-primary animate-spin mb-4" />
      <div className="text-foreground-muted font-medium text-sm animate-pulse">Caricamento in corso...</div>
    </div>
  )

  if (!state.user) return (
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
          <h1 className="text-[44px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground-muted tracking-tight">StudiAI</h1>
        </div>
        <p className="text-[16px] text-foreground-subtle mb-10 font-medium">Il tuo tutor intelligente 24/7</p>
        
        <AuthModal supabase={state.supabase} isEmbedded={true} />
      </motion.div>
    </div>
  )

  if (state.showOnboarding) return <OnboardingScreen onDone={() => actions.setShowOnboarding(false)} />
  if (state.showPersonalizzazione) return <PersonalizzazioneScreen onDone={(p) => { actions.setProfilo(p); actions.setShowPersonalizzazione(false) }} user={state.user} />
  if (state.screen === 'storico') return <StoricoScreen onBack={() => actions.setScreen('home')} />
  if (state.screen === 'profilo') return <ProfiloScreen onBack={() => actions.setScreen('home')} profiloAttuale={state.profilo} user={state.user} onSave={(p) => { actions.setProfilo(p); actions.setScreen('home') }} />

  if (state.screen === 'paywall') return (
    <PaywallScreen 
      usedToday={state.usedToday} 
      DAILY_LIMIT={DAILY_LIMIT} 
      handleCheckout={actions.handleCheckout} 
      onBack={() => actions.setScreen('home')} 
    />
  )

  if (state.screen === 'explanation') return (
    <ExplanationScreen
      exercise={state.exercise}
      loading={state.loading}
      explanation={state.explanation}
      graficoUtile={state.graficoUtile}
      grafico={state.grafico}
      graficoLoading={state.graficoLoading}
      shareUrl={state.shareUrl}
      shareLoading={state.shareLoading}
      quoteIndex={state.quoteIndex}
      onBack={() => { actions.setScreen('home'); actions.setText(''); actions.setImage(null); actions.setImageBase64(null) }}
      handleGrafico={actions.handleGrafico}
      handleShare={actions.handleShare}
      isPremium={state.isPremium}
      chatMessages={state.chatMessages}
      chatLoading={state.chatLoading}
      handleChatSubmit={actions.handleChatSubmit}
      setScreen={actions.setScreen}
    />
  )

  return (
    <HomeScreen
      user={state.user}
      showAuth={state.showAuth}
      setShowAuth={actions.setShowAuth}
      supabase={state.supabase}
      setScreen={actions.setScreen}
      logout={actions.logout}
      isLimited={state.isLimited}
      remaining={state.remaining}
      image={state.image}
      setImage={actions.setImage}
      setImageBase64={actions.setImageBase64}
      dragging={state.dragging}
      setDragging={actions.setDragging}
      handleFile={actions.handleFile}
      text={state.text}
      setText={actions.setText}
      handleSubmit={actions.handleSubmit}
      usedToday={state.usedToday}
      isPremium={state.isPremium}
    />
  )
}
