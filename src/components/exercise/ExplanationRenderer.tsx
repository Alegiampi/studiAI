'use client'

import { parseExplanation } from '@/lib/utils'
import type { Passo } from '@/types'
import { useState, useRef, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowUp, X, Loader2 } from 'lucide-react'


const MD = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
)

function ExplanationRenderer({ 
  text, 
  esercizio, 
  onAskTutor 
}: { 
  text: string; 
  esercizio: string; 
  onAskTutor?: (stepTitle: string, stepBody: string) => void 
}) {
  const parsed = useMemo(() => parseExplanation(text), [text])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0)
  const [showFinale, setShowFinale] = useState(false)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const finaleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusedIndex === parsed.passi.length && finaleRef.current) {
      setTimeout(() => {
        finaleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }

    if (focusedIndex !== null && stepRefs.current[focusedIndex]) {
      const element = stepRefs.current[focusedIndex]
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }, 100)
      }
    }
  }, [focusedIndex, parsed.passi.length])

  return (
    <div className="w-full">
      <style>{`
        .katex { color: var(--color-foreground) !important; font-size: 1.2em; font-weight: 500; }
        .katex-display { 
          margin: 0.6rem 0 !important; 
          padding: 0.2rem 0; 
          overflow-x: auto; 
          text-align: center;
        }
        .katex-display .katex { color: var(--color-foreground) !important; }
        .md-content { line-height: 1.6; text-align: justify; hyphens: auto; }
        .md-content p { margin-bottom: 0.6rem; }
        .md-content p:last-child { margin-bottom: 0; }
        .md-content ul, .md-content ol { padding-left: 1.2rem; margin-bottom: 0.6rem; }
        .md-content ul { list-style-type: disc; }
        .md-content ol { list-style-type: decimal; }
        .md-content li { margin-bottom: 0.3rem; }
        .md-content strong { color: var(--color-foreground); font-weight: 700; }
      `}</style>
      
      {parsed.titolo && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-[20px] font-extrabold text-primary mb-8 leading-snug tracking-tight">
          <MD>{parsed.titolo}</MD>
        </motion.div>
      )}

      <div className="space-y-6">
        {parsed.passi.map((passo, i) => {
          const isFocused = focusedIndex === i
          const isDimmed = focusedIndex !== null && !isFocused

          return (
            <motion.div 
              key={i} 
              ref={el => { stepRefs.current[i] = el }}
              initial={{ opacity: 0, y: 10 }} 
              animate={{ 
                opacity: isDimmed ? 0.4 : 1,
                scale: isFocused ? 1.02 : 1,
                y: 0 
              }} 
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: i < parsed.passi.length ? 0.15 + (i * 0.05) : 0
              }}
              onClick={() => setFocusedIndex(isFocused ? null : i)}
              className={`flex gap-3 cursor-pointer transition-all duration-300 ${isFocused ? 'z-10' : 'z-0'} scroll-mt-24`}
            >
              <div className={`w-1.5 rounded-full shrink-0 transition-colors duration-500 ${isFocused ? 'bg-primary shadow-[0_0_15px_rgba(255,214,0,0.5)]' : 'bg-surface-active'}`} />
              <div className="flex-1">
                <div className={`bg-surface border transition-all duration-500 rounded-[24px] overflow-hidden shadow-sm ${isFocused ? 'border-primary/50 shadow-[0_10px_40px_rgba(0,0,0,0.2)]' : 'border-surface-border'}`}>
                  <div className={`px-5 py-4 border-b font-bold text-[14px] flex items-center gap-3 flex-wrap transition-colors duration-500 ${isFocused ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-active/50 border-surface-border text-foreground'}`}>
                    <span className={`font-extrabold uppercase tracking-widest text-[10px] px-2 py-1 rounded-lg transition-colors duration-500 ${isFocused ? 'bg-primary text-background' : 'bg-background/50 text-foreground-subtle'}`}>Passo {i + 1}</span>
                    <MD>{passo.titolo}</MD>
                  </div>
                  <div className={`md-content px-6 py-5 text-[15px] leading-relaxed transition-colors duration-500 ${isFocused ? 'text-foreground' : 'text-foreground-muted'}`}>
                    <MD>{passo.corpo}</MD>
                  </div>
                </div>

                <AnimatePresence>
                  {isFocused && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="mt-6 flex justify-center relative z-20"
                    >
                      <motion.div 
                        layoutId={`action-bar-${i}`}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-1.5 px-2 rounded-full shadow-2xl flex items-center gap-1"
                      >
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onAskTutor?.(passo.titolo, passo.corpo);
                          }} 
                          className="h-10 px-4 rounded-full bg-transparent border-none text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 font-bold cursor-pointer"
                        >
                          <Sparkles size={14} className="text-primary" /> Dubbi?
                        </button>
                        
                        <div className="w-[1px] h-4 bg-white/10 mx-1" />

                        {i < parsed.passi.length - 1 ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setFocusedIndex(i + 1); }}
                            className="h-10 px-5 rounded-full bg-primary border-none text-background font-extrabold text-[13px] hover:bg-primary-hover transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                          >
                            Passaggio successivo <ArrowUp size={16} className="rotate-90" />
                          </button>
                        ) : (
                          !showFinale && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowFinale(true); setFocusedIndex(parsed.passi.length); }}
                              className="h-10 px-5 rounded-full bg-primary border-none text-background font-extrabold text-[13px] hover:bg-primary-hover transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                            >
                              <Sparkles size={14} fill="currentColor" /> Rivela Soluzione
                            </button>
                          )
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {parsed.finale && showFinale && (
          <motion.div 
            ref={finaleRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="mt-10 mb-10 bg-primary/5 border-2 border-primary/40 rounded-[24px] p-6 relative overflow-hidden"
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '250%' }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -skew-x-12 z-0"
            />
            <div className="text-[12px] font-extrabold text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2 relative z-10">
              <Sparkles size={16} fill="currentColor" /> Soluzione Finale
            </div>
            <div className="md-content text-[22px] font-black text-primary relative z-10 leading-tight">
              <MD>{parsed.finale}</MD>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExplanationRenderer
