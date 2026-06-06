'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'

import { SupabaseClient } from '@supabase/supabase-js'

function AuthModal({ onClose, supabase, isEmbedded = false }: { onClose?: () => void; supabase: SupabaseClient; isEmbedded?: boolean }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function loginConGoogle() {
    const redirectTo = `${window.location.origin}/auth/callback`
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo } 
    })
  }

  async function handleEmail() {
    if (!email || !password) return
    if (mode === 'signup' && password !== confirmPassword) {
      setMsg('Le password non coincidono.')
      return
    }
    setLoading(true)
    setMsg('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
      else if (onClose) onClose()
    } else {
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: redirectTo }
      })
      if (error) setMsg(error.message)
      else setMsg('Controlla la tua email per confermare la registrazione.')
    }
    setLoading(false)
  }

  const modalContent = (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="bg-surface/80 backdrop-blur-xl border border-surface-border rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[22px] font-extrabold text-foreground tracking-tight">
          {mode === 'login' ? 'Accedi' : 'Crea Account'}
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-2 -mr-2 bg-transparent border-none cursor-pointer text-foreground-muted hover:text-foreground hover:bg-surface-active rounded-xl transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <button 
        onClick={loginConGoogle} 
        className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-[14px] text-[15px] font-bold text-gray-900 cursor-pointer flex items-center justify-center gap-3 mb-6 transition-all shadow-sm"
      >
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continua con Google
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-[1px] bg-surface-border" />
        <span className="text-[12px] font-semibold text-foreground-subtle uppercase tracking-wider">oppure via email</span>
        <div className="flex-1 h-[1px] bg-surface-border" />
      </div>

      <div className="space-y-3 mb-6">
        <input 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="La tua email" 
          type="email" 
          className="w-full py-3.5 px-4 bg-background border border-surface-border rounded-[14px] text-[15px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-foreground-muted" 
        />
        <input 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder={mode === 'login' ? 'La tua password' : 'Crea una password'} 
          type="password" 
          onKeyDown={e => e.key === 'Enter' && handleEmail()} 
          className="w-full py-3.5 px-4 bg-background border border-surface-border rounded-[14px] text-[15px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-foreground-muted" 
        />
        {mode === 'signup' && (
          <input 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            placeholder="Conferma password" 
            type="password" 
            onKeyDown={e => e.key === 'Enter' && handleEmail()} 
            className="w-full py-3.5 px-4 bg-background border border-surface-border rounded-[14px] text-[15px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-foreground-muted" 
          />
        )}
      </div>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`text-[13px] font-medium p-3 rounded-xl mb-6 ${msg.includes('email') ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
          {msg}
        </motion.div>
      )}

      <button 
        onClick={handleEmail} 
        disabled={loading || !email || !password || (mode === 'signup' && !confirmPassword)} 
        className="w-full py-3.5 px-4 bg-primary text-background border-none rounded-[14px] text-[15px] font-extrabold cursor-pointer hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex justify-center items-center gap-2 mb-6"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> Attendere...</> : mode === 'login' ? 'Accedi' : 'Registrati'}
      </button>

      <div className="text-center text-[14px] text-foreground-muted font-medium">
        {mode === 'login' ? 'Non hai un account? ' : 'Hai già un account? '}
        <button 
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(''); setConfirmPassword('') }} 
          className="text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
        >
          {mode === 'login' ? 'Registrati ora' : 'Accedi'}
        </button>
      </div>
    </motion.div>
  )

  if (isEmbedded) return modalContent

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[500] p-5">
      {modalContent}
    </div>
  )
}

export default AuthModal
