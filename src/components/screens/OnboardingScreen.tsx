'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Sparkles, MessagesSquare, LineChart, BookOpen } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/ToastContext'

export default function OnboardingScreen() {
  const [step, setStep] = useState(0)
  const { fetchProfile } = useStore()
  const { showToast } = useToast()
  
  const steps = [
    { 
      icon: (
        <div className="relative">
          <Sparkles size={80} className="text-primary mb-8" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-primary/20 blur-3xl -z-10" 
          />
        </div>
      ), 
      title: 'Benvenuto su theLemma', 
      desc: 'Il tuo compagno di studio potenziato dall\'AI, pronto a guidarti passo dopo passo.' 
    },
    { 
      icon: <BookOpen size={72} className="text-primary mb-8" />, 
      title: 'Spiegazioni Chiare', 
      desc: 'Ogni esercizio viene risolto con passaggi dettagliati e formule matematiche perfette.' 
    },
    { 
      icon: (
        <div className="relative">
          <MessagesSquare size={72} className="text-primary mb-8" />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-2 -right-2 bg-primary text-background text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter"
          >
            Novità
          </motion.div>
        </div>
      ), 
      title: 'Tutor AI Sempre Online', 
      desc: 'Hai dei dubbi? Chatta direttamente con il tutor per chiarire ogni punto della spiegazione.' 
    },
    { 
      icon: <LineChart size={72} className="text-primary mb-8" />, 
      title: 'Grafici Interattivi', 
      desc: 'Visualizza le funzioni e i dati con grafici interattivi di alta qualità per una comprensione profonda.' 
    },
    { 
      icon: <Zap size={72} className="text-primary mb-8" />, 
      title: 'Studia Gratis Ogni Giorno', 
      desc: 'Hai 5 spiegazioni gratuite ogni giorno. Sblocca il piano Premium per studio illimitato.' 
    },
  ]

  async function next() {
    if (step < steps.length - 1) { 
      setStep(s => s + 1) 
    } else { 
      try {
        const res = await fetch('/api/profile', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ onboarding_done: true }) 
        })
        if (res.ok) {
          await fetchProfile()
        } else {
          const errorData = await res.json()
          console.error('Failed to update onboarding:', errorData)
          showToast('Errore salvataggio profilo. Riprova.', 'error')
        }
      } catch (e) {
        console.error('Failed to update onboarding:', e)
        showToast('Errore di connessione. Riprova.', 'error')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 overflow-hidden relative font-outfit">
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
      
      <div className="w-full max-w-[440px] text-center z-10">
        <div className="text-[12px] font-black text-primary mb-12 tracking-[0.25em] uppercase opacity-70">
          Il Futuro dello Studio • {step + 1} / {steps.length}
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="mb-14 flex flex-col items-center px-4"
          >
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              {steps[step].icon}
            </motion.div>
            
            <h2 className="text-[32px] font-black text-foreground mb-4 tracking-tight leading-[1.1]">
              {steps[step].title}
            </h2>
            <p className="text-[17px] text-foreground-muted leading-relaxed font-medium">
              {steps[step].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2.5 justify-center mb-12">
          {steps.map((_, i) => (
            <motion.div 
              key={i} 
              animate={{ 
                width: i === step ? 32 : 8,
                backgroundColor: i === step ? "var(--color-primary)" : "var(--color-surface-border)"
              }}
              className={`h-1.5 rounded-full transition-colors duration-300 ${i === step ? 'shadow-[0_0_12px_rgba(255,214,0,0.4)]' : ''}`} 
            />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={next} 
            className="w-full py-5 bg-primary border-none rounded-[22px] text-[17px] font-black cursor-pointer text-background hover:bg-primary-hover transition-all shadow-[0_12px_40px_rgba(255,214,0,0.25)]"
          >
            {step < steps.length - 1 ? 'Continua →' : 'Inizia Ora →'}
          </motion.button>
          
          {step < steps.length - 1 && (
            <button 
              onClick={async () => { 
                const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboarding_done: true }) }).catch(e => { console.error(e); return null; });
                if (res?.ok) {
                  await fetchProfile()
                } else {
                  showToast('Errore salvataggio. Riprova.', 'error');
                }
              }} 
              className="bg-transparent border-none text-foreground-subtle text-[14px] font-bold cursor-pointer py-2 hover:text-foreground transition-colors"
            >
              Salta introduzione
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
