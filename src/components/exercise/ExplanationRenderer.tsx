'use client'

import { parseExplanation } from '@/lib/utils'
import type { Passo } from '@/types'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { motion } from 'framer-motion'
import { Sparkles, ArrowUp, X, Loader2 } from 'lucide-react'


const MD = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
)

function ExplanationRenderer({ text, esercizio }: { text: string; esercizio: string }) {
  const parsed = parseExplanation(text)
  const [passi, setPassi] = useState<Passo[]>(parsed.passi)
  const [openInput, setOpenInput] = useState<number | null>(null)
  const [inputs, setInputs] = useState<string[]>(parsed.passi.map(() => ''))

  async function chiedi(i: number, domanda: string) {
    if (!domanda.trim()) return
    const newPassi = [...passi]
    newPassi[i] = { ...newPassi[i], domanda, loadingRisposta: true, risposta: undefined }
    setPassi(newPassi)
    setOpenInput(null)
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'chiarimento', text: 'Esercizio: ' + esercizio + '. Passo "' + passi[i].titolo + '": ' + passi[i].corpo + '. Domanda: ' + domanda })
    })
    const data = await res.json()
    setPassi(prev => { const updated = [...prev]; updated[i] = { ...updated[i], risposta: data.explanation, loadingRisposta: false }; return updated })
    const newInputs = [...inputs]; newInputs[i] = ''; setInputs(newInputs)
  }

  return (
    <div className="w-full">
      <style>{`
        .katex { color: var(--color-foreground) !important; font-size: 1.2em; font-weight: 500; }
        .katex-display { 
          margin: 1.5rem 0 !important; 
          padding: 0.5rem 0; 
          overflow-x: auto; 
          text-align: center;
        }
        .katex-display .katex { color: var(--color-foreground) !important; }
        .md-content { line-height: 1.8; }
        .md-content p { margin-bottom: 1.2rem; }
        .md-content p:last-child { margin-bottom: 0; }
        .md-content ul, .md-content ol { padding-left: 1.5rem; margin-bottom: 1.2rem; }
        .md-content ul { list-style-type: disc; }
        .md-content ol { list-style-type: decimal; }
        .md-content li { margin-bottom: 0.5rem; }
        .md-content strong { color: var(--color-foreground); font-weight: 700; }
      `}</style>
      
      {parsed.titolo && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-[20px] font-extrabold text-primary mb-8 leading-snug tracking-tight">
          <MD>{parsed.titolo}</MD>
        </motion.div>
      )}

      <div className="space-y-6">
        {passi.map((passo, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.15 + (i * 0.05) }}
            className="flex gap-3"
          >
            <div className="w-1 bg-primary/30 rounded-full shrink-0" />
            <div className="flex-1">
              <div className="bg-surface border border-surface-border rounded-[20px] overflow-hidden shadow-sm">
                <div className="bg-surface-active px-4 py-3 border-b border-surface-border font-bold text-[14px] text-foreground flex items-center gap-2 flex-wrap">
                  <span className="text-foreground-subtle font-semibold uppercase tracking-wider text-[11px] bg-background/50 px-2 py-0.5 rounded-md">Passo {i + 1}</span>
                  <span className="text-foreground-muted mx-1">•</span>
                  <MD>{passo.titolo}</MD>
                </div>
                <div className="md-content px-5 py-4 text-[15px] text-foreground-muted bg-surface/50">
                  <MD>{passo.corpo}</MD>
                </div>
              </div>

              {passo.domanda && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-4 border border-primary/20 rounded-[16px] overflow-hidden shadow-sm">
                  <div className="bg-primary/10 px-4 py-2.5 text-[13px] text-primary font-bold flex items-center gap-2 border-b border-primary/10">
                    <span className="bg-primary text-background text-[10px] uppercase px-1.5 py-0.5 rounded-sm">Domanda</span>
                    {passo.domanda}
                  </div>
                  <div className="px-5 py-4 text-[14px] text-foreground-muted leading-relaxed bg-surface/30 md-content">
                    {passo.loadingRisposta ? (
                      <div className="flex items-center gap-2 text-primary/70 font-medium">
                        <Loader2 size={16} className="animate-spin" /> Sto generando la spiegazione...
                      </div>
                    ) : (
                      <MD>{passo.risposta || ''}</MD>
                    )}
                  </div>
                </motion.div>
              )}

              {!passo.loadingRisposta && (
                <div className="mt-3 ml-4">
                  {openInput === i ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-2 items-center bg-surface border border-surface-border rounded-full p-1 pl-4 shadow-sm">
                      <input 
                        autoFocus 
                        value={inputs[i]} 
                        onChange={e => { const n = [...inputs]; n[i] = e.target.value; setInputs(n) }} 
                        onKeyDown={e => e.key === 'Enter' && chiedi(i, inputs[i].trim())} 
                        placeholder="Cosa non ti è chiaro di questo passo?" 
                        className="flex-1 bg-transparent border-none text-[14px] outline-none text-foreground placeholder:text-foreground-subtle" 
                      />
                      <button onClick={() => chiedi(i, inputs[i].trim())} className="w-9 h-9 rounded-full bg-primary border-none cursor-pointer text-background shrink-0 flex items-center justify-center hover:bg-primary-hover hover:scale-105 transition-all shadow-sm">
                        <ArrowUp size={18} strokeWidth={3} />
                      </button>
                      <button onClick={() => setOpenInput(null)} className="w-9 h-9 rounded-full bg-surface-active border border-surface-border cursor-pointer text-foreground-muted shrink-0 flex items-center justify-center hover:bg-surface-border hover:text-foreground transition-all">
                        <X size={16} strokeWidth={2.5} />
                      </button>
                    </motion.div>
                  ) : (
                    <button onClick={() => setOpenInput(i)} className="bg-transparent border-none text-[13px] text-primary/70 cursor-pointer py-1 font-semibold hover:text-primary transition-colors flex items-center gap-1.5">
                      <span className="text-lg leading-none">+</span> Chiedimi di più su questo passo
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {parsed.finale && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.4 }}
          className="bg-primary/5 border-2 border-primary/40 rounded-[20px] p-5 mt-8 mb-4 shadow-[0_0_30px_rgba(255,214,0,0.1)]"
        >
          <div className="text-[12px] font-extrabold text-primary uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
            <Sparkles size={14} /> Risposta Finale
          </div>
          <div className="md-content text-[18px] font-bold text-primary">
            <MD>{parsed.finale}</MD>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ExplanationRenderer
