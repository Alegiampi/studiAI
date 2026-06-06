'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Bot, Send, ChevronRight, ChevronDown, Check, Star, ArrowRight, Zap, Maximize2, Sliders, Play, Activity } from 'lucide-react'
import AuthModal from '@/components/AuthModal'
import { createClient } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// Helper per il rendering di KaTeX/Markdown
const MD = ({ children }: { children: string }) => (
  <div className="md-content text-foreground-muted">
    <ReactMarkdown 
      remarkPlugins={[remarkMath]} 
      rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: '#cc0000' }]]}
    >
      {children}
    </ReactMarkdown>
  </div>
)

export default function PublicLandingPage() {
  const supabase = createClient()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'eq' | 'deriv' | 'limit'>('eq')
  
  // Stati per la Sandbox Matematica
  const [tangentX, setTangentX] = useState<number>(0.5) // tab deriv
  const [limitH, setLimitH] = useState<number>(1.5) // tab limit
  const [hoveredEqRoot, setHoveredEqRoot] = useState<'root1' | 'root2' | null>(null) // tab eq
  const [eqX, setEqX] = useState<number>(0)
  const [showVertex, setShowVertex] = useState<boolean>(false)
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [isAnimatingLimit, setIsAnimatingLimit] = useState<boolean>(false)
  const svgRef = useRef<SVGSVGElement>(null)

  // Stati per la Chat Simulata con il Tutor
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; sender: 'user' | 'bot'; text: string }>>([
    { 
      id: '1', 
      sender: 'bot', 
      text: "Ciao! Sono il tuo tutor personale theLemma. Hai dei dubbi su un passaggio della sandbox qui sopra o vuoi chiedermi qualcos'altro? Clicca su una delle domande frequenti qui sotto o prova a scrivermi!" 
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isBotTyping, setIsBotTyping] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Stati per le FAQ
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Scroll already handled by inline script in layout

  // Auto scroll chat interno (senza spostare il viewport della pagina)
  useEffect(() => {
    if (chatHistory.length > 1 || isBotTyping) {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [chatHistory, isBotTyping])

  // Contenuti Sandbox Matematica
  const sandboxContent = {
    eq: {
      title: "Risoluzione Equazione di Secondo Grado",
      formula: "$x^2 - 5x + 6 = 0$",
      steps: [
        {
          title: "Passo 1: Identifica i coefficienti",
          body: "Identifichiamo i coefficienti dell'equazione della forma $ax^2 + bx + c = 0$:\n\n$$a = 1, \\quad b = -5, \\quad c = 6$$"
        },
        {
          title: "Passo 2: Calcola il discriminante (Delta)",
          body: "Applichiamo la formula $\\Delta = b^2 - 4ac$:\n\n$$\\Delta = (-5)^2 - 4(1)(6) = 25 - 24 = 1$$\n\nPoiché $\\Delta > 0$, l'equazione ammette due soluzioni reali e distinte."
        },
        {
          title: "Passo 3: Applica la formula risolutiva",
          body: "Utilizziamo la formula quadratica $x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$:\n\n$$x_{1,2} = \\frac{-(-5) \\pm \\sqrt{1}}{2(1)} = \\frac{5 \\pm 1}{2}$$\n\nLe soluzioni finali sono:\n\n$$x_1 = \\frac{5 - 1}{2} = 2, \\quad x_2 = \\frac{5 + 1}{2} = 3$$"
        }
      ],
      solution: "$$x_1 = 2, \\quad x_2 = 3$$"
    },
    deriv: {
      title: "Calcolo della Derivata di una Funzione",
      formula: "$f(x) = x^3 - 3x + 2$",
      steps: [
        {
          title: "Passo 1: Regola di somma e potenza",
          body: "Per derivare una somma di funzioni, deriviamo singolarmente ogni termine usando la regola della potenza: $\\frac{d}{dx}[x^n] = n x^{n-1}$."
        },
        {
          title: "Passo 2: Deriva i singoli termini",
          body: "Calcoliamo la derivata per ciascuna parte dell'espressione:\n\n- Per $x^3$: la derivata è $3x^2$.\n- Per $-3x$: la derivata è $-3$.\n- Per la costante $2$: la derivata è sempre $0$."
        },
        {
          title: "Passo 3: Unisci i risultati",
          body: "Sommando le derivate parziali otteniamo la derivata finale:\n\n$$f'(x) = 3x^2 - 3$$\n\n*Nota: sposta lo slider sotto il grafico per vedere come la pendenza della tangente cambia dinamicamente lungo la curva!*"
        }
      ],
      solution: "$$f'(x) = 3x^2 - 3$$"
    },
    limit: {
      title: "Verifica di un Limite Notevole",
      formula: "$\\lim_{x \\to 0} \\frac{\\sin(x)}{x}$",
      steps: [
        {
          title: "Passo 1: Verifica la forma indeterminata",
          body: "Sostituendo direttamente $x=0$ nell'espressione otteniamo:\n\n$$\\lim_{x \\to 0} \\sin(x) = 0, \\quad \\lim_{x \\to 0} x = 0 \\implies \\left[\\frac{0}{0}\\right]$$\n\nSi tratta di una forma indeterminata."
        },
        {
          title: "Passo 2: Teorema del Confronto (Dimostrazione Geometrica)",
          body: "Considerando la circonferenza goniometrica per un angolo $x$ (in radianti) molto piccolo, è provata la relazione:\n\n$$\\cos(x) < \\frac{\\sin(x)}{x} < 1$$"
        },
        {
          title: "Passo 3: Applica il Teorema dei Carabinieri",
          body: "Calcoliamo i limiti per $x \\to 0$ delle due funzioni esterne:\n\n$$\\lim_{x \\to 0} \\cos(x) = 1, \\quad \\lim_{x \\to 0} 1 = 1$$\n\nPoiché le funzioni esterne tendono entrambe a $1$, allora per il teorema del confronto:\n\n$$\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1$$"
        }
      ],
      solution: "$$\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1$$"
    }
  }

  // Calcoli per i grafici SVG
  // Tab EQ: y = x^2 - 5x + 6. x in [-1.5, 6], y in [-2.5, 8.5]
  const mapXEq = (x: number) => 40 + ((x - (-1.5)) / 7.5) * 320
  const mapYEq = (y: number) => 260 - ((y - (-2.5)) / 11) * 220
  
  const eqY = useMemo(() => eqX * eqX - 5 * eqX + 6, [eqX])
  
  const eqPathD = useMemo(() => {
    const points = []
    for (let x = -1.5; x <= 6.05; x += 0.05) {
      const y = x * x - 5 * x + 6
      points.push(`${mapXEq(x)},${mapYEq(y)}`)
    }
    return `M ${points.join(' L ')}`
  }, [])

  // Tab Deriv: y = x^3 - 3x + 2. x in [-3, 3], y in [-2, 6] (Upper Section Y: 25 to 165)
  const mapXDeriv = (x: number) => 40 + ((x - (-3)) / 6) * 320
  const mapYDeriv = (y: number) => 165 - ((y - (-2)) / 8) * 140
  // Tab Deriv Prime: f'(x) = 3x^2 - 3. y in [-4.5, 9.5] (Lower Section Y: 195 to 285)
  const mapYDerivPrime = (y: number) => 285 - ((y - (-4.5)) / 14) * 90

  const derivPathD = useMemo(() => {
    const points = []
    for (let x = -3; x <= 3.05; x += 0.05) {
      const y = x * x * x - 3 * x + 2
      points.push(`${mapXDeriv(x)},${mapYDeriv(y)}`)
    }
    return `M ${points.join(' L ')}`
  }, [])

  const derivPrimePathD = useMemo(() => {
    const points = []
    for (let x = -2.2; x <= 2.2; x += 0.05) {
      const y = 3 * x * x - 3
      points.push(`${mapXDeriv(x)},${mapYDerivPrime(y)}`)
    }
    return `M ${points.join(' L ')}`
  }, [])

  // Calcoli retta tangente in tangentX per Tab Deriv
  const tangentPoints = useMemo(() => {
    const x0 = tangentX
    const y0 = x0 * x0 * x0 - 3 * x0 + 2
    const m = 3 * x0 * x0 - 3
    // y - y0 = m(x - x0) => y = m(x - x0) + y0
    const xStart = -3
    const yStart = m * (xStart - x0) + y0
    const xEnd = 3
    const yEnd = m * (xEnd - x0) + y0
    return {
      x1: mapXDeriv(xStart),
      y1: mapYDeriv(yStart),
      x2: mapXDeriv(xEnd),
      y2: mapYDeriv(yEnd),
      px: mapXDeriv(x0),
      py: mapYDeriv(y0),
      m,
      y0
    }
  }, [tangentX])

  // Tab Limit: y = sin(x)/x. x in [-6, 6], y in [-0.5, 1.5]
  const mapXLimit = (x: number) => 40 + ((x - (-6)) / 12) * 320
  const mapYLimit = (y: number) => 260 - ((y - (-0.5)) / 2) * 220
  
  const limitPathD = useMemo(() => {
    const points = []
    for (let x = -6; x <= 6.05; x += 0.05) {
      const y = Math.abs(x) < 0.001 ? 1 : Math.sin(x) / x
      points.push(`${mapXLimit(x)},${mapYLimit(y)}`)
    }
    return `M ${points.join(' L ')}`
  }, [])

  const cosPathD = useMemo(() => {
    const points = []
    for (let x = -6; x <= 6.05; x += 0.05) {
      const y = Math.cos(x)
      points.push(`${mapXLimit(x)},${mapYLimit(y)}`)
    }
    return `M ${points.join(' L ')}`
  }, [])

  const limitPoints = useMemo(() => {
    const h = limitH
    const yVal = Math.sin(h) / h
    return {
      xPos: mapXLimit(h),
      xNeg: mapXLimit(-h),
      y: mapYLimit(yVal),
      yVal
    }
  }, [limitH])

  // Effetto animazione di convergenza
  useEffect(() => {
    if (!isAnimatingLimit) return
    const startTime = performance.now()
    const duration = 2000 // 2 secondi
    const startH = 4.0
    const endH = 0.02
    
    let frameId: number
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      const currentH = startH - ease * (startH - endH)
      setLimitH(currentH)
      
      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        setIsAnimatingLimit(false)
      }
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [isAnimatingLimit])

  // Gestione drag & drop sui grafici SVG
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    updatePointFromCoords(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return
    updatePointFromCoords(e.clientX)
  }

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(false)
  }

  const updatePointFromCoords = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const localX = clientX - rect.left
    
    if (activeTab === 'eq') {
      let x = ((localX - 40) / 320) * 7.5 - 1.5
      x = Math.max(-1.5, Math.min(6, x))
      
      // Snap magnetico sulle soluzioni x=2 e x=3
      if (Math.abs(x - 2) < 0.15) {
        x = 2
      } else if (Math.abs(x - 3) < 0.15) {
        x = 3
      }
      setEqX(x)
    } else if (activeTab === 'deriv') {
      let x = ((localX - 40) / 320) * 6 - 3
      x = Math.max(-2.8, Math.min(2.8, x))
      setTangentX(x)
    } else if (activeTab === 'limit') {
      const x = ((localX - 40) / 320) * 12 - 6
      let h = Math.abs(x)
      h = Math.max(0.01, Math.min(5.0, h))
      setLimitH(h)
    }
  }

  // Risposte della chat del tutor simulato
  const tutorAnswers = {
    'delta': "Certamente! Per un'equazione di secondo grado $ax^2 + bx + c = 0$, il delta $\\Delta = b^2 - 4ac$ si ottiene completando il quadrato dell'espressione.\n\nSe dividi tutto per $a$ e completi il quadrato, arrivi a:\n\n$$(x + \\frac{b}{2a})^2 = \\frac{b^2 - 4ac}{4a^2}$$\n\nIl numeratore della frazione a destra è proprio il nostro $\\Delta$. Indica se l'equazione ha soluzioni reali (se $\\Delta \\ge 0$) o complesse!",
    'derivata': "Nel passaggio 2 della derivata abbiamo usato la regola della potenza: $\\frac{d}{dx}[x^n] = n x^{n-1}$.\n\nPer il termine $x^3$, l'esponente è $n=3$, quindi scende davanti e l'esponente si riduce di 1, ottenendo $3x^2$.\n\nPer il termine $-3x$, la derivata di $x$ è 1, quindi resta solo il coefficiente costante $-3$.\n\nLa derivata del numero fisso $2$ è sempre $0$. Sommando tutto otteniamo $3x^2 - 3$. Semplice, vero?",
    'materie': "Sì, assolutamente! Oltre alla matematica (algebra, analisi, geometria, trigonometria), theLemma risolve e spiega passo-passo esercizi di **fisica** (meccanica, termodinamica, elettromagnetismo) e **chimica** (bilanciamento di reazioni, stechiometria, calcolo del pH).\n\nTi basta caricare una foto del testo dell'esercizio o scriverlo direttamente nella schermata principale dell'applicazione!",
    'custom': "Ottima domanda! Per risposte personalizzate approfondite su qualsiasi esercizio e per caricare le tue foto reali, registrati gratuitamente a **theLemma**. Ci vorranno solo 10 secondi!"
  }

  const handlePresetQuestion = (key: 'delta' | 'derivata' | 'materie') => {
    if (isBotTyping) return
    
    let questionText = ''
    if (key === 'delta') questionText = "Come si ricava la formula del Delta (Δ)?"
    else if (key === 'derivata') questionText = "Puoi spiegarmi meglio il calcolo della derivata di x³?"
    else if (key === 'materie') questionText = "Risolvete anche esercizi di fisica e chimica?"

    // Aggiungi domanda utente
    const userMsg = { id: Math.random().toString(), sender: 'user' as const, text: questionText }
    setChatHistory(prev => [...prev, userMsg])
    
    // Attiva digitazione
    setIsBotTyping(true)

    setTimeout(() => {
      setIsBotTyping(false)
      const botMsg = { id: Math.random().toString(), sender: 'bot' as const, text: tutorAnswers[key] }
      setChatHistory(prev => [...prev, botMsg])
    }, 1500)
  }

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isBotTyping) return

    const userMsg = { id: Math.random().toString(), sender: 'user' as const, text: chatInput }
    setChatHistory(prev => [...prev, userMsg])
    setChatInput('')
    setIsBotTyping(true)

    setTimeout(() => {
      setIsBotTyping(false)
      const botMsg = { id: Math.random().toString(), sender: 'bot' as const, text: tutorAnswers['custom'] }
      setChatHistory(prev => [...prev, botMsg])
    }, 1500)
  }

  // FAQ Data
  const faqs = [
    {
      q: "theLemma è gratuito?",
      a: "Sì, offriamo 5 spiegazioni passo-passo gratuite ogni giorno per tutti gli utenti registrati. Per un utilizzo illimitato, priorità del server e accesso completo ai grafici interattivi avanzati, offriamo un piano Premium conveniente."
    },
    {
      q: "Quali materie sono supportate?",
      a: "Copriamo l'intero programma di Matematica, Geometria, Fisica e Chimica per scuole medie, scuole superiori e università. L'intelligenza artificiale è ottimizzata specificamente per il rigore matematico italiano."
    },
    {
      q: "Come funziona la scansione delle foto?",
      a: "Il nostro sistema utilizza una pipeline di visione artificiale a due stadi. Il primo stadio effettua un OCR ad altissima risoluzione per riconoscere e isolare formule matematiche e testi, anche se scritti a mano su un foglio stropicciato o su una lavagna. Il secondo stadio elabora la struttura logica per generare la spiegazione."
    },
    {
      q: "Posso disdire l'abbonamento Premium quando voglio?",
      a: "Assolutamente sì. Tutti i pagamenti sono gestiti in modo sicuro tramite Stripe. Puoi disattivare o modificare il tuo abbonamento in qualsiasi momento con un solo clic dalla pagina del tuo Profilo, senza vincoli di permanenza."
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden font-outfit text-foreground">
      {/* Sfondo geometrico e glow premium */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none -z-20" />
      <motion.div 
        animate={{ 
          x: [0, 20, -10, 0], 
          y: [0, -30, 15, 0],
          scale: [1, 1.05, 0.95, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-primary/5 blur-[130px] rounded-full pointer-events-none -z-10" 
      />
      <motion.div 
        animate={{ 
          x: [0, -25, 20, 0], 
          y: [0, 25, -20, 0],
          scale: [1, 0.95, 1.05, 1]
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[20%] right-[-10%] w-[450px] h-[450px] bg-primary/4 blur-[120px] rounded-full pointer-events-none -z-10" 
      />

      {/* CSS per lo shimmer del logo */}
      <style>{`
        @keyframes shimmer-logo {
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
          animation: shimmer-logo 3s linear infinite;
        }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-surface-border px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          <span className="text-[20px] font-extrabold tracking-tight">
            <span className="logo-shimmer font-light opacity-80">the</span>
            <span className="logo-shimmer">Lemma</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            id="btn-header-login"
            onClick={() => setShowAuthModal(true)} 
            className="text-foreground-muted hover:text-foreground font-bold text-[14px] px-4 py-2 rounded-xl transition-colors"
          >
            Accedi
          </button>
          <button 
            id="btn-header-register"
            onClick={() => setShowAuthModal(true)} 
            className="bg-primary text-background hover:bg-primary-hover font-black text-[13px] px-5 py-2.5 rounded-xl shadow-lg shadow-primary/15 transition-all hover:scale-102 active:scale-98"
          >
            Registrati Gratis
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-6 pt-16 pb-20 max-w-[900px] mx-auto text-center flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">Tutor Intelligente 24/7</span>
          </div>

          <h1 className="text-[44px] md:text-[60px] font-extrabold tracking-tight leading-[1.1] mb-6 max-w-2xl text-foreground">
            Capisci davvero la <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-300 to-primary-hover">matematica</span>, un passo alla volta.
          </h1>

          <p className="text-[17px] md:text-[19px] text-foreground-muted max-w-xl mb-12 font-medium leading-relaxed">
            Non limitarti a copiare le risposte. Carica la foto di un esercizio e impara il ragionamento logico con spiegazioni interattive e grafici dinamici.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              id="btn-hero-cta-primary"
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 bg-primary text-background hover:bg-primary-hover rounded-2xl text-[16px] font-black shadow-xl shadow-primary/20 transition-all hover:scale-103 active:scale-97 flex items-center justify-center gap-2"
            >
              Inizia Gratis Ora <ArrowRight size={18} />
            </button>
            <a 
              id="btn-hero-cta-secondary"
              href="#sandbox"
              className="px-8 py-4 bg-surface hover:bg-surface-hover border border-surface-border rounded-2xl text-[16px] font-bold text-foreground transition-all flex items-center justify-center gap-2"
            >
              Prova la Sandbox <Play size={14} className="text-primary fill-primary" />
            </a>
          </div>

          {/* Social Proof badge */}
          <div className="flex items-center gap-6 mt-16 text-foreground-subtle text-[13px] font-bold">
            <div className="flex items-center gap-1">
              <Check size={16} className="text-primary" /> 5 esercizi gratuiti al giorno
            </div>
            <div className="w-1.5 h-1.5 bg-surface-border rounded-full" />
            <div className="flex items-center gap-1">
              <Check size={16} className="text-primary" /> Supporto scrittura a mano
            </div>
            <div className="w-1.5 h-1.5 bg-surface-border rounded-full" />
            <div className="flex items-center gap-1">
              <Check size={16} className="text-primary" /> Made in Italy 🇮🇹
            </div>
          </div>
        </motion.div>
      </section>

      {/* SANDBOX SECTION */}
      <section id="sandbox" className="px-6 py-20 bg-surface/30 border-y border-surface-border relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-black text-foreground mb-4">Sandbox Matematica Interattiva</h2>
            <p className="text-[15px] text-foreground-muted max-w-md mx-auto font-medium">
              Esplora come theLemma risolve e visualizza gli esercizi. Scegli uno degli argomenti qui sotto e interagisci con il grafico.
            </p>
          </div>

          {/* Tabs header */}
          <div className="flex justify-center gap-2 mb-10 max-w-md mx-auto p-1 bg-background/50 border border-surface-border rounded-2xl">
            {(['eq', 'deriv', 'limit'] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => {
                  setActiveTab(tab)
                  setHoveredStep(null)
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-black transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-primary text-background shadow-md shadow-primary/10' 
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-active/30'
                }`}
              >
                {tab === 'eq' ? 'Equazione' : tab === 'deriv' ? 'Derivata' : 'Limite'}
              </button>
            ))}
          </div>

          {/* Sandbox content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Colonna 1: Spiegazione */}
            <div className="lg:col-span-6 flex flex-col justify-between bg-surface border border-surface-border rounded-[32px] p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Bot size={180} className="text-primary" />
              </div>
              
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg">Spiegazione IA</span>
                <h3 className="text-[23px] font-black text-foreground mt-4 mb-1">
                  {sandboxContent[activeTab].title}
                </h3>
                <div className="text-[14px] font-medium text-foreground-subtle mb-6 step-body-math">
                  <MD>{`Quesito: ${sandboxContent[activeTab].formula}`}</MD>
                </div>
                
                <div className="space-y-3">
                  {sandboxContent[activeTab].steps.map((step, idx) => {
                    const isHovered = hoveredStep === idx
                    return (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        onMouseEnter={() => setHoveredStep(idx)}
                        onMouseLeave={() => setHoveredStep(null)}
                        className={`flex gap-4 p-3 rounded-2xl border transition-all duration-300 ${
                          isHovered 
                            ? 'bg-surface-active/85 border-primary/20 shadow-sm' 
                            : 'border-transparent'
                        }`}
                      >
                        <div className={`w-[2px] rounded-full shrink-0 flex flex-col items-center transition-colors duration-300 ${
                          isHovered ? 'bg-primary' : 'bg-primary/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full -mt-0.5 transition-colors duration-300 ${
                            isHovered ? 'bg-primary shadow-[0_0_8px_rgba(255,214,0,0.5)]' : 'bg-primary/50'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-[15px] font-black mb-1 transition-colors duration-300 ${
                            isHovered ? 'text-primary' : 'text-foreground'
                          }`}>{step.title}</h4>
                          <div className="text-[14px] leading-relaxed step-body-math">
                            <MD>{step.body}</MD>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Soluzione finale evidenziata */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 pt-6 border-t border-surface-border/50 flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Risultato Finale</div>
                  <div className="text-lg font-black text-primary">
                    <MD>{sandboxContent[activeTab].solution}</MD>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5"
                >
                  Fai una domanda <Sparkles size={12} fill="currentColor" />
                </button>
              </motion.div>
            </div>

            {/* Colonna 2: Grafico Interattivo */}
            <div className="lg:col-span-6 bg-surface border border-surface-border rounded-[32px] p-6 md:p-8 flex flex-col justify-between shadow-xl relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-primary" />
                  <span className="text-[13px] font-black text-foreground uppercase tracking-wider">Grafico Interattivo</span>
                </div>
                <div className="text-[10px] font-bold text-foreground-subtle bg-background px-2.5 py-1 rounded-lg border border-surface-border flex items-center gap-1">
                  <Maximize2 size={10} /> {activeTab === 'eq' ? 'Trascina lungo la parabola' : activeTab === 'deriv' ? 'Trascina sul grafico' : 'Trascina h sull\'asse X'}
                </div>
              </div>

              {/* Contenitore Grafico SVG */}
              <div className="bg-background border border-surface-border/60 rounded-2xl h-[280px] w-full relative flex items-center justify-center overflow-hidden shadow-inner select-none">
                <svg 
                  ref={svgRef}
                  className="w-full h-full cursor-crosshair touch-none animate-fade-in" 
                  viewBox="0 0 400 300"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  <defs>
                    <clipPath id="upper-clip">
                      <rect x="15" y="10" width="370" height="155" />
                    </clipPath>
                    <clipPath id="lower-clip">
                      <rect x="15" y="190" width="370" height="95" />
                    </clipPath>
                  </defs>

                  {/* Griglia di Background */}
                  {activeTab === 'eq' && (
                    <>
                      {/* Vertical Grid */}
                      {[-1, 0, 1, 2, 3, 4, 5, 6].map(x => (
                        <line key={`v-${x}`} x1={mapXEq(x)} y1="0" x2={mapXEq(x)} y2="300" stroke="#1f1f1f" strokeWidth="1" strokeDasharray="2,2" />
                      ))}
                      {/* Horizontal Grid */}
                      {[-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8].map(y => (
                        <line key={`h-${y}`} x1="0" y1={mapYEq(y)} x2="400" y2={mapYEq(y)} stroke="#1f1f1f" strokeWidth="1" strokeDasharray="2,2" />
                      ))}
                      {/* Axes */}
                      <line x1={mapXEq(0)} y1="0" x2={mapXEq(0)} y2="300" stroke="#333" strokeWidth="2" />
                      <line x1="0" y1={mapYEq(0)} x2="400" y2={mapYEq(0)} stroke="#333" strokeWidth="2" />
                      
                      {/* Parabola Curve */}
                      <path d={eqPathD} fill="none" stroke={hoveredStep !== null ? "#555" : "#A3A3A3"} strokeWidth="3" className="transition-colors duration-300" />
                      
                      {/* Axis of Symmetry & Vertex */}
                      {showVertex && (
                        <>
                          <line x1={mapXEq(2.5)} y1="0" x2={mapXEq(2.5)} y2="300" stroke="#C084FC" strokeWidth="1.5" strokeDasharray="4,4" />
                          <circle cx={mapXEq(2.5)} cy={mapYEq(-0.25)} r="5" fill="#C084FC" stroke="#121212" strokeWidth="1.5" />
                          <text x={mapXEq(2.5) + 8} y={mapYEq(-0.25) - 6} fill="#C084FC" fontSize="9" fontWeight="bold">V(2.5, -0.25)</text>
                          <text x={mapXEq(2.5) - 8} y="25" fill="#C084FC" fontSize="8" fontWeight="bold" textAnchor="end">Asse x = 2.5</text>
                        </>
                      )}

                      {/* Solution Roots highlights */}
                      <circle 
                        cx={mapXEq(2)} 
                        cy={mapYEq(0)} 
                        r={hoveredEqRoot === 'root1' || hoveredStep === 2 ? 8 : 6} 
                        fill={hoveredStep === 2 ? "#FFD600" : "#A3A3A3"} 
                        stroke={hoveredStep === 2 ? "#FFD600" : "#121212"}
                        strokeWidth="1.5"
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredEqRoot('root1')}
                        onMouseLeave={() => setHoveredEqRoot(null)}
                      />
                      <circle 
                        cx={mapXEq(3)} 
                        cy={mapYEq(0)} 
                        r={hoveredEqRoot === 'root2' || hoveredStep === 2 ? 8 : 6} 
                        fill={hoveredStep === 2 ? "#FFD600" : "#A3A3A3"} 
                        stroke={hoveredStep === 2 ? "#FFD600" : "#121212"}
                        strokeWidth="1.5"
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredEqRoot('root2')}
                        onMouseLeave={() => setHoveredEqRoot(null)}
                      />

                      {/* Pulsing ring if step 3 is hovered */}
                      {hoveredStep === 2 && (
                        <>
                          <circle cx={mapXEq(2)} cy={mapYEq(0)} r="15" fill="none" stroke="#FFD600" strokeWidth="2" opacity="0.6">
                            <animate attributeName="r" values="6;22" dur="1.2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0" dur="1.2s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={mapXEq(3)} cy={mapYEq(0)} r="15" fill="none" stroke="#FFD600" strokeWidth="2" opacity="0.6">
                            <animate attributeName="r" values="6;22" dur="1.2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0" dur="1.2s" repeatCount="indefinite" />
                          </circle>
                        </>
                      )}

                      {/* Draggable Handle Point */}
                      <circle cx={mapXEq(eqX)} cy={mapYEq(eqY)} r="7" fill="#FFD600" stroke="#121212" strokeWidth="2" />
                      <circle cx={mapXEq(eqX)} cy={mapYEq(eqY)} r="12" fill="#FFD600" opacity="0.25" className="animate-ping" style={{ animationDuration: '3s' }} />

                      {/* Tooltip coordinates */}
                      <g transform={`translate(${mapXEq(eqX) - 45}, ${mapYEq(eqY) - 30})`}>
                        <rect width="90" height="22" rx="6" fill="#1E1E1E" stroke="#333" strokeWidth="1" opacity="0.9" />
                        <text x="45" y="14" fill="#F5F5F5" fontSize="9" fontWeight="bold" textAnchor="middle">
                          P({eqX.toFixed(2)}, {eqY.toFixed(2)})
                        </text>
                      </g>

                      {/* Snapped Badge */}
                      {(eqX === 2 || eqX === 3) && (
                        <g transform={`translate(${mapXEq(eqX) - 55}, ${mapYEq(0) + 18})`}>
                          <rect width="110" height="20" rx="10" fill="#22C55E" />
                          <text x="55" y="13" fill="#121212" fontSize="8" fontWeight="extrabold" textAnchor="middle">SOLUZIONE TROVATA!</text>
                        </g>
                      )}

                      {/* Tooltip Roots Hover */}
                      <AnimatePresence>
                        {hoveredEqRoot && (
                          <g transform={`translate(${hoveredEqRoot === 'root1' ? mapXEq(2) - 35 : mapXEq(3) - 35}, ${mapYEq(0) - 40})`}>
                            <rect width="70" height="28" rx="6" fill="#1E1E1E" stroke="#FFD600" strokeWidth="1" />
                            <text x="35" y="18" fill="#F5F5F5" fontSize="11" fontWeight="bold" textAnchor="middle">
                              {hoveredEqRoot === 'root1' ? 'x = 2 (y=0)' : 'x = 3 (y=0)'}
                            </text>
                          </g>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {activeTab === 'deriv' && (
                    <>
                      {/* --- UPPER SECTION: f(x) --- */}
                      {/* Vertical Grid upper */}
                      {[-3, -2, -1, 0, 1, 2, 3].map(x => (
                        <line key={`v-${x}`} x1={mapXDeriv(x)} y1="10" x2={mapXDeriv(x)} y2="165" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="2,2" />
                      ))}
                      {/* Horizontal Grid upper */}
                      {[-2, 0, 2, 4, 6].map(y => (
                        <line key={`h-${y}`} x1="15" y1={mapYDeriv(y)} x2="385" y2={mapYDeriv(y)} stroke="#1a1a1a" strokeWidth="1" strokeDasharray="2,2" />
                      ))}
                      {/* Axes upper */}
                      <line x1={mapXDeriv(0)} y1="10" x2={mapXDeriv(0)} y2="165" stroke="#2a2a2a" strokeWidth="1.5" />
                      <line x1="15" y1={mapYDeriv(0)} x2="385" y2={mapYDeriv(0)} stroke="#2a2a2a" strokeWidth="1.5" />
                      
                      <text x="20" y="23" fill="#888" fontSize="8" fontWeight="bold">GRAFICO PRINCIPALE: f(x) = x³ - 3x + 2</text>

                      {/* Cubic Curve */}
                      <path d={derivPathD} fill="none" stroke={hoveredStep === 2 ? "#555" : "#A3A3A3"} strokeWidth="2.5" className="transition-colors duration-300" />
                      
                      {/* Tangent Line clipped to upper area */}
                      <line 
                        x1={tangentPoints.x1} 
                        y1={tangentPoints.y1} 
                        x2={tangentPoints.x2} 
                        y2={tangentPoints.y2} 
                        stroke="#FFD600" 
                        strokeWidth={hoveredStep === 2 ? "3" : "2"} 
                        strokeDasharray={hoveredStep === 2 ? "6,2" : "4,2"}
                        clipPath="url(#upper-clip)"
                        className="transition-all duration-300"
                      />

                      {/* Draggable Point of tangency */}
                      <circle cx={tangentPoints.px} cy={tangentPoints.py} r="7" fill="#FFD600" stroke="#121212" strokeWidth="1.5" />
                      <circle cx={tangentPoints.px} cy={tangentPoints.py} r="12" fill="#FFD600" opacity="0.25" className="animate-ping" style={{ animationDuration: '3s' }} />

                      {/* Slope Triangle */}
                      {(() => {
                        const dx = tangentX > 1.8 ? -0.6 : 0.6
                        const dy = tangentPoints.m * dx
                        const bx = mapXDeriv(tangentX + dx)
                        const cy = mapYDeriv(tangentPoints.y0 + dy)
                        return (
                          <g opacity={hoveredStep === 2 ? "1.0" : "0.75"}>
                            {/* Horizontal segment dx */}
                            <line x1={tangentPoints.px} y1={tangentPoints.py} x2={bx} y2={tangentPoints.py} stroke="#FFD600" strokeWidth="1.5" strokeDasharray="3,3" />
                            {/* Vertical segment dy */}
                            <line x1={bx} y1={tangentPoints.py} x2={bx} y2={cy} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,3" />
                            
                            {/* Labels */}
                            <text x={(tangentPoints.px + bx) / 2} y={tangentPoints.py + (dy > 0 ? 12 : -6)} fill="#FFD600" fontSize="8" fontWeight="black" textAnchor="middle">
                              Δx = {Math.abs(dx).toFixed(1)}
                            </text>
                            <text x={bx + (dx > 0 ? 6 : -6)} y={(tangentPoints.py + cy) / 2} fill="#EF4444" fontSize="8" fontWeight="black" textAnchor={dx > 0 ? "start" : "end"}>
                              Δy = {dy.toFixed(2)}
                            </text>
                          </g>
                        )
                      })()}

                      {/* Tooltip Coordinates */}
                      <g transform={`translate(${tangentPoints.px - 45}, ${tangentPoints.py - 28})`} clipPath="url(#upper-clip)">
                        <rect width="90" height="20" rx="5" fill="#1E1E1E" stroke="#333" strokeWidth="1" opacity="0.9" />
                        <text x="45" y="13" fill="#F5F5F5" fontSize="9" fontWeight="bold" textAnchor="middle">
                          P({tangentX.toFixed(1)}, {tangentPoints.y0.toFixed(1)})
                        </text>
                      </g>

                      {/* Dividendo tratteggiato delle due sezioni */}
                      <line x1="0" y1="180" x2="400" y2="180" stroke="#2c2c2c" strokeWidth="1.5" strokeDasharray="5,5" />

                      {/* --- LOWER SECTION: f'(x) --- */}
                      {/* Vertical Grid lower */}
                      {[-3, -2, -1, 0, 1, 2, 3].map(x => (
                        <line key={`vl-${x}`} x1={mapXDeriv(x)} y1="190" x2={mapXDeriv(x)} y2="290" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="2,2" />
                      ))}
                      {/* Horizontal Grid lower */}
                      {[-3, 0, 3, 6, 9].map(y => (
                        <line key={`hl-${y}`} x1="15" y1={mapYDerivPrime(y)} x2="385" y2={mapYDerivPrime(y)} stroke="#1a1a1a" strokeWidth="1" strokeDasharray="2,2" />
                      ))}
                      {/* Axes lower */}
                      <line x1={mapXDeriv(0)} y1="190" x2={mapXDeriv(0)} y2="290" stroke="#2a2a2a" strokeWidth="1.5" />
                      <line x1="15" y1={mapYDerivPrime(0)} x2="385" y2={mapYDerivPrime(0)} stroke="#2a2a2a" strokeWidth="1.5" />

                      <text x="20" y="202" fill="#888" fontSize="8" fontWeight="bold">GRAFICO DERIVATA: f&apos;(x) = 3x² - 3</text>

                      {/* Derivative Parabola */}
                      <path d={derivPrimePathD} fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.8" />
                      
                      {/* Synced indicator point on f'(x) */}
                      <circle cx={tangentPoints.px} cy={mapYDerivPrime(tangentPoints.m)} r="5" fill="#60A5FA" stroke="#121212" strokeWidth="1.5" />
                      <circle cx={tangentPoints.px} cy={mapYDerivPrime(tangentPoints.m)} r="9" fill="#60A5FA" opacity="0.2" className="animate-ping" style={{ animationDuration: '3.5s' }} />

                      {/* Tooltip slope value */}
                      <g transform={`translate(${tangentPoints.px - 35}, ${mapYDerivPrime(tangentPoints.m) - 24})`} clipPath="url(#lower-clip)">
                        <rect width="70" height="18" rx="4" fill="#1E1E1E" stroke="#60A5FA" strokeWidth="1" opacity="0.9" />
                        <text x="35" y="12" fill="#60A5FA" fontSize="8" fontWeight="bold" textAnchor="middle">
                          m = {tangentPoints.m.toFixed(2)}
                        </text>
                      </g>
                    </>
                  )}

                  {activeTab === 'limit' && (
                    <>
                      {/* Vertical Grid */}
                      {[-6, -4, -2, 0, 2, 4, 6].map(x => (
                        <line key={`v-${x}`} x1={mapXLimit(x)} y1="0" x2={mapXLimit(x)} y2="300" stroke="#1f1f1f" strokeWidth="1" strokeDasharray="2,2" />
                      ))}
                      {/* Horizontal Grid */}
                      {[-0.5, 0, 0.5, 1, 1.5].map(y => (
                        <line key={`h-${y}`} x1="0" y1={mapYLimit(y)} x2="400" y2={mapYLimit(y)} stroke="#1f1f1f" strokeWidth="1" strokeDasharray="2,2" />
                      ))}
                      {/* Axes */}
                      <line x1={mapXLimit(0)} y1="0" x2={mapXLimit(0)} y2="300" stroke="#333" strokeWidth="2" />
                      <line x1="0" y1={mapYLimit(0)} x2="400" y2={mapYLimit(0)} stroke="#333" strokeWidth="2" />
                      
                      <text x="20" y="23" fill="#888" fontSize="8" fontWeight="bold">TEOREMA DEI CARABINIERI (SQUEEZE THEOREM)</text>

                      {/* Cosine boundary curve (g(x)) */}
                      <path 
                        d={cosPathD} 
                        fill="none" 
                        stroke="#38BDF8" 
                        strokeWidth={hoveredStep === 1 || hoveredStep === 2 ? "2.5" : "1.5"} 
                        strokeDasharray="3,3" 
                        opacity={hoveredStep === 1 || hoveredStep === 2 ? "1.0" : "0.4"} 
                        className="transition-all duration-300" 
                      />
                      
                      {/* Constant boundary line (h(x) = 1) */}
                      <line 
                        x1="15" 
                        y1={mapYLimit(1)} 
                        x2="385" 
                        y2={mapYLimit(1)} 
                        stroke="#F97316" 
                        strokeWidth={hoveredStep === 1 || hoveredStep === 2 ? "2.5" : "1.5"} 
                        strokeDasharray="3,3" 
                        opacity={hoveredStep === 1 || hoveredStep === 2 ? "1.0" : "0.4"} 
                        className="transition-all duration-300" 
                      />

                      {/* Squeeze Labels */}
                      {(hoveredStep === 1 || hoveredStep === 2) && (
                        <>
                          <text x={mapXLimit(3.5)} y={mapYLimit(Math.cos(3.5)) - 8} fill="#38BDF8" fontSize="8" fontWeight="bold">y = cos(x)</text>
                          <text x={mapXLimit(-4.5)} y={mapYLimit(1) - 8} fill="#F97316" fontSize="8" fontWeight="bold">y = 1 (costante)</text>
                          <text x={mapXLimit(1.8)} y={mapYLimit(Math.sin(1.8)/1.8) + 12} fill="#FFD600" fontSize="8" fontWeight="bold">y = sin(x)/x</text>
                        </>
                      )}

                      {/* main limit curve f(x) */}
                      <path d={limitPathD} fill="none" stroke="#FFD600" strokeWidth="3" />
                      
                      {/* Approaching vertical lines */}
                      <line x1={limitPoints.xPos} y1={limitPoints.y} x2={limitPoints.xPos} y2={mapYLimit(0)} stroke="#FFD600" strokeWidth="1" strokeDasharray="3,3" opacity="0.8" />
                      <line x1={limitPoints.xNeg} y1={limitPoints.y} x2={limitPoints.xNeg} y2={mapYLimit(0)} stroke="#FFD600" strokeWidth="1" strokeDasharray="3,3" opacity="0.8" />
                      
                      {/* Approaching points on curve */}
                      <circle cx={limitPoints.xPos} cy={limitPoints.y} r="6" fill="#FFD600" stroke="#121212" strokeWidth="1.5" />
                      <circle cx={limitPoints.xNeg} cy={limitPoints.y} r="6" fill="#FFD600" stroke="#121212" strokeWidth="1.5" />

                      {/* Undefined hole at (0,1) with green glow */}
                      <circle cx={mapXLimit(0)} cy={mapYLimit(1)} r="8" fill="none" stroke="#22C55E" strokeWidth="2.5" />
                      <circle cx={mapXLimit(0)} cy={mapYLimit(1)} r="14" fill="none" stroke="#22C55E" strokeWidth="1" opacity="0.3" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                      <circle cx={mapXLimit(0)} cy={mapYLimit(1)} r="3" fill="#121212" />

                      {/* Coordinates box */}
                      <g transform={`translate(210, 20)`}>
                        <rect width="170" height="50" rx="8" fill="#1E1E1E" stroke="#333" strokeWidth="1" opacity="0.95" />
                        <text x="10" y="20" fill="#F5F5F5" fontSize="10" fontWeight="bold">Distanza x = ±{limitH.toFixed(4)}</text>
                        <text x="10" y="38" fill="#FFD600" fontSize="10" fontWeight="bold">f(x) = {limitPoints.yVal.toFixed(6)}</text>
                      </g>
                    </>
                  )}
                </svg>
              </div>

              {/* Sliders Controlli */}
              <div className="mt-6">
                {activeTab === 'eq' && (
                  <div className="flex flex-col gap-3">
                    <div className="text-center p-3 bg-background rounded-xl border border-surface-border text-foreground-muted text-xs leading-relaxed font-medium">
                      🎯 <strong>Esercizio Pratico:</strong> Trascina il punto giallo lungo la parabola. Cerca di allinearlo con l&apos;asse X per trovare le radici dell&apos;equazione ($x=2$ o $x=3$).
                    </div>
                    <div className="flex items-center justify-between mt-1 px-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground-subtle hover:text-foreground transition-colors select-none">
                        <input 
                          type="checkbox" 
                          checked={showVertex} 
                          onChange={(e) => setShowVertex(e.target.checked)}
                          className="rounded bg-background border-surface-border text-primary focus:ring-primary focus:ring-offset-0 w-4 h-4"
                        />
                        Mostra Vertice & Asse di Simmetria
                      </label>
                      <span className="text-[10px] font-bold text-foreground-subtle uppercase">x attuale: {eqX.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'deriv' && (
                  <div className="bg-background p-4 rounded-2xl border border-surface-border">
                    <div className="flex justify-between items-center text-xs font-bold mb-2.5">
                      <span>Coordinata X: {tangentX.toFixed(2)}</span>
                      <span className="text-primary font-black">Derivata f&apos;(x) = m = {tangentPoints.m.toFixed(2)}</span>
                    </div>
                    <input 
                      id="slider-derivative-tangent"
                      type="range" 
                      min="-2.8" 
                      max="2.8" 
                      step="0.05"
                      value={tangentX}
                      onChange={(e) => setTangentX(parseFloat(e.target.value))}
                      className="w-full accent-primary bg-surface-active h-1.5 rounded-lg appearance-none cursor-ew-resize"
                    />
                    <div className="text-[10px] text-foreground-subtle font-medium mt-2 leading-normal">
                      💡 Puoi trascinare il punto direttamente sul grafico superiore per inclinare la tangente.
                    </div>
                  </div>
                )}

                {activeTab === 'limit' && (
                  <div className="bg-background p-4 rounded-2xl border border-surface-border flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-2">
                        <span>Distanza da zero (h): {limitH.toFixed(4)}</span>
                        <span className="text-primary font-black">Valore f(h) = {limitPoints.yVal.toFixed(6)}</span>
                      </div>
                      <input 
                        id="slider-limit"
                        type="range" 
                        min="0.01" 
                        max="5.0" 
                        step="0.02"
                        value={limitH}
                        onChange={(e) => setLimitH(parseFloat(e.target.value))}
                        className="w-full accent-primary bg-surface-active h-1.5 rounded-lg appearance-none cursor-ew-resize"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <button 
                        onClick={() => setIsAnimatingLimit(true)}
                        disabled={isAnimatingLimit}
                        className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles size={13} className={isAnimatingLimit ? "animate-spin" : ""} fill="currentColor" />
                        {isAnimatingLimit ? 'Convergenza in corso...' : 'Avvia Convergenza (Animazione)'}
                      </button>
                      <span className="text-[10px] text-foreground-subtle font-medium leading-normal text-right max-w-[180px]">
                        Trascina i punti sul grafico verso il centro per verificare il limite.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TUTOR CHAT SIMULATION SECTION */}
      <section className="px-6 py-20 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg">Assistente Attivo</span>
          <h2 className="text-[32px] font-black text-foreground mt-4 mb-4">Nessun dubbio irrisolto</h2>
          <p className="text-[15px] text-foreground-muted max-w-md mx-auto font-medium">
            Proprio come un insegnante privato, il nostro Tutor AI risponde a qualsiasi domanda di chiarimento sui passaggi o sulle formule.
          </p>
        </div>

        {/* Chat box container */}
        <div className="bg-surface border border-surface-border rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[500px]">
          {/* Chat header */}
          <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-hover/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="text-[15px] font-black leading-tight">Tutor theLemma</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-success uppercase tracking-widest">Disponibile</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-foreground-subtle bg-background px-3 py-1 rounded-full border border-surface-border font-bold">
              Versione Demo
            </div>
          </div>

          {/* Messages list */}
          <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-hide bg-background/20">
            {chatHistory.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-[20px] p-4 text-[14px] leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-background font-bold rounded-br-none' 
                    : 'bg-surface border border-surface-border text-foreground rounded-bl-none'
                }`}>
                  {msg.sender === 'bot' ? (
                    <MD>{msg.text}</MD>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            
            {/* Bot Typing indicator */}
            {isBotTyping && (
              <div className="flex justify-start">
                <div className="bg-surface border border-surface-border rounded-[20px] rounded-bl-none p-4 text-[14px] text-foreground-muted flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                  </div>
                  <span className="italic text-[12px]">Il tutor sta scrivendo...</span>
                </div>
              </div>
            )}
          </div>

          {/* Preset Chips */}
          <div className="p-4 border-t border-surface-border bg-background/30 flex flex-wrap gap-2 justify-center">
            <button 
              id="chip-question-1"
              disabled={isBotTyping}
              onClick={() => handlePresetQuestion('delta')}
              className="text-xs font-bold bg-surface border border-surface-border hover:border-primary/50 text-foreground-muted hover:text-foreground px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Come si ricava il Delta (Δ)? 📐
            </button>
            <button 
              id="chip-question-2"
              disabled={isBotTyping}
              onClick={() => handlePresetQuestion('derivata')}
              className="text-xs font-bold bg-surface border border-surface-border hover:border-primary/50 text-foreground-muted hover:text-foreground px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Spiegami la derivata di x³ 📈
            </button>
            <button 
              id="chip-question-3"
              disabled={isBotTyping}
              onClick={() => handlePresetQuestion('materie')}
              className="text-xs font-bold bg-surface border border-surface-border hover:border-primary/50 text-foreground-muted hover:text-foreground px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Fisica e Chimica? ⚛️
            </button>
          </div>

          {/* Message input */}
          <form 
            onSubmit={handleSendCustomMessage}
            className="p-4 border-t border-surface-border bg-surface flex gap-3"
          >
            <input 
              id="input-chat-message"
              type="text" 
              placeholder="Fai una domanda personalizzata..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isBotTyping}
              className="flex-1 py-3 px-4 bg-background border border-surface-border rounded-xl text-[14px] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
            />
            <button 
              id="btn-chat-send"
              type="submit" 
              disabled={!chatInput.trim() || isBotTyping}
              className="bg-primary text-background disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-md shadow-primary/10 shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </section>

      {/* BENTO FEATURES GRID */}
      <section className="px-6 py-20 bg-surface/10 border-t border-surface-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-black text-foreground mb-4">La tua cassetta degli attrezzi per lo studio</h2>
            <p className="text-[15px] text-foreground-muted max-w-md mx-auto font-medium">
              theLemma unisce intelligenza artificiale avanzata e visualizzazione per offrirti la migliore esperienza di apprendimento scientifico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Box 1 */}
            <div className="bg-surface border border-surface-border p-6 rounded-[28px] flex flex-col justify-between hover:border-primary/30 transition-colors group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
                  <Star size={22} />
                </div>
                <h3 className="text-lg font-black mb-2">OCR di Formule Scritte a Mano</h3>
                <p className="text-[14px] text-foreground-muted leading-relaxed">
                  Scatta la foto del tuo quaderno. L&apos;IA decodifica istantaneamente formule, integrali o sistemi complessi con altissima precisione.
                </p>
              </div>
            </div>

            {/* Box 2 */}
            <div className="bg-surface border border-surface-border p-6 rounded-[28px] flex flex-col justify-between hover:border-primary/30 transition-colors group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
                  <Check size={22} />
                </div>
                <h3 className="text-lg font-black mb-2">Passaggi Logici Strutturati</h3>
                <p className="text-[14px] text-foreground-muted leading-relaxed">
                  Evita soluzioni incomplete o salti logici. Ogni passaggio è dettagliato, motivato e accompagnato da formule chiare.
                </p>
              </div>
            </div>

            {/* Box 3 */}
            <div className="bg-surface border border-surface-border p-6 rounded-[28px] flex flex-col justify-between hover:border-primary/30 transition-colors group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
                  <Bot size={22} />
                </div>
                <h3 className="text-lg font-black mb-2">Tutor Personale Chiarificatore</h3>
                <p className="text-[14px] text-foreground-muted leading-relaxed">
                  Fai clic su un passaggio e fai domande mirate per toglierti qualsiasi dubbio. Il tutor risponde all&apos;istante e con spiegazioni alternative.
                </p>
              </div>
            </div>

            {/* Box 4 */}
            <div className="bg-surface border border-surface-border p-6 rounded-[28px] flex flex-col justify-between hover:border-primary/30 transition-colors group md:col-span-2 lg:col-span-1">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
                  <Activity size={22} />
                </div>
                <h3 className="text-lg font-black mb-2">Grafico Cartesiano Dinamico</h3>
                <p className="text-[14px] text-foreground-muted leading-relaxed">
                  Vedi la matematica prendere vita. Asintoti, rette tangenti, domini e intersezioni vengono tracciati dinamicamente.
                </p>
              </div>
            </div>

            {/* Box 5 */}
            <div className="bg-surface border border-surface-border p-6 rounded-[28px] flex flex-col justify-between hover:border-primary/30 transition-colors group md:col-span-2">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-105 transition-transform">
                  <Zap size={22} />
                </div>
                <h3 className="text-lg font-black mb-2">Supporto Scientifico Multidisciplinare</h3>
                <p className="text-[14px] text-foreground-muted leading-relaxed">
                  L&apos;IA copre l&apos;algebra, la trigonometria, l&apos;analisi matematica, la geometria piana e dello spazio, nonché i principali problemi di fisica generale e chimica inorganica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-[32px] font-black text-foreground mb-4">Perché scegliere theLemma</h2>
          <p className="text-[15px] text-foreground-muted max-w-md mx-auto font-medium">
            Confronto dettagliato con i metodi e gli strumenti tradizionali disponibili sul mercato.
          </p>
        </div>

        {/* Table layout */}
        <div className="border border-surface-border rounded-3xl overflow-hidden bg-surface shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface-hover/30">
                  <th className="p-5 font-black text-sm uppercase tracking-wider text-foreground-subtle">Caratteristica</th>
                  <th className="p-5 font-black text-sm uppercase tracking-wider text-primary bg-primary/5 border-x border-surface-border/40">theLemma</th>
                  <th className="p-5 font-black text-sm uppercase tracking-wider text-foreground-muted">Risolutori Classici</th>
                  <th className="p-5 font-black text-sm uppercase tracking-wider text-foreground-muted">ChatGPT Generico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50 text-[14px]">
                <tr>
                  <td className="p-5 font-bold">Ragionamento Passo-Passo</td>
                  <td className="p-5 text-primary bg-primary/5 border-x border-surface-border/40 font-bold">Sì, spiegato in italiano</td>
                  <td className="p-5 text-foreground-muted">Solo formule matematiche rapide</td>
                  <td className="p-5 text-foreground-muted">Testo lungo, spesso dispersivo o errato</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold">Tutor Chat Dedicato</td>
                  <td className="p-5 text-primary bg-primary/5 border-x border-surface-border/40 font-bold">Sì, fa domande sull&apos;esercizio</td>
                  <td className="p-5 text-foreground-muted">No</td>
                  <td className="p-5 text-foreground-muted">Sì, ma dimentica la struttura del calcolo</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold">Grafici Interattivi 2D</td>
                  <td className="p-5 text-primary bg-primary/5 border-x border-surface-border/40 font-bold">Sì, con asintoti e tangenti dinamiche</td>
                  <td className="p-5 text-foreground-muted">Solo grafici fissi e non interattivi</td>
                  <td className="p-5 text-foreground-muted">No, solo descrizioni testuali</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold">Scansione Scrittura a Mano</td>
                  <td className="p-5 text-primary bg-primary/5 border-x border-surface-border/40 font-bold">Ottimizzato e ultra-preciso (OCR 2 stadi)</td>
                  <td className="p-5 text-foreground-muted">Sì, ma fatica a leggere testi complessi</td>
                  <td className="p-5 text-foreground-muted">Frequenti errori di interpretazione</td>
                </tr>
                <tr>
                  <td className="p-5 font-bold">Fisica e Chimica incluse</td>
                  <td className="p-5 text-primary bg-primary/5 border-x border-surface-border/40 font-bold">Sì, con bilanciamento e formule</td>
                  <td className="p-5 text-foreground-muted">Molto limitato</td>
                  <td className="p-5 text-foreground-muted">Sì, ma allucina costanti e calcoli logici</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="px-6 py-20 bg-surface/20 border-t border-surface-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-black text-foreground mb-4">Domande Frequenti</h2>
            <p className="text-[15px] text-foreground-muted font-medium">
              Tutto quello che c&apos;è da sapere per iniziare a studiare con theLemma.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx
              return (
                <div 
                  key={idx}
                  id={`faq-item-${idx + 1}`}
                  className="bg-surface border border-surface-border rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-[15px] cursor-pointer hover:bg-surface-hover/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown 
                      size={18} 
                      className={`text-foreground-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} 
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 pt-1 text-[14px] text-foreground-muted leading-relaxed border-t border-surface-border/30 bg-background/10">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="px-6 py-24 max-w-4xl mx-auto text-center relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-yellow-500/20 to-primary/20 rounded-[40px] blur opacity-40 -z-10" />
        <div className="bg-surface border border-surface-border p-8 md:p-16 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={200} className="text-primary" />
          </div>
          
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-inner">
            <Zap size={28} />
          </div>

          <h2 className="text-[32px] md:text-[40px] font-black tracking-tight leading-tight mb-4 text-foreground">
            Migliora la tua comprensione scientifica oggi.
          </h2>
          <p className="text-[15px] text-foreground-muted max-w-lg mb-10 font-medium leading-relaxed">
            Unisciti a migliaia di studenti che usano theLemma per chiarire i propri dubbi in matematica, fisica e chimica.
          </p>

          <button 
            id="btn-final-cta-register"
            onClick={() => setShowAuthModal(true)}
            className="px-10 py-5 bg-primary text-background hover:bg-primary-hover rounded-2xl text-[17px] font-extrabold shadow-2xl shadow-primary/20 transition-all hover:scale-103 active:scale-97 flex items-center gap-2"
          >
            Inizia Gratis Ora <ChevronRight size={20} />
          </button>
          
          <div className="mt-6 text-[12px] text-foreground-subtle font-medium">
            Nessuna carta richiesta • 5 esercizi gratuiti ogni giorno
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-surface-border px-6 py-8 bg-surface/20 text-center text-xs text-foreground-subtle font-medium">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            <span className="font-extrabold text-[13px] tracking-tight">
              <span className="font-light">the</span>Lemma
            </span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} theLemma. Tutti i diritti riservati.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Termini di Servizio</a>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL OVERLAY */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <AuthModal 
              onClose={() => setShowAuthModal(false)} 
              supabase={supabase} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
