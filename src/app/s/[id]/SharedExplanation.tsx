'use client'

import 'katex/dist/katex.min.css'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight, Crown, Bot, MessageCircle, BarChart2, MousePointer2, Send } from 'lucide-react'
import GraficoMafs from '@/components/exercise/GraficoMafs'
import ExplanationRenderer from '@/components/exercise/ExplanationRenderer'

export default function SharedExplanation({ data, id }: { data: any; id: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
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

      {/* Header Sticky - Uniformed with main app */}
      <header className="sticky top-0 z-30 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={18} className="text-primary" />
          <span className="text-[18px] font-extrabold tracking-tight">
            <span className="logo-shimmer logo-shimmer-the">the</span>
            <span className="logo-shimmer">Lemma</span>
          </span>
        </div>
        
        <a 
          href="/" 
          className="bg-primary text-background px-4 py-2 rounded-xl text-[13px] font-black no-underline shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
        >
          Prova Gratis <ChevronRight size={14} />
        </a>
      </header>

      <main className="flex-1 max-w-[720px] mx-auto w-full px-5 pt-8 pb-24 relative z-10">
        {/* Question card */}
        {data.question && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="bg-surface border border-surface-border rounded-[20px] p-5 text-[15px] text-foreground leading-relaxed shadow-sm">
              {data.question}
            </div>
          </motion.div>
        )}

        {/* Explanation content */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ExplanationRenderer 
            text={data.explanation} 
            esercizio={data.question || ''} 
            onAskTutor={() => window.location.href = '/'}
          />
        </motion.div>

        {/* Blurred Graph Section */}
        {data.grafico && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }} 
            className="mt-12 mb-8 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-yellow-500/20 rounded-[32px] blur opacity-50" />
            <div className="relative bg-surface border border-surface-border rounded-[32px] overflow-hidden shadow-xl">
              <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/40 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-background shadow-2xl mb-4 transform -rotate-3">
                  <BarChart2 size={32} />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2 flex items-center gap-2">
                  Grafico Interattivo <Crown size={20} className="text-primary" fill="currentColor" />
                </h3>
                <p className="text-[14px] text-foreground-muted max-w-xs mb-6 font-medium leading-relaxed">
                  Esplora questa funzione matematicamente! Iscriviti per sbloccare la visualizzazione dinamica e interagire con i punti chiave.
                </p>
                <a 
                  href="/" 
                  className="bg-primary text-background px-8 py-3.5 rounded-2xl text-[15px] font-black no-underline shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <MousePointer2 size={18} /> Sblocca Grafico
                </a>
              </div>
              <div className="opacity-30 grayscale blur-sm pointer-events-none">
                <GraficoMafs data={data.grafico} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Blurred Tutor Chat Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }} 
          className="mt-16 relative"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="text-[17px] font-black text-foreground leading-tight">Tutor Personale AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-success uppercase tracking-wider">Online ora</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            {/* CTA Overlay */}
            <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-background/30 flex flex-col items-center justify-center p-6 text-center rounded-[32px]">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-surface/95 backdrop-blur-2xl border border-surface-border p-8 rounded-[32px] shadow-2xl max-w-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <MessageCircle size={100} className="text-primary" />
                </div>
                
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                  <MessageCircle size={32} />
                </div>
                
                <h4 className="text-[20px] font-black text-foreground mb-3 leading-tight">Hai ancora dubbi?</h4>
                <p className="text-[14px] text-foreground-muted mb-8 font-medium leading-relaxed">
                  Iscriviti gratuitamente per chattare con il tutor, chiedere chiarimenti infiniti e risolvere ogni incertezza in pochi secondi.
                </p>
                
                <a 
                  href="/" 
                  className="w-full bg-primary text-background px-6 py-4 rounded-2xl text-[15px] font-black no-underline shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Sblocca Chat Gratuita <ChevronRight size={18} />
                </a>
              </motion.div>
            </div>
            
            {/* Mock Chat blurred background */}
            <div className="opacity-20 blur-[1px] pointer-events-none space-y-5 bg-surface/30 border border-surface-border rounded-[32px] p-6 pb-20">
              <div className="flex justify-end">
                <div className="bg-primary text-background rounded-2xl rounded-br-none p-4 text-[14px] font-medium max-w-[75%] shadow-sm">
                  Non ho capito come hai fatto a trovare il discriminante nel passaggio 2.
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={14} className="text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Tutor theLemma</span>
                  </div>
                  <div className="bg-surface border border-surface-border rounded-2xl rounded-bl-none p-4 text-[14px] text-foreground leading-relaxed max-w-[85%] shadow-sm">
                    Ottima domanda! Per trovare il discriminante ($\Delta$) dell'equazione $ax^2 + bx + c = 0$, usiamo la formula:
                    <div className="my-2 bg-background/50 p-2 rounded-lg text-center font-mono italic">
                      $\Delta = b^2 - 4ac$
                    </div>
                    In questo caso, siccome $a=1, b=-5$ e $c=6$, otteniamo...
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-primary text-background rounded-2xl rounded-br-none p-4 text-[14px] font-medium max-w-[65%] shadow-sm">
                  Ah ok! Quindi è sempre b al quadrato meno 4ac?
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-surface border border-surface-border rounded-2xl rounded-bl-none p-4 text-[14px] text-foreground-muted flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                  </div>
                  <span className="italic text-[13px]">Il tutor sta scrivendo...</span>
                </div>
              </div>
            </div>

            {/* Mock Input Bar */}
            <div className="absolute bottom-6 inset-x-6 opacity-20 blur-[1px] pointer-events-none">
              <div className="flex items-center gap-3 bg-surface border border-surface-border rounded-2xl p-3 px-5 shadow-lg">
                <div className="text-foreground-subtle text-[14px]">Scrivi un messaggio...</div>
                <div className="ml-auto w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-background">
                  <Send size={18} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-1.5 rounded-[24px] bg-primary/10 border border-primary/20 mb-6">
            <div className="px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary">Limited Time Offer</div>
          </div>
          <h2 className="text-[32px] font-black text-foreground leading-tight mb-4">
            Pronto a prendere <span className="text-primary">10</span> in matematica?
          </h2>
          <p className="text-foreground-muted text-[16px] mb-10 max-w-md mx-auto font-medium">
            Registrati oggi e ottieni il tuo piano di studio personalizzato assistito dall'intelligenza artificiale.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-3 bg-primary text-background px-10 py-4 rounded-[20px] text-[18px] font-black no-underline shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all group"
          >
            Inizia Ora <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="mt-6 text-[12px] text-foreground-subtle font-medium">
            Nessuna carta richiesta • 5 esercizi gratis ogni giorno
          </p>
        </motion.div>
      </main>

      {/* Background glow effects */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-primary/3 blur-[120px] rounded-full pointer-events-none -z-10" />
    </div>
  )
}
