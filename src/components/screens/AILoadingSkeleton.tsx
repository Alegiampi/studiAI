'use client'

import { motion } from 'framer-motion'
import { Sparkles, Search, Lightbulb, Brain, Calculator, Layout } from 'lucide-react'
import { useState, useEffect } from 'react'

const AI_STEPS = [
  { label: "Analisi dell'input...", icon: <Search size={18} /> },
  { label: "Identificazione concetti chiave...", icon: <Lightbulb size={18} /> },
  { label: "Elaborazione passaggi logici...", icon: <Brain size={18} /> },
  { label: "Risoluzione equazioni...", icon: <Calculator size={18} /> },
  { label: "Formattazione spiegazione...", icon: <Layout size={18} /> },
  { label: "Finalizzazione...", icon: <Sparkles size={18} /> },
]

export default function AILoadingSkeleton() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % AI_STEPS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-6 relative">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .logo-shimmer {
          background: linear-gradient(
            90deg,
            #FFD600 0%,
            #FFF8DC 20%,
            #FFD600 35%,
            #FFA500 50%,
            #FFD600 65%,
            #FFF8DC 80%,
            #FFD600 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 2s linear infinite;
        }
        .logo-shimmer-the {
          opacity: 0.7;
          font-weight: 300;
        }
      `}</style>

      {/* Thinking Glow Background */}
      <div className="absolute inset-0 -top-20 pointer-events-none z-0">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/20 blur-[80px] rounded-full"
        />
      </div>

      {/* AI Status Indicator — theLemma Hero */}
      <div className="flex flex-col items-center justify-center py-6 mb-2 relative z-10">
        {/* Glow halo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[260px] h-[120px] bg-primary/30 blur-[60px] rounded-full"
          />
        </div>

        {/* Logo shimmer gigante */}
        <div className="flex items-center gap-3 mb-6 relative">
          <motion.div
            animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.4, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={24} className="text-primary" />
          </motion.div>
          <span className="text-[52px] font-extrabold tracking-tight leading-none">
            <span className="logo-shimmer logo-shimmer-the">the</span><span className="logo-shimmer">Lemma</span>
          </span>
          <motion.div
            animate={{ rotate: [0, -20, 20, 0], scale: [1, 1.4, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          >
            <Sparkles size={18} className="text-primary/60" />
          </motion.div>
        </div>

        {/* Step corrente come pill */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 text-primary font-semibold text-[13px] shadow-sm"
        >
          {AI_STEPS[currentStep].icon}
          <span>{AI_STEPS[currentStep].label}</span>
        </motion.div>
      </div>

      {/* Skeleton passi */}
      <div className="space-y-6 relative z-10">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 opacity-40">
            <div className="w-[2px] bg-surface-active/50 rounded-full shrink-0" />
            <div className="flex-1 bg-surface border border-surface-border rounded-[24px] overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-surface-border bg-surface-active/50 flex items-center gap-3">
                <div className="bg-background/50 h-[22px] w-[60px] rounded-lg animate-pulse" />
                <div className="h-4 bg-surface-active rounded-md w-1/3 animate-pulse" />
              </div>
              <div className="px-6 py-5 space-y-3">
                <div className="h-3 bg-surface-active rounded-full w-full animate-pulse" />
                <div className="h-3 bg-surface-active rounded-full w-[92%] animate-pulse [animation-delay:200ms]" />
                <div className="h-3 bg-surface-active rounded-full w-[85%] animate-pulse [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
