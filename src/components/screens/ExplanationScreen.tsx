'use client'

import ExplanationRenderer from '@/components/exercise/ExplanationRenderer'
import GraficoMafs from '@/components/exercise/GraficoMafs'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Share2, Copy, Plus, BarChart2, Loader2, CheckCircle2, Crown, Send, Bot, Star, Link } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

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
  handleShare,
  isPremium,
  chatMessages,
  chatLoading,
  handleChatSubmit,
  setScreen,
  exerciseId
}: {
  exerciseId?: number | null
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
  isPremium: boolean
  chatMessages: { role: 'user' | 'assistant', text: string }[]
  chatLoading: boolean
  handleChatSubmit: (msg: string) => void
  setScreen: (screen: 'paywall') => void
}) {
  const chatRef = useRef<HTMLDivElement>(null)
  const [chatInput, setChatInput] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [toast, setToast] = useState<{ text: string; visible: boolean }>({ text: '', visible: false })

  useEffect(() => {
    if (shareUrl) {
      showNotification('Link copiato!')
    }
  }, [shareUrl])

  const showNotification = (text: string) => {
    setToast({ text, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500)
  }

  async function toggleFavorite() {
    if (!exerciseId) return
    const newFav = !isFavorite
    setIsFavorite(newFav)
    showNotification(newFav ? 'Aggiunto ai preferiti!' : 'Rimosso dai preferiti')
    
    await fetch('/api/exercises', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: exerciseId, is_favorite: newFav })
    })
  }

  const submitChat = () => {
    if (!chatInput.trim()) return
    handleChatSubmit(chatInput)
    setChatInput('')
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <header className="sticky top-0 z-20 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl bg-transparent border-none text-foreground-muted cursor-pointer hover:bg-surface-active hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 text-[17px] font-bold text-foreground">Spiegazione</div>
        
        {explanation && !loading && exerciseId && (
          <button 
            onClick={toggleFavorite}
            className={`p-2 rounded-xl transition-colors ${isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-foreground-muted hover:bg-surface-active hover:text-foreground'}`}
          >
            <Star size={22} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
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

        {/* CHAT MESSAGES */}
        {explanation && !loading && (
          <div className="mt-8 flex flex-col gap-4">
            {chatMessages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 text-[15px] ${
                  msg.role === 'user' 
                  ? 'bg-primary text-background rounded-br-none' 
                  : 'bg-surface border border-surface-border text-foreground rounded-bl-none shadow-sm'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <Bot size={14} /> Tutor StudiAI
                    </div>
                  )}
                  <div className="leading-relaxed whitespace-pre-wrap md-content katex-display-chat">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {chatLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-surface border border-surface-border text-foreground rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                  <Loader2 size={16} className="text-primary animate-spin" />
                  <span className="text-sm text-foreground-subtle italic">Il tutor sta scrivendo...</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* CHAT INPUT AREA */}
        {explanation && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 mb-8">
            {!isPremium ? (
              <div onClick={() => setScreen('paywall')} className="cursor-pointer group relative">
                <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-all rounded-full" />
                <div className="relative border border-surface-border bg-surface/50 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Crown size={20} fill="currentColor" />
                  </div>
                  <div className="flex-1 text-sm font-medium text-foreground-subtle">
                    Hai dubbi su questa spiegazione? <span className="text-primary font-bold block sm:inline">Chiedi al Tutor Pro →</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {chatMessages.length === 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {["Spiegami meglio il passaggio 2", "Fammi un esempio simile", "Quale formula hai usato?"].map((suggestion, i) => (
                      <button 
                        key={i}
                        onClick={() => { setChatInput(suggestion); setTimeout(submitChat, 100); }}
                        className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full px-3 py-1.5 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 bg-surface border border-primary/30 rounded-2xl p-2 px-3 shadow-[0_0_20px_rgba(255,214,0,0.05)] focus-within:border-primary transition-colors">
                  <textarea 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitChat();
                      }
                    }}
                    placeholder="Chiedi un chiarimento al tutor..." 
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-foreground-muted resize-none max-h-32 min-h-[40px] py-2"
                    rows={1}
                  />
                  <button 
                    onClick={submitChat}
                    disabled={!chatInput.trim() || chatLoading}
                    className="bg-primary text-background p-2.5 rounded-xl cursor-pointer hover:bg-primary-hover disabled:opacity-50 disabled:cursor-default transition-all mb-0.5"
                  >
                    <Send size={18} className={chatInput.trim() ? "translate-x-0.5" : ""} />
                  </button>
                </div>
              </div>
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

      {/* Toast Notification (Stile WhatsApp) */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%', transition: { duration: 0.2 } }}
            className="fixed bottom-24 left-1/2 z-[100] px-6 py-3 bg-zinc-900/95 backdrop-blur-md text-yellow-400 rounded-full shadow-2xl flex items-center gap-3 min-w-[200px] justify-center border border-white/10"
          >
            <span className="text-[14px] font-bold tracking-tight">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
