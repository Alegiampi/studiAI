'use client'

import { parseExplanation } from '@/lib/utils'
import { useState, useRef, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowUp, ArrowDown } from 'lucide-react'


const MD = ({ children }: { children: string }) => (
  <ReactMarkdown 
    remarkPlugins={[remarkMath]} 
    rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: '#cc0000' }]]}
  >
    {children}
  </ReactMarkdown>
)

function ExplanationRenderer({ 
  text, 
  onAskTutor 
}: { 
  text: string; 
  onAskTutor?: (stepTitle: string, stepBody: string) => void 
}) {
  const parsed = useMemo(() => parseExplanation(text, true), [text])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0)
  const [showFinale, setShowFinale] = useState(false)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const finaleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusedIndex === parsed.passi.length && finaleRef.current) {
      setTimeout(() => {
        finaleRef.current?.scrollIntoView({ block: 'center' })
      }, 100)
      return
    }

    if (focusedIndex !== null && stepRefs.current[focusedIndex]) {
      const element = stepRefs.current[focusedIndex]
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            block: 'center'
          })
        }, 100)
      }
    }
  }, [focusedIndex, parsed.passi.length])

  return (
    <div className="w-full">
      {parsed.titolo && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-[21px] font-extrabold text-primary mb-8 leading-snug tracking-tight">
          <MD>{parsed.titolo}</MD>
        </motion.div>
      )}

      {parsed.passi.length > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-semibold text-foreground-subtle uppercase tracking-widest">
            {focusedIndex !== null && focusedIndex < parsed.passi.length
              ? `Passo ${focusedIndex + 1} di ${parsed.passi.length}`
              : focusedIndex !== null
                ? `Soluzione`
                : `${parsed.passi.length} passi`}
          </span>
          <div className="flex-1 h-[1px] bg-surface-border" />
          {focusedIndex !== null && (
            <button 
              onClick={() => setFocusedIndex(null)} 
              className="text-[10px] text-foreground-subtle hover:text-foreground-muted transition-colors uppercase tracking-wider cursor-pointer"
            >
              Tutti i passi
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {parsed.passi.map((passo, i) => {
          const isFocused = focusedIndex === i
          const isDimmed = focusedIndex !== null && !isFocused

          return (
            <motion.div 
              key={i} 
              ref={el => { stepRefs.current[i] = el }}
              initial={{ opacity: 0, y: 10 }} 
              animate={{ 
                opacity: isDimmed ? 0.85 : 1,
                y: 0 
              }} 
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 25,
                delay: i < parsed.passi.length ? 0.05 + (i * 0.03) : 0,
              }}
              onClick={() => setFocusedIndex(isFocused ? null : i)}
              className={`flex gap-4 p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 ${isFocused ? 'z-10' : 'z-0'} scroll-mt-24 ${
                isFocused 
                  ? 'bg-surface-hover/80 border-primary/20 shadow-lg shadow-black/10' 
                  : 'bg-surface/30 border-transparent hover:bg-surface/50'
              }`}
            >
              {/* Barretta laterale con puntino in cima */}
              <div className={`rounded-full shrink-0 flex flex-col items-center transition-all duration-300 ${
                isFocused ? 'w-[3px] bg-primary' : 'w-[2px] bg-primary/20'
              }`}>
                <div className={`rounded-full -mt-0.5 transition-all duration-300 ${
                  isFocused ? 'w-2 h-2 bg-primary shadow-[0_0_8px_rgba(255,214,0,0.5)]' : 'w-1.5 h-1.5 bg-primary/50'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`font-extrabold uppercase tracking-widest text-[10px] px-2 py-0.5 rounded transition-colors duration-300 ${
                    isFocused ? 'bg-primary text-background font-black' : 'bg-background/50 text-foreground-subtle'
                  }`}>
                    Passo {i + 1}
                  </span>
                  <div className={`text-[15px] font-black tracking-tight transition-colors duration-300 ${
                    isFocused ? 'text-primary' : 'text-foreground'
                  }`}>
                    <MD>{passo.titolo}</MD>
                  </div>
                </div>

                <div className="md-content leading-relaxed step-body-math text-foreground-muted">
                  <MD>{passo.corpo}</MD>
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
                        layoutId={`explanation-action-bar-${i}`}
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
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowFinale(true); setFocusedIndex(parsed.passi.length); }}
                            className="h-10 px-5 rounded-full bg-primary border-none text-background font-extrabold text-[13px] hover:bg-primary-hover transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                          >
                            Vedi soluzione <ArrowDown size={16} />
                          </button>
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
        {parsed.finale && (
          <div className="mt-10 mb-10">
            <div 
              ref={finaleRef}
              onClick={() => { if (!showFinale) { setShowFinale(true); setFocusedIndex(parsed.passi.length); } }}
              className={`rounded-[24px] border transition-all duration-300 relative overflow-hidden ${
                showFinale 
                  ? 'bg-primary/5 border-primary/40 p-6 cursor-default' 
                  : 'bg-surface/30 border-surface-border hover:bg-surface/50 p-4 cursor-pointer'
              }`}
            >
              {!showFinale ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-[12px] font-extrabold text-primary uppercase tracking-[0.2em]">
                      Soluzione Finale
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-foreground-subtle">
                    Tocca per vedere →
                  </span>
                </div>
              ) : (
                <>
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '250%' }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -skew-x-12 z-0"
                  />
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="text-[12px] font-extrabold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                      <Sparkles size={16} fill="currentColor" /> Soluzione Finale
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowFinale(false); }}
                      className="text-[10px] text-foreground-subtle hover:text-foreground-muted transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Nascondi ↑
                    </button>
                  </div>
                  <div className="md-content text-[22px] font-black text-primary relative z-10 leading-tight">
                    <MD>{parsed.finale}</MD>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExplanationRenderer
