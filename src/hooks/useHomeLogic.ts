import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export const DAILY_LIMIT = 5

export function useHomeLogic() {
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
  const [grafico, setGrafico] = useState<any>(null)
  const [graficoLoading, setGraficoLoading] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [currentExerciseId, setCurrentExerciseId] = useState<number | null>(null)
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  
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
          if (!d.scuola) setShowPersonalizzazione(true)
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
          if (!d.scuola) setShowPersonalizzazione(true)
          setProfilo({ scuola: d.scuola, classe: d.classe, materie: d.materie })
          setIsPremium(d.is_premium ?? false)
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (loading) {
      setQuoteIndex(Math.floor(Math.random() * 6))
      interval = setInterval(() => {
        setQuoteIndex(prev => (prev + 1) % 6)
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
    setCurrentExerciseId(null) // Reset
    setScreen('explanation')
    setLoading(true)
    setExplanation('')
    setGrafico(null)
    setGraficoUtile(null)
    setShareUrl(null)
    setChatMessages([]) // Reset chat

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

    let detectedTipo = 'Altro'

    if (classifyRes) {
      const classifyData = await classifyRes.json()
      setGraficoUtile(classifyData.graficoUtile ?? false)
      if (classifyData.tipo) detectedTipo = classifyData.tipo
    } else {
      setGraficoUtile(false)
    }

    if (user) {
      fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, explanation: explainData.explanation, subject: detectedTipo })
      }).then(r => r.json()).then(d => {
        if (d.data?.id) setCurrentExerciseId(d.data.id)
      })
    }
    setLoading(false)
  }

  async function handleShare() {
    setShareLoading(true)
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: exercise?.text || '', explanation, scuola: profilo.scuola, classe: profilo.classe, grafico })
    })
    const data = await res.json()
    const url = window.location.origin + '/s/' + data.id
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Spiegazione StudiAI',
          text: 'Guarda questa spiegazione passo-passo su StudiAI!',
          url: url
        })
        // Se ha successo, non mostriamo "Copiato" ma puliamo lo stato
        setShareLoading(false)
        return
      } catch (err) {
        // Utente ha annullato o errore nativo, fallback a copia
        try { await navigator.clipboard.writeText(url) } catch {}
        setShareUrl(url)
      }
    } else {
      try { await navigator.clipboard.writeText(url) } catch {}
      setShareUrl(url)
    }
    
    setShareLoading(false)
    
    // Rimuoviamo la notifica di "copiato" dopo 3 secondi
    setTimeout(() => setShareUrl(null), 3000)
  }

  async function handleGrafico() {
    setGraficoLoading(true)
    const res = await fetch('/api/graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ esercizio: exercise?.text || '', spiegazione: explanation })
    })
    const data = await res.json()
    if (data.data) {
      console.log('Grafico:', JSON.stringify(data.data))
      setGrafico(data.data)
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

  async function handlePortal() {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error('Errore portale:', err)
    }
  }

  async function handleChatSubmit(messageText: string) {
    if (!messageText.trim() || chatLoading) return
    
    const newMessages = [...chatMessages, { role: 'user' as const, text: messageText }]
    setChatMessages(newMessages)
    setChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          exercise: exercise?.text,
          explanation: explanation
        })
      })
      const data = await res.json()
      if (data.reply) {
        setChatMessages([...newMessages, { role: 'assistant' as const, text: data.reply }])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setChatLoading(false)
    }
  }

  return {
    state: {
      screen, exercise, usedToday, explanation, loading, dragging, text, image, imageBase64,
      user, authLoading, showAuth, showOnboarding, showPersonalizzazione, profilo,
      shareUrl, shareLoading, grafico, graficoUtile, graficoLoading, quoteIndex, isPremium,
      remaining, isLimited, supabase, chatMessages, chatLoading, currentExerciseId
    },
    actions: {
      setScreen, setDragging, setText, setImage, setImageBase64, setShowAuth,
      setShowOnboarding, setShowPersonalizzazione, setProfilo,
      logout, handleFile, handleSubmit, handleShare, handleGrafico, handleCheckout, handlePortal, handleChatSubmit
    }
  }
}
