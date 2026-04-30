'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, BrainCircuit, Zap } from 'lucide-react'

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  
  const steps = [
    { icon: <Camera size={64} className="text-primary mb-6" />, title: 'Fotografa o scrivi', desc: 'Carica una foto del tuo esercizio di matematica o fisica, oppure scrivilo direttamente.' },
    { icon: <BrainCircuit size={64} className="text-primary mb-6" />, title: 'Spiegazione passo passo', desc: 'StudiAI spiega ogni passaggio in italiano con formule chiare. Puoi chiedere chiarimenti su ogni passo.' },
    { icon: <Zap size={64} className="text-primary mb-6" />, title: '5 esercizi al giorno gratis', desc: 'Ogni giorno hai 5 spiegazioni gratuite. Sblocca tutto con il piano premium.' },
  ]

  function next() {
    if (step < steps.length - 1) { setStep(s => s + 1) }
    else { fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboarding_done: true }) }).then(() => onDone()) }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <div className="w-full max-w-[420px] text-center z-10">
        <div className="text-[11px] font-extrabold text-foreground-subtle mb-10 tracking-[0.2em] uppercase">
          Passo {step + 1} di {steps.length}
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-12 flex flex-col items-center"
          >
            {steps[step].icon}
            <h2 className="text-[28px] font-extrabold text-foreground mb-4 tracking-tight leading-tight">
              {steps[step].title}
            </h2>
            <p className="text-[16px] text-foreground-muted leading-relaxed font-medium">
              {steps[step].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 justify-center mb-10">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-primary shadow-[0_0_10px_rgba(255,214,0,0.5)]' : 'w-2 bg-surface-border'}`} />
          ))}
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={next} 
          className="w-full p-4 bg-primary border-none rounded-[16px] text-[16px] font-extrabold cursor-pointer text-background hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
        >
          {step < steps.length - 1 ? 'Continua →' : 'Inizia a studiare →'}
        </motion.button>
        
        {step < steps.length - 1 && (
          <button 
            onClick={() => { fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboarding_done: true }) }).then(() => onDone()) }} 
            className="bg-transparent border-none text-foreground-subtle text-[14px] font-medium cursor-pointer mt-6 hover:text-foreground transition-colors"
          >
            Salta introduzione
          </button>
        )}
      </div>
    </div>
  )
}
