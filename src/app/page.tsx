'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { createClient } from '@/lib/supabase'
import AuthModal from '@/components/AuthModal'
import ExplanationRenderer from '@/components/exercise/ExplanationRenderer'
import GraficoJSX from '@/components/exercise/GraficoJSX'
import HomeScreen from '@/components/screens/HomeScreen'

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

type EspressioneGrafico = { fn: string; color: string; label: string }

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
      // ignoriamo
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
            {scuole.map(s => <button key={s} onClick={() => setScuola(s)} style={scuola === s ? btnActive : btnInactive}>{s}</button>)}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Che classe sei?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {classi.map(c => <button key={c} onClick={() => setClasse(c)} style={classe === c ? btnActive : btnInactive}>{c}</button>)}
          </div>
        </div>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Materie difficili?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {materieList.map(m => <button key={m} onClick={() => toggleMateria(m)} style={materie.includes(m) ? btnActive : btnInactive}>{m}</button>)}
          </div>
        </div>
        <button onClick={salva} disabled={!scuola || !classe || loading} style={{ width: '100%', padding: 15, background: (!scuola || !classe) ? '#2A2A2A' : '#FFD600', color: (!scuola || !classe) ? '#555' : '#1A1A1A', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (!scuola || !classe) ? 'default' : 'pointer' }}>
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
            {scuole.map(s => <button key={s} onClick={() => { setScuola(s); setClasse('') }} style={scuola === s ? btnActive : btnInactive}>{s}</button>)}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Che classe sei?</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {classi.map(c => <button key={c} onClick={() => setClasse(c)} style={classe === c ? btnActive : btnInactive}>{c}</button>)}
          </div>
        </div>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Materie difficili?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {materieList.map(m => <button key={m} onClick={() => toggleMateria(m)} style={materie.includes(m) ? btnActive : btnInactive}>{m}</button>)}
          </div>
        </div>
        <button onClick={salva} disabled={!scuola || !classe || loading} style={{ width: '100%', padding: 15, background: (!scuola || !classe) ? '#2A2A2A' : '#FFD600', color: (!scuola || !classe) ? '#555' : '#1A1A1A', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (!scuola || !classe) ? 'default' : 'pointer' }}>
          {loading ? '...' : saved ? '✓ Salvato!' : 'Salva modifiche'}
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [graficoUtile, setGraficoUtile] = useState<boolean | null>(null)
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
  const [showPersonalizzazione, setShowPersonalizzazione] = useState(false)
  const [profilo, setProfilo] = useState<{ scuola?: string; classe?: string; materie?: string[] }>({})
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [grafico, setGrafico] = useState<EspressioneGrafico[] | null>(null)
  const [graficoLoading, setGraficoLoading] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [isPremium, setIsPremium] = useState(false)

  const admins = ['alegiampi@icloud.com', 'g79750797@gmail.com']
  const isAdmin = admins.includes(user?.email || '')
  const remaining = DAILY_LIMIT - usedToday
  const isLimited = !isAdmin && !isPremium && remaining <= 0

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('loggedin')) {
      supabase.auth.refreshSession().then(() => { window.history.replaceState({}, '', '/') })
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
          setIsPremium(d.is_premium ?? false)  
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
  setGrafico(null)
  setGraficoUtile(null)   // <-- nuovo stato, vedi sotto
  setShareUrl(null)

  // Le due chiamate partono in parallelo
  const [explainRes, classifyRes] = await Promise.all([
    fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, imageBase64, tipo: 'esercizio', scuola: profilo.scuola, classe: profilo.classe, materie: profilo.materie })
    }),
    text.trim() ? fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, scuola: profilo.scuola, classe: profilo.classe })
    }) : Promise.resolve(null)
  ])

  const explainData = await explainRes.json()
  setExplanation(explainData.explanation)

  if (classifyRes) {
    const classifyData = await classifyRes.json()
    setGraficoUtile(classifyData.graficoUtile ?? false)
  } else {
    setGraficoUtile(false) // immagine senza testo: no grafico
  }

  if (user) {
    fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text, explanation: explainData.explanation })
    })
  }
  setLoading(false)
}

  async function handleShare() {
    setShareLoading(true)
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: exercise?.text || '', explanation, scuola: profilo.scuola, classe: profilo.classe })
    })
    const data = await res.json()
    const url = window.location.origin + '/s/' + data.id
    setShareUrl(url)
    try { await navigator.clipboard.writeText(url) } catch {}
    setShareLoading(false)
  }

  async function handleGrafico() {
    setGraficoLoading(true)
    const res = await fetch('/api/graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ esercizio: exercise?.text || '', spiegazione: explanation })
    })
    const data = await res.json()
    if (data.espressioni) {
      console.log('Grafico:', JSON.stringify(data.espressioni))
      setGrafico(data.espressioni)
    }
    if (data.error) console.log('Grafico error:', data.error)
    setGraficoLoading(false)
  }
