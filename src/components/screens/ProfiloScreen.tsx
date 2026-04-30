'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, User, School, Book, CheckCircle2 } from 'lucide-react'

export default function ProfiloScreen({ onBack, profiloAttuale, onSave, user }: { onBack: () => void; profiloAttuale: { scuola?: string; classe?: string; materie?: string[] }; onSave: (p: any) => void; user?: any }) {
  const [nome, setNome] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '')
  const [scuola, setScuola] = useState(profiloAttuale.scuola || '')
  const [classe, setClasse] = useState(profiloAttuale.classe || '')
  const [materie, setMaterie] = useState<string[]>(profiloAttuale.materie || [])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleMateria(m: string) {
    setMaterie(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  async function salva() {
    setLoading(true)

    if (nome.trim() && nome.trim() !== (user?.user_metadata?.full_name || user?.user_metadata?.name)) {
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { full_name: nome.trim() } })
    }

    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scuola, classe, materie, onboarding_done: true })
    })
    onSave({ scuola, classe, materie })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const scuole = ['Liceo Scientifico', 'Liceo Classico', 'Istituto Tecnico', 'Scuola Media', 'Altro']
  const classi = scuola === 'Scuola Media' ? ['1ª media', '2ª media', '3ª media'] : ['1ª', '2ª', '3ª', '4ª', '5ª']
  const materieList = ['Matematica', 'Fisica', 'Chimica', 'Informatica']
  
  const btnBase = "border rounded-xl px-4 py-2.5 text-sm cursor-pointer font-semibold transition-all duration-200"
  const btnActive = `${btnBase} bg-primary text-background border-primary shadow-sm shadow-primary/20 scale-105`
  const btnInactive = `${btnBase} bg-surface-active text-foreground-subtle border-surface-border hover:bg-surface-hover hover:text-foreground`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl bg-transparent border-none text-foreground-muted cursor-pointer hover:bg-surface-active hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="text-[17px] font-bold text-foreground">Il tuo profilo</div>
      </header>
      
      <main className="flex-1 p-6 max-w-[540px] mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 mb-8">
          
          <div>
            <div className="flex items-center gap-2 text-[13px] font-extrabold text-primary mb-3 uppercase tracking-wider">
              <User size={16} /> Come ti chiami?
            </div>
            <input 
              type="text" 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              placeholder="Il tuo nome" 
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3.5 text-[15px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 text-[13px] font-extrabold text-primary mb-3 uppercase tracking-wider">
              <School size={16} /> Che scuola frequenti?
            </div>
            <div className="flex flex-wrap gap-2.5">
              {scuole.map(s => (
                <button key={s} onClick={() => { setScuola(s); setClasse('') }} className={scuola === s ? btnActive : btnInactive}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {scuola && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex items-center gap-2 text-[13px] font-extrabold text-primary mb-3 uppercase tracking-wider mt-2">
                  <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-primary rounded-full" /></div>
                  Che classe sei?
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {classi.map(c => (
                    <button key={c} onClick={() => setClasse(c)} className={classe === c ? btnActive : btnInactive}>
                      {c}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <div className="flex items-center gap-2 text-[13px] font-extrabold text-primary mb-3 uppercase tracking-wider">
              <Book size={16} /> Materie difficili?
            </div>
            <div className="flex flex-wrap gap-2.5">
              {materieList.map(m => (
                <button key={m} onClick={() => toggleMateria(m)} className={materie.includes(m) ? btnActive : btnInactive}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.button 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          whileHover={(!scuola || !classe || !nome.trim() || loading) ? {} : { scale: 1.02 }}
          whileTap={(!scuola || !classe || !nome.trim() || loading) ? {} : { scale: 0.98 }}
          onClick={salva} 
          disabled={!scuola || !classe || !nome.trim() || loading} 
          className={`w-full p-4 border-none rounded-[16px] text-[16px] font-extrabold transition-all flex items-center justify-center gap-2 ${
            (!scuola || !classe || !nome.trim()) 
            ? 'bg-surface-active text-foreground-subtle cursor-default shadow-none' 
            : 'bg-primary text-background cursor-pointer hover:bg-primary-hover shadow-lg shadow-primary/25'
          }`}
        >
          {loading ? 'Salvataggio...' : saved ? <><CheckCircle2 size={20} /> Salvato!</> : 'Salva modifiche'}
        </motion.button>
      </main>
    </div>
  )
}
