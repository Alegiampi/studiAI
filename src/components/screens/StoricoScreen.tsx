'use client'

import { useState, useEffect, useMemo } from 'react'
import ExplanationRenderer from '@/components/exercise/ExplanationRenderer'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen, Clock, AlertCircle, Search, Star, Share2, Tag, Activity, Triangle, Divide, Calculator, FunctionSquare, LayoutGrid, Zap, Variable, Infinity, Link } from 'lucide-react'

const SUBJECT_STYLES: Record<string, { color: string, icon: any, label: string }> = {
  'derivata': { color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: Zap, label: 'Derivata' },
  'integrale': { color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200', icon: FunctionSquare, label: 'Integrale' },
  'funzione': { color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200', icon: Variable, label: 'Funzione' },
  'geometria_analitica': { color: 'bg-orange-500/10 text-orange-600 border-orange-200', icon: Triangle, label: 'Geometria' },
  'trigonometria': { color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: Triangle, label: 'Trigonometria' },
  'limite': { color: 'bg-purple-500/10 text-purple-600 border-purple-200', icon: Infinity, label: 'Limite' },
  'algebra': { color: 'bg-sky-500/10 text-sky-600 border-sky-200', icon: Divide, label: 'Algebra' },
  'equazione': { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', icon: Calculator, label: 'Equazione' },
  'altro': { color: 'bg-slate-500/10 text-slate-600 border-slate-200', icon: BookOpen, label: 'Altro' },
  'Tutti': { color: 'bg-primary text-white border-primary', icon: LayoutGrid, label: 'Tutti' },
  'Preferiti': { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: Star, label: 'Preferiti' }
}

export default function StoricoScreen({ onBack }: { onBack: () => void }) {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('Tutti')
  const [sharingId, setSharingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ text: string; visible: boolean }>({ text: '', visible: false })

  const showNotification = (text: string) => {
    setToast({ text, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500)
  }

  useEffect(() => {
    fetch('/api/exercises').then(r => r.json()).then(data => { setExercises(data); setLoading(false) })
  }, [])

  const subjects = useMemo(() => {
    const subs = new Set<string>()
    exercises.forEach(ex => {
      if (ex.subject) subs.add(ex.subject)
    })
    return ['Tutti', 'Preferiti', ...Array.from(subs).sort()]
  }, [exercises])

  const filteredExercises = useMemo(() => {
    let result = exercises

    if (selectedSubject === 'Preferiti') {
      result = result.filter(ex => ex.is_favorite)
    } else if (selectedSubject !== 'Tutti') {
      result = result.filter(ex => ex.subject === selectedSubject)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(ex => 
        (ex.question || '').toLowerCase().includes(query) || 
        (ex.subject || '').toLowerCase().includes(query)
      )
    }

    return result
  }, [exercises, searchQuery, selectedSubject])

  const recentExercises = useMemo(() => {
    // Prendiamo i 5 più recenti in ordine di data assoluta
    return [...exercises]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [exercises])

  const groupedExercises = useMemo(() => {
    const groups: Record<string, any[]> = {}
    
    // Raggruppamento per materia
    filteredExercises.forEach(ex => {
      const subject = ex.subject && ex.subject !== 'Altro' ? 
        ex.subject.charAt(0).toUpperCase() + ex.subject.slice(1) : 
        'Generico'
      
      if (!groups[subject]) groups[subject] = []
      groups[subject].push(ex)
    })

    // Ordina i gruppi: "Preferiti" logici sono già ordinati dal server, 
    // ma qui raggruppiamo alfabeticamente per materia
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredExercises])

  async function toggleFavorite(e: React.MouseEvent, id: number, currentFav: boolean) {
    e.stopPropagation()
    const newFav = !currentFav
    
    // Aggiornamento ottimistico
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, is_favorite: newFav } : ex))
    
    showNotification(newFav ? 'Aggiunto ai preferiti!' : 'Rimosso dai preferiti')

    await fetch('/api/exercises', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_favorite: newFav })
    })
  }

  async function handleShareExercise(e: React.MouseEvent, exercise: any) {
    e.stopPropagation()
    setSharingId(exercise.id)

    let shareUrl = ''

    if (exercise.shared_id) {
      shareUrl = window.location.origin + '/s/' + exercise.shared_id
    } else {
      // Crea nuovo share
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: exercise.question || '', 
          explanation: exercise.explanation 
        })
      })
      const data = await res.json()
      
      if (data.id) {
        shareUrl = window.location.origin + '/s/' + data.id
        // Salva l'id generato nel db
        await fetch('/api/exercises', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: exercise.id, shared_id: data.id })
        })
        // Aggiorna lo stato locale
        setExercises(prev => prev.map(ex => ex.id === exercise.id ? { ...ex, shared_id: data.id } : ex))
      }
    }

    if (shareUrl) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Spiegazione theLemma',
            text: 'Guarda questa spiegazione passo-passo su theLemma!',
            url: shareUrl
          })
        } catch (err) {
          try { await navigator.clipboard.writeText(shareUrl); showNotification('Link copiato!') } catch {}
        }
      } else {
        try { await navigator.clipboard.writeText(shareUrl); showNotification('Link copiato!') } catch {}
      }
    }
    setSharingId(null)
  }

  if (selected) return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setSelected(null)} className="p-2 -ml-2 rounded-xl bg-transparent border-none text-foreground-muted cursor-pointer hover:bg-surface-active hover:text-foreground transition-colors flex-shrink-0">
            <ChevronLeft size={24} />
          </button>
          <div className="text-[17px] font-bold text-foreground truncate">{selected.question || 'Esercizio'}</div>
        </div>
        <button 
          onClick={(e) => handleShareExercise(e, selected)}
          disabled={sharingId === selected.id}
          className="p-2 rounded-xl bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors flex-shrink-0"
        >
          {sharingId === selected.id ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Share2 size={20} />}
        </button>
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="sticky top-0 z-20 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl bg-transparent border-none text-foreground-muted cursor-pointer hover:bg-surface-active hover:text-foreground transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="text-[17px] font-bold text-foreground">Il tuo Storico</div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={18} />
          <input 
            type="text" 
            placeholder="Cerca per testo o materia..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-[15px] text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        
        {/* Chips Filtri Materie */}
        {!loading && subjects.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
                {subjects.map(sub => {
                  const style = SUBJECT_STYLES[sub] || SUBJECT_STYLES['altro']
                  const isSelected = selectedSubject === sub
                  const Icon = style.icon

                  return (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all border flex items-center gap-2 ${
                        isSelected 
                          ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' 
                          : 'bg-surface border-surface-border text-foreground-muted hover:border-primary/30'
                      }`}
                    >
                      <Icon size={14} fill={isSelected && sub === 'Preferiti' ? "white" : "none"} />
                      {sub === 'Preferiti' ? 'Preferiti' : (style.label || sub)}
                    </button>
                  )
                })}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-10">
        <div className="max-w-[640px] mx-auto w-full p-5">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center p-12 text-foreground-muted">
                <div className="w-8 h-8 border-4 border-surface-active border-t-primary rounded-full animate-spin mb-4" />
                <div className="text-[15px] font-medium">Caricamento...</div>
              </motion.div>
            ) : filteredExercises.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-surface-active rounded-full flex items-center justify-center text-foreground-subtle mb-4">
                  {searchQuery ? <Search size={32} /> : <AlertCircle size={32} />}
                </div>
                <div className="text-[16px] font-bold text-foreground mb-1">
                  {searchQuery ? 'Nessun risultato' : 'Nessun esercizio'}
                </div>
                <div className="text-[14px] text-foreground-subtle">
                  {searchQuery ? 'Prova a usare termini diversi.' : 'Non hai ancora risolto nessun esercizio. Torna alla home e inizia a studiare!'}
                </div>
              </motion.div>
            ) : (
              <motion.div key="list" initial="hidden" animate="visible" variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}>
                
                {/* Sezione Recenti - Solo se "Tutti" e nessuna ricerca */}
                {selectedSubject === 'Tutti' && !searchQuery && recentExercises.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-2 text-foreground font-bold text-[16px]">
                        <Clock size={18} className="text-primary" /> Recenti
                      </div>
                      <div className="text-[12px] text-foreground-muted font-medium">Scorri →</div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar">
                      {recentExercises.map((ex) => (
                        <div 
                          key={`recent-${ex.id}`}
                          onClick={() => setSelected(ex)}
                          className="flex-shrink-0 w-[200px] bg-surface/50 backdrop-blur-sm border border-surface-border rounded-2xl p-4 cursor-pointer hover:border-primary/40 transition-all hover:bg-surface"
                        >
                          <div className="text-[13px] text-foreground font-semibold line-clamp-3 leading-snug mb-3 h-[48px]">
                            {ex.question || 'Esercizio con foto'}
                          </div>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-[10px] text-foreground-subtle font-medium">
                              {new Date(ex.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                            </span>
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <ChevronRight size={14} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupedExercises.map(([subject, exs]) => (
                <div key={subject} className="mb-8">
                  <div className="flex items-center gap-2 text-foreground-muted font-bold text-[14px] uppercase tracking-wider mb-4 px-1">
                    <Tag size={16} /> {subject}
                  </div>
                  {exs.map((ex, i) => (
                    <motion.div 
                      key={ex.id || i} 
                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                      onClick={() => setSelected(ex)} 
                      className="bg-surface border border-surface-border rounded-2xl p-4 mb-3 cursor-pointer flex flex-col group hover:border-primary/30 transition-all hover:shadow-md relative overflow-hidden"
                    >
                      {/* Preferiti evidenziazione sfondo leggera */}
                      {ex.is_favorite && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
                      
                      <div className="flex justify-between items-start mb-3 gap-3 z-10">
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="text-[15px] text-foreground font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                            {ex.question || 'Esercizio con foto'}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => toggleFavorite(e, ex.id, ex.is_favorite)}
                          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${ex.is_favorite ? 'text-primary bg-primary/10' : 'text-foreground-muted hover:bg-surface-active hover:text-foreground'}`}
                        >
                          <Star size={18} fill={ex.is_favorite ? "currentColor" : "none"} />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center z-10">
                        <div className="text-[12px] text-foreground-subtle flex items-center gap-1.5 font-medium">
                          <Clock size={12} />
                          {new Date(ex.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => handleShareExercise(e, ex)}
                            className="p-1.5 text-foreground-muted hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                            disabled={sharingId === ex.id}
                          >
                            {sharingId === ex.id ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Share2 size={16} />}
                          </button>
                          <div className="w-7 h-7 rounded-full bg-surface-active flex items-center justify-center text-foreground-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* Toast Notification (Stile WhatsApp) */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%', transition: { duration: 0.2 } }}
            className="fixed bottom-10 left-1/2 z-[100] px-6 py-3 bg-zinc-900/95 backdrop-blur-md text-yellow-400 rounded-full shadow-2xl flex items-center gap-3 min-w-[200px] justify-center border border-white/10"
          >
            <span className="text-[14px] font-bold tracking-tight">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
