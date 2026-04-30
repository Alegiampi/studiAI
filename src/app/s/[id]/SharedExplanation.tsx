'use client'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight, BookOpen } from 'lucide-react'

const MD = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
)

type Passo = { titolo: string; corpo: string }

function parseExplanation(text: string): { titolo: string; passi: Passo[]; finale: string } {
  const lines = text.split('\n')
  let titolo = ''
  const passi: Passo[] = []
  let finale = ''
  let currentPasso: Passo | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('TITOLO:')) {
      titolo = trimmed.replace('TITOLO:', '').trim()
    } else if (trimmed.match(/^PASSO \d+:/)) {
      if (currentPasso) passi.push(currentPasso)
      currentPasso = { titolo: trimmed.replace(/^PASSO \d+:/, '').trim(), corpo: '' }
    } else if (trimmed.startsWith('SUGGERIMENTI:')) {
      // ignoriamo
    } else if (trimmed.startsWith('RISPOSTA FINALE:')) {
      if (currentPasso) { passi.push(currentPasso); currentPasso = null }
      finale = trimmed.replace('RISPOSTA FINALE:', '').trim()
    } else if (currentPasso) {
      currentPasso.corpo += (currentPasso.corpo ? '\n' : '') + trimmed
    }
  }
  if (currentPasso) passi.push(currentPasso)
  return { titolo, passi, finale }
}

export default function SharedExplanation({ data, id }: { data: any; id: string }) {
  const parsed = parseExplanation(data.explanation)

  return (
    <div className="min-h-screen bg-background font-sans relative overflow-hidden flex flex-col">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
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
      
      {/* Banner Top */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-primary px-5 py-3.5 flex justify-between items-center shadow-md relative z-20">
        <div className="flex items-center gap-2">
          <div className="bg-background/20 p-1.5 rounded-lg backdrop-blur-sm">
            <Sparkles size={20} className="text-background" />
          </div>
          <div>
            <div className="text-[17px] font-extrabold text-background tracking-tight leading-tight">StudiAI</div>
            <div className="text-[11px] font-semibold text-background/80 uppercase tracking-wider">Il tutor AI per studenti</div>
          </div>
        </div>
        <a href="/" className="bg-background text-primary px-4 py-2 rounded-xl text-[13px] font-extrabold no-underline shadow-sm hover:scale-105 transition-transform flex items-center gap-1">
          Prova gratis <ChevronRight size={14} />
        </a>
      </motion.div>

      <main className="max-w-[680px] mx-auto w-full px-5 py-8 relative z-10 flex-1">
        {data.question && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-surface-border rounded-2xl p-5 mb-8 shadow-sm text-[15px] text-foreground-muted leading-relaxed font-medium">
            {data.question}
          </motion.div>
        )}

        {parsed.titolo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-[20px] font-extrabold text-primary mb-8 leading-snug tracking-tight">
            <MD>{parsed.titolo}</MD>
          </motion.div>
        )}

        <div className="space-y-6">
          {parsed.passi.map((passo, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.15 + (i * 0.05) }}
              className="flex gap-3"
            >
              <div className="w-1 bg-primary/30 rounded-full shrink-0" />
              <div className="flex-1 bg-surface border border-surface-border rounded-[20px] overflow-hidden shadow-sm">
                <div className="bg-surface-active px-4 py-3 border-b border-surface-border font-bold text-[14px] text-foreground flex items-center gap-2">
                  <span className="text-foreground-subtle font-semibold uppercase tracking-wider text-[11px] bg-background/50 px-2 py-0.5 rounded-md">Passo {i + 1}</span>
                  <span className="text-foreground-muted mx-1">•</span>
                  <MD>{passo.titolo}</MD>
                </div>
                <div className="md-content px-5 py-4 text-[15px] text-foreground-muted bg-surface/50">
                  <MD>{passo.corpo}</MD>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {parsed.finale && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.4 }}
            className="bg-primary/5 border-2 border-primary/40 rounded-[20px] p-5 mt-6 mb-12 shadow-[0_0_30px_rgba(255,214,0,0.1)]"
          >
            <div className="text-[12px] font-extrabold text-primary uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
              <Sparkles size={14} /> Risposta Finale
            </div>
            <div className="md-content text-[18px] font-bold text-primary">
              <MD>{parsed.finale}</MD>
            </div>
          </motion.div>
        )}

        {/* CTA Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="bg-surface border border-surface-border rounded-[24px] p-8 text-center shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-30" />
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <BookOpen size={28} />
          </div>
          <h3 className="text-[20px] font-extrabold text-foreground mb-2">Vuoi spiegazioni passo-passo?</h3>
          <p className="text-[15px] text-foreground-muted font-medium mb-8 max-w-sm mx-auto">Ricevi 5 risoluzioni gratuite ogni giorno. Nessuna carta di credito richiesta.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-primary text-background px-8 py-3.5 rounded-[16px] text-[16px] font-extrabold no-underline shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary-hover transition-all">
            Inizia a studiare gratis <ChevronRight size={18} />
          </a>
        </motion.div>
      </main>
    </div>
  )
}
