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
  "La matematica non mente, stiamo calcolando la migliore per te!",
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

function parseExplanation(text: string): { titolo: string; grafico?: { latex: string; color: string; label: string }[]; passi: Passo[]; finale: string } {
  const lines = text.split('\n')
  let titolo = ''
  let grafico: { latex: string; color: string; label: string }[] | undefined
  const passi: Passo[] = []
  let finale = ''
  let currentPasso: Passo | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('TITOLO:')) {
      titolo = trimmed.replace('TITOLO:', '').trim()
    } else if (trimmed.startsWith('GRAFICO:')) {
      try {
        const jsonStr = trimmed.replace('GRAFICO:', '').trim()
        grafico = JSON.parse(jsonStr)
        console.log('GRAFICO parsed:', grafico)
      } catch (e) {
        console.log('GRAFICO parse error:', trimmed, e)
      }
    } else if (trimmed.match(/^PASSO \d+:/)) {
      if (currentPasso) passi.push(currentPasso)
      currentPasso = { titolo: trimmed.replace(/^PASSO \d+:/, '').trim(), corpo: '' }
    } else if (trimmed.startsWith('SUGGERIMENTI:')) {
      // ignoriamo
    } else if (trimmed.startsWith('RISPOSTA FINALE:')) {
      if (currentPasso) { passi.push(currentPasso); currentPasso = null }
      finale = trimmed.replace('RISPOSTA FINALE:', '').trim()
    } else if (currentPasso) {
      currentPasso.corpo += (currentPasso.corpo ? ' ' : '') + trimmed
    }
  }
  if (currentPasso) passi.push(currentPasso)
  return { titolo, grafico, passi, finale }
}

function Desmos({ expression }: { expression: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grafico</div>
      <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 16, overflow: 'hidden', border: '1px solid #3A3A3A', background: '#000' }}>
        <iframe
          title="Grafico Desmos"
          src={`https://www.desmos.com/calculator?lang=it&embed=true&expr=${encodeURIComponent(expression)}`}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  )
}

