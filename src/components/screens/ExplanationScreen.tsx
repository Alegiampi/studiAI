'use client'

import { useRef } from 'react'
import ExplanationRenderer from '@/components/exercise/ExplanationRenderer'
import GraficoMafs from '@/components/exercise/GraficoMafs'
import { motion } from 'framer-motion'
import { ChevronLeft, Share2, Copy, Plus, BarChart2, Loader2, CheckCircle2 } from 'lucide-react'

export const FRASI_MOTIVAZIONALI = [
  "Un problema alla volta, verso la soluzione...",
  "Scaldando i motori della fisica...",
  "La matematica non mente, stiamo calcolando la migliore per te!",
  "Elaborando i dati, quasi pronto...",
  "Ricorda: ogni errore è un passo verso la comprensione.",
  "Mettendo in ordine i numeri..."
]

export default function ExplanationScreen({
  exercise,
  loading,
  explanation,
  graficoUtile,
  grafico,
  graficoLoading,
  shareUrl,
  shareLoading,
  quoteIndex,
  onBack,
  handleGrafico,
  handleShare
}: {
  exercise: any
  loading: boolean
  explanation: string
  graficoUtile: boolean | null
  grafico: any
  graficoLoading: boolean
  shareUrl: string | null
  shareLoading: boolean
  quoteIndex: number
  onBack: () => void
  handleGrafico: () => void
  handleShare: () => void
}) {
  const chatRef = useRef<HTMLDivElement>(null)

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <header className="sticky top-0 z-20 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl bg-transparent border-none text-foreground-muted cursor-pointer hover:bg-surface-active hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="text-[17px] font-bold text-foreground">Spiegazione</div>
      </header>

      <main ref={chatRef} className="flex-1 overflow-y-auto px-5 pt-6 pb-24 max-w-[720px] mx-auto w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          {exercise?.imagePreview && (
            <div className="rounded-[20px] overflow-hidden border border-surface-border mb-4 shadow-sm">
              <img src={exercise.imagePreview} alt="esercizio" className="w-full object-cover" />
            </div>
          )}
          {exercise?.text && (
            <div className="bg-surface border border-surface-border rounded-[20px] p-5 text-[15px] text-foreground leading-relaxed shadow-sm">
              {exercise.text}
            </div>
          )}
        </motion.div>

        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center py-16 px-5 gap-6"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 size={48} className="text-primary animate-spin relative z-10" />
            </div>
            <div className="text-center">
              <motion.div 
                animate={{ opacity: [1, 0.5, 1] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-[16px] font-extrabold text-primary mb-3"
              >
                Analizzando l'esercizio...
              </motion.div>
              <div className="text-[14px] text-foreground-subtle italic max-w-[280px] mx-auto leading-relaxed">
                "{FRASI_MOTIVAZIONALI[quoteIndex]}"
              </div>
            </div>
          </motion.div>
        ) : explanation ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ExplanationRenderer text={explanation} esercizio={exercise?.text || ''} />
          </motion.div>
        ) : null}

        {explanation && !loading && graficoUtile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 mb-4">
            {grafico ? (
              <GraficoMafs data={grafico} />
            ) : (
              <button 
                onClick={handleGrafico} 
                disabled={graficoLoading} 
                className={`w-full p-4 rounded-2xl text-[15px] font-bold transition-all flex items-center justify-center gap-2 border ${
                  graficoLoading 
                  ? 'bg-surface-active border-surface-border text-foreground-muted cursor-default' 
                  : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 cursor-pointer shadow-sm'
                }`}
              >
                {graficoLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Generazione in corso...</>
                ) : (
                  <><BarChart2 size={18} /> Visualizza Grafico Interattivo</>
                )}
              </button>
            )}
          </motion.div>
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-surface/90 backdrop-blur-xl border-t border-surface-border p-4 pb-6 sm:pb-4 z-20">
        <div className="max-w-[720px] mx-auto flex flex-wrap justify-center items-center gap-4">
          {explanation && !loading && (
            <div className="flex-shrink-0">
              <button 
                onClick={handleShare} 
                disabled={shareLoading || !!shareUrl} 
                className={`flex items-center gap-2 h-11 px-6 rounded-full border text-[14px] font-semibold transition-all shadow-sm ${
                  shareUrl 
                    ? 'bg-success/10 border-success/30 text-success cursor-default' 
                    : 'bg-surface border-surface-border text-foreground hover:bg-surface-hover hover:border-primary/30 cursor-pointer'
                }`}
              >
                {shareLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : shareUrl ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Share2 size={16} />
                )}
                {shareUrl ? 'Link Copiato!' : 'Condividi'}
              </button>
            </div>
          )}
          <button 
            onClick={onBack} 
            className="flex items-center justify-center gap-2 h-11 px-8 rounded-full bg-primary border-none text-background font-extrabold cursor-pointer text-[14px] hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Nuovo Esercizio
          </button>
        </div>
      </div>
    </div>
  )
}
