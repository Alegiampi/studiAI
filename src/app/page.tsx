'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { createClient } from '@/lib/supabase'

const DAILY_LIMIT = 5

const FRASI_MOTIVAZIONALI = [
  "Un problema alla volta, verso la soluzione...",
  "Scaldando i motori della fisica...",
  "La matematica non è un'opinione, ma stiamo calcolando la migliore per te!",
  "Elaborando i dati, quasi pronto...",
  "Ricorda: ogni errore è un passo verso la comprensione.",
  "Mettendo in ordine i numeri..."
]

const MD = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
)

type Passo = {
  titolo: string
  corpo: string
  domanda?: string
  risposta?: string
  loadingRisposta?: boolean
}

function parseExplanation(text: string): { titolo: string; passi: Passo[]; finale: string } {
  const lines = text.split('\n')
  let titolo = ''
  const passi: Passo[] = []
  let finale = ''
  let currentPasso: Passo | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('TITOLO:')) {
      titolo = trimmed.replace('TITOLO:', '').trim()
    } else if (trimmed.match(/^PASSO \d+:/)) {
      if (currentPasso) passi.push(currentPasso)
      currentPasso = { titolo: trimmed.replace(/^PASSO \d+:/, '').trim(), corpo: '' }
    } else if (trimmed.startsWith('SUGGERIMENTI:')) {
      // ignoriamo i suggerimenti
    } else if (trimmed.startsWith('RISPOSTA FINALE:')) {
      if (currentPasso) { passi.push(currentPasso); currentPasso = null }
      finale = trimmed.replace('RISPOSTA FINALE:', '').trim()
    } else if (currentPasso) {
      currentPasso.corpo += (currentPasso.corpo ? ' ' : '') + trimmed
    }
  }
  if (currentPasso) passi.push(currentPasso)
  return { titolo, passi, finale }
}

