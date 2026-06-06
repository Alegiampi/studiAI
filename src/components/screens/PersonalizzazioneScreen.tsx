'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, School, Book, Sparkles, GraduationCap } from 'lucide-react'
import { useStore } from '@/store/useStore'

export default function PersonalizzazioneScreen() {
  const { user, saveProfile, setShowOnboarding, setShowPersonalizzazione } = useStore()
  
  const [nome, setNome] = useState('')
  const [scuola, setScuola] = useState('')
  const [classe, setClasse] = useState('')
  const [materie, setMaterie] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [prevUser, setPrevUser] = useState(user)
  if (user !== prevUser) {
    setPrevUser(user)
    if (user) {
      setNome(user?.user_metadata?.full_name || user?.user_metadata?.name || '')
    }
  }

  function toggleMateria(m: string) {
    setMaterie(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  async function salva() {
    setLoading(true)
    try {
      await saveProfile(nome, { scuola, classe, materie, onboarding_done: true })
    } catch (e) {
      console.error('Error saving profile:', e)
    } finally {
      setLoading(false)
    }
  }

  async function salta() {
    setLoading(true)
    try {
      // Salva solo onboarding_done sul database
      await fetch('/api/profile', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ onboarding_done: true }) 
      })
      // Disabilita localmente le schermate di onboarding e personalizzazione per far passare l'utente
      setShowOnboarding(false)
      setShowPersonalizzazione(false)
    } catch (e) {
      console.error('Error skipping personalization:', e)
    } finally {
      setLoading(false)
    }
  }

  const scuole = ['Liceo Scientifico', 'Liceo Classico', 'Istituto Tecnico', 'Scuola Media', 'Altro']
  const classi = scuola === 'Scuola Media' ? ['1ª media', '2ª media', '3ª media'] : ['1ª', '2ª', '3ª', '4ª', '5ª']
  const materieList = ['Matematica', 'Fisica', 'Chimica', 'Informatica']
  
  const btnBase = "border rounded-xl px-4 py-3 text-[14px] cursor-pointer font-bold transition-all duration-300"
  const btnActive = `${btnBase} bg-primary text-background border-primary shadow-[0_8px_20px_rgba(255,214,0,0.25)] scale-105 z-10`
  const btnInactive = `${btnBase} bg-surface-active text-foreground-subtle border-surface-border hover:bg-surface-hover hover:text-foreground`

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-outfit">
      {/* Sfondo dinamico */}
      <motion.div 
        animate={{ 
          x: [0, -30, 20, 0], 
          y: [0, 40, -20, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" 
      />
      
      <main className="w-full max-w-[520px] relative z-10 bg-surface/40 p-10 rounded-[32px] border border-surface-border/50 backdrop-blur-2xl shadow-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
             <GraduationCap size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Personalizziamo</h1>
          <p className="text-[16px] font-medium text-foreground-muted">Così le spiegazioni saranno calibrate sul tuo livello.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-8">
          
          <div>
            <div className="flex items-center gap-2 text-[12px] font-black text-primary mb-4 uppercase tracking-widest opacity-80">
              <User size={14} /> Come ti chiami?
            </div>
            <input 
              type="text" 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              placeholder="Il tuo nome" 
              className="w-full bg-surface-active border-2 border-surface-border rounded-2xl px-5 py-4 text-[16px] text-foreground outline-none focus:border-primary focus:ring-0 transition-all font-bold placeholder:text-foreground-subtle"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 text-[12px] font-black text-primary mb-4 uppercase tracking-widest opacity-80">
              <School size={14} /> Che scuola frequenti?
            </div>
            <div className="flex flex-wrap gap-2.5">
              {scuole.map(s => (
                <button key={s} onClick={() => { setScuola(s); setClasse('') }} className={scuola === s ? btnActive : btnInactive}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {scuola && (
              <motion.div 
                key={scuola}
                initial={{ opacity: 0, height: 0, y: -10 }} 
                animate={{ opacity: 1, height: 'auto', y: 0 }} 
                exit={{ opacity: 0, height: 0, y: -10 }} 
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 text-[12px] font-black text-primary mb-4 uppercase tracking-widest opacity-80 mt-2">
                  <Sparkles size={14} /> Che classe sei?
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
            <div className="flex items-center gap-2 text-[12px] font-black text-primary mb-4 uppercase tracking-widest opacity-80">
              <Book size={14} /> Materie preferite?
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
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-10 flex flex-col gap-4">
          <motion.button 
            whileHover={(!scuola || !classe || !nome.trim() || loading) ? {} : { scale: 1.02, y: -2 }}
            whileTap={(!scuola || !classe || !nome.trim() || loading) ? {} : { scale: 0.98 }}
            onClick={salva} 
            disabled={!scuola || !classe || !nome.trim() || loading} 
            className={`w-full py-5 border-none rounded-[22px] text-[17px] font-black transition-all ${
              (!scuola || !classe || !nome.trim()) 
              ? 'bg-surface-active text-foreground-subtle cursor-default shadow-none' 
              : 'bg-primary text-background cursor-pointer hover:bg-primary-hover shadow-[0_12px_40px_rgba(255,214,0,0.25)]'
            }`}
          >
            {loading ? 'Attendi...' : 'Inizia a studiare →'}
          </motion.button>
          
          <button 
            onClick={salta}
            disabled={loading}
            className="w-full p-3 bg-transparent border-none text-foreground-subtle text-[14px] font-bold cursor-pointer hover:text-foreground transition-colors disabled:opacity-50"
          >
            Salta per ora
          </button>
        </motion.div>
      </main>
    </div>
  )
}
