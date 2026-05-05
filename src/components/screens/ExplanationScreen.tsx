'use client'

import ExplanationRenderer from '@/components/exercise/ExplanationRenderer'
import GraficoMafs from '@/components/exercise/GraficoMafs'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Share2, Copy, Plus, BarChart2, Loader2, CheckCircle2, Crown, Send, Bot, Star, Link, Sparkles, Brain, Search, Layout, Lightbulb, Calculator, Zap } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useToast } from '@/hooks/useToast'

export const AI_STEPS = [
  { label: "Analisi dell'input...", icon: <Search size={18} /> },
  { label: "Identificazione concetti chiave...", icon: <Lightbulb size={18} /> },
  { label: "Elaborazione passaggi logici...", icon: <Brain size={18} /> },
  { label: "Risoluzione equazioni...", icon: <Calculator size={18} /> },
  { label: "Formattazione spiegazione...", icon: <Layout size={18} /> },
  { label: "Finalizzazione...", icon: <Sparkles size={18} /> },
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
  const { showToast } = useToast()
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [chatInput, setChatInput] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showFAB, setShowFAB] = useState(false)

  // Scroll handler for FAB
  useEffect(() => {
    const main = chatRef.current
    if (!main) return
    const handleScroll = () => {
      if (!main) return
      const isNearBottom = main.scrollHeight - main.scrollTop - main.clientHeight < 300
      
      // Mostra il FAB sempre, a meno che non siamo già arrivati alla chat in fondo
      setShowFAB(!isNearBottom)
    }
    main.addEventListener('scroll', handleScroll)
    // Eseguiamo un controllo immediato con un piccolo delay per il layout
    const timeout = setTimeout(handleScroll, 100)
    return () => {
      main.removeEventListener('scroll', handleScroll)
      clearTimeout(timeout)
    }
  }, [loading, explanation])

  useEffect(() => {
    if (!loading) {
      setCurrentStep(0)
      return
    }
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % AI_STEPS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [loading])

  useEffect(() => {
    if (shareUrl) {
      showToast('Link copiato!', 'success')
    }
  }, [shareUrl])

  async function toggleFavorite() {
    if (!exerciseId) return
    const newFav = !isFavorite
    setIsFavorite(newFav)
    showToast(newFav ? 'Aggiunto ai preferiti!' : 'Rimosso dai preferiti', 'success')
    
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

  // Auto-expand textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [chatInput])

  const onAskTutor = (stepTitle: string, stepBody: string) => {
    const question = `Non mi è chiaro il passaggio "${stepTitle}". Puoi spiegarmelo meglio?`
    setChatInput(question)
    // Scroll to chat input
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="h-screen bg-background flex flex-col relative overflow-hidden">
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
        .md-content { line-height: 1.6; text-align: justify; hyphens: auto; }
        .md-content p { margin-bottom: 0.6rem; }
        .md-content p:last-child { margin-bottom: 0; }
        .md-content ul, .md-content ol { padding-left: 1.2rem; margin-bottom: 0.6rem; }
        .md-content ul { list-style-type: disc; }
        .md-content ol { list-style-type: decimal; }
        .md-content li { margin-bottom: 0.3rem; }
        .md-content strong { color: var(--color-foreground); font-weight: 700; }
        .katex { color: var(--color-foreground) !important; font-size: 1.1em; font-weight: 500; }
        .katex-display { 
          margin: 0.6rem 0 !important; 
          padding: 0.2rem 0; 
          overflow-x: auto; 
          text-align: center;
        }
        .katex-display .katex { color: var(--color-foreground) !important; }
      `}</style>
      <header className="sticky top-0 z-20 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl bg-transparent border-none text-foreground-muted cursor-pointer hover:bg-surface-active hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="logo-loading"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1.5"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles size={16} className="text-primary" />
                </motion.div>
                <span className="text-[18px] font-extrabold tracking-tight">
                  <span className="logo-shimmer logo-shimmer-the">the</span>
                  <span className="logo-shimmer">Lemma</span>
                </span>
                <motion.div
                  animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <Sparkles size={14} className="text-primary/60" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="title-done"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-[17px] font-bold text-foreground"
              >
                Spiegazione
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 relative">
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
            <div className="space-y-4 relative z-10">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 opacity-40">
                  <div className="w-1.5 bg-surface-active rounded-full shrink-0" />
                  <div className="flex-1 bg-surface/50 border border-surface-border rounded-[24px] overflow-hidden backdrop-blur-sm">
                    <div className="bg-surface-active/50 px-5 py-4 border-b border-surface-border/50">
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
          </motion.div>
        ) : explanation ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ExplanationRenderer 
              text={explanation} 
              esercizio={exercise?.text || ''} 
              onAskTutor={onAskTutor}
            />
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
          <div className="mt-12 flex flex-col gap-6">
            {/* Tutor Profile Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-[32px] p-6 mb-4 flex items-center gap-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={80} className="text-primary" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-background shadow-xl shadow-primary/20 shrink-0 relative z-10">
                <Bot size={32} />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-foreground mb-1">Tutor <span className="font-light opacity-60">the</span>Lemma</h3>
                <p className="text-sm text-foreground-muted leading-snug">Il tuo assistente intelligente. Chiedimi qualsiasi cosa sulla spiegazione qui sopra!</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-success">Online ora</span>
                </div>
              </div>
            </motion.div>

            {chatMessages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 text-[15px] shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-primary text-background rounded-br-none' 
                  : 'bg-surface border border-surface-border text-foreground rounded-bl-none'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-primary font-bold text-[11px] uppercase tracking-widest">
                      <Bot size={14} /> Tutor AI
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
                <div className="bg-surface border border-surface-border text-foreground rounded-2xl rounded-bl-none p-4 flex items-center gap-2 shadow-sm">
                  <Loader2 size={16} className="text-primary animate-spin" />
                  <span className="text-sm text-foreground-subtle italic font-medium">Il tutor sta elaborando...</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* CHAT INPUT AREA */}
        {explanation && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 mb-12">
            {!isPremium ? (
              <div onClick={() => setScreen('paywall')} className="cursor-pointer group relative">
                <div className="absolute inset-0 bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all rounded-[32px]" />
                <div className="relative border-2 border-primary/30 bg-surface/50 backdrop-blur-md rounded-[28px] p-6 flex items-center gap-4 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-yellow-500 flex items-center justify-center text-background shrink-0 shadow-lg">
                    <Crown size={28} fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-foreground mb-0.5">Hai ancora dei dubbi?</div>
                    <div className="text-[13px] text-foreground-subtle leading-snug">
                      Sblocca il <span className="text-primary font-black">Tutor Pro</span> per chattare senza limiti e risolvere ogni incertezza.
                    </div>
                  </div>
                  <ChevronLeft className="rotate-180 text-primary" size={24} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {chatMessages.length <= 1 && (
                  <div className="flex flex-wrap gap-2 mb-1">
                    {["Spiegami meglio l'ultimo passaggio", "Fammi un esempio simile", "Quale formula hai usato?"].map((suggestion, i) => (
                      <button 
                        key={i}
                        onClick={() => { setChatInput(suggestion); setTimeout(submitChat, 100); }}
                        className="text-[13px] font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full px-4 py-2 transition-all hover:scale-105 active:scale-95"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-yellow-500/20 rounded-[22px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                  <div className="relative flex items-end gap-2 bg-surface border-2 border-primary/20 rounded-[20px] p-2.5 px-4 shadow-lg focus-within:border-primary focus-within:shadow-primary/10 transition-all">
                    <textarea 
                      ref={inputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitChat();
                        }
                      }}
                      placeholder="Chiedi un chiarimento al tutor..." 
                      className="flex-1 bg-transparent border-none outline-none text-[16px] text-foreground placeholder:text-foreground-muted resize-none max-h-48 min-h-[44px] py-2.5 leading-normal"
                      rows={1}
                    />
                    <button 
                      onClick={submitChat}
                      disabled={!chatInput.trim() || chatLoading}
                      className="bg-primary text-background p-3 rounded-xl cursor-pointer hover:bg-primary-hover disabled:opacity-50 disabled:cursor-default transition-all mb-0.5 shadow-md shadow-primary/20"
                    >
                      <Send size={20} className={chatInput.trim() ? "translate-x-0.5" : ""} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Floating Assistant Button (FAB) */}
      <AnimatePresence>
        {showFAB && !loading && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ 
              layout: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            onClick={() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })}
            className="fixed bottom-24 right-6 z-40 h-14 rounded-2xl bg-primary text-background flex items-center shadow-2xl shadow-primary/30 border-none cursor-pointer hover:scale-105 active:scale-95 transition-transform overflow-hidden group px-3.5"
          >
            <motion.div layout className="flex items-center gap-3">
              <Bot size={28} className="shrink-0" />
              <AnimatePresence mode="popLayout">
                {chatMessages.length <= 1 && (
                  <motion.span 
                    layout
                    initial={{ opacity: 0, width: 0, x: -10 }}
                    animate={{ opacity: 1, width: "auto", x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-[14px] font-black whitespace-nowrap overflow-hidden"
                  >
                    Chiedi al Tutor
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
            
            <motion.div 
              layout
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-2 right-2 w-2.5 h-2.5 bg-success rounded-full border-2 border-primary"
            />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 inset-x-0 z-20 px-4 flex justify-center pointer-events-none">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          className="bg-surface/80 backdrop-blur-2xl border border-surface-border p-2 rounded-[24px] shadow-2xl flex items-center gap-2 pointer-events-auto"
        >
          {explanation && !loading && (
            <button 
              onClick={handleShare} 
              disabled={shareLoading || !!shareUrl} 
              className={`flex items-center gap-2 h-12 px-5 rounded-[18px] border text-[14px] font-bold transition-all ${
                shareUrl 
                  ? 'bg-success/10 border-success/30 text-success cursor-default' 
                  : 'bg-surface/50 border-surface-border text-foreground hover:bg-surface-active hover:border-primary/50 cursor-pointer'
              }`}
            >
              {shareLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : shareUrl ? (
                <CheckCircle2 size={18} />
              ) : (
                <Share2 size={18} />
              )}
              <span className="hidden sm:inline">{shareUrl ? 'Link Copiato!' : 'Condividi'}</span>
              <span className="sm:hidden">{shareUrl ? 'Copiato!' : 'Invia'}</span>
            </button>
          )}
          
          <button 
            onClick={onBack} 
            className="flex items-center justify-center gap-2 h-12 px-8 rounded-[18px] bg-primary border-none text-background font-black cursor-pointer text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Nuovo Esercizio
          </button>
        </motion.div>
      </div>

    </div>
  )
}