function ExplanationRenderer({ text, esercizio }: { text: string; esercizio: string }) {
  const parsed = parseExplanation(text)
  const [passi, setPassi] = useState<Passo[]>(parsed.passi)
  const [openInput, setOpenInput] = useState<number | null>(null)
  const [inputs, setInputs] = useState<string[]>(parsed.passi.map(() => ''))

  async function chiedi(i: number, domanda: string) {
    const newPassi = [...passi]
    newPassi[i] = { ...newPassi[i], domanda, loadingRisposta: true, risposta: undefined }
    setPassi(newPassi)
    setOpenInput(null)
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'chiarimento',
        text: 'Esercizio: ' + esercizio + '. Passo "' + passi[i].titolo + '": ' + passi[i].corpo + '. Domanda: ' + domanda
      })
    })
    const data = await res.json()
    setPassi(prev => {
      const updated = [...prev]
      updated[i] = { ...updated[i], risposta: data.explanation, loadingRisposta: false }
      return updated
    })
    const newInputs = [...inputs]
    newInputs[i] = ''
    setInputs(newInputs)
  }

  return (
    <div>
      {parsed.titolo && (
        <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD600', marginBottom: 24, lineHeight: 1.4 }}>
          <MD>{parsed.titolo}</MD>
        </div>
      )}
      {passi.map((passo, i) => (
        <div key={i} style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
          <div style={{ width: 3, background: '#FFD600', borderRadius: 4, flexShrink: 0, opacity: 0.4 }} />
          <div style={{ flex: 1 }}>
            <div style={{ border: '1px solid #3A3A3A', borderRadius: 12, overflow: 'hidden', background: '#2A2A2A' }}>
              <div style={{ background: '#333', padding: '9px 14px', borderBottom: '1px solid #3A3A3A', fontWeight: 700, fontSize: 13, color: '#E0E0E0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: '#888', fontWeight: 400 }}>Passo {i + 1}</span>
                <span style={{ color: '#888' }}>—</span>
                <MD>{passo.titolo}</MD>
              </div>
              <div style={{ padding: '12px 14px', fontSize: 14, color: '#D0D0D0', lineHeight: 1.8 }}>
                <MD>{passo.corpo}</MD>
              </div>
            </div>

            {passo.domanda && (
              <div style={{ marginTop: 8, marginLeft: 12, border: '1px solid #3A3A3A', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: '#FFD600', padding: '7px 12px', fontSize: 12, color: '#1A1A1A', fontWeight: 600 }}>
                  {passo.domanda}
                </div>
                <div style={{ padding: '10px 12px', fontSize: 13, color: '#D0D0D0', lineHeight: 1.7, background: '#2A2A2A' }}>
                  {passo.loadingRisposta ? <span style={{ color: '#888' }}>Sto pensando...</span> : <MD>{passo.risposta || ''}</MD>}
                </div>
              </div>
            )}

            {!passo.loadingRisposta && (
              <div style={{ marginTop: 8, marginLeft: 12 }}>
                {openInput === i ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input autoFocus value={inputs[i]} onChange={e => { const n = [...inputs]; n[i] = e.target.value; setInputs(n) }} onKeyDown={e => e.key === 'Enter' && chiedi(i, inputs[i].trim())} placeholder="Cosa non ti è chiaro?" style={{ flex: 1, border: '1px solid #3A3A3A', borderRadius: 20, padding: '7px 14px', fontSize: 13, outline: 'none', background: '#2A2A2A', color: '#E0E0E0' }} />
                    <button onClick={() => chiedi(i, inputs[i].trim())} style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFD600', border: 'none', cursor: 'pointer', color: '#1A1A1A', fontSize: 16, flexShrink: 0, fontWeight: 700 }}>↑</button>
                    <button onClick={() => setOpenInput(null)} style={{ width: 34, height: 34, borderRadius: '50%', background: '#333', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14, flexShrink: 0 }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setOpenInput(i)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#FFD600', cursor: 'pointer', padding: '2px 0', fontWeight: 500, opacity: 0.7 }}>
                    + Chiedimi di più su questo passo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {parsed.finale && (
        <div style={{ background: '#2A2A2A', border: '2px solid #FFD600', borderRadius: 12, padding: '14px 18px', marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Risposta finale</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#FFD600' }}><MD>{parsed.finale}</MD></div>
        </div>
      )}
    </div>
  )
}

function AuthModal({ onClose, supabase }: { onClose: () => void; supabase: any }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function loginConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  async function handleEmail() {
    if (!email || !password) return
    setLoading(true)
    setMsg('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg(error.message)
      else onClose()
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}>✕</button>
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

export default function Home() {
  const [screen, setScreen] = useState<'home' | 'explanation' | 'paywall'>('home')
  const [exercise, setExercise] = useState<{ text: string; imageBase64?: string; imagePreview?: string } | null>(null)
  const [usedToday, setUsedToday] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  
  const fileRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const remaining = DAILY_LIMIT - usedToday
  const isLimited = remaining <= 0

useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setAuthLoading(false)
      if (data.user) {
        fetch('/api/usage').then(r => r.json()).then(d => setUsedToday(d.count))
      }
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetch('/api/usage').then(r => r.json()).then(d => setUsedToday(d.count))
      } else {
        setUsedToday(0)
      }
    })
  }, [])

  // Nuovo useEffect per far ruotare le frasi motivazionali
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setQuoteIndex(Math.floor(Math.random() * FRASI_MOTIVAZIONALI.length))
      interval = setInterval(() => {
        setQuoteIndex(prev => (prev + 1) % FRASI_MOTIVAZIONALI.length)
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [loading])

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setUsedToday(0)
  }

  function handleFile(file: File) {
    if (!file || !file.type.startsWith('image/')) return
    setImage(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = (e) => setImageBase64((e.target?.result as string).split(',')[1])
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (isLimited) { setScreen('paywall'); return }
    if (!text.trim() && !image) return
    setUsedToday(u => u + 1)
    if (user) fetch('/api/usage', { method: 'POST' })
    setExercise({ text, imageBase64: imageBase64 || undefined, imagePreview: image || undefined })
    setScreen('explanation')
    setLoading(true)
    setExplanation('')
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, imageBase64, tipo: 'esercizio' })
    })
    const data = await res.json()
    setExplanation(data.explanation)
    setLoading(false)
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A' }}>
      <div style={{ color: '#888', fontFamily: 'system-ui' }}>Caricamento...</div>
    </div>
  )

  if (screen === 'paywall') return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui' }}>
      <div style={{ background: '#FFD600', padding: '48px 24px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Hai finito gli esercizi</div>
        <div style={{ fontSize: 14, color: '#333' }}>Sblocca spiegazioni illimitate</div>
      </div>
      <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {['9.99€/mese', '4.99€/mese (annuale)'].map((p, i) => (
            <div key={i} style={{ flex: 1, border: i === 1 ? '2px solid #FFD600' : '1px solid #3A3A3A', borderRadius: 14, padding: 16, textAlign: 'center', background: '#2A2A2A' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#E0E0E0' }}>{p}</div>
              {i === 1 && <div style={{ fontSize: 12, color: '#FFD600', marginTop: 4 }}>Risparmi il 50%</div>}
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: 14, background: '#FFD600', color: '#1A1A1A', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>Inizia ora</button>
        <button onClick={() => setScreen('home')} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Continua gratis (5 esercizi/giorno)</button>
      </div>
    </div>
  )

  if (screen === 'explanation') return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', background: '#222', borderBottom: '1px solid #3A3A3A', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { setScreen('home'); setText(''); setImage(null); setImageBase64(null) }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0' }}>Spiegazione</div>
      </div>
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {exercise?.imagePreview && <img src={exercise.imagePreview} alt="esercizio" style={{ width: '100%', borderRadius: 12, marginBottom: 16 }} />}
        {exercise?.text && <div style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 12, padding: '12px 14px', marginBottom: 20, fontSize: 14, color: '#A0A0A0' }}>{exercise.text}</div>}
        
        {/* Nuovo blocco animazione di caricamento */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 24 }}>
            <style>
              {`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
              `}
            </style>
            
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #3A3A3A', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #FFD600', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD600', marginBottom: 12, animation: 'pulse 2s infinite' }}>
                Sto analizzando l'esercizio...
              </div>
              <div style={{ fontSize: 14, color: '#888', fontStyle: 'italic', maxWidth: 280, margin: '0 auto', lineHeight: 1.5, transition: 'opacity 0.3s ease' }}>
                &quot;{FRASI_MOTIVAZIONALI[quoteIndex]}&quot;
              </div>
            </div>
          </div>
        ) : explanation ? (
          <ExplanationRenderer text={explanation} esercizio={exercise?.text || ''} />
        ) : null}
      </div>
      <div style={{ background: '#222', borderTop: '1px solid #3A3A3A', padding: '12px 20px 20px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={() => { setScreen('home'); setText(''); setImage(null); setImageBase64(null) }} style={{ height: 42, padding: '0 24px', borderRadius: 24, background: '#FFD600', border: 'none', color: '#1A1A1A', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>+ Nuovo esercizio</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui' }}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} supabase={supabase} />}

      <div style={{ padding: '18px 24px', background: '#222', borderBottom: '1px solid #3A3A3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#FFD600', letterSpacing: '-0.5px' }}>StudiAI</div>
          <div style={{ fontSize: 11, color: '#666' }}>il tuo tutor di matematica e fisica</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <div style={{ fontSize: 12, color: '#888' }}>{user.email?.split('@')[0]}</div>
              <button onClick={logout} style={{ background: 'none', border: '1px solid #3A3A3A', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#888', cursor: 'pointer' }}>Esci</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#E0E0E0', cursor: 'pointer', fontWeight: 500 }}>
              Accedi
            </button>
          )}
          <div onClick={() => setScreen('paywall')} style={{ background: '#FFD600', color: '#1A1A1A', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, cursor: 'pointer' }}>
            {isLimited ? '⚡ Sblocca' : `${remaining} rimasti`}
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 20px', maxWidth: 640, margin: '0 auto' }}>
        <div
          onClick={() => !image && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          style={{ border: '2px dashed ' + (dragging ? '#FFD600' : '#3A3A3A'), borderRadius: 16, padding: image ? 0 : '36px 16px', textAlign: 'center', background: dragging ? '#2A2A1A' : '#222', cursor: image ? 'default' : 'pointer', marginBottom: 16, overflow: 'hidden', position: 'relative', transition: 'all 0.2s' }}
        >
          {image ? (
            <>
              <img src={image} alt="esercizio" style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
              <button onClick={e => { e.stopPropagation(); setImage(null); setImageBase64(null) }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}>✕</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#E0E0E0', marginBottom: 4 }}>Carica una foto dell&apos;esercizio</div>
              <div style={{ fontSize: 12, color: '#666' }}>trascina qui o clicca per scegliere</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && handleFile(e.target.files[0])} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#3A3A3A' }} />
          <span style={{ fontSize: 12, color: '#555' }}>oppure scrivi</span>
          <div style={{ flex: 1, height: 1, background: '#3A3A3A' }} />
        </div>

        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Es: Calcola la derivata di f(x) = x² · sin(x)..." rows={3} style={{ width: '100%', border: '1px solid #3A3A3A', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'system-ui', resize: 'none', outline: 'none', marginBottom: 16, background: '#222', color: '#E0E0E0' }} />

        <button onClick={handleSubmit} disabled={!text.trim() && !image} style={{ width: '100%', padding: 15, background: (!text.trim() && !image) ? '#2A2A2A' : '#FFD600', color: (!text.trim() && !image) ? '#555' : '#1A1A1A', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (!text.trim() && !image) ? 'default' : 'pointer', transition: 'all 0.2s' }}>
          {isLimited ? '⚡ Sblocca per continuare' : 'Spiega questo esercizio →'}
        </button>

        {!isLimited && (
          <div style={{ marginTop: 16, background: '#222', border: '1px solid #3A3A3A', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#666' }}>Esercizi oggi</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#FFD600' }}>{usedToday}/{DAILY_LIMIT}</span>
            </div>
            <div style={{ height: 4, background: '#3A3A3A', borderRadius: 4 }}>
              <div style={{ height: '100%', width: (usedToday / DAILY_LIMIT * 100) + '%', background: '#FFD600', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}