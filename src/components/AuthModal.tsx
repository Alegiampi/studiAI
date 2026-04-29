'use client'

import { useState } from 'react'

function AuthModal({ onClose, supabase }: { onClose?: () => void; supabase: any }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function loginConGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  async function handleEmail() {
    if (!email || !password) return
    setLoading(true)
    setMsg('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
      else if (onClose) onClose()
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMsg(error.message)
      else setMsg('Controlla la tua email per confermare la registrazione.')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD600' }}>{mode === 'login' ? 'Accedi' : 'Registrati'}</div>
          {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}>✕</button>}
        </div>
        <button onClick={loginConGoogle} style={{ width: '100%', padding: '11px', background: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, color: '#1A1A1A' }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continua con Google
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#3A3A3A' }} />
          <span style={{ fontSize: 12, color: '#888' }}>oppure</span>
          <div style={{ flex: 1, height: 1, background: '#3A3A3A' }} />
        </div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{ width: '100%', padding: '11px 14px', background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 10, fontSize: 14, color: '#E0E0E0', outline: 'none', marginBottom: 10 }} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" onKeyDown={e => e.key === 'Enter' && handleEmail()} style={{ width: '100%', padding: '11px 14px', background: '#1A1A1A', border: '1px solid #3A3A3A', borderRadius: 10, fontSize: 14, color: '#E0E0E0', outline: 'none', marginBottom: 16 }} />
        {msg && <div style={{ fontSize: 13, color: msg.includes('email') ? '#4ADE80' : '#FF6B6B', marginBottom: 12 }}>{msg}</div>}
        <button onClick={handleEmail} disabled={loading} style={{ width: '100%', padding: 12, background: '#FFD600', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#1A1A1A', marginBottom: 12 }}>
          {loading ? '...' : mode === 'login' ? 'Accedi' : 'Registrati'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>
          {mode === 'login' ? 'Non hai un account? ' : 'Hai già un account? '}
          <span onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg('') }} style={{ color: '#FFD600', cursor: 'pointer', fontWeight: 500 }}>
            {mode === 'login' ? 'Registrati' : 'Accedi'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
