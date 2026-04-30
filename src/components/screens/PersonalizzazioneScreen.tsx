'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { User, School, Book } from 'lucide-react'

export default function PersonalizzazioneScreen({ onDone, user }: { onDone: (data: { scuola: string; classe: string; materie: string[] }) => void, user?: any }) {
  const [nome, setNome] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || '')
  const [scuola, setScuola] = useState('')
  const [classe, setClasse] = useState('')
  const [materie, setMaterie] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

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
    setLoading(false)
    onDone({ scuola, classe, materie })
  }

  const scuole = ['Liceo Scientifico', 'Liceo Classico', 'Istituto Tecnico', 'Scuola Media', 'Altro']
  const classi = scuola === 'Scuola Media' ? ['1ª media', '2ª media', '3ª media'] : ['1ª', '2ª', '3ª', '4ª', '5ª']
  const materieList = ['Matematica', 'Fisica', 'Chimica', 'Informatica']
  
  const btnBase = "border rounded-xl px-4 py-2.5 text-sm cursor-pointer font-semibold transition-all duration-200"
  const btnActive = `${btnBase} bg-primary text-background border-primary shadow-sm shadow-primary/20 scale-105`
  const btnInactive = `${btnBase} bg-surface-active text-foreground-subtle border-surface-border hover:bg-surface-hover hover:text-foreground`

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <main className="w-full max-w-[480px] relative z-10 bg-surface/50 p-8 rounded-[32px] border border-surface-border/50 backdrop-blur-xl shadow-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Personalizziamo</h1>
          <p className="text-[15px] font-medium text-foreground-muted">Così le spiegazioni saranno calibrate sul tuo livello.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-7">
          
          <div>
            <div className="flex items-center gap-2 text-[13px] font-extrabold text-primary mb-3 uppercase tracking-wider">
              <User size={16} /> Come ti chiami?
            </div>
            <input 
              type="text" 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              placeholder="Il tuo nome" 
              className="w-full bg-surface-active border border-surface-border rounded-xl px-4 py-3.5 text-[15px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
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
          
          <div className="pb-4">
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
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-col gap-3">
          <motion.button 
            whileHover={(!scuola || !classe || !nome.trim() || loading) ? {} : { scale: 1.02 }}
            whileTap={(!scuola || !classe || !nome.trim() || loading) ? {} : { scale: 0.98 }}
            onClick={salva} 
            disabled={!scuola || !classe || !nome.trim() || loading} 
            className={`w-full p-4 border-none rounded-[16px] text-[16px] font-extrabold transition-all ${
              (!scuola || !classe || !nome.trim()) 
              ? 'bg-surface-active text-foreground-subtle cursor-default shadow-none' 
              : 'bg-primary text-background cursor-pointer hover:bg-primary-hover shadow-lg shadow-primary/25'
            }`}
          >
            {loading ? 'Attendi...' : 'Inizia a studiare →'}
          </motion.button>
          
          <button 
            onClick={() => { 
              fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboarding_done: true }) }); 
              onDone({ scuola: '', classe: '', materie: [] }) 
            }} 
            className="w-full p-3 bg-transparent border-none text-foreground-subtle text-[14px] font-medium cursor-pointer hover:text-foreground transition-colors"
          >
            Salta per ora
          </button>
        </motion.div>
      </main>
    </div>
  )
}
