'use client'

import { useState, useEffect } from 'react'
import ExplanationRenderer from '@/components/exercise/ExplanationRenderer'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen, Clock, AlertCircle } from 'lucide-react'

export default function StoricoScreen({ onBack }: { onBack: () => void }) {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    fetch('/api/exercises').then(r => r.json()).then(data => { setExercises(data); setLoading(false) })
  }, [])

  if (selected) return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="p-2 -ml-2 rounded-xl bg-transparent border-none text-foreground-muted cursor-pointer hover:bg-surface-active hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="text-[17px] font-bold text-foreground truncate">{selected.question || 'Esercizio'}</div>
      </header>
      <main className="flex-1 overflow-y-auto p-5 max-w-[720px] mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-surface-border rounded-[20px] p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold text-[13px] uppercase tracking-wider mb-3">
            <BookOpen size={16} /> Domanda
          </div>
          <div className="text-[15px] text-foreground leading-relaxed">
            {selected.question || <span className="text-foreground-muted italic">Immagine inviata senza testo</span>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ExplanationRenderer text={selected.explanation} esercizio={selected.question} />
        </motion.div>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl bg-transparent border-none text-foreground-muted cursor-pointer hover:bg-surface-active hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="text-[17px] font-bold text-foreground">I tuoi esercizi</div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 max-w-[640px] mx-auto w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center p-12 text-foreground-muted">
              <div className="w-8 h-8 border-4 border-surface-active border-t-primary rounded-full animate-spin mb-4" />
              <div className="text-[15px] font-medium">Caricamento...</div>
            </motion.div>
          ) : exercises.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-surface-active rounded-full flex items-center justify-center text-foreground-subtle mb-4">
                <AlertCircle size={32} />
              </div>
              <div className="text-[16px] font-bold text-foreground mb-1">Nessun esercizio</div>
              <div className="text-[14px] text-foreground-subtle">Non hai ancora risolto nessun esercizio. Torna alla home e inizia a studiare!</div>
            </motion.div>
          ) : (
            <motion.div key="list" initial="hidden" animate="visible" variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}>
              {exercises.map((ex, i) => (
                <motion.div 
                  key={i} 
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  onClick={() => setSelected(ex)} 
                  className="bg-surface border border-surface-border rounded-2xl p-4 mb-3 cursor-pointer flex justify-between items-center group hover:border-primary/30 transition-all hover:shadow-md"
                >
                  <div className="flex-1 pr-4 overflow-hidden">
                    <div className="text-[15px] text-foreground font-bold mb-1.5 truncate group-hover:text-primary transition-colors">
                      {ex.question || 'Esercizio con foto'}
                    </div>
                    <div className="text-[12px] text-foreground-subtle flex items-center gap-1.5 font-medium">
                      <Clock size={12} />
                      {new Date(ex.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center text-foreground-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                    <ChevronRight size={18} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