async function handleCheckout(priceId: string) {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId })
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
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
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
        {usedToday >= DAILY_LIMIT ? 'Hai finito gli esercizi' : 'Passa a Premium'}
      </div>
      <div style={{ fontSize: 14, color: '#333' }}>Sblocca spiegazioni illimitate e grafici</div>
    </div>
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSILE!)} style={{ flex: 1, border: '1px solid #3A3A3A', borderRadius: 14, padding: 20, textAlign: 'center', background: '#2A2A2A', cursor: 'pointer' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Mensile</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#E0E0E0' }}>3.99€</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>/mese</div>
        </div>
        <div onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUALE!)} style={{ flex: 1, border: '2px solid #FFD600', borderRadius: 14, padding: 20, textAlign: 'center', background: '#2A2A2A', cursor: 'pointer', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#FFD600', color: '#1A1A1A', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>PIÙ CONVENIENTE</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Annuale</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#FFD600' }}>29.99€</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>= 2.50€/mese</div>
          <div style={{ fontSize: 11, color: '#00B894', marginTop: 4 }}>Risparmi il 37%</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        {['Esercizi illimitati ogni giorno', 'Grafici interattivi con JSXGraph', 'Foto degli esercizi con AI vision', 'Storico completo', 'Spiegazioni calibrate sul tuo livello'].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #2A2A2A' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#00B89420', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#00B894', fontSize: 11 }}>✓</span>
            </div>
            <span style={{ fontSize: 14, color: '#D0D0D0' }}>{f}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setScreen('home')} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13 }}>
        Continua gratis (5 esercizi/giorno)
      </button>
      <div style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 8 }}>
        Disdici quando vuoi · Pagamento sicuro con Stripe
      </div>
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

        {explanation && !loading && graficoUtile && (
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            {grafico ? (
              <GraficoJSX espressioni={grafico} />
            ) : (
              <button onClick={handleGrafico} disabled={graficoLoading} style={{ width: '100%', padding: 12, background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 12, color: graficoLoading ? '#666' : '#FFD600', fontSize: 14, fontWeight: 600, cursor: graficoLoading ? 'default' : 'pointer' }}>
                {graficoLoading ? 'Generando grafico...' : '📊 Visualizza grafico'}
              </button>
            )}
          </div>
        )}
      </div>
      <div style={{ background: '#222', borderTop: '1px solid #3A3A3A', padding: '12px 20px 20px', display: 'flex', justifyContent: 'center', gap: 12 }}>
        {explanation && !loading && (
          <div>
            {shareUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input readOnly value={shareUrl} style={{ border: '1px solid #3A3A3A', borderRadius: 20, padding: '8px 14px', fontSize: 12, background: '#2A2A2A', color: '#E0E0E0', outline: 'none', width: 200 }} onClick={e => (e.target as HTMLInputElement).select()} />
                <button onClick={() => { try { navigator.clipboard.writeText(shareUrl) } catch {} }} style={{ height: 36, padding: '0 12px', borderRadius: 20, background: '#FFD600', border: 'none', color: '#1A1A1A', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Copia</button>
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
  <HomeScreen
    user={user}
    showAuth={showAuth}
    setShowAuth={setShowAuth}
    supabase={supabase}
    setScreen={setScreen}
    logout={logout}
    isLimited={isLimited}
    remaining={remaining}
    image={image}
    setImage={setImage}
    setImageBase64={setImageBase64}
    dragging={dragging}
    setDragging={setDragging}
    handleFile={handleFile}
    text={text}
    setText={setText}
    handleSubmit={handleSubmit}
    usedToday={usedToday}
  />
)

}