function GraficoDesmos({ espressioni }: { espressioni: { latex: string; color: string; label: string }[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const calcRef = useRef<any>(null)

  useEffect(() => {
    if (!ref.current) return

    const existingScript = document.getElementById('desmos-script')
    
    function initDesmos() {
      if (!ref.current || !(window as any).Desmos) return
      if (calcRef.current) calcRef.current.destroy()
      
      const calc = (window as any).Desmos.GraphingCalculator(ref.current, {
        expressionsCollapsed: true,
        settingsMenu: false,
        zoomButtons: true,
        border: false,
        keypad: false,
        expressions: false,
        backgroundColor: '#1A1A1A',
        textColor: '#E0E0E0',
        axisColor: '#3A3A3A',
        gridLineColor: '#2A2A2A',
      })

      espressioni.forEach((e, i) => {
        calc.setExpression({ id: 'expr' + i, latex: e.latex, color: e.color, label: e.label, showLabel: true })
      })

      calcRef.current = calc
    }

    if (existingScript) {
      if ((window as any).Desmos) initDesmos()
      else existingScript.addEventListener('load', initDesmos)
    } else {
      const script = document.createElement('script')
      script.id = 'desmos-script'
      script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6'
      script.async = true
      script.onload = initDesmos
      document.head.appendChild(script)
    }

    return () => { if (calcRef.current) { calcRef.current.destroy(); calcRef.current = null } }
  }, [espressioni])

  const colori = espressioni.map(e => ({ color: e.color, label: e.label }))

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grafico</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {colori.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
              <span style={{ fontSize: 11, color: '#888' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ width: '100%', height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #3A3A3A' }} />
    </div>
  )
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
      body: JSON.stringify({ tipo: 'chiarimento', text: 'Esercizio: ' + esercizio + '. Passo "' + passi[i].titolo + '": ' + passi[i].corpo + '. Domanda: ' + domanda })
    })
    const data = await res.json()
    setPassi(prev => { const updated = [...prev]; updated[i] = { ...updated[i], risposta: data.explanation, loadingRisposta: false }; return updated })
    const newInputs = [...inputs]; newInputs[i] = ''; setInputs(newInputs)
  }

  return (
    <div>
      {parsed.titolo && <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD600', marginBottom: 24, lineHeight: 1.4 }}><MD>{parsed.titolo}</MD></div>}
      {parsed.grafico && parsed.grafico.length > 0 && <GraficoDesmos espressioni={parsed.grafico} />}
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
              <div style={{ padding: '12px 14px', fontSize: 14, color: '#D0D0D0', lineHeight: 1.8 }}><MD>{passo.corpo}</MD></div>
            </div>
            {passo.domanda && (
              <div style={{ marginTop: 8, marginLeft: 12, border: '1px solid #3A3A3A', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: '#FFD600', padding: '7px 12px', fontSize: 12, color: '#1A1A1A', fontWeight: 600 }}>{passo.domanda}</div>
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
                  <button onClick={() => setOpenInput(i)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#FFD600', cursor: 'pointer', padding: '2px 0', fontWeight: 500, opacity: 0.7 }}>+ Chiedimi di più su questo passo</button>
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

function StoricoScreen({ onBack }: { onBack: () => void }) {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    fetch('/api/exercises').then(r => r.json()).then(data => { setExercises(data); setLoading(false) })
  }, [])

  if (selected) return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', background: '#222', borderBottom: '1px solid #3A3A3A', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0' }}>Esercizio</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 12, padding: '12px 14px', marginBottom: 20, fontSize: 14, color: '#A0A0A0' }}>{selected.question}</div>
        <ExplanationRenderer text={selected.explanation} esercizio={selected.question} />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', background: '#222', borderBottom: '1px solid #3A3A3A', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0' }}>I tuoi esercizi</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Caricamento...</div>
        ) : exercises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Nessun esercizio ancora. Inizia a studiare!</div>
        ) : (
          exercises.map((ex, i) => (
            <div key={i} onClick={() => setSelected(ex)} style={{ background: '#222', border: '1px solid #3A3A3A', borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, color: '#E0E0E0', marginBottom: 4, fontWeight: 500 }}>{ex.question || 'Esercizio con foto'}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{new Date(ex.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <span style={{ color: '#FFD600', fontSize: 18 }}>›</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const steps = [
    { emoji: '📸', title: 'Fotografa o scrivi', desc: 'Carica una foto del tuo esercizio di matematica o fisica, oppure scrivilo direttamente.' },
    { emoji: '🧠', title: 'Spiegazione passo per passo', desc: 'StudiAI spiega ogni passaggio in italiano con formule chiare. Puoi chiedere chiarimenti su ogni passo.' },
    { emoji: '⚡', title: '5 esercizi al giorno gratis', desc: 'Ogni giorno hai 5 spiegazioni gratuite. Sblocca tutto con il piano premium.' },
  ]

  function next() {
    if (step < steps.length - 1) { setStep(s => s + 1) }
    else { fetch('/api/profile', { method: 'POST' }).then(() => onDone()) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 40, letterSpacing: '0.1em' }}>{step + 1} / {steps.length}</div>
        <div style={{ fontSize: 72, marginBottom: 24 }}>{steps[step].emoji}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#FFD600', marginBottom: 16, letterSpacing: '-0.5px' }}>{steps[step].title}</div>
        <div style={{ fontSize: 15, color: '#888', lineHeight: 1.7, marginBottom: 48 }}>{steps[step].desc}</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 6, height: 6, borderRadius: 3, background: i === step ? '#FFD600' : '#3A3A3A', transition: 'all 0.3s' }} />
          ))}
        </div>
        <button onClick={next} style={{ width: '100%', padding: 15, background: '#FFD600', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', color: '#1A1A1A' }}>
          {step < steps.length - 1 ? 'Continua →' : 'Inizia a studiare →'}
        </button>
        {step < steps.length - 1 && (
          <button onClick={() => { fetch('/api/profile', { method: 'POST' }).then(() => onDone()) }} style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', marginTop: 16 }}>Salta</button>
        )}
      </div>
    </div>
  )
}

function PersonalizzazioneScreen({ onDone }: { onDone: () => void }) {
  const [scuola, setScuola] = useState('')
  const [classe, setClasse] = useState('')
  const [materie, setMaterie] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function toggleMateria(m: string) {
    setMaterie(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  async function salva() {
    setLoading(true)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scuola, classe, materie, onboarding_done: true })
    })
    setLoading(false)
    onDone()
  }

  const scuole = ['Liceo Scientifico', 'Liceo Classico', 'Istituto Tecnico', 'Scuola Media', 'Altro']
  const classi = scuola === 'Scuola Media' ? ['1ª media', '2ª media', '3ª media'] : ['1ª', '2ª', '3ª', '4ª', '5ª']
  const materieList = ['Matematica', 'Fisica', 'Chimica', 'Informatica']

  const btnBase = { border: '1px solid #3A3A3A', borderRadius: 10, padding: '10px 14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }
  const btnActive = { ...btnBase, background: '#FFD600', color: '#1A1A1A', border: '1px solid #FFD600' }
  const btnInactive = { ...btnBase, background: '#2A2A2A', color: '#888' }

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#FFD600', marginBottom: 8, letterSpacing: '-0.5px' }}>Personalizziamo</div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 32 }}>Così le spiegazioni saranno calibrate su di te.</div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Che scuola frequenti?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {scuole.map(s => (
              <button key={s} onClick={() => setScuola(s)} style={scuola === s ? btnActive : btnInactive}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Che classe sei?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {classi.map(c => (
              <button key={c} onClick={() => setClasse(c)} style={classe === c ? btnActive : btnInactive}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Materie difficili?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {materieList.map(m => (
              <button key={m} onClick={() => toggleMateria(m)} style={materie.includes(m) ? btnActive : btnInactive}>{m}</button>
            ))}
          </div>
        </div>

        <button
          onClick={salva}
          disabled={!scuola || !classe || loading}
          style={{ width: '100%', padding: 15, background: (!scuola || !classe) ? '#2A2A2A' : '#FFD600', color: (!scuola || !classe) ? '#555' : '#1A1A1A', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (!scuola || !classe) ? 'default' : 'pointer' }}
        >
          {loading ? '...' : 'Inizia a studiare →'}
        </button>

        <button onClick={() => { fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboarding_done: true }) }); onDone() }} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
          Salta per ora
        </button>
      </div>
    </div>
  )
}

function ProfiloScreen({ onBack, profiloAttuale, onSave }: { onBack: () => void; profiloAttuale: { scuola?: string; classe?: string; materie?: string[] }; onSave: (p: any) => void }) {
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

  const btnBase = { border: '1px solid #3A3A3A', borderRadius: 10, padding: '10px 14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }
  const btnActive = { ...btnBase, background: '#FFD600', color: '#1A1A1A', border: '1px solid #FFD600' }
  const btnInactive = { ...btnBase, background: '#2A2A2A', color: '#888' }

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', background: '#222', borderBottom: '1px solid #3A3A3A', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0' }}>Il tuo profilo</div>
      </div>
      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 480, margin: '0 auto', width: '100%' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Che scuola frequenti?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {scuole.map(s => (
              <button key={s} onClick={() => { setScuola(s); setClasse('') }} style={scuola === s ? btnActive : btnInactive}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Che classe sei?</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {classi.map(c => (
              <button key={c} onClick={() => setClasse(c)} style={classe === c ? btnActive : btnInactive}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Materie difficili?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {materieList.map(m => (
              <button key={m} onClick={() => toggleMateria(m)} style={materie.includes(m) ? btnActive : btnInactive}>{m}</button>
            ))}
          </div>
        </div>

        <button
          onClick={salva}
          disabled={!scuola || !classe || loading}
          style={{ width: '100%', padding: 15, background: (!scuola || !classe) ? '#2A2A2A' : '#FFD600', color: (!scuola || !classe) ? '#555' : '#1A1A1A', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (!scuola || !classe) ? 'default' : 'pointer' }}
        >
          {loading ? '...' : saved ? '✓ Salvato!' : 'Salva modifiche'}
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [screen, setScreen] = useState<'home' | 'explanation' | 'paywall' | 'storico' | 'profilo'>('home')
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
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [showPersonalizzazione, setShowPersonalizzazione] = useState(false)
  const [profilo, setProfilo] = useState<{ scuola?: string; classe?: string; materie?: string[] }>({})
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)

  const admins = ['alegiampi@icloud.com', 'g79750797@gmail.com']
  const isAdmin = admins.includes(user?.email || '')
  const remaining = DAILY_LIMIT - usedToday
  const isLimited = !isAdmin && remaining <= 0

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('loggedin')) {
      supabase.auth.refreshSession().then(() => {
        window.history.replaceState({}, '', '/')
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setAuthLoading(false)
      if (currentUser) {
        fetch('/api/usage').then(r => r.json()).then(d => setUsedToday(d.count))
        fetch('/api/profile').then(r => r.json()).then(d => {
          if (!d.onboarding_done) setShowOnboarding(true)
          else if (!d.scuola) setShowPersonalizzazione(true)
        setProfilo({ scuola: d.scuola, classe: d.classe, materie: d.materie })
        })
      } else {
        setUsedToday(0)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setAuthLoading(false)
      if (currentUser) {
        fetch('/api/usage').then(r => r.json()).then(d => setUsedToday(d.count))
        fetch('/api/profile').then(r => r.json()).then(d => {
          if (!d.onboarding_done) setShowOnboarding(true)
          else if (!d.scuola) setShowPersonalizzazione(true)
        setProfilo({ scuola: d.scuola, classe: d.classe, materie: d.materie })
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
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
      body: JSON.stringify({ text, imageBase64, tipo: 'esercizio', scuola: profilo.scuola, classe: profilo.classe, materie: profilo.materie })
    })
    const data = await res.json()
    setExplanation(data.explanation)
    if (user) {
      fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, explanation: data.explanation })
      })
    }
    setLoading(false)
  }

  async function handleShare() {
    setShareLoading(true)
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: exercise?.text || '',
        explanation,
        scuola: profilo.scuola,
        classe: profilo.classe
      })
    })
    const data = await res.json()
    const url = window.location.origin + '/s/' + data.id
    setShareUrl(url)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // fallback silenzioso
    }
    setShareLoading(false)
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A' }}>
      <div style={{ color: '#888', fontFamily: 'system-ui' }}>Caricamento...</div>
    </div>
  )

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#FFD600', marginBottom: 8, letterSpacing: '-1px' }}>StudiAI</div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 40 }}>il tuo tutor di matematica e fisica</div>
        <AuthModal supabase={supabase} />
      </div>
    </div>
  )

  if (showOnboarding) return <OnboardingScreen onDone={() => setShowOnboarding(false)} />

  if (showPersonalizzazione) return <PersonalizzazioneScreen onDone={() => setShowPersonalizzazione(false)} />

  if (screen === 'storico') return <StoricoScreen onBack={() => setScreen('home')} />

  if (screen === 'profilo') return <ProfiloScreen onBack={() => setScreen('home')} profiloAttuale={profilo} onSave={(p) => { setProfilo(p); setScreen('home') }} />

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
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 24 }}>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #3A3A3A', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #FFD600', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFD600', marginBottom: 12, animation: 'pulse 2s infinite' }}>Sto analizzando l&apos;esercizio...</div>
              <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>&quot;{FRASI_MOTIVAZIONALI[quoteIndex]}&quot;</div>
            </div>
          </div>
        ) : explanation ? (
          <ExplanationRenderer text={explanation} esercizio={exercise?.text || ''} />
        ) : null}
      </div>
      <div style={{ background: '#222', borderTop: '1px solid #3A3A3A', padding: '12px 20px 20px', display: 'flex', justifyContent: 'center', gap: 12 }}>
        {explanation && !loading && (
          <div style={{ marginRight: 8 }}>
            {shareUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input 
                  readOnly 
                  value={shareUrl} 
                  style={{ border: '1px solid #3A3A3A', borderRadius: 20, padding: '8px 14px', fontSize: 12, background: '#2A2A2A', color: '#E0E0E0', outline: 'none', width: 200 }}
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <button onClick={() => { try { navigator.clipboard.writeText(shareUrl) } catch {} }} style={{ height: 36, padding: '0 12px', borderRadius: 20, background: '#FFD600', border: 'none', color: '#1A1A1A', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                  Copia
                </button>
              </div>
            ) : (
              <button onClick={handleShare} disabled={shareLoading} style={{ height: 42, padding: '0 20px', borderRadius: 24, background: '#2A2A2A', border: '1px solid #3A3A3A', color: '#E0E0E0', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
                {shareLoading ? '...' : '🔗 Condividi'}
              </button>
            )}
          </div>
        )}
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
              <button onClick={() => setScreen('storico')} style={{ background: 'none', border: '1px solid #3A3A3A', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#FFD600', cursor: 'pointer' }}>Storico</button>
              <button onClick={() => setScreen('profilo')} style={{ background: 'none', border: '1px solid #3A3A3A', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#888', cursor: 'pointer' }}>Profilo</button>
              <button onClick={logout} style={{ background: 'none', border: '1px solid #3A3A3A', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#888', cursor: 'pointer' }}>Esci</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#E0E0E0', cursor: 'pointer', fontWeight: 500 }}>Accedi</button>
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
